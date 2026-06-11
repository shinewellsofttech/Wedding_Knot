export const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    let numStr = Math.floor(num).toString();
    if (numStr.length > 9) return 'Overflow';
    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
    return str.trim();
};

export const amountToWords = (amount: number): string => {
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    let str = "INR " + numberToWords(rupees);
    if (paise > 0) {
        str += " and " + numberToWords(paise) + " paise";
    }
    return str + " Only";
};

export const generateInvoiceHTML = (
  title: string,
  state: any,
  gridRows: any[],
  otherChargesRows: any[] = [],
  taxOverrides: any = {}
) => {
  const vendorId = state.formData?.F_VendorMaster || state.formData?.F_PartyMaster || state.formData?.F_LedgerMaster || "";
  const vendorMasterObj = state.VendorMaster?.find((v: any) => String(v.Id) === String(vendorId)) || state.PartyMaster?.find((v: any) => String(v.Id) === String(vendorId));
  const vendor = state.SelectedVendor || vendorMasterObj;

  const isInState = (vendorMasterObj && (vendorMasterObj.IsInState === true || vendorMasterObj.IsInState === 1 || vendorMasterObj.IsInState === "1" || vendorMasterObj.IsInState === "true")) || 
    (vendor && (vendor.IsInState === true || vendor.IsInState === 1 || vendor.IsInState === "1" || vendor.IsInState === "true")) || false;

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

  gridRows.forEach((row) => {
    const qty = parseFloat(row.Qty) || 0;
    const rate = parseFloat(row.Rate) || 0;
    const amount = qty * rate;

    if (qty > 0) {
      const itemObj = row.ItemData?.find((i: any) => String(i.Id) === String(row.F_ItemMaster)) ||
                      state.ItemMaster?.find((i: any) => String(i.Id) === String(row.F_ItemMaster));
                      
      const gstGroupId = row.F_GSTGroupMaster || itemObj?.F_GSTGroupMaster || itemObj?.GSTGroupMasterId || itemObj?.GSTGroupId;
      const gstGroup = state.GSTGroupMaster?.find((g: any) => String(g.Id) === String(gstGroupId));
      
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
      } else if (row.GSTPercent) {
        if (isInState) {
          const half = row.GSTPercent / 2;
          if (half > highestCGSTPercent) highestCGSTPercent = half;
          if (half > highestSGSTPercent) highestSGSTPercent = half;
          totalCGST += amount * (half / 100);
          totalSGST += amount * (half / 100);
        } else {
          if (row.GSTPercent > highestIGSTPercent) highestIGSTPercent = row.GSTPercent;
          totalIGST += amount * (row.GSTPercent / 100);
        }
      }
    }
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

  const dispatchDocNo = state.formData.DispatchDocNo || "N/A";
  const dispatchedThrough = state.formData.DispatchedThrough || "N/A";

  let vendorInfo = "N/A";
  if (vendor) {
    const vendorStateId = vendor.F_StateMaster || vendor.StateId || vendor.F_State || vendor.F_StateId;
    const vendorState = state.StateMaster?.find((s: any) => String(s.Id) === String(vendorStateId));
    const vendorStateName = vendor.StateName || vendor.State || vendorState?.StateName || vendorState?.Name || "N/A";
    const vendorStateCode = vendor.StateCode || vendorState?.StateCode || "N/A";
    const vendorGST = vendor.GSTIN || vendor.GstIn || vendor.gstin || vendor.GSTNo || vendor.GstNo || vendor.GST_No || vendor.GST || vendor.TaxNo || vendor.TaxNumber || "N/A";

    vendorInfo = `
      <div style="font-weight: bold; font-size: 12px; margin-top: 4px; text-transform: uppercase;">${vendor.CompanyName || vendor.Name || vendor.LedgerName || vendor.PartyName}</div>
      ${vendor.Address ? `<div style="font-size: 11px; margin-top: 2px;">${vendor.Address}</div>` : ""}
      <div style="font-size: 11px; margin-top: 2px;">
        GSTIN/UIN: ${vendorGST}<br/>
        State Name : ${vendorStateName}, Code : ${vendorStateCode}
      </div>
    `;
  }

  const companyState = state.StateMaster?.find((s: any) => String(s.Id) === String(state.GlobalOptions?.[0]?.F_StateMaster));
  const companyStateName = companyState?.StateName || companyState?.Name || state.GlobalOptions?.[0]?.StateName || state.GlobalOptions?.[0]?.State || "N/A";
  const companyStateCode = companyState?.StateCode || state.GlobalOptions?.[0]?.StateCode || "N/A";
  const companyGST = state.GlobalOptions?.[0]?.GSTIN || state.GlobalOptions?.[0]?.GSTNo || "N/A";
  const companyPhone = state.GlobalOptions?.[0]?.Phone1 || state.GlobalOptions?.[0]?.MobileNo || state.GlobalOptions?.[0]?.PhoneNo || "N/A";
  const companyEmail = state.GlobalOptions?.[0]?.Email || state.GlobalOptions?.[0]?.EmailId || "N/A";

  const invoiceNo = state.formData.PONo || state.formData.EntryNo || state.formData.ChallanNo || "N/A";
  const invoiceDate = state.formData.PODate || state.formData.EntryDate || state.formData.ChallanDate || "N/A";

  let firstItemObj = gridRows[0]?.ItemData?.find((i: any) => String(i.Id) === String(gridRows[0]?.F_ItemMaster)) ||
                     state.ItemMaster?.find((i: any) => String(i.Id) === String(gridRows[0]?.F_ItemMaster));
  let hsn = firstItemObj?.HSNCode || firstItemObj?.HSN || gridRows[0]?.HSNCode || gridRows[0]?.HSN || "N/A";

  // Tax Sub-Table rows
  let taxBreakdownHTML = "";
  if (isInState) {
    taxBreakdownHTML = `
      <tr>
        <td style="padding: 4px; border: 1px solid #000; text-align: center;">${hsn}</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;">${subTotal.toFixed(2)}</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;">${(highestCGSTPercent).toFixed(2)}%</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;">${finalCGST.toFixed(2)}</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;">${(highestSGSTPercent).toFixed(2)}%</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;">${finalSGST.toFixed(2)}</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;">${(finalCGST + finalSGST).toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding: 4px; border: 1px solid #000; text-align: right; font-weight: bold;" colspan="2">Total</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;"></td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right; font-weight: bold;">${finalCGST.toFixed(2)}</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;"></td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right; font-weight: bold;">${finalSGST.toFixed(2)}</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right; font-weight: bold;">${(finalCGST + finalSGST).toFixed(2)}</td>
      </tr>
    `;
  } else {
    taxBreakdownHTML = `
      <tr>
        <td style="padding: 4px; border: 1px solid #000; text-align: center;">${hsn}</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;">${subTotal.toFixed(2)}</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;">${(highestIGSTPercent).toFixed(2)}%</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;">${finalIGST.toFixed(2)}</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;">${finalIGST.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding: 4px; border: 1px solid #000; text-align: right; font-weight: bold;" colspan="2">Total</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;"></td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right; font-weight: bold;">${finalIGST.toFixed(2)}</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right; font-weight: bold;">${finalIGST.toFixed(2)}</td>
      </tr>
    `;
  }

  let igstOrCgstSgstRows = "";
  if (isInState) {
    igstOrCgstSgstRows = `
      <tr>
        <td colspan="4" style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 6px; text-align: right;"><em>OUTPUT CGST</em></td>
        <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
        <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
        <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
        <td style="padding: 2px 6px; border-bottom: 1px solid #000; text-align: right; font-weight: bold;">${finalCGST.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="4" style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 6px; text-align: right;"><em>OUTPUT SGST</em></td>
        <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
        <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
        <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
        <td style="padding: 2px 6px; border-bottom: 1px solid #000; text-align: right; font-weight: bold;">${finalSGST.toFixed(2)}</td>
      </tr>
    `;
  } else {
    igstOrCgstSgstRows = `
      <tr>
        <td colspan="4" style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 6px; text-align: right;"><em>OUTPUT IGST</em></td>
        <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
        <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
        <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
        <td style="padding: 2px 6px; border-bottom: 1px solid #000; text-align: right; font-weight: bold;">${finalIGST.toFixed(2)}</td>
      </tr>
    `;
  }

  let forwardingRow = otherChargesRows.map((chargeRow) => {
    const ledger = state.OtherChargesLedgers?.find((l: any) => String(l.Id) === String(chargeRow.F_LedgerMaster));
    const chargeName = ledger?.LedgerName || ledger?.Name || "OTHER CHARGES";
    const amount = parseFloat(chargeRow.Amount) || 0;
    if (amount === 0) return "";
    return `
      <tr>
        <td colspan="4" style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 6px; text-align: right;"><em>${chargeName}</em></td>
        <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
        <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
        <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
        <td style="padding: 2px 6px; border-bottom: 1px solid #000; text-align: right; font-weight: bold;">${amount.toFixed(2)}</td>
      </tr>
    `;
  }).join("");

  return `
    <div style="font-family: Arial, sans-serif; background: white; color: black; padding: 15px; width: 100%; max-width: 800px; box-sizing: border-box; margin: 0 auto; line-height: 1.3;">
      <div style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 5px;">GST INVOICE</div>
      <div style="border: 1px solid #000; display: block;">
        
        <div style="display: flex; border-bottom: 1px solid #000;">
          <!-- Left side -->
          <div style="flex: 1; border-right: 1px solid #000; display: flex; flex-direction: column;">
            <div style="padding: 5px; border-bottom: 1px solid #000; flex: 1;">
              ${title.toUpperCase().includes("PURCHASE") ? vendorInfo : `
              <div style="font-weight: bold; font-size: 13px; text-transform: uppercase;">${firmName}</div>
              <div style="font-size: 11px;">${firmAddress}</div>
              <div style="font-size: 11px;">GSTIN/UIN: ${companyGST}</div>
              <div style="font-size: 11px;">State Name : ${companyStateName}, Code : ${companyStateCode}</div>
              <div style="font-size: 11px;">Contact : ${companyPhone}</div>
              <div style="font-size: 11px;">E-Mail : ${companyEmail}</div>
              `}
            </div>
            <div style="padding: 5px; flex: 1;">
              <div style="font-size: 11px;">Buyer (Bill to)</div>
              ${title.toUpperCase().includes("PURCHASE") ? `
              <div style="font-weight: bold; font-size: 13px; text-transform: uppercase;">${firmName}</div>
              <div style="font-size: 11px;">${firmAddress}</div>
              <div style="font-size: 11px;">GSTIN/UIN: ${companyGST}</div>
              <div style="font-size: 11px;">State Name : ${companyStateName}, Code : ${companyStateCode}</div>
              <div style="font-size: 11px;">Contact : ${companyPhone}</div>
              <div style="font-size: 11px;">E-Mail : ${companyEmail}</div>
              ` : vendorInfo}
            </div>
          </div>
          <!-- Right side -->
          <div style="flex: 1; display: flex; flex-direction: column;">
            <div style="display: flex; border-bottom: 1px solid #000; flex: 1;">
              <div style="flex: 1; padding: 5px; border-right: 1px solid #000;">
                <div style="font-size: 10px;">Invoice No.</div>
                <div style="font-weight: bold; font-size: 12px;">${invoiceNo}</div>
              </div>
              <div style="flex: 1; padding: 5px;">
                <div style="font-size: 10px;">Dated</div>
                <div style="font-weight: bold; font-size: 12px;">${invoiceDate}</div>
              </div>
            </div>
            <div style="display: flex; border-bottom: 1px solid #000; flex: 1;">
              <div style="flex: 1; padding: 5px; border-right: 1px solid #000;">
                <div style="font-size: 10px;">Dispatch Doc No.</div>
                <div style="font-weight: bold; font-size: 12px;">${dispatchDocNo}</div>
              </div>
              <div style="flex: 1; padding: 5px;">
                <div style="font-size: 10px;">Dispatched through</div>
                <div style="font-weight: bold; font-size: 12px;">${dispatchedThrough}</div>
              </div>
            </div>
            <div style="display: flex; flex: 1;">
              <div style="flex: 1; padding: 5px; border-right: 1px solid #000;"></div>
              <div style="flex: 1; padding: 5px;"></div>
            </div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; min-height: 250px;">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="padding: 4px; border-right: 1px solid #000; text-align: center; width: 30px; font-size: 11px;">Sl No.</th>
              <th style="padding: 4px; border-right: 1px solid #000; text-align: left; font-size: 11px;">Description of Goods</th>
              <th style="padding: 4px; border-right: 1px solid #000; text-align: center; width: 60px; font-size: 11px;">HSN/SAC</th>
              <th style="padding: 4px; border-right: 1px solid #000; text-align: center; width: 50px; font-size: 11px;">GST Rate</th>
              <th style="padding: 4px; border-right: 1px solid #000; text-align: center; width: 60px; font-size: 11px;">Quantity</th>
              <th style="padding: 4px; border-right: 1px solid #000; text-align: right; width: 70px; font-size: 11px;">Rate</th>
              <th style="padding: 4px; border-right: 1px solid #000; text-align: center; width: 40px; font-size: 11px;">per</th>
              <th style="padding: 4px; text-align: right; width: 90px; font-size: 11px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${gridRows.filter(r => parseFloat(r.Qty) > 0).map((row, index) => {
              const qty = parseFloat(row.Qty) || 0;
              const rate = parseFloat(row.Rate) || 0;
              const amount = qty * rate;
              const itemObj = row.ItemData?.find((i: any) => String(i.Id) === String(row.F_ItemMaster)) ||
                              state.ItemMaster?.find((i: any) => String(i.Id) === String(row.F_ItemMaster));
              const itemName = itemObj?.ItemName || itemObj?.Name || row.ItemCode || "N/A";
              const gstGroupId = row.F_GSTGroupMaster || itemObj?.F_GSTGroupMaster || itemObj?.GSTGroupMasterId || itemObj?.GSTGroupId;
              const gstGroup = state.GSTGroupMaster?.find((g: any) => String(g.Id) === String(gstGroupId));
              let gstPercent = gstGroup ? parseFloat(gstGroup.GSTPercent) || 0 : (row.GSTPercent || 0);
              const hsnCode = gstGroup?.HSN_SAC_Code || itemObj?.HSNCode || itemObj?.HSN || row.HSNCode || row.HSN || "";
              const uom = itemObj?.UOMName || itemObj?.UOM || "PCS";
              return `
                <tr>
                  <td style="padding: 2px 4px; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: center; font-size: 11px; vertical-align: top;">${index + 1}</td>
                  <td style="padding: 2px 4px; border-right: 1px solid #000; border-bottom: 1px solid #000; font-size: 11px; vertical-align: top;">
                    <strong>${itemName}</strong>
                  </td>
                  <td style="padding: 2px 4px; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: center; font-size: 11px; vertical-align: top;">${hsnCode}</td>
                  <td style="padding: 2px 4px; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: center; font-size: 11px; vertical-align: top;">${gstPercent}%</td>
                  <td style="padding: 2px 4px; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: center; font-size: 11px; vertical-align: top; font-weight: bold;">${qty} ${uom}</td>
                  <td style="padding: 2px 4px; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: right; font-size: 11px; vertical-align: top;">${rate.toFixed(2)}</td>
                  <td style="padding: 2px 4px; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: center; font-size: 11px; vertical-align: top;">${uom}</td>
                  <td style="padding: 2px 4px; border-bottom: 1px solid #000; text-align: right; font-size: 11px; vertical-align: top; font-weight: bold;">${amount.toFixed(2)}</td>
                </tr>
              `;
            }).join("")}
            ${forwardingRow}
            ${igstOrCgstSgstRows}
            <!-- empty space filler -->
            <tr>
              <td style="border-right: 1px solid #000; height: 100px;"></td>
              <td style="border-right: 1px solid #000;"></td>
              <td style="border-right: 1px solid #000;"></td>
              <td style="border-right: 1px solid #000;"></td>
              <td style="border-right: 1px solid #000;"></td>
              <td style="border-right: 1px solid #000;"></td>
              <td style="border-right: 1px solid #000;"></td>
              <td></td>
            </tr>
          </tbody>
          <tfoot style="border-top: 1px solid #000;">
            <tr>
              <td colspan="4" style="padding: 4px; border-right: 1px solid #000; text-align: right; font-size: 11px;">Total</td>
              <td style="padding: 4px; border-right: 1px solid #000; text-align: center; font-size: 11px; font-weight: bold;">${totalQty}</td>
              <td colspan="2" style="padding: 4px; border-right: 1px solid #000;"></td>
              <td style="padding: 4px; text-align: right; font-size: 12px; font-weight: bold;">₹ ${grandTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="padding: 5px; border-bottom: 1px solid #000; font-size: 11px;">
          <div>Amount Chargeable (in words)</div>
          <div style="font-weight: bold; font-size: 12px; margin-top: 2px;">${amountToWords(grandTotal)}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            ${isInState ? `
              <tr>
                <th rowspan="2" style="padding: 4px; border: 1px solid #000; text-align: center;">HSN/SAC</th>
                <th rowspan="2" style="padding: 4px; border: 1px solid #000; text-align: center;">Taxable Value</th>
                <th colspan="2" style="padding: 4px; border: 1px solid #000; text-align: center;">CGST</th>
                <th colspan="2" style="padding: 4px; border: 1px solid #000; text-align: center;">SGST</th>
                <th rowspan="2" style="padding: 4px; border: 1px solid #000; text-align: center;">Total Tax Amount</th>
              </tr>
              <tr>
                <th style="padding: 4px; border: 1px solid #000; text-align: center;">Rate</th>
                <th style="padding: 4px; border: 1px solid #000; text-align: center;">Amount</th>
                <th style="padding: 4px; border: 1px solid #000; text-align: center;">Rate</th>
                <th style="padding: 4px; border: 1px solid #000; text-align: center;">Amount</th>
              </tr>
            ` : `
              <tr>
                <th rowspan="2" style="padding: 4px; border: 1px solid #000; text-align: center;">HSN/SAC</th>
                <th rowspan="2" style="padding: 4px; border: 1px solid #000; text-align: center;">Taxable Value</th>
                <th colspan="2" style="padding: 4px; border: 1px solid #000; text-align: center;">IGST</th>
                <th rowspan="2" style="padding: 4px; border: 1px solid #000; text-align: center;">Total Tax Amount</th>
              </tr>
              <tr>
                <th style="padding: 4px; border: 1px solid #000; text-align: center;">Rate</th>
                <th style="padding: 4px; border: 1px solid #000; text-align: center;">Amount</th>
              </tr>
            `}
          </thead>
          <tbody>
            ${taxBreakdownHTML}
          </tbody>
        </table>

        <div style="padding: 5px; font-size: 11px;">
          Tax Amount (in words) : <strong>${amountToWords(totalTax)}</strong>
        </div>

        <div style="display: flex; border-top: 1px solid #000;">
          <div style="flex: 1; padding: 5px; border-right: 1px solid #000; font-size: 10px;">
            <div><u>Declaration</u></div>
            <div>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
          </div>
          <div style="flex: 1; display: flex; flex-direction: column;">
            <div style="padding: 5px; font-size: 10px; font-weight: bold; text-align: right;">for ${firmName}</div>
            <div style="margin-top: auto; padding: 5px; font-size: 10px; text-align: right;">Authorised Signatory</div>
          </div>
        </div>

      </div>
      <div style="text-align: center; font-size: 10px; margin-top: 5px;">This is a Computer Generated Invoice</div>
    </div>
  `;
};
