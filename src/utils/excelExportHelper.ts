import * as XLSX from "xlsx";

/**
 * Utility to export JSON array data or table records to an Excel (.xlsx) file.
 * @param data Array of objects to export
 * @param fileName Output file name (default adds timestamp if needed)
 * @param sheetName Sheet title inside the Excel workbook
 */
export const exportDataToExcel = (data: any[], fileName: string, sheetName: string = "Report") => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Calculate dynamic column widths based on cell content length
    const keys = Object.keys(data[0] || {});
    const colWidths = keys.map((key) => {
      const maxLen = Math.max(
        key.length,
        ...data.map((row) => String(row[key] ?? "").length)
      );
      return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
    });
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const safeName = fileName.replace(/[\\/:*?"<>|]/g, "_");
    const cleanFileName = safeName.endsWith(".xlsx") ? safeName : `${safeName}.xlsx`;
    XLSX.writeFile(wb, cleanFileName);
  } catch (error) {
    console.error("Excel Export Error:", error);
    alert("Failed to export Excel file. Please try again.");
  }
};
