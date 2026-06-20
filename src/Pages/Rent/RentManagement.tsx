import React, { useState, useEffect, useRef } from "react";
import { Col, Row, Card, CardBody, CardFooter, Container, Input, Button, Modal, ModalBody, ModalHeader, ModalFooter, Form, FormGroup, Label } from "reactstrap";
import { Fn_AddEditData, Fn_FillListData, Fn_DeleteData, Fn_GetReport } from "../../store/Functions";
import { useDispatch } from "react-redux";
import { API_WEB_URLS } from "../../constants/constAPI";
import { useLocation, useNavigate } from "react-router-dom";
import GridSystemRentManagement from "./GridSystemRentManagement";
import { getCurrentDateYYYYMMDD, parseDateFromAPI } from "../../helpers/dateUtils";
import DateInput from "../../CommonElements/DateInput/DateInput";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import { Btn } from "../../AbstractElements";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";

interface GridRow {
  ItemCode: string;
  F_ItemGroupMaster: string;
  F_ItemMaster: string;
  F_WarehouseMaster: string;
  Qty: string;
  Rate: string;
  SecurityDeposit: string;
  Variant?: string;
  Photos?: any[];
  ItemData: any[] | null;
  UnitValue?: number;
  F_ItemDesignMaster?: number | string;
  DesignPhoto?: string;
  ItemName?: string;
  GSTPercent?: number;
}

interface StateData {
  id: number;
  formData: {
    PONo: string;
    PODate: string;
    F_VendorMaster: string;
    TillDate: string;
    Remarks: string;
    CustomerName?: string;
    MobileNo?: string;
    F_RentEntryH?: string;
    F_TaxLedger?: string;
    TotalTax?: number;
  };
  CreatedRentEntries?: any[];
  VendorMaster: any[];
  TaxLedgers: any[];
  ItemGroupMaster: any[];
  ItemMaster: any[];
  WarehouseMaster: any[];
  DefaultWarehouse: any | null;
  GlobalOptions?: any[];
  GSTGroupMaster?: any[];
  isEditMode: boolean;
  isGridEditable: boolean;
}

function RentManagement() {
  const API_URL_SAVE = "RentManagement/0/token";
  const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/RentEntryH/Id";
  const API_URL_LINES = API_WEB_URLS.MASTER + "/0/token/RentEntryL/Id";
  const API_URL_ITEMGROUP = API_WEB_URLS.MASTER + "/0/token/CategoryMaster/Id/0";
  const API_URL_ITEMS = API_WEB_URLS.MASTER + "/0/token/ItemMaster/Id";
  const API_URL_VENDOR = API_WEB_URLS.MASTER + "/0/token/SalesPartyLedgerMaster/Id/0";
  const API_URL_WAREHOUSE = API_WEB_URLS.MASTER + "/0/token/WarehouseMaster/Id/0";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState<StateData>({
    id: 0,
    formData: {
      PONo: "",
      PODate: getCurrentDateYYYYMMDD(),
      F_VendorMaster: "",
      TillDate: getCurrentDateYYYYMMDD(),
      Remarks: "",
      CustomerName: "",
      MobileNo: "",
      F_TaxLedger: "",
      TotalTax: 0,
    },
    VendorMaster: [],
    TaxLedgers: [],
    ItemGroupMaster: [],
    ItemMaster: [],
    WarehouseMaster: [],
    DefaultWarehouse: null,
    GlobalOptions: [],
    GSTGroupMaster: [],
    isEditMode: false,
    isGridEditable: true,
  });

  const [gridRows, setGridRows] = useState<GridRow[]>([
    {
      ItemCode: "",
      F_ItemGroupMaster: "",
      F_ItemMaster: "",
      F_WarehouseMaster: "",
      Qty: "",
      Rate: "",
      SecurityDeposit: "",
      Variant: "",
      Photos: [],
      ItemData: null,
    },
  ]);

  const saveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const itemGroups = await Fn_FillListData(dispatch, setState, "ItemGroupMaster", API_URL_ITEMGROUP);
        const vendors = await Fn_FillListData(dispatch, setState, "VendorMaster", API_URL_VENDOR);
        const API_URL_RE_LIST = API_WEB_URLS.MASTER + "/0/token/RentManagementData/Id/0";
        const reData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_RE_LIST);
        
        const API_URL_TAX = API_WEB_URLS.MASTER + "/0/token/LedgerMaster/Id/0";
        const taxLedgers = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_TAX);
        
        const globalOptions = await Fn_FillListData(dispatch, () => ({}), "ignored", `${API_WEB_URLS.MASTER}/0/token/GlobalOptions/Id/0`);
        const gstGroups = await Fn_FillListData(dispatch, () => ({}), "ignored", `${API_WEB_URLS.MASTER}/0/token/GSTGroupMaster/Id/0`);
        
        let reDataArray: any[] = [];
        if (Array.isArray(reData)) reDataArray = reData;
        else if (reData?.data?.dataList && Array.isArray(reData.data.dataList)) reDataArray = reData.data.dataList;
        else if (reData?.dataList && Array.isArray(reData.dataList)) reDataArray = reData.dataList;
        else if (reData?.data?.response && Array.isArray(reData.data.response)) reDataArray = reData.data.response;

        const extractArray = (data: any) => Array.isArray(data) ? data : (data?.data?.dataList || data?.dataList || data?.data?.response || data?.response || []);

        setState((prev) => ({
          ...prev,
          ItemGroupMaster: extractArray(itemGroups),
          VendorMaster: extractArray(vendors),
          CreatedRentEntries: reDataArray,
          TaxLedgers: extractArray(taxLedgers),
          GlobalOptions: extractArray(globalOptions),
          GSTGroupMaster: extractArray(gstGroups),
        }));

        const params = new URLSearchParams(location.search);
        const recordId = params.get("id");
        if (recordId) {
          await loadRentEntryRecord(parseInt(recordId));
        } else {
          try {
            const API_ENTRY_NO = API_WEB_URLS.MASTER + "/0/token/GetVoucherNoByVoucherTypeId/Id/15"; // Assuming 9 for Rent Entry, adjust if needed
            const entryNoData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_ENTRY_NO);
            let newEntryNo = "";
            let dataArray = extractArray(entryNoData);
            if (dataArray.length > 0 && dataArray[0].VoucherNo) {
              newEntryNo = String(dataArray[0].VoucherNo);
            } else if (typeof entryNoData === "string") {
              newEntryNo = entryNoData;
            }
            if (newEntryNo) {
              setState((prev) => ({
                ...prev,
                formData: { ...prev.formData, PONo: newEntryNo }
              }));
            }
          } catch (e) {
            console.error("Error fetching auto entry no:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching master data:", error);
      }
    };

    fetchMasterData();
  }, []);

  const fetchREDataAndPopulateGrid = async (reId: string) => {
    if (!reId) return;
    const prevState = state;
    const re = prevState.CreatedRentEntries?.find((p: any) => String(p.Id) === String(reId));
    if (!re) return;

    let lines: any[] = [];
    try {
      if (re.RentDetails) {
        const parsed = typeof re.RentDetails === "string" ? JSON.parse(re.RentDetails) : re.RentDetails;
        lines = Array.isArray(parsed) ? parsed : [];
      } else if (re.RentLDetails) {
        const parsed = typeof re.RentLDetails === "string" ? JSON.parse(re.RentLDetails) : re.RentLDetails;
        lines = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error parsing RentDetails", e);
    }

    setState((prev) => ({
      ...prev,
      isEditMode: true,
      isGridEditable: false,
      id: re.Id,
      formData: {
        ...prev.formData,
        PONo: re.EntryNo || "",
        PODate: re.EntryDate ? re.EntryDate.split('T')[0] : "",
        TillDate: re.TillDate ? re.TillDate.split('T')[0] : "",
        F_VendorMaster: re.F_LedgerMaster || "",
        Remarks: re.Remarks || "",
        CustomerName: re.CustomerName || "",
        MobileNo: re.MobileNo || "",
        F_TaxLedger: re.F_TaxLedger || re.F_LedgerMasterTax || "",
        F_RentEntryH: re.Id,
        TotalTax: re.TotalTax || 0,
      }
    }));

    if (lines.length > 0) {
      const mappedRows: GridRow[] = lines.map((l: any) => {
        const cleanUrl = (url: string) => {
          let cleaned = url || "";
          if (cleaned.includes("https://") && cleaned.lastIndexOf("https://") > 0) {
            const firstPart = cleaned.substring(0, cleaned.lastIndexOf("https://"));
            const secondPart = cleaned.substring(cleaned.lastIndexOf("https://"));
            if (firstPart.includes("Thumbnail")) {
              const filename = secondPart.substring(secondPart.lastIndexOf("/") + 1);
              return firstPart + filename;
            }
            return secondPart;
          }
          return cleaned;
        };
        let cleanPhoto = cleanUrl(l.DesignPhoto);
        let cleanThumb = cleanUrl(l.DesignPhoto_Thumb);

        return {
          ItemCode: l.Barcode || "",
          F_ItemGroupMaster: String(l.F_CategoryMaster || ""),
          F_ItemMaster: String(l.F_ItemMaster || ""),
          F_WarehouseMaster: state.DefaultWarehouse?.Id || "",
          Variant: l.Variant || l.Varient || "",
          Photos: cleanPhoto ? [{ full: cleanPhoto, thumb: cleanThumb || cleanPhoto }] : [],
          Qty: String(l.Qty || ""),
          Rate: l.Rate || l.RentPrice ? String(l.Rate || l.RentPrice) : "",
          SecurityDeposit: l.SecurityDeposit ? String(l.SecurityDeposit) : "",
          ItemData: [{ Id: l.F_ItemMaster, ItemName: l.ItemName || "Scanned Item" }],
          F_ItemDesignMaster: l.F_ItemDesignMaster || 0,
          DesignPhoto: l.DesignPhoto || "",
          ItemName: l.ItemName || "",
        };
      });
      setGridRows(mappedRows);
    } else {
      setGridRows([{ ItemCode: "", F_ItemGroupMaster: "", F_ItemMaster: "", F_WarehouseMaster: state.DefaultWarehouse?.Id || "", Variant: "", Qty: "", Rate: "", SecurityDeposit: "", Photos: [], ItemData: null }]);
      alert("No lines found for the selected Rent Entry.");
    }
  };

  const loadRentEntryRecord = async (id: number) => {
    try {
      setState((prev) => ({ ...prev, isEditMode: true }));
      const headerData = await Fn_FillListData(dispatch, setState, "headerData", API_URL_EDIT + "/" + id);
      const lineData = await Fn_FillListData(dispatch, setState, "lineData", API_URL_LINES + "/" + id);
      const header = Array.isArray(headerData) && headerData.length > 0 ? headerData[0] : null;
      const lines = Array.isArray(lineData) ? lineData : [];

      if (header) {
        setState((prev) => ({
          ...prev,
          id: id,
          formData: {
            PONo: header.EntryNo || "",
            PODate: header.EntryDate ? parseDateFromAPI(header.EntryDate) : getCurrentDateYYYYMMDD(),
            TillDate: header.TillDate ? parseDateFromAPI(header.TillDate) : getCurrentDateYYYYMMDD(),
            F_VendorMaster: header.F_LedgerMaster || "",
            Remarks: header.Remarks || "",
            CustomerName: header.CustomerName || "",
            MobileNo: header.MobileNo || "",
            F_TaxLedger: header.F_TaxLedger || header.F_LedgerMasterTax || "",
            TotalTax: header.TotalTax || 0,
          },
        }));

        if (lines.length > 0) {
          const rowsData = await Promise.all(
            lines.map(async (line: any) => {
              const itemData = await Fn_FillListData(dispatch, setState, `itemData_${line.F_CategoryMaster}`, API_URL_ITEMS + "/" + line.F_CategoryMaster);
              const extractArray = (data: any) => Array.isArray(data) ? data : (data?.data?.dataList || data?.dataList || data?.data?.response || data?.response || []);
              return {
                ItemCode: line.Barcode || "",
                F_ItemGroupMaster: line.F_CategoryMaster || "",
                F_ItemMaster: line.F_ItemMaster || "",
                F_WarehouseMaster: line.F_WarehouseMaster || "",
                Variant: line.Variant || line.Varient || "",
                Photos: [],
                Qty: line.Qty || "",
                Rate: line.Rate || line.RentPrice || "",
                SecurityDeposit: line.SecurityDeposit || "",
                ItemData: extractArray(itemData) || [],
                UnitValue: (line.UnitConversion && parseFloat(line.UnitConversion) > 0) ? parseFloat(line.UnitConversion) : 1,
                F_ItemDesignMaster: line.F_ItemDesignMaster || 0,
                DesignPhoto: line.DesignPhoto || "",
                ItemName: line.ItemName || "",
              };
            })
          );
          setGridRows(rowsData);
        }
      }
    } catch (error) {
      console.error("Error loading rent entry record:", error);
    }
  };

  const handleFormFieldChange = (field: string, value: any) => {
    setState((prev) => ({ ...prev, formData: { ...prev.formData, [field]: value } }));
  };

  const addRow = () => {
    setGridRows((prevRows) => [
      ...prevRows,
      { ItemCode: "", F_ItemGroupMaster: "", F_ItemMaster: "", F_WarehouseMaster: state.DefaultWarehouse?.Id || "", Variant: "", Photos: [], Qty: "", Rate: "", SecurityDeposit: "", ItemData: null, UnitValue: 1 },
    ]);
  };

  const handleDeleteRE = () => {
    if (!state.formData.F_RentEntryH) return;
    if (window.confirm("Are you sure you want to delete this Rent Entry?")) {
      const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/RentManagementH`;
      Fn_DeleteData(dispatch, () => {}, Number(state.formData.F_RentEntryH), DELETE_API_URL)
        .then(() => {
          alert("Rent Entry deleted successfully.");
          window.location.reload();
        })
        .catch((error: any) => {
          console.error("Failed to delete rent entry:", error);
          alert("Failed to delete rent entry. Please try again.");
        });
    }
  };

  const handleEditRE = () => {
    setState((prev) => ({ ...prev, isGridEditable: true }));
  };

  const removeRow = (index: number) => {
    if (gridRows.length > 1) {
      setGridRows((prevRows) => prevRows.filter((_, i) => i !== index));
    }
  };

  const updateGridRow = async (index: number, field: string, value: any) => {
    const updatedRows = [...gridRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    if (field === "F_ItemGroupMaster") {
      updatedRows[index].F_ItemMaster = "";
      updatedRows[index].ItemCode = "";
      if (value) {
        const itemData = await Fn_FillListData(dispatch, setState, `itemData_${value}`, API_URL_ITEMS + "/" + value);
        const extractArray = (data: any) => Array.isArray(data) ? data : (data?.data?.dataList || data?.dataList || data?.data?.response || data?.response || []);
        updatedRows[index].ItemData = extractArray(itemData) || [];
      } else {
        updatedRows[index].ItemData = null;
      }
    } else if (field === "F_ItemMaster") {
      const selectedItem = updatedRows[index].ItemData?.find((item: any) => String(item.Id) === String(value));
      if (selectedItem) {
        updatedRows[index].ItemCode = selectedItem.ItemCode || selectedItem.Code || "";
      }
    }
    setGridRows(updatedRows);
  };

  const handleBarcodeFetch = async (index: number, barcode: string) => {
    barcode = (barcode || "").trim();
    if (!barcode) return;
    if ((window as any).isFetchingBarcode) return;
    const now = Date.now();
    if ((window as any).lastScannedBarcode === barcode && now - ((window as any).lastScannedTime || 0) < 500) return;
    (window as any).lastScannedBarcode = barcode;
    (window as any).lastScannedTime = now;
    (window as any).isFetchingBarcode = true;

    const duplicateIndex = gridRows.findIndex((row, rIndex) => rIndex !== index && row.ItemCode === barcode);
    if (duplicateIndex !== -1) {
      const updatedRows = [...gridRows];
      const dupRow = updatedRows[duplicateIndex];
      const newQty = (parseFloat(dupRow.Qty) || 0) + 1;
      dupRow.Qty = String(newQty);
      
      updatedRows[duplicateIndex] = dupRow;
      updatedRows[index] = { ...updatedRows[index], ItemCode: "" };
      setGridRows(updatedRows);
      
      setTimeout(() => {
        const barcodeInput = document.querySelector(`input[data-row="${index}"][data-field="ItemCode"]`) as HTMLInputElement;
        if (barcodeInput) {
          barcodeInput.focus();
        }
      }, 100);
      (window as any).isFetchingBarcode = false;
      return;
    }

    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser?.uid ?? authUser?.Id ?? "0";
      const userToken = authUser?.Token ?? authUser?.token ?? "token";
      const url = `GetItemDetailByBarcode/${userId}/${userToken}`;
      const formData = new FormData();
      formData.append("Barcode", barcode);

      const res = await Fn_GetReport(dispatch, () => {}, "ignored", url, { arguList: { id: 0, formData } }, true);
      let list: any[] = [];
      if (Array.isArray(res)) list = res;
      else if (res && typeof res === "object") {
        if (Array.isArray(res.response)) list = res.response;
        else if (res.data && Array.isArray(res.data.response)) list = res.data.response;
      }

      if (list && list.length > 0) {
        const item = list[0];
        
        let designItem = null;
        try {
          if (typeof item.DesignDetails === "string") {
            const parsedDesign = JSON.parse(item.DesignDetails);
            designItem = parsedDesign.find((d: any) => String(d.Barcode) === String(barcode));
          } else if (Array.isArray(item.DesignDetails)) {
            designItem = item.DesignDetails.find((d: any) => String(d.Barcode) === String(barcode));
          }
        } catch(e) {}
        
        if (!designItem) designItem = item;

        const groupId = item.F_CategoryMaster || item.F_ItemGroupMaster || "";
        const itemId = item.F_ItemMaster || item.Id || "";
        
        let unitVal = parseFloat(designItem.UnitConversion);
        if (isNaN(unitVal) || unitVal === 0) unitVal = 1;

        let gstPercent = 0;
        const gstGroupId = item.F_GSTGroupMaster || "";
        const gstGroup = state.GSTGroupMaster?.find((g: any) => String(g.Id) === String(gstGroupId));
        if (gstGroup) {
          gstPercent = parseFloat(gstGroup.GSTPercent) || parseFloat(gstGroup.IGSTPercent) || 0;
        }

        let baseSecDep = parseFloat(designItem.SalePrice || item.SalePrice || designItem.SecurityDeposit || item.SecurityDeposit || 0);
        let secDepWithGST = baseSecDep + (baseSecDep * gstPercent / 100);

        const updatedRows = [...gridRows];
        
        updatedRows[index] = {
          ...updatedRows[index],
          ItemCode: designItem.Barcode || item.Barcode || barcode,
          F_ItemGroupMaster: String(groupId),
          F_ItemMaster: String(itemId),
          Variant: designItem.SizeName || item.SizeName || "",
          Qty: "1",
          Rate: designItem.RentPrice || item.RentPrice || designItem.Rate || item.Rate || "",
          SecurityDeposit: String(secDepWithGST.toFixed(2)),
          ItemData: [{ Id: itemId, ItemName: item.ItemName || "Scanned Item", F_GSTGroupMaster: gstGroupId }],
          GSTPercent: gstPercent,
          UnitValue: unitVal,
          F_ItemDesignMaster: designItem.Id || item.Id || 0,
          DesignPhoto: designItem.DesignPhoto || item.DesignPhoto || "",
          ItemName: item.ItemName || designItem.ItemName || "Scanned Item"
        };
        
        let nextRowIndex = index;
        if (index === gridRows.length - 1) {
          updatedRows.push({
            ItemCode: "",
            F_ItemGroupMaster: "",
            F_ItemMaster: "",
            F_WarehouseMaster: state.DefaultWarehouse?.Id || "",
            Variant: "",
            Photos: [],
            Qty: "",
            Rate: "",
            SecurityDeposit: "",
            ItemData: null,
          });
          nextRowIndex = index + 1;
        } else {
          nextRowIndex = index + 1;
        }
        
        setGridRows(updatedRows);
        
        setTimeout(() => {
          const barcodeInput = document.querySelector(`input[data-row="${nextRowIndex}"][data-field="ItemCode"]`) as HTMLInputElement;
          if (barcodeInput) {
            barcodeInput.focus();
          }
        }, 100);
        (window as any).isFetchingBarcode = false;
      } else {
        (window as any).isFetchingBarcode = false;
      }
    } catch (e) {
      console.error("Error fetching barcode details:", e);
      (window as any).isFetchingBarcode = false;
    }
  };

  const handleSave = async () => {
    if (!state.formData.F_VendorMaster) { alert("Please select a Party"); return; }
    const validGridRows = gridRows.filter(row => row.ItemCode || row.F_ItemMaster);
    if (validGridRows.length === 0) { alert("Please add at least one valid item"); return; }
    for (let i = 0; i < validGridRows.length; i++) {
      const row = validGridRows[i];
      if (!row.F_ItemMaster || !row.Qty || parseFloat(row.Qty) <= 0 || !row.Rate || parseFloat(row.Rate) < 0 || !row.SecurityDeposit || parseFloat(row.SecurityDeposit) < 0) {
        alert(`Row ${i + 1}: Please fill all required fields correctly (Item, Quantity, Rent Price, Security Deposit)`);
        return;
      }
    }
    try {
      const obj = JSON.parse(localStorage.getItem("user") || "{}");
      
      const subTotal = validGridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.Rate) || 0)), 0);
      const totalSecDep = validGridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.SecurityDeposit) || 0)), 0);

      let taxAmount = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;
      const vendor = state.VendorMaster?.find((v: any) => String(v.Id) === String(state.formData.F_VendorMaster));
      const isInState = vendor ? (vendor.IsInState === true || vendor.IsInState === 1 || vendor.IsInState === "1" || vendor.IsInState === "true") : false;

      if (state.GlobalOptions && state.GlobalOptions.length > 0 && state.GSTGroupMaster && state.GSTGroupMaster.length > 0) {
        const globalOpt = state.GlobalOptions[0];
        const serviceTaxGroupId = globalOpt.F_GSTGroupMaster || globalOpt.F_GSTGroupMaster_ServiceTax || globalOpt.F_ServiceTaxGroup;
        if (serviceTaxGroupId) {
          const gstGroup = state.GSTGroupMaster.find((g: any) => String(g.Id) === String(serviceTaxGroupId));
          if (gstGroup) {
            const cgstP = parseFloat(gstGroup.CGSTPercent) || 0;
            const sgstP = parseFloat(gstGroup.SGSTPercent) || 0;
            const igstP = parseFloat(gstGroup.IGSTPercent) || 0;

            if (isInState) {
              const totalPercent = cgstP + sgstP;
              if (totalPercent > 0) {
                taxAmount = subTotal * (totalPercent / 100);
                cgstAmount = taxAmount * (cgstP / totalPercent) || 0;
                sgstAmount = taxAmount * (sgstP / totalPercent) || 0;
              }
            } else {
              const totalPercent = igstP;
              if (totalPercent > 0) {
                taxAmount = subTotal * (totalPercent / 100);
                igstAmount = taxAmount;
              }
            }
          }
        }
      }

      const jsonDataArray = validGridRows.map((row) => {
        const qty = Number(row.Qty) || 0;
        const rate = Number(row.Rate) || 0;
        const amount = qty * rate;

        return {
          F_ItemDesignMaster: Number(row.F_ItemDesignMaster) || 0,
          F_CategoryMaster: Number(row.F_ItemGroupMaster) || 0,
          F_ItemMaster: Number(row.F_ItemMaster) || 0,
          Barcode: row.ItemCode || "",
          ItemName: row.ItemName || row.ItemData?.[0]?.ItemName || "",
          DesignPhoto: row.DesignPhoto || "",
          Qty: qty,
          RentPrice: rate,
          SecurityDeposit: Number(row.SecurityDeposit) || 0,
          Amount: amount,
          F_StatusMaster: 0
        };
      });

      const headerFormData = new FormData();
      headerFormData.append("EntryNo", state.formData.PONo || "");
      headerFormData.append("EntryDate", state.formData.PODate);
      headerFormData.append("TillDate", state.formData.TillDate);
      headerFormData.append("F_LedgerMaster", state.formData.F_VendorMaster);
      headerFormData.append("F_LedgerMaster_Tax", state.formData.F_TaxLedger || "0");
      headerFormData.append("Remarks", state.formData.Remarks || "");
      headerFormData.append("CustomerName", state.formData.CustomerName || "");
      headerFormData.append("MobileNo", state.formData.MobileNo || "");
      headerFormData.append("TotalRentAmount", subTotal.toString());
      headerFormData.append("TotalSecurityDeposit", totalSecDep.toString());
      headerFormData.append("TaxAmount", taxAmount.toFixed(2));
      headerFormData.append("TotalTaxAmount", taxAmount.toFixed(2));
      headerFormData.append("TotalTax", taxAmount.toFixed(2));
      headerFormData.append("TotalCGST", cgstAmount.toFixed(2));
      headerFormData.append("TotalSGST", sgstAmount.toFixed(2));
      headerFormData.append("TotalIGST", igstAmount.toFixed(2));
      headerFormData.append("F_LedgerMaster_CGST", cgstAmount > 0 ? "18" : "0");
      headerFormData.append("F_LedgerMaster_SGST", sgstAmount > 0 ? "19" : "0");
      headerFormData.append("F_LedgerMaster_IGST", igstAmount > 0 ? "17" : "0");
      headerFormData.append("F_CompanyMaster", "0");
      headerFormData.append("UserId", obj?.uid || "0");
      headerFormData.append("JsonData", JSON.stringify(jsonDataArray));
      headerFormData.append("F_RentManagementH", state.formData.F_RentEntryH || "0");
      await Fn_AddEditData(dispatch, setState, { arguList: { id: state.id, formData: headerFormData } }, API_URL_SAVE, true, "memberid", navigate, "#");
      alert("Rent Entry saved successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error saving rent entry:", error);
    }
  };

  const latestBarcodeFetch = useRef(handleBarcodeFetch);
  const latestGridRows = useRef(gridRows);
  useEffect(() => {
    latestBarcodeFetch.current = handleBarcodeFetch;
    latestGridRows.current = gridRows;
  });

  useEffect(() => {
    let barcodeBuffer = "";
    let lastKeyTime = Date.now();
    let originalInputValue = "";
    let activeInputRef: HTMLInputElement | HTMLTextAreaElement | null = null;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      if (currentTime - lastKeyTime > 50) {
        barcodeBuffer = "";
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          activeInputRef = activeEl as HTMLInputElement | HTMLTextAreaElement;
          originalInputValue = activeInputRef.value;
        } else {
          activeInputRef = null;
        }
      }
      
      if (e.key === "Enter" && barcodeBuffer.length >= 3) {
        const finalBarcode = barcodeBuffer;
        barcodeBuffer = "";
        
        // Prevent default to avoid form submission or unwanted newlines
        e.preventDefault();

        // Restore original input value if focus was on an input
        if (activeInputRef && activeInputRef === document.activeElement) {
          const proto = activeInputRef.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(activeInputRef, originalInputValue);
            activeInputRef.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }

        const currentGridRows = latestGridRows.current;
        let targetIndex = currentGridRows.findIndex((row: any) => !row.ItemCode);
        if (targetIndex === -1) {
          targetIndex = currentGridRows.length - 1;
        }
        
         
        if (latestBarcodeFetch.current) {
          latestBarcodeFetch.current(targetIndex, finalBarcode);
        }
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
      
      lastKeyTime = currentTime;
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const rentCompactStyles = `
    @media (max-width: 991.98px) {
      .rent-entry-page .container-fluid { padding: 0.4rem !important; }
      .rent-entry-page .card-body { padding: 0.4rem !important; }
      .rent-entry-page .card-footer { padding: 0.35rem 0.4rem !important; }
      .rent-entry-page .form-label { font-size: 0.75rem; margin-bottom: 0.2rem; }
      .rent-entry-page .form-control { font-size: 0.8rem; height: 26px; padding: 0.2rem 0.35rem; }
      .rent-entry-page .btn { font-size: 0.8rem; padding: 0.22rem 0.4rem; }
    }
    @media (max-width: 767.98px) {
      .rent-entry-page .container-fluid { padding: 0.25rem !important; }
      .rent-entry-page .card-body { padding: 0.3rem !important; }
      .rent-entry-page .card-footer { padding: 0.25rem 0.3rem !important; }
      .rent-entry-page .form-label { font-size: 0.7rem; margin-bottom: 0.15rem; }
      .rent-entry-page .form-control { font-size: 0.75rem; height: 24px; padding: 0.15rem 0.28rem; }
      .rent-entry-page .btn { font-size: 0.75rem; padding: 0.18rem 0.35rem; }
    }
  `;

  return (
    <div className="page-body rent-entry-page" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <style>{rentCompactStyles}</style>
      <Breadcrumbs mainTitle="Rent Management" parent="Rent" />
      <Container fluid className="px-2 px-sm-3">
        <Row>
          <Col xs="12">
            <Card>
              <CardBody className="p-2 p-sm-3">
                <Row className="g-2 g-sm-3">
                  <Col md="2">
                    <label className="form-label">Created Rent</label>
                    <select className="form-control" value={state.formData.F_RentEntryH || ""} onChange={(e) => { 
                      const val = e.target.value;
                      handleFormFieldChange("F_RentEntryH", val); 
                      if (!val) window.location.reload();
                      else fetchREDataAndPopulateGrid(val); 
                    }}>
                      <option value="">Select Rent Entry</option>
                      {state.CreatedRentEntries?.map((re: any) => (
                        <option key={re.Id} value={re.Id}>{re.EntryNo || re.Id}</option>
                      ))}
                    </select>
                  </Col>

                  <Col md="2">
                    <label className="form-label">Entry No</label>
                    <Input type="text" value={state.formData.PONo} onChange={(e) => handleFormFieldChange("PONo", e.target.value)} disabled={state.isEditMode} placeholder="Auto-generated" />
                  </Col>
                  <Col md="2">
                    <label className="form-label">Entry Date</label>
                    <DateInput name="poDate" value={state.formData.PODate} onChange={(e: any) => handleFormFieldChange("PODate", e.target.value)} />
                  </Col>
                  <Col md="2">
                    <div className="d-flex justify-content-between align-items-center">
                      <label className="form-label">Party</label>
                    </div>
                    <select className="form-control" value={state.formData.F_VendorMaster} onChange={(e) => handleFormFieldChange("F_VendorMaster", e.target.value)} disabled={!state.isGridEditable}>
                      <option value="">Select Party</option>
                      {state.VendorMaster?.map((v: any) => (
                        <option key={v.Id} value={v.Id}>{v.CompanyName || v.Name || v.LedgerName}</option>
                      ))}
                    </select>
                  </Col>
                  <Col md="2">
                    <label className="form-label">Till Date</label>
                    <DateInput name="tillDate" value={state.formData.TillDate} onChange={(e: any) => handleFormFieldChange("TillDate", e.target.value)} />
                  </Col>

                  <Col md="2">
                    <label className="form-label">Customer Name</label>
                    <Input type="text" value={state.formData.CustomerName || ""} onChange={(e) => handleFormFieldChange("CustomerName", e.target.value)} placeholder="Customer Name" disabled={!state.isGridEditable} />
                  </Col>
                  <Col md="2">
                    <label className="form-label">Mobile No</label>
                    <Input type="text" value={state.formData.MobileNo || ""} onChange={(e) => handleFormFieldChange("MobileNo", e.target.value)} placeholder="Mobile No" disabled={!state.isGridEditable} />
                  </Col>

                  <Col md="2">
                    <label className="form-label">Remarks</label>
                    <Input type="text" value={state.formData.Remarks} onChange={(e) => handleFormFieldChange("Remarks", e.target.value)} placeholder="Enter remarks" disabled={!state.isGridEditable} />
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col xs="12" className="overflow-auto">
                    <GridSystemRentManagement
                      gridRows={gridRows}
                      itemGroupMaster={state.ItemGroupMaster}
                      onAddRow={addRow}
                      onRemoveRow={removeRow}
                      onUpdateRow={updateGridRow}
                      disabled={!state.isGridEditable}
                      onBarcodeFetch={handleBarcodeFetch}
                      saveButtonRef={saveButtonRef}
                    />
                  </Col>
                </Row>

                {/* Summary Section */}
                <Row className="mt-4">
                  {(() => {
                    const subTotal = gridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.Rate) || 0)), 0);
                    const totalSecDep = gridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.SecurityDeposit) || 0)), 0);
                    
                    let taxAmount = 0;
                    let cgstAmount = 0;
                    let sgstAmount = 0;
                    let igstAmount = 0;

                    const vendor = state.VendorMaster?.find((v: any) => String(v.Id) === String(state.formData.F_VendorMaster));
                    const isInState = vendor ? (vendor.IsInState === true || vendor.IsInState === 1 || vendor.IsInState === "1" || vendor.IsInState === "true") : false;

                    if (state.GlobalOptions && state.GlobalOptions.length > 0 && state.GSTGroupMaster && state.GSTGroupMaster.length > 0) {
                      const globalOpt = state.GlobalOptions[0];
                      const serviceTaxGroupId = globalOpt.F_GSTGroupMaster || globalOpt.F_GSTGroupMaster_ServiceTax || globalOpt.F_ServiceTaxGroup;
                      if (serviceTaxGroupId) {
                        const gstGroup = state.GSTGroupMaster.find((g: any) => String(g.Id) === String(serviceTaxGroupId));
                        if (gstGroup) {
                          const cgstP = parseFloat(gstGroup.CGSTPercent) || 0;
                          const sgstP = parseFloat(gstGroup.SGSTPercent) || 0;
                          const igstP = parseFloat(gstGroup.IGSTPercent) || 0;

                          if (isInState) {
                            const totalPercent = cgstP + sgstP;
                            if (totalPercent > 0) {
                              taxAmount = subTotal * (totalPercent / 100);
                              cgstAmount = taxAmount * (cgstP / totalPercent) || 0;
                              sgstAmount = taxAmount * (sgstP / totalPercent) || 0;
                            }
                          } else {
                            const totalPercent = igstP;
                            if (totalPercent > 0) {
                              taxAmount = subTotal * (totalPercent / 100);
                              igstAmount = taxAmount;
                            }
                          }
                        }
                      }
                    }
                    
                    const grandTotal = totalSecDep;

                    return (
                      <>
                        <Col md="8">
                          <div className="d-flex flex-wrap gap-3">
                            <div className="p-3 bg-light border rounded flex-grow-1" style={{ minWidth: "250px", maxWidth: "350px" }}>
                              <h6 className="mb-1 text-muted fw-bold">Total Rent Amount</h6>
                              <h4 className="mb-2 text-primary">₹ {(subTotal + taxAmount).toFixed(2)}</h4>
                              
                              <div className="d-flex justify-content-between small text-muted mt-2"><span>Rent Subtotal:</span> <span>₹ {subTotal.toFixed(2)}</span></div>
                              {taxAmount > 0 && <div className="d-flex justify-content-between small text-muted mt-1 fw-bold"><span>Total GST:</span> <span>₹ {taxAmount.toFixed(2)}</span></div>}
                              {cgstAmount > 0 && <div className="d-flex justify-content-between small text-muted mt-1"><span className="ms-2">- CGST:</span> <span>₹ {cgstAmount.toFixed(2)}</span></div>}
                              {sgstAmount > 0 && <div className="d-flex justify-content-between small text-muted"><span className="ms-2">- SGST:</span> <span>₹ {sgstAmount.toFixed(2)}</span></div>}
                              {igstAmount > 0 && <div className="d-flex justify-content-between small text-muted mt-1"><span className="ms-2">- IGST:</span> <span>₹ {igstAmount.toFixed(2)}</span></div>}

                              <div className="text-muted mt-2 fw-normal" style={{ fontSize: "0.75rem", borderTop: "1px dashed #ccc", paddingTop: "0.5rem" }}>
                                (Receipt entry will be done at Rent Return)
                              </div>
                            </div>
                            
                            <div className="p-3 bg-light border rounded flex-grow-1" style={{ minWidth: "250px", maxWidth: "350px" }}>
                              <h6 className="mb-1 text-muted fw-bold">Total Security Deposit</h6>
                              <h4 className="mb-2 text-info">₹ {totalSecDep.toFixed(2)}</h4>

                            </div>
                          </div>
                        </Col>
                        <Col md="4">
                          <div className="table-responsive h-100 d-flex flex-column justify-content-end">
                            <table className="table table-bordered table-sm mb-0 align-middle shadow-sm">
                              <tbody>
                                <tr>
                                  <th className="text-end text-success fs-5 py-3">Grand Total:</th>
                                  <td className="text-end text-success fw-bold fs-5 py-3">₹ {grandTotal.toFixed(2)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </Col>
                      </>
                    );
                  })()}
                </Row>
              </CardBody>
              <CardFooter className="d-flex flex-row flex-nowrap gap-2 justify-content-end p-2 p-sm-3">
                {state.isEditMode && !state.isGridEditable && (
                  <Btn
                    type="button"
                    color="warning"
                    onClick={handleEditRE}
                  >
                    <i className="fa fa-edit me-1"></i> Edit
                  </Btn>
                )}
                {state.isEditMode && !state.isGridEditable && (
                  <Btn type="button" color="danger" onClick={handleDeleteRE}>
                    <i className="fa fa-trash me-1"></i> Delete
                  </Btn>
                )}
                <button ref={saveButtonRef} type="button" className="btn btn-primary m-0" onClick={handleSave} disabled={!state.isGridEditable}>
                  <i className="bx bx-save me-2"></i>Save
                </button>
                <Btn color="dark" type="button" className="m-0" onClick={() => navigate("/dashboard")}>
                  <i className="bx bx-exit me-2"></i>Exit
                </Btn>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default RentManagement;
