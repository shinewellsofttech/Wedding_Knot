import React, { useState, useEffect, useRef } from "react";
import { Col, Row, Card, CardBody, CardFooter, Container, Input, Button, Modal, ModalBody, ModalHeader, ModalFooter, Form, FormGroup, Label } from "reactstrap";
import { Fn_AddEditData, Fn_FillListData, Fn_DeleteData, Fn_GetReport } from "../../store/Functions";
import { useDispatch } from "react-redux";
import { API_WEB_URLS } from "../../constants/constAPI";
import { useLocation, useNavigate } from "react-router-dom";
import GridSystemRentReturn from "./GridSystemRentReturn";
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
}

interface StateData {
  id: number;
  formData: {
    PONo: string;
    PODate: string;
    F_VendorMaster: string;
    TillDate: string;
    Remarks: string;
    F_RentEntryH?: string;
    F_RentReturnH?: string;
    TotalTax?: number;
    TotalCGST?: number;
    TotalSGST?: number;
    TotalIGST?: number;
  };
  CreatedRentEntries?: any[];
  CreatedRentReturns?: any[];
  VendorMaster: any[];
  ItemGroupMaster: any[];
  ItemMaster: any[];
  WarehouseMaster: any[];
  DefaultWarehouse: any | null;
  isEditMode: boolean;
  isGridEditable: boolean;
}

function RentReturn() {
  const API_URL_SAVE = "RentReturn/0/token";
  const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/RentReturnH/Id";
  const API_URL_LINES = API_WEB_URLS.MASTER + "/0/token/RentReturnL/Id";
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
    },
    VendorMaster: [],
    ItemGroupMaster: [],
    ItemMaster: [],
    WarehouseMaster: [],
    DefaultWarehouse: null,
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
        
        const API_URL_RR_LIST = API_WEB_URLS.MASTER + "/0/token/RentReturnData/Id/0";
        const rrData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_RR_LIST);
        
        const extractArray = (data: any) => Array.isArray(data) ? data : (data?.data?.dataList || data?.dataList || data?.data?.response || data?.response || []);
        
        const reDataArray = extractArray(reData);
        const rrDataArray = extractArray(rrData);

        setState((prev) => ({
          ...prev,
          ItemGroupMaster: extractArray(itemGroups),
          VendorMaster: extractArray(vendors),
          CreatedRentEntries: reDataArray,
          CreatedRentReturns: rrDataArray,
        }));

        const params = new URLSearchParams(location.search);
        const recordId = params.get("id");
        if (recordId) {
          await loadRentReturnRecord(parseInt(recordId));
        } else {
          try {
            const API_ENTRY_NO = API_WEB_URLS.MASTER + "/0/token/GetVoucherNoByVoucherTypeId/Id/10"; 
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

  const fetchRentReturnAndPopulateGrid = async (rrId: string) => {
    if (!rrId) return;
    const prevState = state;
    const rr = prevState.CreatedRentReturns?.find((p: any) => String(p.Id) === String(rrId));
    if (!rr) return;

    let lines: any[] = [];
    try {
      if (rr.RentReturnDetails) {
        const parsed = typeof rr.RentReturnDetails === "string" ? JSON.parse(rr.RentReturnDetails) : rr.RentReturnDetails;
        lines = Array.isArray(parsed) ? parsed : [];
      } else if (rr.RentReturnLDetails) {
        const parsed = typeof rr.RentReturnLDetails === "string" ? JSON.parse(rr.RentReturnLDetails) : rr.RentReturnLDetails;
        lines = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error parsing RentReturnLDetails", e);
    }

    setState((prev) => ({
      ...prev,
      isEditMode: true,
      isGridEditable: false,
      id: rr.Id,
      formData: {
        ...prev.formData,
        PONo: rr.EntryNo || "",
        PODate: rr.EntryDate ? rr.EntryDate.split('T')[0] : "",
        TillDate: rr.TillDate ? rr.TillDate.split('T')[0] : "",
        F_VendorMaster: rr.F_LedgerMaster || "",
        Remarks: rr.Remarks || "",
        F_RentReturnH: rr.Id,
        F_RentEntryH: rr.F_RentEntryH || "",
        TotalTax: Number(rr.TotalTax || rr.TaxAmount || rr.TotalTaxAmount || 0),
        TotalCGST: Number(rr.TotalCGST || 0),
        TotalSGST: Number(rr.TotalSGST || 0),
        TotalIGST: Number(rr.TotalIGST || 0),
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
          Rate: l.Rate ? String(l.Rate) : "",
          SecurityDeposit: l.SecurityDeposit ? String(l.SecurityDeposit) : "",
          ItemData: [{ Id: l.F_ItemMaster, ItemName: l.ItemName || "Scanned Item" }],
        };
      });
      setGridRows(mappedRows);
    } else {
      setGridRows([{ ItemCode: "", F_ItemGroupMaster: "", F_ItemMaster: "", F_WarehouseMaster: state.DefaultWarehouse?.Id || "", Variant: "", Qty: "", Rate: "", SecurityDeposit: "", Photos: [], ItemData: null }]);
      alert("No lines found for the selected Rent Return.");
    }
  };

  const fetchRentEntryAndPopulateGrid = async (reId: string) => {
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
      formData: {
        ...prev.formData,
        F_VendorMaster: re.F_LedgerMaster || "",
        F_RentEntryH: re.Id,
        TillDate: re.TillDate ? re.TillDate.split('T')[0] : prev.formData.TillDate,
        TotalTax: Number(re.TotalTax || re.TaxAmount || re.TotalTaxAmount || 0),
        TotalCGST: Number(re.TotalCGST || 0),
        TotalSGST: Number(re.TotalSGST || 0),
        TotalIGST: Number(re.TotalIGST || 0),
      }
    }));

    if (lines.length > 0) {
      const mappedRows: GridRow[] = lines.map((l: any) => {
        return {
          ItemCode: l.Barcode || "",
          F_ItemGroupMaster: String(l.F_CategoryMaster || ""),
          F_ItemMaster: String(l.F_ItemMaster || ""),
          F_WarehouseMaster: state.DefaultWarehouse?.Id || "",
          Variant: l.Variant || l.Varient || "",
          Photos: [],
          Qty: String(l.Qty || ""),
          Rate: l.RentPrice || l.Rate ? String(l.RentPrice || l.Rate) : "",
          SecurityDeposit: l.SecurityDeposit ? String(l.SecurityDeposit) : "",
          ItemData: [{ Id: l.F_ItemMaster, ItemName: l.ItemName || "Scanned Item" }],
          F_ItemDesignMaster: l.F_ItemDesignMaster || 0,
          DesignPhoto: l.DesignPhoto || "",
          ItemName: l.ItemName || "",
        };
      });
      setGridRows(mappedRows);
    } else {
      alert("No lines found for the selected Rent Entry.");
    }
  };

  const loadRentReturnRecord = async (id: number) => {
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
                Rate: line.Rate || "",
                SecurityDeposit: line.SecurityDeposit || "",
                ItemData: extractArray(itemData) || [],
                UnitValue: (line.UnitConversion && parseFloat(line.UnitConversion) > 0) ? parseFloat(line.UnitConversion) : 1,
              };
            })
          );
          setGridRows(rowsData);
        }
      }
    } catch (error) {
      console.error("Error loading rent return record:", error);
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

  const handleDeleteRR = () => {
    if (!state.formData.F_RentReturnH) return;
    if (window.confirm("Are you sure you want to delete this Rent Return?")) {
      const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/RentReturnH`;
      Fn_DeleteData(dispatch, () => {}, Number(state.formData.F_RentReturnH), DELETE_API_URL)
        .then(() => {
          alert("Rent Return deleted successfully.");
          window.location.reload();
        })
        .catch((error: any) => {
          console.error("Failed to delete rent return:", error);
          alert("Failed to delete rent return. Please try again.");
        });
    }
  };

  const handleEditRR = () => {
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
    if (!barcode) return;

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

        const updatedRows = [...gridRows];
        
        updatedRows[index] = {
          ...updatedRows[index],
          ItemCode: designItem.Barcode || item.Barcode || barcode,
          F_ItemGroupMaster: String(groupId),
          F_ItemMaster: String(itemId),
          Variant: designItem.SizeName || item.SizeName || "",
          Qty: "1",
          Rate: designItem.RentPrice || item.RentPrice || designItem.Rate || item.Rate || "",
          SecurityDeposit: designItem.SecurityDeposit || item.SecurityDeposit || "",
          ItemData: [{ Id: itemId, ItemName: item.ItemName || "Scanned Item" }],
          UnitValue: unitVal
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
      }
    } catch (e) {
      console.error("Error fetching barcode details:", e);
    }
  };

  const handleSave = async () => {
    if (!state.formData.F_RentEntryH) { alert("Please select a Rent Entry. It is mandatory for Rent Return."); return; }
    if (!state.formData.F_VendorMaster) { alert("Please select a Party"); return; }
    const validGridRows = gridRows.filter(row => row.ItemCode || row.F_ItemMaster);
    if (validGridRows.length === 0) { alert("Please add at least one valid item"); return; }
    
    try {
      const obj = JSON.parse(localStorage.getItem("user") || "{}");
      
      const subTotal = validGridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.Rate) || 0)), 0);
      const totalSecDep = validGridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.SecurityDeposit) || 0)), 0);

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
      headerFormData.append("EntryDate", state.formData.PODate);
      headerFormData.append("TillDate", state.formData.TillDate);
      headerFormData.append("EntryNo", state.formData.PONo || "");
      headerFormData.append("F_LedgerMaster", state.formData.F_VendorMaster);
      headerFormData.append("Remarks", state.formData.Remarks || "");
      headerFormData.append("TotalRentAmount", subTotal.toString());
      headerFormData.append("TotalSecurityDeposit", totalSecDep.toString());
      
      const taxAmount = state.formData.TotalTax || 0;
      const cgstAmount = state.formData.TotalCGST || 0;
      const sgstAmount = state.formData.TotalSGST || 0;
      const igstAmount = state.formData.TotalIGST || 0;

      headerFormData.append("TotalTax", taxAmount.toFixed(2));
      headerFormData.append("TotalCGST", cgstAmount.toFixed(2));
      headerFormData.append("TotalSGST", sgstAmount.toFixed(2));
      headerFormData.append("TotalIGST", igstAmount.toFixed(2));
      headerFormData.append("F_LedgerMaster_CGST", "18");
      headerFormData.append("F_LedgerMaster_SGST", "19");
      headerFormData.append("F_LedgerMaster_IGST", "17");

      headerFormData.append("UserId", obj?.uid || "0");
      headerFormData.append("F_CompanyMaster", "0");
      headerFormData.append("JsonData", JSON.stringify(jsonDataArray));
      headerFormData.append("F_RentEntryH", state.formData.F_RentEntryH || "0");
      await Fn_AddEditData(dispatch, setState, { arguList: { id: state.id, formData: headerFormData } }, API_URL_SAVE, true, "memberid", navigate, "#");
      alert("Rent Return saved successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error saving rent return:", error);
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
      <Breadcrumbs mainTitle="Rent Return" parent="Rent" />
      <Container fluid className="px-2 px-sm-3">
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Created Rent Return" tagClass="card-title mb-0" />
              <CardBody className="p-2 p-sm-3">
                <Row className="g-2 g-sm-3">
                  <Col md="2">
                    <label className="form-label">Created Rent Return</label>
                    <select className="form-control" value={state.formData.F_RentReturnH || ""} onChange={(e) => { 
                      const val = e.target.value;
                      handleFormFieldChange("F_RentReturnH", val); 
                      if (!val) window.location.reload();
                      else fetchRentReturnAndPopulateGrid(val); 
                    }}>
                      <option value="">Select Rent Return</option>
                      {state.CreatedRentReturns?.map((re: any) => (
                        <option key={re.Id} value={re.Id}>{re.EntryNo || re.Id}</option>
                      ))}
                    </select>
                  </Col>

                  <Col md="2">
                    <label className="form-label text-danger">Rent Entry *</label>
                    <select className="form-control" value={state.formData.F_RentEntryH || ""} onChange={(e) => { 
                      const val = e.target.value;
                      handleFormFieldChange("F_RentEntryH", val); 
                      fetchRentEntryAndPopulateGrid(val); 
                    }} disabled={state.isEditMode}>
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
                    <DateInput name="poDate" value={state.formData.PODate} onChange={(e: any) => handleFormFieldChange("PODate", e.target.value)} disabled={state.isEditMode} />
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
                    <DateInput name="tillDate" value={state.formData.TillDate} onChange={(e: any) => handleFormFieldChange("TillDate", e.target.value)} disabled={!state.isGridEditable} />
                  </Col>
                  <Col md="2">
                    <label className="form-label">Remarks</label>
                    <Input type="text" value={state.formData.Remarks} onChange={(e) => handleFormFieldChange("Remarks", e.target.value)} placeholder="Enter remarks" />
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col xs="12" className="overflow-auto">
                    <GridSystemRentReturn
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
                    
                    const taxAmount = state.formData.TotalTax || 0;
                    const cgstAmount = state.formData.TotalCGST || 0;
                    const sgstAmount = state.formData.TotalSGST || 0;
                    const igstAmount = state.formData.TotalIGST || 0;

                    const rentWithGST = subTotal + taxAmount;
                    const grandTotal = rentWithGST;

                    return (
                      <>
                        <Col md="8">
                          <div className="d-flex flex-wrap gap-3">
                            <div className="p-3 bg-light border rounded flex-grow-1" style={{ minWidth: "250px", maxWidth: "350px" }}>
                              <h6 className="mb-1 text-muted fw-bold">Total Security Deposit</h6>
                              <h4 className="mb-0 text-info">₹ {totalSecDep.toFixed(2)}</h4>
                            </div>
                          </div>
                        </Col>
                        <Col md="4">
                          <div className="table-responsive h-100 d-flex flex-column justify-content-end">
                            <table className="table table-bordered table-sm mb-0 align-middle shadow-sm">
                              <tbody>
                                <tr>
                                  <th className="text-end w-50">Rent Amount:</th>
                                  <td className="text-end fw-bold">₹ {subTotal.toFixed(2)}</td>
                                </tr>
                                {cgstAmount > 0 && (
                                  <tr>
                                    <th className="text-end" style={{ width: "60%" }}>Total CGST:</th>
                                    <td className="text-end fw-bold">₹ {cgstAmount.toFixed(2)}</td>
                                  </tr>
                                )}
                                {sgstAmount > 0 && (
                                  <tr>
                                    <th className="text-end">Total SGST:</th>
                                    <td className="text-end fw-bold">₹ {sgstAmount.toFixed(2)}</td>
                                  </tr>
                                )}
                                {igstAmount > 0 && (
                                  <tr>
                                    <th className="text-end">Total IGST:</th>
                                    <td className="text-end fw-bold">₹ {igstAmount.toFixed(2)}</td>
                                  </tr>
                                )}
                                {taxAmount > 0 && cgstAmount === 0 && sgstAmount === 0 && igstAmount === 0 && (
                                  <tr>
                                    <th className="text-end">Tax Amount:</th>
                                    <td className="text-end fw-bold">₹ {taxAmount.toFixed(2)}</td>
                                  </tr>
                                )}
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
                    onClick={handleEditRR}
                  >
                    <i className="fa fa-edit me-1"></i> Edit
                  </Btn>
                )}
                {state.isEditMode && !state.isGridEditable && (
                  <Btn type="button" color="danger" onClick={handleDeleteRR}>
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

export default RentReturn;
