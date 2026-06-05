// Verified exact structural match with PurchaseEntry
import React, { useState, useEffect, useRef } from "react";
import { Col, Row, Card, CardBody, CardFooter, Button, Modal, ModalBody, ModalHeader, ModalFooter, Form, FormGroup, Label, Input, Container } from "reactstrap";
import { Fn_AddEditData, Fn_DisplayData, Fn_FillListData, Fn_GetReport, Fn_DeleteData } from "../../../store/Functions";
import { useDispatch } from "react-redux";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { useLocation, useNavigate } from "react-router-dom";
import GridSystemSalesInvoice from "./GridSystemSalesInvoice";
import { getCurrentDateYYYYMMDD, parseDateFromAPI } from "../../../helpers/dateUtils";
import DateInput from "../../../CommonElements/DateInput/DateInput";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import { Btn } from "../../../AbstractElements";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";

interface GridRow {
  ItemCode: string;
  F_ItemGroupMaster: string;
  F_ItemMaster: string;
  F_ItemDesignMaster?: string;
  ItemName?: string;
  DesignPhoto?: string;
  F_ColorMaster?: string;
  F_WarehouseMaster: string;
  F_BatchMaster?: string;
  Qty: string;
  Rate: string;
  Variant?: string;
  Photos?: string[];
  ItemData: any[] | null;
  AvailableQty?: number;
  F_SalesOrderH?: string | number;
  F_SalesOrderL?: string | number;
  F_GSTGroupMaster?: string;
  OriginalSalePrice?: number;
  SchemeDetails?: any[];
  GSTPercent?: number;
  UnitValue?: number;
}

interface StateData {
  id: number;
  formData: {
    PONo: string;
    PODate: string;
    F_VendorMaster: string;
    Remarks: string;
    F_SalesOrderH?: string;
    F_SalesInvoiceH?: string;
  };
  CreatedSalesOrders?: any[];
  SalesOrderLinesMap?: Record<string, any[]>;
  CreatedSalesEntries?: any[];
  SalesInvoiceLinesMap?: Record<string, any[]>;
  VendorMaster: any[];
  ItemGroupMaster: any[];
  ItemMaster: any[];
  WarehouseMaster: any[];
  ColorMaster: any[];
  BatchMaster: any[];
  DefaultWarehouse: any | null;
  DefaultColor: any | null;
  IsBatchAllowed: boolean;
  isEditMode: boolean;
  isGridEditable: boolean;
  itemColorApplyMap: Record<string | number, boolean>;
  GlobalOptions: any[];
  GSTGroupMaster: any[];
  OtherChargesLedgers: any[];
  StateMaster: any[];
  CityMaster: any[];
}

function SalesInvoice() {
  const API_URL_SAVE = "SalesEntry/0/token";
  const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/SalesEntryH/Id";
  const API_URL_LINES = API_WEB_URLS.MASTER + "/0/token/SalesEntryL/Id";
  const API_URL_ITEMGROUP = API_WEB_URLS.MASTER + "/0/token/CategoryMaster/Id/0";
  const API_URL_ITEMS = API_WEB_URLS.MASTER + "/0/token/ItemMaster/Id";
  const API_URL_VENDOR = API_WEB_URLS.MASTER + "/0/token/PartyLedgerMaster/Id/0";
  const API_URL_WAREHOUSE = API_WEB_URLS.MASTER + "/0/token/WarehouseMaster/Id/0";
  const API_URL_COLOR = API_WEB_URLS.MASTER + "/0/token/ColorMaster/Id/0";
  const API_URL_BATCH = API_WEB_URLS.MASTER + "/0/token/BatchMaster/Id/0";
  const API_URL_GLOBALOPTIONS = API_WEB_URLS.MASTER + "/0/token/GlobalOptions/Id/0";
  const API_ITEM_SAVE = "ItemMaster/0/token";
  const API_ITEMGROUP_SAVE = "ItemGroupMaster/0/token";
  const API_VENDOR_SAVE = "LedgerMaster/0/token";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState<StateData>({
    id: 0,
    formData: {
      PONo: "",
      PODate: getCurrentDateYYYYMMDD(),
      F_VendorMaster: "",
      Remarks: "",
    },
    VendorMaster: [],
    ItemGroupMaster: [],
    ItemMaster: [],
    WarehouseMaster: [],
    StateMaster: [],
    CityMaster: [],
    ColorMaster: [],
    BatchMaster: [],
    DefaultWarehouse: null,
    DefaultColor: null,
    IsBatchAllowed: false,
    isEditMode: false,
    isGridEditable: true,
    itemColorApplyMap: {},
    GlobalOptions: [],
    GSTGroupMaster: [],
    OtherChargesLedgers: [],
  });

  const [gridRows, setGridRows] = useState<GridRow[]>([
    {
      ItemCode: "",
      F_ItemGroupMaster: "",
      F_ItemMaster: "",
      F_ColorMaster: "",
      F_WarehouseMaster: "",
      F_BatchMaster: "",
      Variant: "",
      Photos: [],
      Qty: "",
      Rate: "",
      ItemData: null,
      AvailableQty: 0,
    },
  ]);

  const [otherChargesRows, setOtherChargesRows] = useState<any[]>([
    { F_LedgerMaster: "", Amount: "" }
  ]);

  const [quickItemModalOpen, setQuickItemModalOpen] = useState(false);
  const [quickItemTargetRow, setQuickItemTargetRow] = useState<number | null>(null);
  const [quickItemSubmitting, setQuickItemSubmitting] = useState(false);
  const [quickItemForm, setQuickItemForm] = useState({
    ItemName: "",
    ItemCode: "",
    F_ItemGroupMaster: "",
    F_ColorMaster: "",
    ItemColorApply: false,
  });

  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendorSubmitting, setVendorSubmitting] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    Name: "",
    CompanyName: "",
    Phone: "",
    Email: "",
    Address: "",
  });

  const [taxOverrides, setTaxOverrides] = useState<{ CGST?: string, SGST?: string, IGST?: string }>({});

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);

  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const itemGroups = await Fn_FillListData(dispatch, setState, "ItemGroupMaster", API_URL_ITEMGROUP);
        const vendors = await Fn_FillListData(dispatch, setState, "VendorMaster", API_URL_VENDOR);
        const API_URL_PE_LIST = API_WEB_URLS.MASTER + "/0/token/Salesentrydata/Id/0";
        const peData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_PE_LIST);
        
        let peDataArray: any[] = [];
        if (Array.isArray(peData)) peDataArray = peData;
        else if (peData?.data?.dataList && Array.isArray(peData.data.dataList)) peDataArray = peData.data.dataList;
        else if (peData?.dataList && Array.isArray(peData.dataList)) peDataArray = peData.dataList;
        else if (peData?.data?.response && Array.isArray(peData.data.response)) peDataArray = peData.data.response;

        const API_URL_GSTGROUP = API_WEB_URLS.MASTER + "/0/token/GSTGroupMaster/Id/0";
        const gstData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_GSTGROUP);

        const API_URL_OTHER_LEDGER = API_WEB_URLS.MASTER + "/0/token/GetLedgerByLedgerGroup/Id/0";
        const otherLedgersData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_OTHER_LEDGER);

        const API_URL_GLOBALOPTIONS = API_WEB_URLS.MASTER + "/0/token/GlobalOptions/Id/0";
        const globalOptionsData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_GLOBALOPTIONS);

        const API_URL_STATEMASTER = API_WEB_URLS.MASTER + "/0/token/StateMaster/Id/0";
        const stateMasterData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_STATEMASTER);

        const API_URL_CITYMASTER = API_WEB_URLS.MASTER + "/0/token/CityMaster/Id/0";
        const cityMasterData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_CITYMASTER);

        const extractArray = (data: any) => Array.isArray(data) ? data : (data?.data?.dataList || data?.dataList || data?.data?.response || data?.response || []);

        setState((prev) => ({
          ...prev,
          ItemGroupMaster: extractArray(itemGroups),
          VendorMaster: extractArray(vendors),
          CreatedSalesEntries: peDataArray,
          GSTGroupMaster: extractArray(gstData),
          OtherChargesLedgers: extractArray(otherLedgersData),
          GlobalOptions: extractArray(globalOptionsData),
          StateMaster: extractArray(stateMasterData),
          CityMaster: extractArray(cityMasterData),
        }));

        const params = new URLSearchParams(location.search);
        const recordId = params.get("id");
        if (recordId) {
          await loadSalesInvoiceRecord(parseInt(recordId));
        } else {
          try {
            const API_ENTRY_NO = API_WEB_URLS.MASTER + "/0/token/GetVoucherNoByVoucherTypeId/Id/4";
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

  const fetchPODataAndPopulateGrid = async (poId: string) => {
    if (!poId) return;
    const prevState = state;
    const lines = prevState.SalesOrderLinesMap?.[poId] || [];
    if (lines.length > 0) {
      // Fetch item data for each unique group first to avoid empty items list
      const uniqueGroupIds = Array.from(new Set(lines.map((l: any) => l.F_ItemGroupMaster).filter(Boolean)));
      const groupItemsMap: Record<string, any[]> = {};
      await Promise.all(
        uniqueGroupIds.map(async (groupId) => {
          try {
            const data = await Fn_FillListData(dispatch, setState, `itemData_${groupId}`, API_URL_ITEMS + "/" + groupId);
            const extractArray = (d: any) => Array.isArray(d) ? d : (d?.data?.dataList || d?.dataList || d?.data?.response || d?.response || []);
            groupItemsMap[String(groupId)] = extractArray(data);
          } catch (e) {
            console.error("Error fetching items for group in PO load:", e);
          }
        })
      );

      const mappedRows: GridRow[] = lines.map((l: any) => ({
        ItemCode: l.ItemCode || l.itemCode || l.ItemMaster?.ItemCode || l.F_ItemMaster?.ItemCode || "",
        F_ItemGroupMaster: l.F_ItemGroupMaster || "",
        F_ItemMaster: l.F_ItemMaster || "",
        F_ColorMaster: l.F_ColorMaster || prevState.DefaultColor?.Id || "",
        F_WarehouseMaster: l.F_WarehouseMaster || prevState.DefaultWarehouse?.Id || "",
        F_BatchMaster: l.F_BatchMaster || "",
        Variant: l.Variant || l.Varient || "",
        Photos: [],
        Qty: String(l.ApprovedQty || l.OrderedQty || l.Qty || ""),
        Rate: l.Rate ? String(l.Rate) : "",
        ItemData: groupItemsMap[String(l.F_ItemGroupMaster)] || null,
        AvailableQty: 0,
        F_SalesOrderH: poId,
        F_SalesOrderL: l.SalesOrderLId || l.Id || 0,
      }));
      setGridRows(mappedRows);
      
      let newVendorMasterId = prevState.formData.F_VendorMaster;
      const poHeader = prevState.CreatedSalesOrders?.find((p: any) => String(p.Id) === String(poId));
      if (poHeader && poHeader.F_LedgerMaster) {
         newVendorMasterId = String(poHeader.F_LedgerMaster);
      }
      setState((prev) => ({
        ...prev,
        formData: { ...prev.formData, F_VendorMaster: newVendorMasterId, F_SalesOrderH: poId }
      }));
    } else {
      alert("No approved lines found for the selected PO.");
    }
  };

  const fetchPEDataAndPopulateGrid = async (peId: string) => {
    if (!peId) return;
    const prevState = state;
    const pe = prevState.CreatedSalesEntries?.find((p: any) => String(p.Id) === String(peId));
    if (!pe) return;

    let lines: any[] = [];
    try {
      if (pe.SalesLDetails) {
        const parsed = typeof pe.SalesLDetails === "string" ? JSON.parse(pe.SalesLDetails) : pe.SalesLDetails;
        lines = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error parsing SalesLDetails", e);
    }

    let otherChargesLines: any[] = [];
    try {
      if (pe.SalesLOtherChargesDetails) {
        const parsed = typeof pe.SalesLOtherChargesDetails === "string" ? JSON.parse(pe.SalesLOtherChargesDetails) : pe.SalesLOtherChargesDetails;
        otherChargesLines = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error parsing SalesLOtherChargesDetails", e);
    }

    if (otherChargesLines.length > 0) {
      setOtherChargesRows(otherChargesLines.map((l: any) => ({
        F_LedgerMaster: String(l.F_LedgerMaster || ""),
        Amount: String(l.Amount || "")
      })));
    } else {
      setOtherChargesRows([{ F_LedgerMaster: "", Amount: "" }]);
    }

    setTaxOverrides({
      CGST: pe.TotalCGST !== undefined ? String(pe.TotalCGST) : undefined,
      SGST: pe.TotalSGST !== undefined ? String(pe.TotalSGST) : undefined,
      IGST: pe.TotalIGST !== undefined ? String(pe.TotalIGST) : undefined,
    });

    setState((prev) => ({
      ...prev,
      isEditMode: true,
      isGridEditable: false,
      id: pe.Id,
      formData: {
        ...prev.formData,
        PONo: pe.EntryNo || "",
        PODate: pe.EntryDate ? pe.EntryDate.split('T')[0] : "",
        F_VendorMaster: pe.F_LedgerMaster || "",
        Remarks: pe.Remarks || "",
        F_SalesInvoiceH: pe.Id,
      }
    }));

    if (lines.length > 0) {
      const mappedRows: GridRow[] = lines.map((l: any) => {
        let cleanPhoto = l.DesignPhoto || "";
        if (cleanPhoto.includes("https://") && cleanPhoto.lastIndexOf("https://") > 0) {
           cleanPhoto = cleanPhoto.substring(cleanPhoto.lastIndexOf("https://"));
        } else if (cleanPhoto.includes("http://") && cleanPhoto.lastIndexOf("http://") > 0) {
           cleanPhoto = cleanPhoto.substring(cleanPhoto.lastIndexOf("http://"));
        }

        return {
          ItemCode: l.Barcode || "",
          F_ItemGroupMaster: String(l.F_CategoryMaster || ""),
          F_ItemMaster: String(l.F_ItemMaster || ""),
          F_ItemDesignMaster: String(l.F_ItemDesignMaster || ""),
          F_ColorMaster: state.DefaultColor?.Id || "",
          F_WarehouseMaster: state.DefaultWarehouse?.Id || "",
          F_BatchMaster: "",
          ItemName: l.ItemName || "",
          DesignPhoto: cleanPhoto,
          Variant: l.Variant || l.Varient || "",
          Photos: cleanPhoto ? [cleanPhoto] : [],
          Qty: String(l.Qty || ""),
          Rate: l.Rate ? String(l.Rate) : "",
          ItemData: [{ Id: l.F_ItemMaster, ItemName: l.ItemName || "Scanned Item" }],
          AvailableQty: 0,
          F_SalesOrderH: 0,
          F_SalesOrderL: 0,
        };
      });
      setGridRows(mappedRows);
    } else {
      setGridRows([{ ItemCode: "", F_ItemGroupMaster: "", F_ItemMaster: "", F_WarehouseMaster: state.DefaultWarehouse?.Id || "", F_BatchMaster: "", Variant: "", Qty: "", Rate: "", Photos: [], ItemData: null }]);
      alert("No lines found for the selected Sales Invoice.");
    }
  };

  const loadSalesInvoiceRecord = async (id: number) => {
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
            PONo: header.PONo || "",
            PODate: header.PODate ? parseDateFromAPI(header.PODate) : getCurrentDateYYYYMMDD(),
            F_VendorMaster: header.F_VendorMaster || "",
            Remarks: header.Remarks || "",
          },
        }));

        if (lines.length > 0) {
          const rowsData = await Promise.all(
            lines.map(async (line: any) => {
              const itemData = await Fn_FillListData(dispatch, setState, `itemData_${line.F_ItemGroupMaster}`, API_URL_ITEMS + "/" + line.F_ItemGroupMaster);
              const extractArray = (data: any) => Array.isArray(data) ? data : (data?.data?.dataList || data?.dataList || data?.data?.response || data?.response || []);
              return {
                ItemCode: line.ItemCode || "",
                F_ItemGroupMaster: line.F_ItemGroupMaster || "",
                F_ItemMaster: line.F_ItemMaster || "",
                F_ColorMaster: line.F_ColorMaster || "",
                F_WarehouseMaster: line.F_WarehouseMaster || "",
                F_BatchMaster: line.F_BatchMaster || "",
                Variant: line.Variant || line.Varient || "",
                Photos: [],
                Qty: line.Qty || "",
                Rate: line.Rate || "",
                ItemData: extractArray(itemData) || [],
                UnitValue: (line.UnitConversion && parseFloat(line.UnitConversion) > 0) ? parseFloat(line.UnitConversion) : 1,
              };
            })
          );
          setGridRows(rowsData);
        }
      }
    } catch (error) {
      console.error("Error loading sales entry record:", error);
    }
  };

  const handleFormFieldChange = (field: string, value: any) => {
    setState((prev) => ({ ...prev, formData: { ...prev.formData, [field]: value } }));
  };

  const addRow = () => {
    setGridRows((prevRows) => [
      ...prevRows,
      { ItemCode: "", F_ItemGroupMaster: "", F_ItemMaster: "", F_ColorMaster: state.DefaultColor?.Id || "", F_WarehouseMaster: state.DefaultWarehouse?.Id || "", F_BatchMaster: "", Variant: "", Photos: [], Qty: "", Rate: "", ItemData: null, AvailableQty: 0, UnitValue: 1 },
    ]);
  };

  const handleDeletePE = () => {
    if (!state.formData.F_SalesInvoiceH) return;
    if (window.confirm("Are you sure you want to delete this sales invoice?")) {
      const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/SalesEntryH`;
      Fn_DeleteData(dispatch, () => {}, Number(state.formData.F_SalesInvoiceH), DELETE_API_URL)
        .then(() => {
          alert("Sales Invoice deleted successfully.");
          window.location.reload();
        })
        .catch((error: any) => {
          console.error("Failed to delete sales invoice:", error);
          alert("Failed to delete sales invoice. Please try again.");
        });
    }
  };

  const handleEditPE = () => {
    setState((prev) => ({ ...prev, isGridEditable: true }));
  };

  const removeRow = (index: number) => {
    if (gridRows.length > 1) {
      setGridRows((prevRows) => prevRows.filter((_, i) => i !== index));
    }
  };

  const fetchRate = async (groupId: number | string, itemId: number | string, colorId: number | string, warehouseId: number | string) => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser?.uid ?? authUser?.Id ?? "0";
      const userToken = authUser?.Token ?? authUser?.token ?? "token";
      const url = `GetRateByItemId/${userId}/${userToken}`;
      
      const formData = new FormData();
      formData.append("F_WarehouseMaster", "0");
      formData.append("F_ItemGroupMaster", String(groupId || 0));
      formData.append("F_ItemMaster", String(itemId || 0));
      formData.append("F_ColorMaster", "0");

      const res = await Fn_GetReport(
        dispatch,
        setState,
        "ignored_rate",
        url,
        { arguList: { id: 0, formData } },
        true
      );

      console.log("GetRateByItemId via Fn_GetReport response:", res);
      let rate = 0;
      
      // Resolve the list from any potential response wrapper
      let list: any[] | null = null;
      if (Array.isArray(res)) {
        list = res;
      } else if (res && typeof res === "object") {
        if (Array.isArray(res.response)) {
          list = res.response;
        } else if (res.data && Array.isArray(res.data.response)) {
          list = res.data.response;
        } else if (res.data && Array.isArray(res.data.dataList)) {
          list = res.data.dataList;
        } else if (Array.isArray(res.dataList)) {
          list = res.dataList;
        }
      }

      if (list && list.length > 0) {
        const item = list[0];
        rate = Number(item.Rate1 ?? item.rate1 ?? item.Rate ?? item.rate ?? item.Amount ?? item.amount ?? 0);
      } else if (res && typeof res === "object") {
        const resObj = res as any;
        rate = Number(resObj.Rate1 ?? resObj.rate1 ?? resObj.Rate ?? resObj.rate ?? resObj.Amount ?? resObj.amount ?? resObj.RateValue ?? 0);
      }
      return rate;
    } catch (e) {
      console.error("Error fetching rate:", e);
    }
    return 0;
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
    } else if (field === "Qty") {
      const row = updatedRows[index];
      const qty = parseFloat(value) || 0;
      let newSalePrice = row.OriginalSalePrice || parseFloat(row.Rate) || 0;
      
      if (row.SchemeDetails && Array.isArray(row.SchemeDetails) && row.SchemeDetails.length > 0 && qty > 0) {
        let schemeRate: number | null = null;
        for (const scheme of row.SchemeDetails) {
          const from = parseFloat(scheme.FromRange) || 0;
          const to = parseFloat(scheme.ToRange) || Infinity;
          if (qty >= from && qty <= to) {
            schemeRate = parseFloat(scheme.Rate) || 0;
            if (schemeRate === 0) {
              schemeRate = row.OriginalSalePrice || parseFloat(row.Rate) || 0;
            }
            break;
          }
        }
        if (schemeRate !== null) {
          newSalePrice = schemeRate;
        }
      }

      const gstPercent = row.GSTPercent || 0;
      let baseRate = newSalePrice;
      
      if (row.OriginalSalePrice !== undefined) {
        updatedRows[index].Rate = String(baseRate > 0 ? baseRate.toFixed(2) : "");
      }
    }

    if (field === "F_ItemMaster" || field === "F_ColorMaster" || field === "F_WarehouseMaster") {
      const row = updatedRows[index];
      if (row.F_ItemMaster && !row.OriginalSalePrice) { // Don't override barcode scanned items
        const fetchedRate = await fetchRate(
          row.F_ItemGroupMaster || "0",
          row.F_ItemMaster || "0",
          row.F_ColorMaster || state.DefaultColor?.Id || "0",
          row.F_WarehouseMaster || state.DefaultWarehouse?.Id || "0"
        );
        updatedRows[index].Rate = String(fetchedRate || "");
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
      
      let newSalePrice = dupRow.OriginalSalePrice || parseFloat(dupRow.Rate) || 0;
      if (dupRow.SchemeDetails && Array.isArray(dupRow.SchemeDetails) && dupRow.SchemeDetails.length > 0 && newQty > 0) {
        let schemeRate: number | null = null;
        for (const scheme of dupRow.SchemeDetails) {
          const from = parseFloat(scheme.FromRange) || 0;
          const to = parseFloat(scheme.ToRange) || Infinity;
          if (newQty >= from && newQty <= to) {
            schemeRate = parseFloat(scheme.Rate) || 0;
            if (schemeRate === 0) {
              schemeRate = dupRow.OriginalSalePrice || parseFloat(dupRow.Rate) || 0;
            }
            break;
          }
        }
        if (schemeRate !== null) {
          newSalePrice = schemeRate;
        }
      }

      if (dupRow.OriginalSalePrice !== undefined) {
        dupRow.Rate = String(newSalePrice > 0 ? newSalePrice.toFixed(2) : "");
      }
      
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
        const designId = designItem.Id || item.Id || "";
        
        const photos = [];
        if (designItem.DesignPhoto) photos.push(designItem.DesignPhoto);
        if (designItem.DesignPhoto2) photos.push(designItem.DesignPhoto2);
        if (designItem.DesignPhoto3) photos.push(designItem.DesignPhoto3);
        if (designItem.DesignPhoto4) photos.push(designItem.DesignPhoto4);
        if (designItem.DesignPhoto5) photos.push(designItem.DesignPhoto5);
        
        const vendor = state.VendorMaster?.find((v: any) => String(v.Id) === String(state.formData.F_VendorMaster));
        const isInState = vendor ? (vendor.IsInState === true || vendor.IsInState === 1 || vendor.IsInState === "1" || vendor.IsInState === "true") : false;

        let gstPercent = 0;
        const gstGroupId = item.F_GSTGroupMaster || "";
        const gstGroup = state.GSTGroupMaster?.find((g: any) => String(g.Id) === String(gstGroupId));
        if (gstGroup) {
          if (isInState) {
            gstPercent = (parseFloat(gstGroup.CGSTPercent) || 0) + (parseFloat(gstGroup.SGSTPercent) || 0);
          } else {
            gstPercent = parseFloat(gstGroup.IGSTPercent) || 0;
          }
        }
        
        let salePrice = parseFloat(designItem.SalePrice || designItem.Rate || designItem.Price || item.SalePrice || item.Rate || item.Price || 0);
        
        let parsedSchemes = [];
        try {
          if (typeof designItem.SchemeDetails === "string") {
            parsedSchemes = JSON.parse(designItem.SchemeDetails || "[]");
          } else if (Array.isArray(designItem.SchemeDetails)) {
            parsedSchemes = designItem.SchemeDetails;
          }
        } catch(e) {}

        const updatedRows = [...gridRows];
        const qty = 1; // Auto fill qty to 1
        
        // Auto-apply scheme rate if quantity already exists in the row
        let finalSalePrice = salePrice;
        if (parsedSchemes.length > 0 && qty > 0) {
          for (const scheme of parsedSchemes) {
            const from = parseFloat(scheme.FromRange) || 0;
            const to = parseFloat(scheme.ToRange) || Infinity;
            if (qty >= from && qty <= to) {
              let sRate = parseFloat(scheme.Rate) || 0;
              finalSalePrice = sRate === 0 ? salePrice : sRate;
              break;
            }
          }
        }

        let unitVal = parseFloat(designItem.UnitConversion);
        if (isNaN(unitVal) || unitVal === 0) unitVal = 1;

        let baseRate = finalSalePrice;

        updatedRows[index] = {
          ...updatedRows[index],
          ItemCode: designItem.Barcode || item.Barcode || barcode,
          F_ItemGroupMaster: String(groupId),
          F_ItemMaster: String(itemId),
          F_ItemDesignMaster: String(designId),
          ItemName: item.ItemName || "Scanned Item",
          DesignPhoto: designItem.DesignPhoto || item.DesignPhoto || "",
          Variant: designItem.SizeName || item.SizeName || "",
          Photos: photos,
          Qty: "1",
          Rate: baseRate > 0 ? String(baseRate.toFixed(2)) : "",
          F_GSTGroupMaster: item.F_GSTGroupMaster || "",
          ItemData: [{ Id: itemId, ItemName: item.ItemName || "Scanned Item", F_GSTGroupMaster: item.F_GSTGroupMaster }],
          OriginalSalePrice: salePrice,
          SchemeDetails: parsedSchemes,
          GSTPercent: gstPercent,
          UnitValue: unitVal
        };
        
        let nextRowIndex = index;
        if (index === gridRows.length - 1) {
          updatedRows.push({
            ItemCode: "",
            F_ItemGroupMaster: "",
            F_ItemMaster: "",
            F_ColorMaster: state.DefaultColor?.Id || "",
            F_WarehouseMaster: state.DefaultWarehouse?.Id || "",
            F_BatchMaster: "",
            Variant: "",
            Photos: [],
            Qty: "",
            Rate: "",
            ItemData: null,
            AvailableQty: 0,
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

  const openQuickItemModal = (rowIndex: number) => {
    if (state.isEditMode) return;
    setQuickItemTargetRow(rowIndex);
    setQuickItemForm({
      ItemName: "",
      ItemCode: gridRows[rowIndex]?.ItemCode || "",
      F_ItemGroupMaster: gridRows[rowIndex]?.F_ItemGroupMaster || "",
      F_ColorMaster: gridRows[rowIndex]?.F_ColorMaster || state.DefaultColor?.Id || "",
      ItemColorApply: false,
    });
    setQuickItemModalOpen(true);
  };

  const closeQuickItemModal = () => {
    if (quickItemSubmitting) return;
    setQuickItemModalOpen(false);
    setQuickItemTargetRow(null);
  };

  const handleQuickItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quickItemSubmitting) return;
    const trimmedName = (quickItemForm.ItemName || "").trim();
    const trimmedCode = (quickItemForm.ItemCode || "").trim();
    if (!trimmedName || !trimmedCode || !quickItemForm.F_ItemGroupMaster || !quickItemForm.F_ColorMaster) {
      alert("Please fill all required fields");
      return;
    }
    setQuickItemSubmitting(true);
    try {
      const obj = JSON.parse(localStorage.getItem("user") || "{}");
      const formData = new FormData();
      formData.append("ItemName", trimmedName);
      formData.append("ItemCode", trimmedCode);
      formData.append("F_ItemGroupMaster", quickItemForm.F_ItemGroupMaster);
      formData.append("F_ColorMaster", quickItemForm.F_ColorMaster);
      formData.append("ItemColorApply", quickItemForm.ItemColorApply ? "true" : "false");
      formData.append("UserId", obj?.uid || "0");
      await Fn_AddEditData(dispatch, setState, { arguList: { id: 0, formData } }, API_ITEM_SAVE, true, "memberid", navigate, "#");
      const groupItems = await Fn_FillListData(dispatch, setState, `itemData_${quickItemForm.F_ItemGroupMaster}`, API_URL_ITEMS + "/" + quickItemForm.F_ItemGroupMaster);
      const newItem = groupItems?.find((item: any) => item.ItemCode?.toLowerCase() === trimmedCode.toLowerCase());
      if (newItem && quickItemTargetRow !== null) {
        setGridRows((prevRows) => prevRows.map((row, i) => i === quickItemTargetRow ? { ...row, F_ItemMaster: newItem.Id, ItemCode: newItem.ItemCode, ItemData: groupItems } : row));
      }
      setQuickItemModalOpen(false);
    } catch (error) {
      console.error("Error creating item:", error);
    } finally {
      setQuickItemSubmitting(false);
    }
  };

  const openVendorModal = () => {
    if (state.isEditMode) return;
    setVendorForm({ Name: "", CompanyName: "", Phone: "", Email: "", Address: "" });
    setVendorModalOpen(true);
  };

  const closeVendorModal = () => {
    if (vendorSubmitting) return;
    setVendorModalOpen(false);
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (vendorSubmitting) return;
    const companyName = (vendorForm.CompanyName || "").trim();
    const phone = (vendorForm.Phone || "").trim();
    const address = (vendorForm.Address || "").trim();
    if (!companyName || !phone || !address) {
      alert("Please fill all required fields");
      return;
    }
    setVendorSubmitting(true);
    try {
      const obj = JSON.parse(localStorage.getItem("user") || "{}");
      const formData = new FormData();
      formData.append("Id", "0");
      formData.append("Name", companyName);
      formData.append("Alias", "0");
      formData.append("F_LedgerGroupMaster", "40");
      formData.append("Address", address);
      formData.append("Address1", "0");
      formData.append("F_CountryMaster", "0");
      formData.append("F_StateMaster", "0");
      formData.append("F_CityMaster", "0");
      formData.append("PinCode", "0");
      formData.append("PhoneNo", "0");
      formData.append("MobileNo", phone);
      formData.append("Email", vendorForm.Email || "0");
      formData.append("GSTIN", "0");
      formData.append("PANNo", "0");
      formData.append("CreditDays", "0");
      formData.append("CreditLimit", "0");
      formData.append("Rate", "0");
      formData.append("F_Type", "0");
      formData.append("F_CalculationType", "0");
      formData.append("F_AddLess", "0");
      formData.append("YesNoActs", "false");
      formData.append("F_GSTGroupMaster", "0");
      formData.append("F_TaxPayerType", "0");
      formData.append("F_LedgerMasterSales", "0");
      formData.append("F_LedgerMasterSales", "0");
      formData.append("F_YearScheme", "0");
      formData.append("F_IntCalcMethod", "0");
      formData.append("BankName", "0");
      formData.append("BankAccountNo", "0");
      formData.append("BankIFSCCode", "0");
      formData.append("ISDalal", "false");
      formData.append("F_LedgerMasterDalal", "0");
      formData.append("IsTransport", "false");
      formData.append("F_TCSonSales", "0");
      formData.append("UserId", obj?.uid || "0");
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(dispatch, setState, { arguList: { id: 0, formData } }, API_VENDOR_SAVE, true, "memberid", navigate, "#");
      const vendors = await Fn_FillListData(dispatch, setState, "VendorMaster", API_URL_VENDOR);
      const newVendor = vendors?.find((v: any) => (v.CompanyName || v.Name || v.LedgerName)?.toLowerCase() === companyName.toLowerCase());
      if (newVendor) {
        setState((prev) => ({ ...prev, formData: { ...prev.formData, F_VendorMaster: newVendor.Id }, VendorMaster: vendors || [] }));
      }
      setVendorModalOpen(false);
    } catch (error) {
      console.error("Error creating vendor:", error);
    } finally {
      setVendorSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!state.formData.F_VendorMaster) { alert("Please select a Vendor"); return; }
    const validGridRows = gridRows.filter(row => row.ItemCode || row.F_ItemMaster);
    if (validGridRows.length === 0) { alert("Please add at least one valid item"); return; }
    for (let i = 0; i < validGridRows.length; i++) {
      const row = validGridRows[i];
      if (!row.F_ItemMaster || !row.Qty || parseFloat(row.Qty) <= 0 || !row.Rate || parseFloat(row.Rate) < 0) {
        alert(`Row ${i + 1}: Please fill all required fields correctly (Item, Quantity, Rate)`);
        return;
      }
    }
    try {
      const obj = JSON.parse(localStorage.getItem("user") || "{}");
      
      let totalCGST = 0;
      let totalSGST = 0;
      let totalIGST = 0;
      let highestCGSTPercent = 0;
      let highestSGSTPercent = 0;
      let highestIGSTPercent = 0;
      const vendor = state.VendorMaster?.find((v: any) => String(v.Id) === String(state.formData.F_VendorMaster));
      const isInState = vendor ? (vendor.IsInState === true || vendor.IsInState === 1 || vendor.IsInState === "1" || vendor.IsInState === "true") : false;

      const jsonDataArray = validGridRows.map((row) => {
        const qty = Number(row.Qty) || 0;
        const rate = Number(row.Rate) || 0;
        const amount = qty * rate;

        let itemCGST = 0;
        let itemSGST = 0;
        let itemIGST = 0;

        const itemObj = row.ItemData?.find((i: any) => String(i.Id) === String(row.F_ItemMaster)) ||
                        state.ItemMaster?.find((i: any) => String(i.Id) === String(row.F_ItemMaster));
        const gstGroupId = itemObj?.F_GSTGroupMaster || itemObj?.GSTGroupMasterId || itemObj?.GSTGroupId || row.F_GSTGroupMaster;
        const gstGroup = state.GSTGroupMaster?.find((g: any) => String(g.Id) === String(gstGroupId));

        if (gstGroup) {
          const cgstP = parseFloat(gstGroup.CGSTPercent) || 0;
          const sgstP = parseFloat(gstGroup.SGSTPercent) || 0;
          const igstP = parseFloat(gstGroup.IGSTPercent) || 0;
          
          if (cgstP > highestCGSTPercent) highestCGSTPercent = cgstP;
          if (sgstP > highestSGSTPercent) highestSGSTPercent = sgstP;
          if (igstP > highestIGSTPercent) highestIGSTPercent = igstP;

          if (isInState) {
            const totalPercent = cgstP + sgstP;
            if (totalPercent > 0) {
              const taxAmount = (amount * totalPercent) / (100 + totalPercent);
              itemCGST = taxAmount * (cgstP / totalPercent);
              itemSGST = taxAmount * (sgstP / totalPercent);
            }
          } else {
            const totalPercent = igstP;
            if (totalPercent > 0) {
              itemIGST = (amount * totalPercent) / (100 + totalPercent);
            }
          }
        }
        
        totalCGST += itemCGST;
        totalSGST += itemSGST;
        totalIGST += itemIGST;

        return {
          F_ItemDesignMaster: Number(row.F_ItemDesignMaster) || 0,
          F_CategoryMaster: Number(row.F_ItemGroupMaster) || 0,
          F_ItemMaster: Number(row.F_ItemMaster) || 0,
          Barcode: row.ItemCode || "",
          ItemName: row.ItemName || row.ItemData?.[0]?.ItemName || "",
          DesignPhoto: row.DesignPhoto || row.Photos?.[0] || "",
          Qty: qty,
          Rate: rate,
          Amount: amount,
          CGST: Number(itemCGST.toFixed(2)),
          SGST: Number(itemSGST.toFixed(2)),
          IGST: Number(itemIGST.toFixed(2))
        };
      });

      const otherChargesArray = otherChargesRows
        .filter((row) => row.F_LedgerMaster && row.Amount)
        .map((row) => ({
          F_LedgerMaster: Number(row.F_LedgerMaster),
          Amount: Number(row.Amount),
        }));

      const totalOtherCharges = otherChargesArray.reduce((sum, r) => sum + r.Amount, 0);

      if (isInState) {
        totalCGST += totalOtherCharges * (highestCGSTPercent / 100);
        totalSGST += totalOtherCharges * (highestSGSTPercent / 100);
      } else {
        totalIGST += totalOtherCharges * (highestIGSTPercent / 100);
      }

      const finalCGST = Math.round(taxOverrides.CGST !== undefined ? parseFloat(taxOverrides.CGST) || 0 : totalCGST);
      const finalSGST = Math.round(taxOverrides.SGST !== undefined ? parseFloat(taxOverrides.SGST) || 0 : totalSGST);
      const finalIGST = Math.round(taxOverrides.IGST !== undefined ? parseFloat(taxOverrides.IGST) || 0 : totalIGST);
      const finalTotalTax = finalCGST + finalSGST + finalIGST;

      const headerFormData = new FormData();
      headerFormData.append("EntryDate", state.formData.PODate);
      headerFormData.append("EntryNo", state.formData.PONo || "");
      headerFormData.append("F_LedgerMaster", state.formData.F_VendorMaster);
      headerFormData.append("Remarks", state.formData.Remarks || "");
      headerFormData.append("TotalCGST", finalCGST.toFixed(2));
      headerFormData.append("TotalSGST", finalSGST.toFixed(2));
      headerFormData.append("TotalIGST", finalIGST.toFixed(2));
      headerFormData.append("TotalTax", finalTotalTax.toFixed(2));
      headerFormData.append("UserId", obj?.uid || "0");
      headerFormData.append("F_CompanyMaster", "0");
      headerFormData.append("JsonData", JSON.stringify(jsonDataArray));
      headerFormData.append("OtherChargesJson", JSON.stringify(otherChargesArray));
      await Fn_AddEditData(dispatch, setState, { arguList: { id: state.id, formData: headerFormData } }, API_URL_SAVE, true, "memberid", navigate, "#");
      alert("Sales Invoice saved successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error saving sales entry:", error);
    }
  };

  const [printModalOpen, setPrintModalOpen] = useState(false);

  const executePrint = () => {
    const oldTitle = document.title;
    document.title = "";
    window.print();
    document.title = oldTitle;
    setPrintModalOpen(false);
  };

  const handleGenerateQR = async () => {
    if (!state.formData.PONo || state.id === 0) {
      alert("Please save or select an invoice first.");
      return;
    }

    // Calculate Grand Total
    const subTotal = gridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.Rate) || 0)), 0);
    const totalOtherCharges = otherChargesRows.reduce((sum, r) => sum + (parseFloat(r.Amount) || 0), 0);
    let finalCGST = 0, finalSGST = 0, finalIGST = 0;

    const vendor = state.VendorMaster?.find((v: any) => String(v.Id) === String(state.formData.F_VendorMaster));
    const isInState = vendor ? (vendor.IsInState === true || vendor.IsInState === 1 || vendor.IsInState === "1" || vendor.IsInState === "true") : false;

    if (isInState) {
        finalCGST = taxOverrides.CGST !== undefined ? parseFloat(taxOverrides.CGST) || 0 : gridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.Rate) || 0) * (row.GSTPercent || 0) / 200), 0);
        finalSGST = taxOverrides.SGST !== undefined ? parseFloat(taxOverrides.SGST) || 0 : finalCGST;
    } else {
        finalIGST = taxOverrides.IGST !== undefined ? parseFloat(taxOverrides.IGST) || 0 : gridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.Rate) || 0) * (row.GSTPercent || 0) / 100), 0);
    }
    const grandTotal = Math.round(subTotal + finalCGST + finalSGST + finalIGST + totalOtherCharges);

    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser?.uid ?? authUser?.Id ?? "0";
      const userToken = authUser?.Token ?? authUser?.token ?? "token";
      
      const url = `${API_WEB_URLS.BASE}Payment/${userId}/${userToken}`;
      const fd = new FormData();
      fd.append("F_SalesEntryH", String(state.id));
      fd.append("Amount", String(Math.round(grandTotal))); // Send amount in rupees
      
      const fetchRes = await fetch(url, {
          method: "POST",
          body: fd
      });

      const res = await fetchRes.json();

      if (!fetchRes.ok || res.status === 400) {
        console.error("CreateOrder failed with status:", fetchRes.status, res);
        alert(`Failed to create order: ${res?.message || res?.title || "Bad Request"}`);
        return;
      }

      let qrCode = "";
      
      // Based on image and raw fetch response: res.data.data.qrCode
      if (res?.data?.data?.qrCode) {
         qrCode = res.data.data.qrCode;
      } else if (res?.data?.data?.QRCode) {
         qrCode = res.data.data.QRCode;
      } else if (res?.data?.qrCode) {
         qrCode = res.data.qrCode;
      } else if (res?.data?.QRCode) {
         qrCode = res.data.QRCode;
      } else if (res?.qrCode) {
         qrCode = res.qrCode;
      } else if (res?.QRCode) {
         qrCode = res.QRCode;
      } else if (res?.data?.response && res.data.response.length > 0) {
         qrCode = res.data.response[0].QRCode || res.data.response[0].qrCode || res.data.response[0].qrcode || res.data.response[0].qrUrl || "";
      } else if (res?.response && res.response.length > 0) {
         qrCode = res.response[0].QRCode || res.response[0].qrCode || res.response[0].qrcode || res.response[0].qrUrl || "";
      } else if (Array.isArray(res) && res.length > 0) {
         qrCode = res[0].QRCode || res[0].qrCode || res[0].qrcode || res[0].qrUrl || "";
      } else if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
         qrCode = res.data[0].QRCode || res.data[0].qrCode || res.data[0].qrcode || res.data[0].qrUrl || "";
      }

      if (!qrCode) {
        alert("Failed to generate QR Code from server.");
        console.error("CreateOrder response:", res);
        return;
      }

      setQrData(qrCode);
      setQrModalOpen(true);

    } catch (e) {
      console.error("Error generating QR:", e);
      alert("Error generating QR code.");
    }
  };

  const handleDownloadPdf = async () => {
    const element = document.querySelector(".sales-print-layout") as HTMLElement;
    if (!element) {
      alert("Print layout not found.");
      return;
    }
    
    element.style.display = "block";
    element.style.position = "absolute";
    element.style.top = "-9999px";
    
    setTimeout(async () => {
      try {
        const html2pdfModule = require("html2pdf.js");
        const html2pdf = html2pdfModule.default || html2pdfModule;
        
        if (typeof html2pdf !== "function") {
           alert("PDF Library could not be loaded correctly.");
           return;
        }

        const opt = {
          margin:       5,
          filename:     `Invoice_${state.formData.PONo || 'Draft'}.pdf`,
          image:        { type: 'jpeg' as const, quality: 0.98 },
          html2canvas:  { scale: 2 },
          jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };
        
        await html2pdf().set(opt).from(element).save();
      } catch(e) {
        console.error("Error generating PDF", e);
        alert("Error generating PDF. Check console.");
      } finally {
        element.style.display = "";
        element.style.position = "";
        element.style.top = "";
        setPrintModalOpen(false);
      }
    }, 100);
  };

  const handleSharePdf = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Sales Invoice",
          text: `Invoice No: ${state.formData.PONo || "N/A"}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      alert("Sharing is not supported in this browser. Please download the PDF and share manually.");
    }
  };

  const handleShareQR = async () => {
    if (!qrData) return;
    try {
      const qrImageUrl = qrData.startsWith('http') || qrData.startsWith('data:image') ? qrData : `data:image/png;base64,${qrData}`;
      
      if (navigator.share) {
        if (qrImageUrl.startsWith('data:image')) {
           const res = await fetch(qrImageUrl);
           const blob = await res.blob();
           const file = new File([blob], "payment_qr.png", { type: blob.type });
           
           if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: "Payment QR",
                text: "Please scan the QR code to make a payment.",
                files: [file]
              });
           } else {
              alert("Your device doesn't support sharing this image directly.");
           }
        } else {
           await navigator.share({
              title: "Payment QR",
              text: "Please scan the QR code to make a payment.",
              url: qrImageUrl,
           });
        }
      } else {
        alert("Sharing is not supported in this browser.");
      }
    } catch (err) {
      console.error("Error sharing QR:", err);
    }
  };

  const salesInvoiceCompactStyles = `
    @media (max-width: 991.98px) {
      .sales-entry-page .container-fluid { padding: 0.4rem !important; }
      .sales-entry-page .card-body { padding: 0.4rem !important; }
      .sales-entry-page .card-footer { padding: 0.35rem 0.4rem !important; }
      .sales-entry-page .form-label { font-size: 0.75rem; margin-bottom: 0.2rem; }
      .sales-entry-page .form-control { font-size: 0.8rem; height: 26px; padding: 0.2rem 0.35rem; }
      .sales-entry-page .btn { font-size: 0.8rem; padding: 0.22rem 0.4rem; }
    }
    @media (max-width: 767.98px) {
      .sales-entry-page .container-fluid { padding: 0.25rem !important; }
      .sales-entry-page .card-body { padding: 0.3rem !important; }
      .sales-entry-page .card-footer { padding: 0.25rem 0.3rem !important; }
      .sales-entry-page .form-label { font-size: 0.7rem; margin-bottom: 0.15rem; }
      .sales-entry-page .form-control { font-size: 0.75rem; height: 24px; padding: 0.15rem 0.28rem; }
      .sales-entry-page .btn { font-size: 0.75rem; padding: 0.18rem 0.35rem; }
    }
    .sales-print-layout { display: none; }
    @media print {
      @page { margin: 0; }
      body { margin: 0.2cm; line-height: 1.1; }
      body * { visibility: hidden; }
      .sales-print-layout, .sales-print-layout * { visibility: visible; }
      .sales-print-layout { 
        display: block !important; 
        position: absolute; 
        left: 0; top: 0; 
        width: 100%; 
        padding: 5px; 
        background: white; 
        color: black; 
        font-family: Arial, sans-serif; 
      }
      .sales-print-layout .print-header { text-align: center; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 2px; }
      .sales-print-layout .firm-name { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 0; }
      .sales-print-layout .print-title { font-size: 14px; font-weight: bold; margin-top: 0; }
      .sales-print-layout .print-details { margin-bottom: 5px; }
      .sales-print-layout .detail-row { display: flex; justify-content: space-between; margin-bottom: 1px; font-size: 11px; }
      .sales-print-layout table { width: 100%; border-collapse: collapse; margin-top: 2px; }
      .sales-print-layout th, .sales-print-layout td { border: 1px solid #000; padding: 2px 4px; text-align: left; font-size: 11px; }
      .sales-print-layout th { background: #eee !important; -webkit-print-color-adjust: exact; }
      .sales-print-layout .text-right { text-align: right; }
      .sales-print-layout .total-row { font-weight: bold; }
    }
  `;

  return (
    <div className="page-body sales-entry-page" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <style>{salesInvoiceCompactStyles}</style>
      <Breadcrumbs mainTitle="Sales Invoice" parent="Inventory" />
      <Container fluid className="px-2 px-sm-3">
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title={`${state.isEditMode ? "Edit" : "Add"} Sales Invoice`} tagClass="card-title mb-0" />
              <CardBody className="p-2 p-sm-3">
                <Row className="g-2 g-sm-3">
                  <Col md="2">
                    <label className="form-label">Created Sales Invoice</label>
                    <select className="form-control" value={state.formData.F_SalesInvoiceH || ""} onChange={(e) => { 
                      const val = e.target.value;
                      handleFormFieldChange("F_SalesInvoiceH", val); 
                      if (!val) window.location.reload();
                      else fetchPEDataAndPopulateGrid(val); 
                    }}>
                      <option value="">Select PE</option>
                      {state.CreatedSalesEntries?.map((pe: any) => (
                        <option key={pe.Id} value={pe.Id}>{pe.EntryNo || pe.Id}</option>
                      ))}
                    </select>
                  </Col>

                  <Col md="2">
                    <label className="form-label">Entry No</label>
                    <Input type="text" value={state.formData.PONo} onChange={(e) => handleFormFieldChange("PONo", e.target.value)} disabled={state.isEditMode} placeholder="Auto-generated" />
                  </Col>
                  <Col md="2">
                    <label className="form-label">Entry Date</label>
                    <DateInput name="poDate" value={state.formData.PODate} onChange={(val: string) => handleFormFieldChange("PODate", val)} />
                  </Col>
                  <Col md="2">
                    <div className="d-flex justify-content-between align-items-center">
                      <label className="form-label">Vendor / Party</label>
                      <Button color="link" size="sm" className="p-0 text-decoration-none" onClick={openVendorModal} tabIndex={-1}>+ New</Button>
                    </div>
                    <select className="form-control" value={state.formData.F_VendorMaster} onChange={(e) => handleFormFieldChange("F_VendorMaster", e.target.value)} disabled={!state.isGridEditable}>
                      <option value="">Select Vendor</option>
                      {state.VendorMaster?.map((v: any) => (
                        <option key={v.Id} value={v.Id}>{v.CompanyName || v.Name || v.LedgerName}</option>
                      ))}
                    </select>
                  </Col>
                  <Col md="2">
                    <label className="form-label">Remarks</label>
                    <Input type="text" value={state.formData.Remarks} onChange={(e) => handleFormFieldChange("Remarks", e.target.value)} placeholder="Enter remarks" />
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col xs="12" className="overflow-auto">
                    <GridSystemSalesInvoice
                      gridRows={gridRows}
                      itemGroupMaster={state.ItemGroupMaster}
                      colorMaster={state.ColorMaster}
                      warehouseMaster={state.WarehouseMaster}
                      batchMaster={state.BatchMaster}
                      isBatchAllowed={state.IsBatchAllowed}
                      onAddRow={addRow}
                      onRemoveRow={removeRow}
                      onUpdateRow={updateGridRow}
                      disabled={!state.isGridEditable}
                      defaultColor={state.DefaultColor}
                      itemColorApplyMap={state.itemColorApplyMap}
                      onQuickAddItem={openQuickItemModal}
                      onBarcodeFetch={handleBarcodeFetch}
                    />
                  </Col>
                </Row>
                {/* Other Charges Table */}
                <Row className="mt-4">
                  <Col md={6}>
                    <h6 className="mb-2 text-primary fw-bold">Other Charges</h6>
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Ledger</th>
                            <th className="text-end" style={{ width: "120px" }}>Amount</th>
                            <th className="text-center" style={{ width: "90px" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {otherChargesRows.map((row, index) => (
                            <tr key={index}>
                              <td>
                                <select 
                                  className="form-control form-control-sm"
                                  value={row.F_LedgerMaster}
                                  onChange={(e) => {
                                    const newRows = [...otherChargesRows];
                                    newRows[index].F_LedgerMaster = e.target.value;
                                    setOtherChargesRows(newRows);
                                  }}
                                  disabled={!state.isGridEditable}
                                >
                                  <option value="">Select Ledger</option>
                                  {state.OtherChargesLedgers?.map((l: any) => (
                                    <option key={l.Id} value={l.Id}>{l.LedgerName || l.Name}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <Input 
                                  type="number"
                                  bsSize="sm"
                                  className="text-end m-0"
                                  value={row.Amount}
                                  onChange={(e) => {
                                    const newRows = [...otherChargesRows];
                                    newRows[index].Amount = e.target.value;
                                    setOtherChargesRows(newRows);
                                  }}
                                  disabled={!state.isGridEditable}
                                />
                              </td>
                              <td className="text-center">
                                <Button 
                                  color="primary" 
                                  size="sm" 
                                  className="me-1 p-1 px-2" 
                                  onClick={() => setOtherChargesRows([...otherChargesRows, { F_LedgerMaster: "", Amount: "" }])}
                                  disabled={!state.isGridEditable}
                                >
                                  <i className="fa fa-plus"></i>
                                </Button>
                                {otherChargesRows.length > 1 && (
                                  <Button 
                                    color="danger" 
                                    size="sm" 
                                    className="p-1 px-2"
                                    onClick={() => setOtherChargesRows(otherChargesRows.filter((_, i) => i !== index))}
                                    disabled={!state.isGridEditable}
                                  >
                                    <i className="fa fa-minus"></i>
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Col>
                </Row>

                {/* Tax Summary Section */}
                <Row className="mt-4">
                  <Col md={{ size: 4, offset: 8 }}>
                    {(() => {
                      let totalCGST = 0;
                      let totalSGST = 0;
                      let totalIGST = 0;
                      let highestCGSTPercent = 0;
                      let highestSGSTPercent = 0;
                      let highestIGSTPercent = 0;

                      const vendor = state.VendorMaster?.find((v: any) => String(v.Id) === String(state.formData.F_VendorMaster));
                      const isInState = vendor ? (vendor.IsInState === true || vendor.IsInState === 1 || vendor.IsInState === "1" || vendor.IsInState === "true") : false;

                      gridRows.forEach((row) => {
                        const qty = parseFloat(row.Qty) || 0;
                        const rate = parseFloat(row.Rate) || 0;
                        const amount = qty * rate;

                        const itemObj = row.ItemData?.find((i: any) => String(i.Id) === String(row.F_ItemMaster)) ||
                                        state.ItemMaster?.find((i: any) => String(i.Id) === String(row.F_ItemMaster));
                                        
                        const gstGroupId = itemObj?.F_GSTGroupMaster || itemObj?.GSTGroupMasterId || itemObj?.GSTGroupId || row.F_GSTGroupMaster;
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
                        }
                      });

                      const totalOtherCharges = otherChargesRows.reduce((sum, r) => sum + (parseFloat(r.Amount) || 0), 0);

                      if (isInState) {
                        totalCGST += totalOtherCharges * (highestCGSTPercent / 100);
                        totalSGST += totalOtherCharges * (highestSGSTPercent / 100);
                      } else {
                        totalIGST += totalOtherCharges * (highestIGSTPercent / 100);
                      }

                      const finalCGST = Math.round(taxOverrides.CGST !== undefined ? parseFloat(taxOverrides.CGST) || 0 : totalCGST);
                      const finalSGST = Math.round(taxOverrides.SGST !== undefined ? parseFloat(taxOverrides.SGST) || 0 : totalSGST);
                      const finalIGST = Math.round(taxOverrides.IGST !== undefined ? parseFloat(taxOverrides.IGST) || 0 : totalIGST);

                      const totalTax = finalCGST + finalSGST + finalIGST;
                      const subTotal = gridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.Rate) || 0)), 0);
                      const grandTotal = subTotal + totalTax + totalOtherCharges;

                      return (
                        <div className="table-responsive">
                          <table className="table table-bordered table-sm mb-0 align-middle">
                            <tbody>
                              <tr>
                                <th className="text-end w-50">Sub Total:</th>
                                <td className="text-end fw-bold">{subTotal.toFixed(2)}</td>
                              </tr>
                              {totalOtherCharges > 0 && (
                                <tr>
                                  <th className="text-end w-50">Other Charges:</th>
                                  <td className="text-end fw-bold">{totalOtherCharges.toFixed(2)}</td>
                                </tr>
                              )}
                              {isInState ? (
                                <>
                                  <tr>
                                    <th className="text-end">Total CGST:</th>
                                    <td className="text-end">
                                      <Input 
                                        type="number" 
                                        bsSize="sm" 
                                        className="text-end m-0 p-1" 
                                        value={taxOverrides.CGST !== undefined ? taxOverrides.CGST : totalCGST.toFixed(2)} 
                                        onChange={(e) => setTaxOverrides(prev => ({ ...prev, CGST: e.target.value }))} 
                                      />
                                    </td>
                                  </tr>
                                  <tr>
                                    <th className="text-end">Total SGST:</th>
                                    <td className="text-end">
                                      <Input 
                                        type="number" 
                                        bsSize="sm" 
                                        className="text-end m-0 p-1" 
                                        value={taxOverrides.SGST !== undefined ? taxOverrides.SGST : totalSGST.toFixed(2)} 
                                        onChange={(e) => setTaxOverrides(prev => ({ ...prev, SGST: e.target.value }))} 
                                      />
                                    </td>
                                  </tr>
                                </>
                              ) : (
                                <tr>
                                  <th className="text-end">Total IGST:</th>
                                  <td className="text-end">
                                    <Input 
                                      type="number" 
                                      bsSize="sm" 
                                      className="text-end m-0 p-1" 
                                      value={taxOverrides.IGST !== undefined ? taxOverrides.IGST : totalIGST.toFixed(2)} 
                                      onChange={(e) => setTaxOverrides(prev => ({ ...prev, IGST: e.target.value }))} 
                                    />
                                  </td>
                                </tr>
                              )}
                              <tr>
                                <th className="text-end text-danger">Total Tax:</th>
                                <td className="text-end text-danger fw-bold">{totalTax.toFixed(2)}</td>
                              </tr>
                              <tr>
                                <th className="text-end text-success fs-5">Grand Total:</th>
                                <td className="text-end text-success fw-bold fs-5">{grandTotal.toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </Col>
                </Row>
              </CardBody>
              <CardFooter className="d-flex flex-row flex-nowrap gap-2 justify-content-end p-2 p-sm-3">
                {state.isEditMode && !state.isGridEditable && (
                  <Btn
                    type="button"
                    color="warning"
                    onClick={handleEditPE}
                  >
                    <i className="fa fa-edit me-1"></i> Edit
                  </Btn>
                )}
                {state.isEditMode && !state.isGridEditable && (
                  <Btn type="button" color="danger" onClick={handleDeletePE}>
                    <i className="fa fa-trash me-1"></i> Delete
                  </Btn>
                )}
                <button ref={saveButtonRef} type="button" className="btn btn-primary m-0" onClick={handleSave} disabled={!state.isGridEditable}>
                  <i className="bx bx-save me-2"></i>Save
                </button>
                <Btn color="success" type="button" className="m-0" onClick={() => setPrintModalOpen(true)}>
                  <i className="bx bx-printer me-2"></i>Print
                </Btn>
                <Btn color="info" type="button" className="m-0" onClick={handleGenerateQR} disabled={!state.isEditMode || state.id === 0}>
                  <i className="bx bx-qr me-2"></i>Generate QR
                </Btn>
                <Btn color="secondary" type="button" className="m-0" onClick={() => navigate(-1)}>Cancel</Btn>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal isOpen={quickItemModalOpen} toggle={closeQuickItemModal} size="lg">
        <ModalHeader toggle={closeQuickItemModal}>Add New Item</ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup><Label>Item Name *</Label><Input type="text" value={quickItemForm.ItemName} onChange={(e) => setQuickItemForm({ ...quickItemForm, ItemName: e.target.value })} /></FormGroup>
            <FormGroup><Label>Item Code *</Label><Input type="text" value={quickItemForm.ItemCode} onChange={(e) => setQuickItemForm({ ...quickItemForm, ItemCode: e.target.value })} /></FormGroup>
            <FormGroup><Label>Item Group *</Label><select className="form-control" value={quickItemForm.F_ItemGroupMaster} onChange={(e) => setQuickItemForm({ ...quickItemForm, F_ItemGroupMaster: e.target.value })}><option value="">Select Group</option>{state.ItemGroupMaster?.map((g: any) => (<option key={g.Id} value={g.Id}>{g.Name}</option>))}</select></FormGroup>
            <FormGroup><Label>Color *</Label><select className="form-control" value={quickItemForm.F_ColorMaster} onChange={(e) => setQuickItemForm({ ...quickItemForm, F_ColorMaster: e.target.value })}><option value="">Select Color</option>{state.ColorMaster?.map((c: any) => (<option key={c.Id} value={c.Id}>{c.Name}</option>))}</select></FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter><Button color="primary" onClick={handleQuickItemSubmit} disabled={quickItemSubmitting}>Save</Button><Button color="secondary" onClick={closeQuickItemModal}>Cancel</Button></ModalFooter>
      </Modal>

      <Modal isOpen={vendorModalOpen} toggle={closeVendorModal} size="lg">
        <ModalHeader toggle={closeVendorModal}>Add New Vendor</ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup><Label>Vendor Name *</Label><Input type="text" value={vendorForm.CompanyName} onChange={(e) => setVendorForm({ ...vendorForm, CompanyName: e.target.value })} /></FormGroup>
            <FormGroup><Label>Phone *</Label><Input type="tel" value={vendorForm.Phone} onChange={(e) => setVendorForm({ ...vendorForm, Phone: e.target.value })} /></FormGroup>
            <FormGroup><Label>Email</Label><Input type="email" value={vendorForm.Email} onChange={(e) => setVendorForm({ ...vendorForm, Email: e.target.value })} /></FormGroup>
            <FormGroup><Label>Address *</Label><Input type="textarea" value={vendorForm.Address} onChange={(e) => setVendorForm({ ...vendorForm, Address: e.target.value })} rows="2" /></FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter><Button color="primary" onClick={handleVendorSubmit} disabled={vendorSubmitting}>Save</Button><Button color="secondary" onClick={closeVendorModal}>Cancel</Button></ModalFooter>
      </Modal>

      <Modal isOpen={qrModalOpen} toggle={() => setQrModalOpen(false)} centered>
        <ModalHeader toggle={() => setQrModalOpen(false)}>Scan to Pay</ModalHeader>
        <ModalBody className="text-center py-4">
          {qrData ? (
            <div>
              <img 
                src={qrData.startsWith('http') || qrData.startsWith('data:image') ? qrData : `data:image/png;base64,${qrData}`} 
                alt="Payment QR" 
                style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
              />
              <p className="mt-3 text-muted">Scan this QR code with any UPI app to pay.</p>
            </div>
          ) : (
            <p className="text-danger">Failed to load QR code.</p>
          )}
        </ModalBody>
        {qrData && (
          <ModalFooter className="justify-content-center border-0 pt-0">
            <Button color="success" className="d-flex align-items-center gap-2" onClick={handleShareQR}>
              <i className="fa fa-share-alt"></i> Share QR
            </Button>
          </ModalFooter>
        )}
      </Modal>

      <Modal isOpen={printModalOpen} toggle={() => setPrintModalOpen(false)} centered>
        <ModalHeader toggle={() => setPrintModalOpen(false)}>Print / Share Invoice</ModalHeader>
        <ModalBody className="text-center py-4">
          <div className="d-flex flex-column gap-3 align-items-center">
            <Button color="primary" size="lg" className="w-75 d-flex align-items-center justify-content-center gap-2" onClick={handleDownloadPdf}>
              <i className="fa fa-download"></i> Download PDF
            </Button>
            <Button color="success" size="lg" className="w-75 d-flex align-items-center justify-content-center gap-2" onClick={handleSharePdf}>
              <i className="fa fa-share-alt"></i> Share PDF
            </Button>
            <Button color="secondary" size="lg" className="w-75 d-flex align-items-center justify-content-center gap-2" onClick={executePrint}>
              <i className="fa fa-print"></i> Print
            </Button>
          </div>
        </ModalBody>
      </Modal>

      {/* ── SALES INVOICE PRINT LAYOUT ── */}
      <div className="sales-print-layout">
        <div style={{ border: "1px solid #000", minHeight: "1000px", display: "flex", flexDirection: "column" }}>
          
          <div style={{ textAlign: "center", borderBottom: "1px solid #000", padding: "10px" }}>
            <h2 style={{ margin: "0", fontSize: "22px", fontWeight: "bold", textTransform: "uppercase" }}>{state.GlobalOptions[0]?.FirmName || "FIRM NAME"}</h2>
            <div style={{ fontSize: "12px", marginTop: "4px", color: "#555" }}>
              {[
                state.GlobalOptions[0]?.FirmAddress,
                state.GlobalOptions[0]?.CityName || state.GlobalOptions[0]?.City || state.CityMaster?.find(c => String(c.Id) === String(state.GlobalOptions[0]?.F_CityMaster))?.Name,
                state.GlobalOptions[0]?.StateName || state.GlobalOptions[0]?.State || state.GlobalOptions[0]?.StateMasterName || state.StateMaster?.find(s => String(s.Id) === String(state.GlobalOptions[0]?.F_StateMaster))?.StateName
              ].filter(Boolean).join(", ")}
            </div>
            <h4 style={{ margin: "5px 0 0 0", fontSize: "16px", textDecoration: "underline" }}>SALES INVOICE</h4>
          </div>

          <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
            <div style={{ flex: 1, padding: "10px", borderRight: "1px solid #000" }}>
              <strong>Bill To:</strong><br />
              {(() => {
                const vendor = state.VendorMaster?.find((v: any) => String(v.Id) === String(state.formData.F_VendorMaster));
                return vendor ? (
                  <>
                    <div style={{ fontWeight: "bold", fontSize: "14px", marginTop: "4px" }}>{vendor.CompanyName || vendor.Name || vendor.LedgerName}</div>
                    {vendor.Address && <div style={{ fontSize: "12px", marginTop: "2px" }}>{vendor.Address}</div>}
                    {vendor.Phone && <div style={{ fontSize: "12px", marginTop: "2px" }}>Ph: {vendor.Phone}</div>}
                  </>
                ) : "N/A";
              })()}
            </div>
            <div style={{ flex: 1, padding: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span><strong>Invoice No.:</strong> {state.formData.PONo || "N/A"}</span>
                <span><strong>Date:</strong> {state.formData.PODate || "N/A"}</span>
              </div>
              {state.formData.Remarks && <div style={{ marginTop: "10px", fontSize: "12px" }}><strong>Remarks:</strong> {state.formData.Remarks}</div>}
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", flex: 1 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #000" }}>
                <th style={{ padding: "6px", borderRight: "1px solid #000", textAlign: "center", width: "40px" }}>#</th>
                <th style={{ padding: "6px", borderRight: "1px solid #000", textAlign: "left" }}>Description of Goods</th>
                <th style={{ padding: "6px", borderRight: "1px solid #000", textAlign: "center", width: "80px" }}>Qty</th>
                <th style={{ padding: "6px", borderRight: "1px solid #000", textAlign: "right", width: "100px" }}>Rate</th>
                <th style={{ padding: "6px", textAlign: "right", width: "120px" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {gridRows.map((row, index) => {
                const qty = parseFloat(row.Qty) || 0;
                const rate = parseFloat(row.Rate) || 0;
                const itemObj = row.ItemData?.find((i: any) => String(i.Id) === String(row.F_ItemMaster)) ||
                                state.ItemMaster?.find((i: any) => String(i.Id) === String(row.F_ItemMaster));
                const itemName = itemObj?.ItemName || itemObj?.Name || row.ItemCode || "N/A";

                return (
                  <tr key={index}>
                    <td style={{ padding: "4px 6px", borderRight: "1px solid #000", textAlign: "center", verticalAlign: "top" }}>{index + 1}</td>
                    <td style={{ padding: "4px 6px", borderRight: "1px solid #000", verticalAlign: "top" }}>
                      <strong>{itemName}</strong>
                      {(row.Variant || row.ItemCode) && (
                        <div style={{ fontSize: "11px", color: "#333", marginTop: "2px" }}>
                          {row.Variant && <span>Variant: {row.Variant}</span>}
                          {row.Variant && row.ItemCode && <span> | </span>}
                          {row.ItemCode && <span>Code: {row.ItemCode}</span>}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "4px 6px", borderRight: "1px solid #000", textAlign: "center", verticalAlign: "top" }}>{qty}</td>
                    <td style={{ padding: "4px 6px", borderRight: "1px solid #000", textAlign: "right", verticalAlign: "top" }}>{rate.toFixed(2)}</td>
                    <td style={{ padding: "4px 6px", textAlign: "right", verticalAlign: "top" }}>{(qty * rate).toFixed(2)}</td>
                  </tr>
                );
              })}
              {/* Filler row to push footer to bottom */}
              <tr>
                <td style={{ borderRight: "1px solid #000", height: "100%" }}></td>
                <td style={{ borderRight: "1px solid #000" }}></td>
                <td style={{ borderRight: "1px solid #000" }}></td>
                <td style={{ borderRight: "1px solid #000" }}></td>
                <td></td>
              </tr>
            </tbody>
            <tfoot style={{ borderTop: "1px solid #000" }}>
              {(() => {
                let totalCGST = 0;
                let totalSGST = 0;
                let totalIGST = 0;
                let highestCGSTPercent = 0;
                let highestSGSTPercent = 0;
                let highestIGSTPercent = 0;
                const vendor = state.VendorMaster?.find((v: any) => String(v.Id) === String(state.formData.F_VendorMaster));
                const isInState = vendor ? (vendor.IsInState === true || vendor.IsInState === 1 || vendor.IsInState === "1" || vendor.IsInState === "true") : false;

                gridRows.forEach((row) => {
                  const qty = parseFloat(row.Qty) || 0;
                  const rate = parseFloat(row.Rate) || 0;
                  const amount = qty * rate;
                  const itemObj = row.ItemData?.find((i: any) => String(i.Id) === String(row.F_ItemMaster)) ||
                                  state.ItemMaster?.find((i: any) => String(i.Id) === String(row.F_ItemMaster));
                  const gstGroupId = itemObj?.F_GSTGroupMaster || itemObj?.GSTGroupMasterId || itemObj?.GSTGroupId || row.F_GSTGroupMaster;
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
                  }
                });

                const totalOtherCharges = otherChargesRows.reduce((sum, r) => sum + (parseFloat(r.Amount) || 0), 0);

                if (isInState) {
                  totalCGST += totalOtherCharges * (highestCGSTPercent / 100);
                  totalSGST += totalOtherCharges * (highestSGSTPercent / 100);
                } else {
                  totalIGST += totalOtherCharges * (highestIGSTPercent / 100);
                }

                const finalCGST = Math.round(taxOverrides.CGST !== undefined ? parseFloat(taxOverrides.CGST) || 0 : totalCGST);
                const finalSGST = Math.round(taxOverrides.SGST !== undefined ? parseFloat(taxOverrides.SGST) || 0 : totalSGST);
                const finalIGST = Math.round(taxOverrides.IGST !== undefined ? parseFloat(taxOverrides.IGST) || 0 : totalIGST);

                const totalTax = finalCGST + finalSGST + finalIGST;
                const totalQty = gridRows.reduce((sum, row) => sum + (parseFloat(row.Qty) || 0), 0);
                const subTotal = gridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.Rate) || 0)), 0);
                const grandTotal = subTotal + totalTax + totalOtherCharges;

                return (
                  <>
                    <tr style={{ borderBottom: "1px solid #eee" }}>
                      <td colSpan={2} style={{ padding: "6px", borderRight: "1px solid #000", textAlign: "right", fontWeight: "bold" }}>Total:</td>
                      <td style={{ padding: "6px", borderRight: "1px solid #000", textAlign: "center", fontWeight: "bold" }}>{totalQty}</td>
                      <td style={{ padding: "6px", borderRight: "1px solid #000", textAlign: "right", fontWeight: "bold" }}>Sub Total:</td>
                      <td style={{ padding: "6px", textAlign: "right", fontWeight: "bold" }}>{subTotal.toFixed(2)}</td>
                    </tr>
                    {totalOtherCharges > 0 && (
                      <tr style={{ borderBottom: "1px solid #eee" }}>
                        <td colSpan={3} style={{ borderRight: "1px solid #000" }}></td>
                        <td style={{ padding: "6px", borderRight: "1px solid #000", textAlign: "right", fontWeight: "bold" }}>Other Charges:</td>
                        <td style={{ padding: "6px", textAlign: "right", fontWeight: "bold" }}>{totalOtherCharges.toFixed(2)}</td>
                      </tr>
                    )}
                    {isInState ? (
                      <>
                        <tr style={{ borderBottom: "1px solid #eee" }}>
                          <td colSpan={3} style={{ borderRight: "1px solid #000" }}></td>
                          <td style={{ padding: "4px 6px", borderRight: "1px solid #000", textAlign: "right" }}>CGST:</td>
                          <td style={{ padding: "4px 6px", textAlign: "right" }}>{finalCGST.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #eee" }}>
                          <td colSpan={3} style={{ borderRight: "1px solid #000" }}></td>
                          <td style={{ padding: "4px 6px", borderRight: "1px solid #000", textAlign: "right" }}>SGST:</td>
                          <td style={{ padding: "4px 6px", textAlign: "right" }}>{finalSGST.toFixed(2)}</td>
                        </tr>
                      </>
                    ) : (
                      <tr style={{ borderBottom: "1px solid #eee" }}>
                        <td colSpan={3} style={{ borderRight: "1px solid #000" }}></td>
                        <td style={{ padding: "4px 6px", borderRight: "1px solid #000", textAlign: "right" }}>IGST:</td>
                        <td style={{ padding: "4px 6px", textAlign: "right" }}>{finalIGST.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr style={{ borderTop: "1px solid #000", fontSize: "14px" }}>
                      <td colSpan={3} style={{ borderRight: "1px solid #000" }}></td>
                      <td style={{ padding: "8px 6px", borderRight: "1px solid #000", textAlign: "right", fontWeight: "bold" }}>Grand Total:</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: "bold" }}>{grandTotal.toFixed(2)}</td>
                    </tr>
                  </>
                );
              })()}
            </tfoot>
          </table>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "30px 10px 10px 10px", marginTop: "20px" }}>
            <div style={{ borderTop: "1px solid #000", width: "200px", textAlign: "center", paddingTop: "5px" }}>Customer's Signature</div>
            <div style={{ borderTop: "1px solid #000", width: "200px", textAlign: "center", paddingTop: "5px" }}>Authorised Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesInvoice;
