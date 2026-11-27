/* GPL-3.0-or-later */
function policy(raw,snap,now=Date.now()){
 const sensitive=/(?:password|passcode|secret|token|api.?key|credential|otp|\bpin\b|2fa|mfa|credit|debit|card|cvv|iban|bank|كلمة\s*(?:المرور|السر)|رمز|سري|بطاقة|حساب\s*بنكي|مفتاح|توكن|هوية|حذف|إزالة|ازالة|تحويل|دفع|شراء|إرسال|ارسال|اعتماد|تأكيد|تاكيد|نشر|إيداع|سحب|إلغاء|الغاء|تسجيل\s*الدخول|خروج|تفعيل|تعطيل|delete|remove|destroy|transfer|pay|purchase|buy|send|submit|confirm|approve|publish|deploy|revoke|reset|logout|login)/i;
 if(!snap||!Number.isFinite(snap.expires)||snap.expires<=now)throw Error("انتهت المعاينة");
 if(!raw||typeof raw!=="object"||Array.isArray(raw)||Object.keys(raw).some(k=>!["snapshot","origin","id","action","text"].includes(k)))throw Error("أمر غير صالح");
 if(raw.snapshot!==snap.snapshot||raw.origin!==snap.origin||!/^https:\/\/[^/?#@\s]+$/.test(raw.origin))throw Error("الموقع أو المعاينة لا يطابق الأمر");
 const item=snap.controls.find(x=>x.id===raw.id);
 if(!item||!Number.isInteger(raw.id)||item.action!==raw.action||!["click","fill"].includes(raw.action)||sensitive.test(item.label+" "+(item.target||"")))throw Error("عنصر محمي أو غير متاح");
 if(raw.action==="fill"){if(typeof raw.text!=="string"||raw.text.length<1||raw.text.length>500||/[\x00-\x1f\x7f]/.test(raw.text)||sensitive.test(raw.text)||/\d{6,}/.test(raw.text))throw Error("نص غير مسموح")}
 else if(Object.hasOwn(raw,"text"))throw Error("لا يُسمح بإضافة نص");
 return item;
}
if(typeof module!=="undefined")module.exports=policy;
