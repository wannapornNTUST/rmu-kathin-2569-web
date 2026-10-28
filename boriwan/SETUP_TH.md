# บริวารกฐิน มรม. 2569 — หน้าเว็บบน GitHub

เว็บไซต์ผู้ร่วมทำบุญ: https://wannapornntust.github.io/rmu-kathin-2569-web/boriwan/

ระบบนี้ **แยกจากเว็บบริจาคเงินกฐิน** ที่อยู่หน้าแรกของ repository เดียวกัน ห้ามแก้ไฟล์ root `index.html`, `config.js` หรือ Cloudflare Worker ของเว็บบริจาคเงินเดิม

## สถานะ

- `boriwan/index.html` เป็นหน้าเว็บบริวารกฐินฉบับเต็ม V16.1 (ไม่ได้ redirect ไปหน้า Apps Script)
- `boriwan/api-config.json` ยังไม่มี URL ของ Worker โดยตั้งใจ — จนกว่า API จะติดตั้งเสร็จจะไม่รับสลิปจากหน้านี้
- `boriwan/deployment/ApiGateway.gs` เป็นไฟล์ **เพิ่มใหม่** ใน Apps Script Public บริวารกฐิน
- `boriwan/deployment/worker.js` เป็นโค้ดสำหรับ Cloudflare Worker **ตัวใหม่**
- ระบบรับเงินจริง/ตรวจยอด Admin/Google Sheets ยังอยู่ที่ Apps Script และฐานข้อมูลเดิม

## ขั้นตอนเชื่อมให้ใช้งานจริง

1. เปิด **Kathin69 Public NEW Boriwan** ใน Apps Script เพิ่มสคริปต์ใหม่ชื่อ `ApiGateway.gs` ด้วยโค้ดจาก deployment (ไม่แทน Code.gs หรือ Shared.gs)
2. ตั้งค่า Script Properties ชื่อ `BORIWAN_GATEWAY_SECRET` เป็นค่าลับที่สุ่มอย่างน้อย 40 อักขระ **ห้ามส่งลง GitHub หรือในแชท** แล้ว Deploy Web app เป็นเวอร์ชันใหม่ Execute as Me / Anyone
3. ไป Cloudflare > Workers & Pages > Create Worker ชื่อ `rmu-kathin-boriwan-api` วางโค้ดจาก `deployment/worker.js`
4. ตั้งค่าตัวแปร Secret ใน Worker: `GAS_WEB_APP_URL` = URL /exec ที่เปิดได้, `BORIWAN_GATEWAY_SECRET` = ค่าเดียวกับใน Apps Script และ `TURNSTILE_SECRET` = Secret Key ของ Turnstile widget ที่อนุญาตโดเมน `wannapornntust.github.io`
5. เปิด `https://<WORKER-NAME>.<ACCOUNT>.workers.dev/health` ให้ได้ `configured: true`
6. แก้ `boriwan/api-config.json`: `apiUrl` เป็น URL ของ Worker และ `turnstileSiteKey` เป็น Site Key ของ Turnstile (ไม่ใช่ Secret Key)
7. ทดลองอ่าน Catalog และส่งสลิปทดสอบ โดยตั้ง Worker `ALLOW_PUBLIC_SUBMIT=NO` ระหว่างเตรียมระบบ แล้วเปลี่ยนเป็น `YES` **หลัง** ตรวจการส่งจริงในสภาพแวดล้อมทดสอบ/รับความเสี่ยงตาม Audit
8. ทดสอบก่อนเผยแพร่: การตรวจยอด Admin, ไม่มีการยืนยันซ้ำ, วันเวลาตามเกณฑ์, ไม่มีเมนูหนังสือขอบคุณ, ตรวจสิทธิ์โฟลเดอร์สลิป, ตรวจ Payments.transferDate

> สำคัญ: หาก Apps Script deployment เปิดไม่ได้หรือ permission ผิด การเพิ่ม Worker **ไม่สามารถ** ทำให้มันใช้งานได้โดยอัตโนมัติ ต้องเปิด `doPost` ผ่าน deployment ที่ทำงานจริงเสียก่อน

## ข้อมูลที่ห้ามเผยแพร่

ค่าของ Script Properties, secret ของ Cloudflare Worker/Turnstile, รหัสผ่าน, ข้อมูลผู้บริจาคและสลิป ไม่ควรอยู่ใน GitHub สาธารณะ