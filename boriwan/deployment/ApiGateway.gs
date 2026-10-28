/** Add as a NEW ApiGateway.gs in Kathin69 Public NEW Boriwan.
 * Set Script Property BORIWAN_GATEWAY_SECRET, at least 40 random characters.
 * Never put this secret in GitHub. Do not add this file to the Admin project.
 */
function doPost(e) {
  const json = function(value) {
    return ContentService.createTextOutput(JSON.stringify(value))
      .setMimeType(ContentService.MimeType.JSON);
  };
  try {
    if (!e || !e.postData || typeof e.postData.contents !== 'string')
      throw new Error('คำขอไม่ถูกต้อง');
    if (e.postData.contents.length > 7200000)
      throw new Error('คำขอใหญ่เกินขนาดที่กำหนด');
    const req = JSON.parse(e.postData.contents);
    const expected = PropertiesService.getScriptProperties().getProperty('BORIWAN_GATEWAY_SECRET') || '';
    if (expected.length < 40 || !boriwanSafeEqual_(String(req.secret || ''), expected))
      throw new Error('ไม่ได้รับอนุญาต');
    const methods = {
      getPublicData: function(a) {
        if (a.length !== 0) throw new Error('พารามิเตอร์ไม่ถูกต้อง');
        return getPublicData();
      },
      getPublicParticipantsPage: function(a) {
        if (a.length !== 4 || a[0] !== 'CONFIRMED') throw new Error('หมวดรายการไม่ถูกต้อง');
        return getPublicParticipantsPage.apply(null, a);
      },
      getDirectSubmissionResult: function(a) {
        if (a.length !== 1) throw new Error('พารามิเตอร์ไม่ถูกต้อง');
        return getDirectSubmissionResult.apply(null,a);
      },
      submitDonationWithSlip: function(a) {
        if (a.length !== 1) throw new Error('พารามิเตอร์ไม่ถูกต้อง');
        return submitDonationWithSlip.apply(null,a);
      }
    };
    if (!req || !Array.isArray(req.args) || !Object.prototype.hasOwnProperty.call(methods,req.method))
      throw new Error('ไม่รองรับคำสั่งนี้');
    return json({ok:true,data:methods[req.method](req.args)});
  } catch (err) {
    return json({ok:false,error:String(err&&err.message||err).slice(0,240)});
  }
}
function boriwanSafeEqual_(a,b){
  const algorithm=Utilities.DigestAlgorithm.SHA_256;
  const hashA=Utilities.computeDigest(algorithm,String(a));
  const hashB=Utilities.computeDigest(algorithm,String(b));
  let diff=hashA.length^hashB.length;
  for(let i=0;i<Math.min(hashA.length,hashB.length);i++) diff|=(hashA[i]^hashB[i]);
  return diff===0;
}
