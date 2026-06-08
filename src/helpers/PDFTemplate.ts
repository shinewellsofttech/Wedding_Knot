export const generateInvoiceHTML = (
  title: string,
  state: any,
  gridRows: any[],
  otherChargesRows: any[] = [],
  taxOverrides: any = {}
) => {
  const vendorId = state.formData?.F_VendorMaster || state.formData?.F_PartyMaster || state.formData?.F_LedgerMaster || "";
  const vendor = state.VendorMaster?.find(
    (v: any) => String(v.Id) === String(vendorId)
  ) || state.PartyMaster?.find(
    (v: any) => String(v.Id) === String(vendorId)
  );

  const isInState = vendor
    ? vendor.IsInState === true ||
      vendor.IsInState === 1 ||
      vendor.IsInState === "1" ||
      vendor.IsInState === "true"
    : false;

  const firmName = state.GlobalOptions?.[0]?.FirmName || "FIRM NAME";
  const addressParts = [
    state.GlobalOptions?.[0]?.FirmAddress,
    state.GlobalOptions?.[0]?.CityName || state.GlobalOptions?.[0]?.City || state.CityMaster?.find((c: any) => String(c.Id) === String(state.GlobalOptions?.[0]?.F_CityMaster))?.Name,
    state.GlobalOptions?.[0]?.StateName || state.GlobalOptions?.[0]?.State || state.GlobalOptions?.[0]?.StateMasterName || state.StateMaster?.find((s: any) => String(s.Id) === String(state.GlobalOptions?.[0]?.F_StateMaster))?.StateName,
  ].filter(Boolean);
  const firmAddress = addressParts.join(", ");

  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let highestCGSTPercent = 0;
  let highestSGSTPercent = 0;
  let highestIGSTPercent = 0;

  const rowHTMLs = gridRows.filter(r => parseFloat(r.Qty) > 0).map((row, index) => {
    const qty = parseFloat(row.Qty) || 0;
    const rate = parseFloat(row.Rate) || 0;
    const amount = qty * rate;

    const itemObj =
      row.ItemData?.find((i: any) => String(i.Id) === String(row.F_ItemMaster)) ||
      state.ItemMaster?.find((i: any) => String(i.Id) === String(row.F_ItemMaster));

    const itemName = itemObj?.ItemName || itemObj?.Name || row.ItemCode || "N/A";
    const gstGroupId =
      itemObj?.F_GSTGroupMaster ||
      itemObj?.GSTGroupMasterId ||
      itemObj?.GSTGroupId ||
      row.F_GSTGroupMaster;
    const gstGroup = state.GSTGroupMaster?.find(
      (g: any) => String(g.Id) === String(gstGroupId)
    );

    if (gstGroup) {
      const cgstP = parseFloat(gstGroup.CGSTPercent) || 0;
      const sgstP = parseFloat(gstGroup.SGSTPercent) || 0;
      const igstP = parseFloat(gstGroup.IGSTPercent) || 0;

      if (cgstP > highestCGSTPercent) highestCGSTPercent = cgstP;
      if (sgstP > highestSGSTPercent) highestSGSTPercent = sgstP;
      if (igstP > highestIGSTPercent) highestIGSTPercent = igstP;

      if (isInState) {
        totalCGST += amount * (cgstP / 100);
        totalSGST += amount * (sgstP / 100);
      } else {
        totalIGST += amount * (igstP / 100);
      }
    }

    let variantHTML = "";
    if (row.Variant || row.ItemCode) {
      let parts = [];
      if (row.Variant) parts.push(`<span>Variant: ${row.Variant}</span>`);
      if (row.ItemCode) parts.push(`<span>Code: ${row.ItemCode}</span>`);
      variantHTML = `<div style="font-size: 11px; color: #333; margin-top: 2px;">${parts.join(" | ")}</div>`;
    }

    return `
      <tr>
        <td style="padding: 4px 6px; border-right: 1px solid #000; text-align: center; vertical-align: top;">${index + 1}</td>
        <td style="padding: 4px 6px; border-right: 1px solid #000; vertical-align: top;">
          <strong>${itemName}</strong>
          ${variantHTML}
        </td>
        <td style="padding: 4px 6px; border-right: 1px solid #000; text-align: center; vertical-align: top;">${qty}</td>
        <td style="padding: 4px 6px; border-right: 1px solid #000; text-align: right; vertical-align: top;">${rate.toFixed(2)}</td>
        <td style="padding: 4px 6px; text-align: right; vertical-align: top;">${amount.toFixed(2)}</td>
      </tr>
    `;
  });

  const totalOtherCharges = otherChargesRows.reduce(
    (sum, r) => sum + (parseFloat(r.Amount) || 0),
    0
  );

  if (isInState) {
    totalCGST += totalOtherCharges * (highestCGSTPercent / 100);
    totalSGST += totalOtherCharges * (highestSGSTPercent / 100);
  } else {
    totalIGST += totalOtherCharges * (highestIGSTPercent / 100);
  }

  const finalCGST = Math.round(
    taxOverrides.CGST !== undefined ? parseFloat(taxOverrides.CGST) || 0 : totalCGST
  );
  const finalSGST = Math.round(
    taxOverrides.SGST !== undefined ? parseFloat(taxOverrides.SGST) || 0 : totalSGST
  );
  const finalIGST = Math.round(
    taxOverrides.IGST !== undefined ? parseFloat(taxOverrides.IGST) || 0 : totalIGST
  );

  const totalTax = finalCGST + finalSGST + finalIGST;
  const totalQty = gridRows.filter(r => parseFloat(r.Qty) > 0).reduce((sum, row) => sum + (parseFloat(row.Qty) || 0), 0);
  const subTotal = gridRows.filter(r => parseFloat(r.Qty) > 0).reduce(
    (sum, row) => sum + (parseFloat(row.Qty) || 0) * (parseFloat(row.Rate) || 0),
    0
  );
  const grandTotal = subTotal + totalTax + totalOtherCharges;

  let vendorInfo = "N/A";
  if (vendor) {
    vendorInfo = `
      <div style="font-weight: bold; font-size: 14px; margin-top: 4px;">${vendor.CompanyName || vendor.Name || vendor.LedgerName || vendor.PartyName}</div>
      ${vendor.Address ? `<div style="font-size: 12px; margin-top: 2px;">${vendor.Address}</div>` : ""}
      ${vendor.Phone || vendor.MobileNo ? `<div style="font-size: 12px; margin-top: 2px;">Ph: ${vendor.Phone || vendor.MobileNo}</div>` : ""}
    `;
  }

  let taxRowsHTML = "";
  if (isInState) {
    taxRowsHTML = `
      <tr style="border-bottom: 1px solid #eee;">
        <td colspan="3" style="border-right: 1px solid #000;"></td>
        <td style="padding: 4px 6px; border-right: 1px solid #000; text-align: right;">CGST:</td>
        <td style="padding: 4px 6px; text-align: right;">${finalCGST.toFixed(2)}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eee;">
        <td colspan="3" style="border-right: 1px solid #000;"></td>
        <td style="padding: 4px 6px; border-right: 1px solid #000; text-align: right;">SGST:</td>
        <td style="padding: 4px 6px; text-align: right;">${finalSGST.toFixed(2)}</td>
      </tr>
    `;
  } else {
    taxRowsHTML = `
      <tr style="border-bottom: 1px solid #eee;">
        <td colspan="3" style="border-right: 1px solid #000;"></td>
        <td style="padding: 4px 6px; border-right: 1px solid #000; text-align: right;">IGST:</td>
        <td style="padding: 4px 6px; text-align: right;">${finalIGST.toFixed(2)}</td>
      </tr>
    `;
  }

  let otherChargesHTML = "";
  if (totalOtherCharges > 0) {
    otherChargesHTML = `
      <tr style="border-bottom: 1px solid #eee;">
        <td colspan="3" style="border-right: 1px solid #000;"></td>
        <td style="padding: 6px; border-right: 1px solid #000; text-align: right; font-weight: bold;">Other Charges:</td>
        <td style="padding: 6px; text-align: right; font-weight: bold;">${totalOtherCharges.toFixed(2)}</td>
      </tr>
    `;
  }

  let remarksHTML = "";
  if (state.formData.Remarks) {
    remarksHTML = `<div style="margin-top: 10px; font-size: 12px;"><strong>Remarks:</strong> ${state.formData.Remarks}</div>`;
  }

  const invoiceNo = state.formData.PONo || state.formData.EntryNo || state.formData.ChallanNo || "N/A";
  const invoiceDate = state.formData.PODate || state.formData.EntryDate || state.formData.ChallanDate || "N/A";

  return `
    <div style="font-family: Arial, sans-serif; background: white; color: black; padding: 15px; width: 800px; box-sizing: border-box; margin: 0 auto;">
      <div style="border: 1px solid #000; display: flex; flex-direction: column; height: 100%;">
        
        <div style="text-align: center; border-bottom: 1px solid #000; padding: 10px;">
          <h2 style="margin: 0; font-size: 22px; font-weight: bold; text-transform: uppercase;">${firmName}</h2>
          <div style="font-size: 12px; margin-top: 4px; color: #555;">${firmAddress}</div>
          <h4 style="margin: 5px 0 0 0; font-size: 16px; text-decoration: underline;">${title}</h4>
        </div>

        <div style="display: flex; border-bottom: 1px solid #000;">
          <div style="flex: 1; padding: 10px; border-right: 1px solid #000;">
            <strong>Bill To:</strong><br />
            ${vendorInfo}
          </div>
          <div style="flex: 1; padding: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span><strong>No.:</strong> ${invoiceNo}</span>
              <span><strong>Date:</strong> ${invoiceDate}</span>
            </div>
            ${remarksHTML}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; flex: 1;">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="padding: 6px; border-right: 1px solid #000; text-align: center; width: 40px;">#</th>
              <th style="padding: 6px; border-right: 1px solid #000; text-align: left;">Description of Goods</th>
              <th style="padding: 6px; border-right: 1px solid #000; text-align: center; width: 80px;">Qty</th>
              <th style="padding: 6px; border-right: 1px solid #000; text-align: right; width: 100px;">Rate</th>
              <th style="padding: 6px; text-align: right; width: 120px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowHTMLs.join("")}
            <tr>
              <td style="border-right: 1px solid #000; height: 100%;"></td>
              <td style="border-right: 1px solid #000;"></td>
              <td style="border-right: 1px solid #000;"></td>
              <td style="border-right: 1px solid #000;"></td>
              <td></td>
            </tr>
          </tbody>
          <tfoot style="border-top: 1px solid #000;">
            <tr style="border-bottom: 1px solid #eee;">
              <td colspan="2" style="padding: 6px; border-right: 1px solid #000; text-align: right; font-weight: bold;">Total:</td>
              <td style="padding: 6px; border-right: 1px solid #000; text-align: center; font-weight: bold;">${totalQty}</td>
              <td style="padding: 6px; border-right: 1px solid #000; text-align: right; font-weight: bold;">Sub Total:</td>
              <td style="padding: 6px; text-align: right; font-weight: bold;">${subTotal.toFixed(2)}</td>
            </tr>
            ${otherChargesHTML}
            ${taxRowsHTML}
            <tr style="border-top: 1px solid #000; font-size: 14px;">
              <td colspan="3" style="border-right: 1px solid #000;"></td>
              <td style="padding: 8px 6px; border-right: 1px solid #000; text-align: right; font-weight: bold;">Grand Total:</td>
              <td style="padding: 8px 6px; text-align: right; font-weight: bold;">${grandTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        
        <div style="display: flex; justify-content: space-between; padding: 30px 10px 10px 10px; margin-top: auto; border-top: 1px solid #000;">
          <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px;">Customer's Signature</div>
          <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px;">Authorised Signatory</div>
        </div>
      </div>
    </div>
  `;
};
