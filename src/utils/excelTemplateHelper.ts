import * as XLSX from "xlsx";

export const generateItemMasterTemplate = () => {
  // Define all ItemMaster fields
  const headers = [
    "ItemName",
    "ItemCode",
    "PrintName",
    "F_ItemGroup",
    "IsMultiUnit",
    "F_PrimaryUnit",
    "F_SecondaryUnit",
    "F_TertiaryUnit",
    "PrimaryPerSecondary",
    "SecondaryPerTertiary",
    "PrimaryPerTertiary",
    "DefaultSaleUnit",
    "DefaultPurchaseUnit",
    "BaseSaleRate",
    "BasePurchaseRate",
    "MRP",
    "Rate1",
    "Rate2",
    "Rate3",
    "UseGroupTax",
    "F_TaxGroup",
    "HSNCode",
    "IsTaxIncluded",
    "MaintainStock",
    "AllowNegativeStock",
    "IsActive",
    "Remarks",
    "F_MaterialMaster",
    "Weight",
    "Width",
    "Height",
  ];

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Create sample data row to show format
  const sampleData = [
    {
      ItemName: "Sample Item",
      ItemCode: "ITEM001",
      PrintName: "Sample Item Print",
      F_ItemGroup: "1",
      IsMultiUnit: "0",
      F_PrimaryUnit: "1",
      F_SecondaryUnit: "",
      F_TertiaryUnit: "",
      PrimaryPerSecondary: "",
      SecondaryPerTertiary: "",
      PrimaryPerTertiary: "",
      DefaultSaleUnit: "1",
      DefaultPurchaseUnit: "1",
      BaseSaleRate: "100",
      BasePurchaseRate: "80",
      MRP: "120",
      Rate1: "",
      Rate2: "",
      Rate3: "",
      UseGroupTax: "1",
      F_TaxGroup: "",
      HSNCode: "",
      IsTaxIncluded: "0",
      MaintainStock: "1",
      AllowNegativeStock: "0",
      IsActive: "1",
      Remarks: "",
      F_MaterialMaster: "",
      Weight: "",
      Width: "",
      Height: "",
    },
  ];

  // Create worksheet with headers and sample data
  const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

  // Set column widths
  const colWidths = headers.map(() => 15);
  ws["!cols"] = colWidths.map((width) => ({ wch: width }));

  // Add header styling (make it bold and colored)
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "ItemMaster");

  // Generate and download the file
  XLSX.writeFile(wb, "ItemMaster_Template.xlsx");
};

export const generateItemMasterTemplateEmpty = () => {
  // Define all ItemMaster fields
  const headers = [
    "ItemName",
    "ItemCode",
    "PrintName",
    "F_ItemGroup",
    "IsMultiUnit",
    "F_PrimaryUnit",
    "F_SecondaryUnit",
    "F_TertiaryUnit",
    "PrimaryPerSecondary",
    "SecondaryPerTertiary",
    "PrimaryPerTertiary",
    "DefaultSaleUnit",
    "DefaultPurchaseUnit",
    "BaseSaleRate",
    "BasePurchaseRate",
    "MRP",
    "Rate1",
    "Rate2",
    "Rate3",
    "UseGroupTax",
    "F_TaxGroup",
    "HSNCode",
    "IsTaxIncluded",
    "MaintainStock",
    "AllowNegativeStock",
    "IsActive",
    "Remarks",
    "F_MaterialMaster",
    "Weight",
    "Width",
    "Height",
  ];

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Create empty worksheet with just headers
  const ws = XLSX.utils.aoa_to_sheet([headers]);

  // Set column widths
  const colWidths = headers.map(() => 15);
  ws["!cols"] = colWidths.map((width) => ({ wch: width }));

  // Add header styling (make it bold and colored)
  for (let C = 0; C < headers.length; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "ItemMaster");

  // Generate and download the file
  XLSX.writeFile(wb, "ItemMaster_Template_Empty.xlsx");
};
