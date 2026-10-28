/** Isolated RMU Boriwan Kathin Worker. Does not modify the direct-money donation system.
 * Required secrets: GAS_WEB_APP_URL, BORIWAN_GATEWAY_SECRET, TURNSTILE_SECRET.
 * Enable submissions only after tests: ALLOW_PUBLIC_SUBMIT=YES.
 */
const ALLOWED = new Set(['getPublicData','getPublicParticipantsPage','submitDonationWithSlip','getDirectSubmissionResult']);
const CORS_ORIGIN='https://wannapornntust.github.io';
const MAX_BYTES=7200000;
function respond(obj,status=200,origin=''){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 if(origin===CORS_ORIGIN){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='POST, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type';}
 return new Response(JSON.stringify(obj),{status,headers});
}
function validGasUrl(raw){
 try {const u=new URL(raw);return u.protocol==='https:' && u.hostname==='script.google.com' && /^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname) && !u.search && !u.hash;} catch{return false;}
}
async function turnstileVerify(token,ip,secret){
 if(!secret || !token)return false;
 const form=new FormData();form.append('secret',secret);form.append('response',token);
 if(ip)form.append('remoteip',ip);
 const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form});
 if(!response.ok)return false;
 const result=await response.json();return result.success===true;
}
export default {
 async fetch(req,env){
  const origin=req.headers.get('Origin')||'';
  const url=new URL(req.url);
  if(url.pathname==='/health' && req.method==='GET')return respond({ok:true,service:'boriwan-api',configured:!!(env.GAS_WEB_APP_URL&&env.BORIWAN_GATEWAY_SECRET&&env.TURNSTILE_SECRET),accepting:env.ALLOW_PUBLIC_SUBMIT==='YES'});
  if(origin!==CORS_ORIGIN)return respond({ok:false,error:'Origin not allowed'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':CORS_ORIGIN,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600','Vary':'Origin'}});
  if(url.pathname!=='/rpc'||req.method!=='POST')return respond({ok:false,error:'Not found'},404,origin);
  if(!validGasUrl(env.GAS_WEB_APP_URL||'') || !env.BORIWAN_GATEWAY_SECRET)return respond({ok:false,error:'ระบบ API ยังไม่เชื่อม Apps Script'},503,origin);
  if(!/^application\/json\b/i.test(req.headers.get('Content-Type')||''))return respond({ok:false,error:'ต้องส่งข้อมูลแบบ JSON'},415,origin);
  if(Number(req.headers.get('Content-Length')||0)>MAX_BYTES)return respond({ok:false,error:'ไฟล์เกินขนาดที่กำหนด'},413,origin);
  try{
   const raw=await req.text();
   if(raw.length>MAX_BYTES)return respond({ok:false,error:'คำขอใหญ่เกินไป'},413,origin);
   const body=JSON.parse(raw);
   const method=body&&body.method;
   if(!ALLOWED.has(method)||!Array.isArray(body.args))return respond({ok:false,error:'คำขอไม่ถูกต้อง'},400,origin);
   if(method==='getPublicData' && body.args.length!==0)return respond({ok:false,error:'ข้อมูลไม่ถูกต้อง'},400,origin);
   if(method==='getPublicParticipantsPage' && (body.args.length!==4||String(body.args[0])!=='CONFIRMED'))return respond({ok:false,error:'หมวดรายชื่อไม่ถูกต้อง'},400,origin);
   if(method==='getDirectSubmissionResult' && (body.args.length!==1||!(/^[A-Za-z0-9-]{30,80}$/.test(body.args[0]))))return respond({ok:false,error:'รหัสคำขอไม่ถูกต้อง'},400,origin);
   if(method==='submitDonationWithSlip'){
    if(env.ALLOW_PUBLIC_SUBMIT!=='YES')return respond({ok:false,error:'ยังไม่เปิดรับแจ้งโอนผ่านเว็บไซต์นี้'},503,origin);
    if(body.args.length!==1||!body.args[0]||typeof body.args[0]!=='object')return respond({ok:false,error:'ข้อมูลสลิปไม่ครบ'},400,origin);
    if(!(await turnstileVerify(String(body.turnstileToken||''),req.headers.get('CF-Connecting-IP'),env.TURNSTILE_SECRET)))return respond({ok:false,error:'กรุณายืนยัน Turnstile ใหม่ก่อนส่ง'},403,origin);
   }
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),method==='submitDonationWithSlip'?80000:25000);
   let upstream;
   try{upstream=await fetch(env.GAS_WEB_APP_URL,{method:'POST',redirect:'follow',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.BORIWAN_GATEWAY_SECRET,method,args:body.args})});}
   finally{clearTimeout(timer);}
   const value=await upstream.text();
   let result;
   try{result=JSON.parse(value);}catch{return respond({ok:false,error:'Apps Script ไม่ตอบกลับแบบ API กรุณาตรวจ Deployment และสิทธิ์เข้าถึง'},502,origin);}
   if(!upstream.ok||!result||typeof result.ok!=='boolean')return respond({ok:false,error:'Apps Script ตอบกลับไม่สมบูรณ์'},502,origin);
   if(method==='getPublicData'&&env.ALLOW_PUBLIC_SUBMIT!=='YES'&&result.ok&&result.data){
    result.data.paymentEnabled=false;result.data.slipReportingOpen=false;
   }
   return respond(result,result.ok?200:400,origin);
  }catch(e){return respond({ok:false,error:e&&e.name==='AbortError'?'ระบบตอบกลับช้า กรุณาตรวจรายการก่อนส่งซ้ำ':'เชื่อมต่อระบบหลังบ้านไม่สำเร็จ โปรดตรวจสถานะ Apps Script'},502,origin);}
 }
};
