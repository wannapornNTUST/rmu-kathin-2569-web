// PUBLIC CONFIGURATION ONLY. No spreadsheet ID, API secret, or email credentials.
window.RMU_PORTAL_CONFIG=Object.freeze({
  apiUrl: 'https://rmu-kathin-2569-api.immauau.workers.dev',
  turnstileSiteKey: '0x4AAAAAAFm9IHDmFWAIVtTn' // Cloudflare Turnstile PUBLIC sitekey for this site
});


// Show the WEBSITE QR on top of the retired QR printed inside the poster.
// This is NOT the bank transfer/e-Donation QR displayed elsewhere on the page.
document.addEventListener('DOMContentLoaded', () => {
  const cover = document.querySelector('.poster-old-qr-cover');
  if (!cover) return;
  const img = document.createElement('img');
  img.src = './qr-website.svg';
  img.alt = 'QR สำหรับเปิดเว็บไซต์แจ้งโอนกฐิน มรม. 2569 ไม่ใช่ QR ชำระเงิน';
  img.loading = 'eager';
  img.decoding = 'async';
  img.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain;background:#fff;';
  cover.replaceChildren(img);
  cover.setAttribute('aria-label', img.alt);
  cover.style.cssText += ';padding:1px;overflow:hidden;background:#fff;pointer-events:auto;';
});
