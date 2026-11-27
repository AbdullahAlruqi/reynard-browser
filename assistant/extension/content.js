/* GPL-3.0-or-later */
(()=>{"use strict";if(globalThis.__dawrakInstalled)return;globalThis.__dawrakInstalled=true;
const blocked=/(password|passcode|secret|token|api.?key|credential|otp|pin\b|2fa|mfa|credit|debit|card|cvv|iban|bank|حذف|دفع|إرسال|تأكيد|اعتماد|نشر|تحويل|رمز|كلمة المرور|سري|بطاقة|delete|remove|transfer|pay|buy|send|submit|confirm|approve|publish|deploy|reset|login|logout)/i;
let state=null;
function describe(e){
 const r=e.getBoundingClientRect(),s=getComputedStyle(e);
 if(!e.isConnected||!r.width||!r.height||s.visibility==="hidden"||s.display==="none"||e.disabled||e.closest('[hidden],[inert],[aria-hidden="true"],[aria-disabled="true"]'))return null;
 const label=(e.getAttribute("aria-label")||Array.from(e.labels||[]).map(x=>x.textContent).join(" ")||e.placeholder||e.title||(!e.matches("input,textarea")&&e.innerText)||"").replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g," ").trim().slice(0,100);
 if(!label||blocked.test([label,e.id,e.name,e.type,e.autocomplete].join(" ")))return null;
 if(e.matches("a[href]")){const u=new URL(e.href);if(u.origin!==location.origin||u.search||u.hash||u.username||u.password||e.hasAttribute("download")||e.target&&e.target!=="_self"||blocked.test(u.pathname))return null;return {label,action:"click",target:u.pathname}}
 if(e.matches('button,[role="button"]')&&!e.closest("form")&&!["submit","reset"].includes(e.getAttribute("type")))return {label,action:"click",target:""};
 if(e.matches('textarea,input[type="text"],input[type="search"],input:not([type])')&&!e.readOnly&&!e.closest("[contenteditable]"))return {label,action:"fill",target:""};
 return null;
}
function scan(){state=null;if(window.top!==window||location.protocol!=="https:")throw Error("صفحات HTTPS الرئيسية فقط");
 const controls=[],nodes=[];for(const e of document.querySelectorAll('a[href],button,[role="button"],input,textarea')){if(controls.length===60)break;try{const x=describe(e);if(x){nodes.push(e);controls.push({id:nodes.length,...x})}}catch{}}
 const snapshot={snapshot:crypto.randomUUID(),origin:location.origin,expires:Date.now()+300000,controls};state={snapshot,nodes,url:location.href};return {snapshot};
}
function current(){if(!state||state.url!==location.href||state.snapshot.expires<=Date.now()){state=null;throw Error("افحص الصفحة مجددًا")}return state}
browser.runtime.onMessage.addListener((m,sender)=>{if(sender.id!==browser.runtime.id||m?.scope!=="dawrak-v1")return false;try{
 if(m.type==="scan")return Promise.resolve(scan());
 if(m.type==="get")return Promise.resolve({snapshot:current().snapshot});
 if(m.type==="stop"){state=null;return Promise.resolve({ok:true})}
 if(m.type==="execute"){const v=current(),item=policy(m.command,v.snapshot),e=v.nodes[item.id-1],d=describe(e);if(!d||JSON.stringify({id:item.id,...d})!==JSON.stringify(item))throw Error("تغير العنصر");
 state=null;if(item.action==="click"){e.scrollIntoView({block:"center"});e.click()}else{const proto=e.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,"value").set.call(e,m.command.text);e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}))}return Promise.resolve({ok:true,message:"نُفّذ الإجراء المحلي. تحقق من نتيجة الموقع."})}
 }catch(e){return Promise.resolve({error:e.message})}return false});
})();
