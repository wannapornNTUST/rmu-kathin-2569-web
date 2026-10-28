/**
 * Quantity control for the EXISTING Kathin69 Public NEW Boriwan project only.
 * Install in that Apps Script as a new file named InventoryStock.gs.
 * Requires Catalog headers I=stockTotal, J=preReserved and small Code.gs edits.
 * NEVER install this file in the separate direct-money donation project.
 *
 * One-shot process: stock is claimed when CREATE+slip is submitted, NOT while
 * a donor is browsing. Unreviewed submissions reserve stock immediately.
 * An Admin CANCEL releases the reservation; FLAG keeps it allocated.
 */
function boriwanInventory_(all) {
  if (!all || !Array.isArray(all.catalog) || !Array.isArray(all.bookings))
    throw new Error('ไม่สามารถตรวจข้อมูลจำนวนคงเหลือได้');
  var stockRows=readTable_('Catalog');
  var limits=Object.create(null);
  stockRows.forEach(function(row) {
    var sku=String(row.sku||'').trim();
    if (!sku) return;
    var total=Number(row.stockTotal), reserved=Number(row.preReserved);
    // Fail closed if quantities have not been configured by an administrator.
    if (String(row.stockTotal).trim()==='' || String(row.preReserved).trim()==='' ||
        !Number.isSafeInteger(total) || total<0 ||
        !Number.isSafeInteger(reserved) || reserved<0 || reserved>total) {
      throw new Error('จำนวนตั้งต้นหรือจำนวนจองล่วงหน้าของ '+sku+' ไม่ถูกต้อง กรุณาติดต่อผู้ดูแล');
    }
    limits[sku]={total:total,preReserved:reserved};
  });
  var allocated=Object.create(null);
  allBookings_(all).forEach(function(booking) {
    // A confirmed payment and every submitted/unreviewed slip reserve stock.
    // An explicit cancellation releases it. This conservative rule avoids
    // re-selling uncertain transactions.
    if (booking.status==='CANCELLED') return;
    (booking.items||[]).forEach(function(item) {
      var sku=String(item.sku||''), qty=Number(item.qty);
      if (Number.isSafeInteger(qty) && qty>0)
        allocated[sku]=(allocated[sku]||0)+qty;
    });
  });
  return all.catalog.map(function(item) {
    var sku=String(item.sku);
    var lim=limits[sku];
    if (!lim) throw new Error('ไม่พบจำนวนตั้งต้นของรายการ '+sku);
    var taken=allocated[sku]||0;
    return Object.assign({},item,{
      stockTotal:lim.total, preReserved:lim.preReserved,
      stockAllocated:taken,
      stockRemaining:Math.max(0,lim.total-lim.preReserved-taken)
    });
  });
}
function boriwanValidateStock_(items,all) {
  var bySku=Object.create(null);
  boriwanInventory_(all).forEach(function(x){ bySku[x.sku]=x; });
  items.forEach(function(item) {
    var current=bySku[item.sku];
    if (!current || !current.enabled)
      throw new Error('รายการนี้ยังไม่เปิดรับ กรุณาเลือกใหม่');
    if (item.qty>current.stockRemaining)
      throw new Error(String(current.name||item.sku)+' เหลือ '+current.stockRemaining+
        ' '+String(current.unit||'ชิ้น')+' กรุณาปรับจำนวนก่อนส่งสลิป');
  });
}
