const assert=require("node:assert/strict");
const test=require("node:test");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const dir=path.join(__dirname,"../extension");
function harness(){
 const html=fs.readFileSync(path.join(dir,"popup.html"),"utf8");
 const nodes=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],{value:"",textContent:"",checked:false,hidden:true,disabled:false}]));
 const snapshot={snapshot:"test",origin:"https://example.com",expires:Date.now()+300000,headings:["Example"],controls:[{id:1,label:"Next",action:"click",target:"/next"}]};
 const command={snapshot:"test",origin:snapshot.origin,id:1,action:"click"};
 const events=[];
 let tab={id:42,url:"https://example.com/",incognito:false},reply={summary:"Next",command};
 const browser={tabs:{query:async()=>[tab],executeScript:async()=>{},sendMessage:async(id,msg)=>{assert.equal(id,42);events.push(msg.type);return msg.type==="execute"?{message:"done"}:msg.type==="stop"?{ok:true}:{snapshot}}},permissions:{request:async({origins})=>{assert.deepEqual(Array.from(origins),["https://gateway.example/*"]);events.push("permission");return true},remove:async()=>{events.push("revoke");return true}}};
 const fetch=async(url,options)=>{assert.equal(url,"https://gateway.example/v1/plan");assert.equal(options.redirect,"error");assert.equal(options.credentials,"omit");assert.equal(options.headers.Authorization,"Bearer "+"a".repeat(40));assert.equal(JSON.parse(options.body).snapshot.origin,snapshot.origin);events.push("request");return {ok:true,json:async()=>reply}};
 const context=vm.createContext({browser,document:{getElementById:id=>nodes[id],querySelectorAll:()=>[]},localStorage:{getItem:()=>null,setItem:()=>{}},URL,AbortController,setTimeout,clearTimeout,fetch,console});
 vm.runInContext(fs.readFileSync(path.join(dir,"guard.js"),"utf8"),context);
 vm.runInContext(fs.readFileSync(path.join(dir,"popup.js"),"utf8"),context);
 return {nodes,events,snapshot,command,setTab:t=>{tab=t},setReply:r=>{reply=r},ready:()=>new Promise(resolve=>setImmediate(resolve))};
}
async function setup(){
 const h=harness();await h.ready();await h.nodes.scan.onclick();
 h.nodes.endpoint.value="https://gateway.example/v1/plan";h.nodes.pair.value="a".repeat(40);h.nodes.task.value="Next";
 return h;
}
test("AI flow requires consent and separate approval",async()=>{
 const {nodes,events}=await setup();
 await nodes.ask.onclick();assert(!events.includes("request"));
 nodes.consent.checked=true;await nodes.ask.onclick();
 assert(events.includes("request"));assert(events.includes("revoke"));assert.equal(nodes.review.hidden,false);assert(!events.includes("execute"));
 await nodes.execute.onclick();assert.equal(events.filter(x=>x==="execute").length,1);
 await nodes.execute.onclick();assert.equal(events.filter(x=>x==="execute").length,1);
});
test("changed tab and unsafe model command fail closed",async()=>{
 const h=await setup();h.setReply({summary:"bad",command:{...h.command,id:999}});h.nodes.consent.checked=true;await h.nodes.ask.onclick();assert.equal(h.nodes.review.hidden,true);assert(!h.events.includes("execute"));
 h.setReply({summary:"Next",command:h.command});h.nodes.consent.checked=true;await h.nodes.ask.onclick();assert.equal(h.nodes.review.hidden,false);
 h.setTab({id:43,url:"https://other.example/",incognito:false});await h.nodes.execute.onclick();assert(!h.events.includes("execute"));assert.equal(h.nodes.review.hidden,true);
});
test("private tab is rejected",async()=>{const h=await setup();h.setTab({id:42,url:"https://example.com/",incognito:true});h.nodes.consent.checked=true;await h.nodes.ask.onclick();assert(!h.events.includes("request"))});
