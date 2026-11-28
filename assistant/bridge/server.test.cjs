const assert=require("node:assert/strict");
const test=require("node:test");
const {auth,validate,parseResponse,plan,server,config}=require("./server.cjs");
const now=Date.now(),s={snapshot:"test",origin:"https://example.com",expires:now+300000,headings:["Example"],controls:[{id:1,label:"Next",action:"click",target:"/next"},{id:2,label:"Search",action:"fill",target:""}]};
const cfg={origins:new Set([s.origin]),apiKey:"mock-only",model:"mock",token:"a".repeat(40),dailyLimit:5};
const input={task:"Go next",snapshot:s};
const reply=p=>({status:"completed",output:[{type:"message",content:[{type:"output_text",text:JSON.stringify(p)}]}]});
test("authentication",()=>{assert(auth("Bearer "+cfg.token,cfg.token));assert(!auth("Bearer wrong",cfg.token));assert(!auth(undefined,cfg.token))});
test("config fails closed",()=>assert.throws(()=>config({})));
test("allowed snapshot",()=>assert.deepEqual(validate(input,cfg.origins,now),input));
test("reject unauthorized, expired, duplicate or sensitive controls",()=>{
 for(const snapshot of [{...s,origin:"https://evil.example"},{...s,expires:now},{...s,controls:[s.controls[0],s.controls[0]]},{...s,controls:[{id:1,label:"Delete",action:"click",target:""}]}])assert.throws(()=>validate({task:input.task,snapshot},cfg.origins,now));
});
test("valid model proposals",()=>{
 assert.deepEqual(parseResponse(reply({summary:"Next",action:"click",id:1,text:""}),s,now).command,{snapshot:s.snapshot,origin:s.origin,id:1,action:"click"});
 assert.equal(parseResponse(reply({summary:"No action",action:"none",id:0,text:""}),s,now).command,null);
 assert.equal(parseResponse(reply({summary:"Search",action:"fill",id:2,text:"hello"}),s,now).command.text,"hello");
});
test("reject invalid model proposals",()=>{
 for(const p of [{summary:"x",action:"click",id:999,text:""},{summary:"x",action:"fill",id:2,text:"password"},{summary:"x",action:"click",id:1,text:"extra"},{summary:"x",action:"none",id:1,text:""},{summary:"x",action:"eval",id:1,text:""}])assert.throws(()=>parseResponse(reply(p),s,now));
 assert.throws(()=>parseResponse({status:"incomplete",output:[]},s,now));
 assert.throws(()=>parseResponse({status:"completed",output:[{type:"message",content:[{type:"refusal"}]}]},s,now));
});
test("mock model call sends only scoped page data; no token in body",async()=>{
 let calls=0;
 const output=await plan(input,cfg,async(url,opts)=>{calls++;assert.equal(url,"https://api.openai.com/v1/responses");assert.equal(opts.headers.Authorization,"Bearer mock-only");const req=JSON.parse(opts.body);assert.equal(req.store,false);assert.equal(req.text.format.strict,true);const data=JSON.parse(req.input);assert.equal(data.untrustedPage.origin,s.origin);assert(!opts.body.includes(cfg.token));return {ok:true,json:async()=>reply({summary:"Next",action:"click",id:1,text:""})}});
 assert.equal(calls,1);assert.equal(output.command.id,1);
});
test("http gateway rejects unauthorized request without model call",async()=>{
 let calls=0;const srv=server(cfg,async()=>{calls++;throw Error("unexpected")});
 await new Promise(resolve=>srv.listen(0,"127.0.0.1",resolve));
 try{const url="http://127.0.0.1:"+srv.address().port+"/v1/plan";const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});assert.equal(res.status,401);assert.equal(calls,0)}finally{await new Promise(resolve=>srv.close(resolve))}
});
