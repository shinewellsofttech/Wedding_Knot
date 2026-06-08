import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Row,
  Col,
  Container,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
} from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import DateInput from "../../../CommonElements/DateInput";
import GridSystemSalesInvoice from "./GridSystem";
import { Fn_AddEditData, Fn_DisplayData, Fn_FillListData, Fn_GetReport } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { getCurrentUserId } from "../../../utils/formUtils";
import { toast } from "react-toastify";
import { getCurrentDateYYYYMMDD, parseDateFromAPI } from "../../../helpers/dateUtils";

interface GridRow {
  ItemCode: string;
  F_ItemGroupMaster: string;
  F_ItemMaster: string;
  F_ColorMaster?: string;
  F_WarehouseMaster: string;
  F_BatchMaster?: string;
  Qty: string;
  Rate: string;
  ItemData: any[] | null;
  AvailableQty?: number;
  F_SalesOrderH?: string | number;
  F_SalesOrderL?: string | number;
}

interface FormData {
  StockNo: string;
  StockDate: string;
  F_SalesOrderH?: string;
  F_SalesInvoiceH?: string;
  F_VendorMaster: string;
  Remarks: string;
}

interface StateData {
  id: number;
  formData: FormData;
  CreatedSalesOrders?: any[];
  SalesOrderLinesMap?: Record<string, any[]>;
  CreatedSalesInvoices?: any[];
  SalesInvoiceLinesMap?: Record<string, any[]>;
  VendorMaster: any[];
  ItemGroupMaster: any[];
  WarehouseMaster: any[];
  ColorMaster: any[];
  BatchMaster: any[];
  DefaultWarehouse: any | null;
  DefaultColor: any | null;
  IsBatchAllowed: boolean;
  itemColorApplyMap: Record<string, boolean>;
  isEditMode: boolean;
  GlobalOptions?: any[];
  VoucherTypes?: any[];
}

function SalesInvoice() {
  const API_URL_SAVE = "Challan/0/token";
  const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/Challan/Id`;
  const API_URL_LINES = `${API_WEB_URLS.MASTER}/0/token/ChallanL/Id`;
  const API_Global = `${API_WEB_URLS.MASTER}/0/token/GetChallanNo`;
  const API_ITEM_BY_GROUP = `${API_WEB_URLS.MASTER}/0/token/ItemMasterById`;
  const API_SO_DATA = `${API_WEB_URLS.MASTER}/0/token/salesorderdata/Id/0`;
  const API_SI_DATA = `${API_WEB_URLS.MASTER}/0/token/SalesInvoiceData/Id/0`;
  const API_ITEM_GROUP = `${API_WEB_URLS.MASTER}/0/token/ItemGroup/Id/0`;
  const API_WAREHOUSE = `${API_WEB_URLS.MASTER}/0/token/WarehouseMaster/Id/0`;
  const API_COLOR = `${API_WEB_URLS.MASTER}/0/token/ColorMaster/Id/0`;
  const API_BATCH = `${API_WEB_URLS.MASTER}/0/token/BatchMaster/Id/0`;
  const API_VENDOR = `${API_WEB_URLS.MASTER}/0/token/GetLedgerNamesForPoSoApproval/Id/0`;
  const API_GLOBAL_OPTIONS = `${API_WEB_URLS.MASTER}/0/token/GlobalOptions/Id/0`;
  
  const API_ITEM_SAVE = "ItemMaster/0/token";
  const API_VENDOR_SAVE = "LedgerMaster/0/token";

  const [state, setState] = useState<StateData>({
    id: 0,
    formData: {
      StockNo: "",
      StockDate: getCurrentDateYYYYMMDD(),
      F_VendorMaster: "",
      Remarks: "",
    },
    VendorMaster: [],
    ItemGroupMaster: [],
    WarehouseMaster: [],
    ColorMaster: [],
    BatchMaster: [],
    DefaultWarehouse: null,
    DefaultColor: null,
    IsBatchAllowed: false,
    itemColorApplyMap: {},
    isEditMode: false,
    CreatedSalesOrders: [],
    SalesOrderLinesMap: {},
    CreatedSalesInvoices: [],
    SalesInvoiceLinesMap: {},
    GlobalOptions: [],
    VoucherTypes: [],
  });

  const [gridRows, setGridRows] = useState<GridRow[]>([
    {
      ItemCode: "",
      F_ItemGroupMaster: "",
      F_ItemMaster: "",
      F_ColorMaster: "",
      F_WarehouseMaster: "",
      F_BatchMaster: "",
      Qty: "",
      Rate: "",
      ItemData: null,
      AvailableQty: 0,
    },
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

  const [showSharePDFModal, setShowSharePDFModal] = useState(false);
  const [pendingShareFile, setPendingShareFile] = useState<File | null>(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const extractArray = (data: any) => {
    if (Array.isArray(data)) return data;
    return data?.data?.dataList || data?.dataList || data?.data?.response || data?.response || [];
  };

  const parseJsonData = (data: any) => {
    let dataArray: any[] = [];
    if (Array.isArray(data)) dataArray = data;
    else if (data?.data?.dataList && Array.isArray(data.data.dataList)) dataArray = data.data.dataList;
    else if (data?.dataList && Array.isArray(data.dataList)) dataArray = data.dataList;
    else if (data?.data?.response && Array.isArray(data.data.response)) dataArray = data.data.response;
    
    let headers: any[] = [];
    let linesMap: Record<string, any[]> = {};

    dataArray.forEach((item: any) => {
      if (item.Header) {
        try {
          const headerArr = JSON.parse(item.Header);
          const linesArr = item.Lines ? JSON.parse(item.Lines) : [];
          
          if (Array.isArray(headerArr)) {
            headerArr.forEach((hdr: any) => {
              headers.push(hdr);
              linesMap[String(hdr.Id)] = (Array.isArray(linesArr) ? linesArr : []).filter(l => String(l.F_SalesOrderH || l.F_SalesMaster || l.F_ChallanH || l.F_PurchaseOrderH || l.F_PurchaseEntryH || l.F_InvoiceH) === String(hdr.Id));
            });
          } else if (headerArr) {
            headers.push(headerArr);
            linesMap[String(headerArr.Id)] = (Array.isArray(linesArr) ? linesArr : []).filter(l => String(l.F_SalesOrderH || l.F_SalesMaster || l.F_ChallanH || l.F_PurchaseOrderH || l.F_PurchaseEntryH || l.F_InvoiceH) === String(headerArr.Id));
          }
        } catch (e) {
          console.error("Error parsing JSON Data", e);
        }
      }
    });
    return { headers, linesMap };
  };

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const extractArray = (data: any) => Array.isArray(data) ? data : (data?.data?.dataList || data?.dataList || []);

        const itemGroups = await Fn_FillListData(dispatch, setState, "ItemGroupMaster", API_ITEM_GROUP);
        const vendors = await Fn_FillListData(dispatch, setState, "VendorMaster", API_VENDOR);
        const warehouses = await Fn_FillListData(dispatch, setState, "WarehouseMaster", API_WAREHOUSE);
        const colors = await Fn_FillListData(dispatch, setState, "ColorMaster", API_COLOR);
        const batches = await Fn_FillListData(dispatch, setState, "BatchMaster", API_BATCH);
        const globalOptions = await Fn_FillListData(dispatch, setState, "GlobalOptions", API_GLOBAL_OPTIONS);
        
        const API_VOUCHER_TYPES = `${API_WEB_URLS.MASTER}/0/token/VoucherTypeMasterAll/Id/0`;
        const voucherTypes = await Fn_FillListData(dispatch, setState, "VoucherTypes", API_VOUCHER_TYPES);
        
        const API_ENTRY_NO = API_WEB_URLS.MASTER + "/0/token/GetVoucherNoByVoucherTypeId/Id/9";
        const entryNoData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_ENTRY_NO);
        let initialStockNo = "";
        let dataArray = extractArray(entryNoData);
        if (dataArray.length > 0 && dataArray[0].VoucherNo) {
          initialStockNo = String(dataArray[0].VoucherNo);
        } else if (typeof entryNoData === "string") {
          initialStockNo = entryNoData;
        }

        const soData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_SO_DATA);
        const parsedSO = parseJsonData(soData);

        const siData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_SI_DATA);
        const parsedSI = parseJsonData(siData);

        const isBatchAllowed = Array.isArray(globalOptions) && globalOptions.length > 0 ? (globalOptions[0].IsBatchAllowed === true || globalOptions[0].IsBatchAllowed === 1) : false;

        setState((prev) => ({
          ...prev,
          formData: { ...prev.formData, StockNo: initialStockNo },
          ItemGroupMaster: extractArray(itemGroups),
          VendorMaster: extractArray(vendors),
          WarehouseMaster: extractArray(warehouses),
          ColorMaster: extractArray(colors),
          BatchMaster: extractArray(batches),
          IsBatchAllowed: isBatchAllowed,
          DefaultWarehouse: extractArray(warehouses)?.[0] || null,
          DefaultColor: extractArray(colors)?.[0] || null,
          CreatedSalesOrders: parsedSO.headers,
          SalesOrderLinesMap: parsedSO.linesMap,
          CreatedSalesInvoices: parsedSI.headers,
          SalesInvoiceLinesMap: parsedSI.linesMap,
          GlobalOptions: extractArray(globalOptions),
          VoucherTypes: extractArray(voucherTypes),
        }));

        const recordId = location.state?.Id || 0;
        if (recordId > 0) {
          await loadSalesInvoiceRecord(recordId);
        }
      } catch (error) {
        console.error("Error fetching master data:", error);
      }
    };
    fetchMasterData();
  }, [dispatch, location.state]);

  const loadSalesInvoiceRecord = async (id: number) => {
    try {
      setState((prev) => ({ ...prev, isEditMode: true, id }));
      const headerData = await Fn_FillListData(dispatch, setState, "headerData", API_URL_EDIT + "/" + id);
      const lineData = await Fn_FillListData(dispatch, setState, "lineData", API_URL_LINES + "/" + id);

      const header = Array.isArray(headerData) && headerData.length > 0 ? headerData[0] : null;
      const lines = Array.isArray(lineData) ? lineData : [];

      if (header) {
        setState((prev) => ({
          ...prev,
          formData: {
            StockNo: header.StockNo || header.VoucherNo || "",
            StockDate: header.StockDate ? parseDateFromAPI(header.StockDate) : getCurrentDateYYYYMMDD(),
            F_VendorMaster: header.F_VendorMaster || header.F_LedgerMaster || "",
            Remarks: header.Remarks || "",
          },
        }));

        if (lines.length > 0) {
          const rowsData = await Promise.all(
            lines.map(async (line: any) => {
              const groupId = line.F_ItemGroupMaste || line.F_ItemGroupMaster || "";
              const itemData = await Fn_FillListData(dispatch, setState, `itemData_${groupId}`, `${API_WEB_URLS.MASTER}/0/token/ItemMaster/Id/${groupId}`);
              return {
                ItemCode: line.ItemCode || line.Code || "",
                F_ItemGroupMaster: groupId,
                F_ItemMaster: line.F_ItemMaster || "",
                F_ColorMaster: line.F_ColorMaster || "",
                F_WarehouseMaster: line.F_WarehouseMaster || line.F_GodownMaster || "",
                F_BatchMaster: line.F_BatchMaster || "",
                Qty: String(line.Qty || ""),
                Rate: String(line.Rate || ""),
                ItemData: extractArray(itemData),
              };
            })
          );
          setGridRows(rowsData);
        }
      }
    } catch (e) {
      console.error("Error loading record", e);
    }
  };

  const handleSOChange = async (soId: string) => {
    if (!soId) return;
    const lines = state.SalesOrderLinesMap?.[soId] || [];
    if (lines.length > 0) {
      const rowsData = await Promise.all(
        lines.map(async (l: any) => {
          const groupId = l.F_ItemGroupMaste || l.F_ItemGroupMaster || "";
          const itemData = await Fn_FillListData(dispatch, setState, `itemData_${groupId}`, `${API_WEB_URLS.MASTER}/0/token/ItemMaster/Id/${groupId}`);
          return {
            ItemCode: l.Code || l.ItemCode || "",
            F_ItemGroupMaster: groupId,
            F_ItemMaster: l.F_ItemMaster || "",
            F_ColorMaster: l.F_ColorMaster || state.DefaultColor?.Id || "",
            F_WarehouseMaster: l.F_WarehouseMaster || l.F_GodownMaster || state.DefaultWarehouse?.Id || "",
            F_BatchMaster: l.F_BatchMaster || "",
            Qty: String(l.ApprovedQty || l.OrderedQty || l.Qty || ""),
            Rate: String(l.Rate || ""),
            ItemData: extractArray(itemData),
            F_SalesOrderH: soId,
            F_SalesOrderL: l.Id || 0,
          };
        })
      );
      setGridRows(rowsData);
      const soHeader = state.CreatedSalesOrders?.find(p => String(p.Id) === String(soId));
      if (soHeader) {
        setState(prev => ({ ...prev, formData: { ...prev.formData, F_VendorMaster: String(soHeader.F_LedgerMaster || prev.formData.F_VendorMaster), F_SalesOrderH: soId } }));
      }
    }
  };

  const handleSIChange = async (siId: string) => {
    if (!siId) return;
    const lines = state.SalesInvoiceLinesMap?.[siId] || [];
    if (lines.length > 0) {
      const rowsData = await Promise.all(
        lines.map(async (l: any) => {
          const groupId = l.F_ItemGroupMaste || l.F_ItemGroupMaster || "";
          const itemData = await Fn_FillListData(dispatch, setState, `itemData_${groupId}`, `${API_WEB_URLS.MASTER}/0/token/ItemMaster/Id/${groupId}`);
          return {
            ItemCode: l.Code || l.ItemCode || "",
            F_ItemGroupMaster: groupId,
            F_ItemMaster: l.F_ItemMaster || "",
            F_ColorMaster: l.F_ColorMaster || state.DefaultColor?.Id || "",
            F_WarehouseMaster: l.F_WarehouseMaster || l.F_GodownMaster || state.DefaultWarehouse?.Id || "",
            F_BatchMaster: l.F_BatchMaster || "",
            Qty: String(l.Qty || ""),
            Rate: String(l.Rate || ""),
            ItemData: extractArray(itemData),
          };
        })
      );
      setGridRows(rowsData);
      const siHeader = state.CreatedSalesInvoices?.find(p => String(p.Id) === String(siId));
      if (siHeader) {
        setState(prev => ({
          ...prev,
          id: parseInt(siId),
          isEditMode: true,
          formData: {
            ...prev.formData,
            StockNo: siHeader.InvoiceNo || siHeader.StockNo || siHeader.EntryNo || siHeader.VoucherNo || prev.formData.StockNo,
            StockDate: siHeader.InvoiceDate ? String(siHeader.InvoiceDate).split("T")[0] : (siHeader.StockDate ? String(siHeader.StockDate).split("T")[0] : prev.formData.StockDate),
            F_VendorMaster: String(siHeader.F_PartyMaster || siHeader.F_LedgerMaster || siHeader.F_VendorMaster || prev.formData.F_VendorMaster),
            Remarks: siHeader.Remarks || prev.formData.Remarks,
            F_SalesInvoiceH: siId
          }
        }));
      }
    }
  };

  const addRow = () => {
    setGridRows((prev) => [
      ...prev,
      {
        ItemCode: "",
        F_ItemGroupMaster: "",
        F_ItemMaster: "",
        F_ColorMaster: state.DefaultColor?.Id || "",
        F_WarehouseMaster: state.DefaultWarehouse?.Id || "",
        F_BatchMaster: "",
        Qty: "",
        Rate: "",
        ItemData: null,
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (gridRows.length > 1) setGridRows(prev => prev.filter((_, i) => i !== index));
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
      const itemData = await Fn_FillListData(dispatch, setState, `itemData_${value}`, `${API_WEB_URLS.MASTER}/0/token/ItemMaster/Id/${value}`);
      updatedRows[index].ItemData = itemData || [];
    } else if (field === "F_ItemMaster") {
      const selectedItem = updatedRows[index].ItemData?.find((item: any) => String(item.Id) === String(value));
      if (selectedItem) {
        updatedRows[index].ItemCode = selectedItem.ItemCode || selectedItem.Code || "";
      }
    }

    if (field === "F_ItemMaster" || field === "F_ColorMaster" || field === "F_WarehouseMaster") {
      const row = updatedRows[index];
      if (row.F_ItemMaster) {
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

  const openQuickItemModal = (rowIndex: number) => {
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

  const handleQuickItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quickItemSubmitting) return;
    setQuickItemSubmitting(true);
    try {
      const userId = getCurrentUserId();
      const formData = new FormData();
      formData.append("ItemName", quickItemForm.ItemName);
      formData.append("ItemCode", quickItemForm.ItemCode);
      formData.append("F_ItemGroupMaster", quickItemForm.F_ItemGroupMaster);
      formData.append("F_ColorMaster", quickItemForm.F_ColorMaster);
      formData.append("UserId", String(userId || 0));

      await Fn_AddEditData(dispatch, setState, { arguList: { id: 0, formData } }, API_ITEM_SAVE, true, "memberid", navigate, "#");
      const groupItems = await Fn_FillListData(dispatch, setState, `itemData_${quickItemForm.F_ItemGroupMaster}`, `${API_WEB_URLS.MASTER}/0/token/ItemMaster/Id/${quickItemForm.F_ItemGroupMaster}`);
      const newItem = groupItems?.find((item: any) => item.ItemCode?.toLowerCase() === quickItemForm.ItemCode.toLowerCase());

      if (newItem && quickItemTargetRow !== null) {
        setGridRows(prev => prev.map((row, i) => i === quickItemTargetRow ? { ...row, F_ItemMaster: newItem.Id, ItemCode: newItem.ItemCode, ItemData: groupItems } : row));
      }
      setQuickItemModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setQuickItemSubmitting(false);
    }
  };

  const openVendorModal = () => {
    setVendorForm({ Name: "", CompanyName: "", Phone: "", Email: "", Address: "" });
    setVendorModalOpen(true);
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
      const userId = getCurrentUserId();
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
      formData.append("F_LedgerMasterPurchase", "0");
      formData.append("F_YearScheme", "0");
      formData.append("F_IntCalcMethod", "0");
      formData.append("BankName", "0");
      formData.append("BankAccountNo", "0");
      formData.append("BankIFSCCode", "0");
      formData.append("ISDalal", "false");
      formData.append("F_LedgerMasterDalal", "0");
      formData.append("IsTransport", "false");
      formData.append("F_TCSonSales", "0");
      formData.append("UserId", String(userId || obj?.uid || "0"));
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(dispatch, setState, { arguList: { id: 0, formData } }, API_VENDOR_SAVE, true, "memberid", navigate, "#");
      const vendors = await Fn_FillListData(dispatch, setState, "VendorMaster", API_VENDOR);
      const newVendor = vendors?.find((v: any) => (v.CompanyName || v.Name || v.LedgerName)?.toLowerCase() === companyName.toLowerCase());
      if (newVendor) {
        setState(prev => ({ ...prev, formData: { ...prev.formData, F_VendorMaster: newVendor.Id }, VendorMaster: vendors || [] }));
      }
      setVendorModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setVendorSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!state.formData.StockNo || !state.formData.F_VendorMaster) {
      alert("Please fill Stock No and Vendor");
      return;
    }
    for (let i = 0; i < gridRows.length; i++) {
      if (!gridRows[i].F_ItemMaster || !gridRows[i].Qty) {
        alert(`Row ${i + 1}: Please fill Item and Quantity`);
        return;
      }
    }
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = String(authUser?.uid ?? authUser?.Id ?? "0");
      const userToken = authUser?.Token ?? authUser?.token ?? "token";
      const companyId = authUser?.F_CompanyMaster ?? authUser?.CompanyId ?? authUser?.F_Company ?? "0";

      const grossAmount = gridRows.reduce((sum, r) => sum + ((Number(r.Qty) || 0) * (Number(r.Rate) || 0)), 0);

      const jsonDataArray = gridRows.map(row => ({
        F_ItemGroupMaster: Number(row.F_ItemGroupMaster) || 0,
        F_ItemMaster: Number(row.F_ItemMaster) || 0,
        F_GodownMaster: Number(row.F_WarehouseMaster) || 0,
        F_UnitMaster: 0,
        Qty: Number(row.Qty) || 0,
        QtyInPrimary: Number(row.Qty) || 0,
        Rate: Number(row.Rate) || 0,
        GrossLineAmount: (Number(row.Qty) || 0) * (Number(row.Rate) || 0),
        DiscountType: "",
        DiscountRate: 0,
        DiscountAmount: 0,
        NetLineAmount: (Number(row.Qty) || 0) * (Number(row.Rate) || 0),
        LineRemarks: "",
        F_CompanyMaster: Number(companyId) || 0,
        F_ColorMaster: Number(row.F_ColorMaster) || 0,
        F_BatchMaster: Number(row.F_BatchMaster) || 0,
      }));

      const formData = new FormData();
      formData.append("InvoiceNo", state.formData.StockNo);
      formData.append("InvoiceDate", state.formData.StockDate);
      formData.append("F_PartyMaster", state.formData.F_VendorMaster);
      formData.append("GrossAmount", String(grossAmount));
      formData.append("Remarks", state.formData.Remarks || "");
      formData.append("UserId", String(userId || 0));
      formData.append("F_CompanyMaster", String(companyId || 0));
      formData.append("JsonData", JSON.stringify(jsonDataArray));

      const apiURL = `SalesInvoice/${userId}/${userToken}`;

      const res = await Fn_AddEditData(dispatch, setState, { arguList: { id: state.id, formData } }, apiURL, true, "memberid", navigate, "#");
      if (res?.id) {
        toast.success("Sales Invoice saved successfully!");
        handleReset();
      }
    } catch (e) {
      console.error(e);
      toast.error("Error saving sales invoice");
    }
  };

  const handleReset = () => {
    setState(prev => ({
      ...prev,
      id: 0,
      isEditMode: false,
      formData: { StockNo: "", StockDate: getCurrentDateYYYYMMDD(), F_VendorMaster: "", Remarks: "" }
    }));
    setGridRows([{ ItemCode: "", F_ItemGroupMaster: "", F_ItemMaster: "", F_ColorMaster: state.DefaultColor?.Id || "", F_WarehouseMaster: state.DefaultWarehouse?.Id || "", F_BatchMaster: "", Qty: "", Rate: "", ItemData: null }]);
  };

  const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = Math.floor(num)) === 0) return 'Zero';

    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';

    let str = '';
    str += Number(n[1]) != 0 ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += Number(n[2]) != 0 ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += Number(n[3]) != 0 ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += Number(n[4]) != 0 ? a[Number(n[4])] + 'Hundred ' : '';
    str += Number(n[5]) != 0 ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
    return str.trim();
  };

  const handlePrint = () => {
    const oldTitle = document.title;
    document.title = "";
    window.print();
    document.title = oldTitle;
  };

  const handleDownloadPdf = async () => {
    const { generateInvoiceHTML } = require('../../../helpers/PDFTemplate');
    const htmlString = generateInvoiceHTML("CHALLAN", state, gridRows);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    await new Promise(r => setTimeout(r, 1000));

    const safeInvoiceNo = (state.formData.StockNo || "Draft").replace(/[\\/:*?"<>|]/g, "_");

    const html2pdfModule = require("html2pdf.js");
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin:       5,
      filename:     `Challan_${safeInvoiceNo}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, windowWidth: 800, width: 800 },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    const worker = html2pdf().set(opt).from(tempDiv.firstElementChild);
    const pdf = await worker.toPdf().get("pdf");
    const pdfBlob = pdf.output("blob");
    
    document.body.removeChild(tempDiv);
    return pdfBlob;
  };

  const handleSharePDFClick = async () => {
    if (!pendingShareFile || !('share' in navigator)) return;
    try {
      if (navigator.canShare && !navigator.canShare({ files: [pendingShareFile] })) {
        alert("Your device doesn't support sharing this PDF file directly. Please download it instead.");
        setShowSharePDFModal(false);
        setPendingShareFile(null);
        return;
      }
      
      await navigator.share({
        title: 'Challan',
        text: 'Please find attached the Challan',
        files: [pendingShareFile]
      });
      alert('PDF shared successfully!');
      setShowSharePDFModal(false);
      setPendingShareFile(null);
    } catch (shareError: any) {
      if (shareError.name === 'AbortError') {
        console.log('Share cancelled.');
      } else {
        console.error('Share error:', shareError);
        alert('Share failed. Try again.');
      }
      setShowSharePDFModal(false);
      setPendingShareFile(null);
    }
  };

  const handlePDFExport = async () => {
    const safeInvoiceNo = (state.formData.StockNo || "Draft").replace(/[\\/:*?"<>|]/g, "_");
    try {
      const pdfBlob = await handleDownloadPdf();
      const filename = `Challan_${safeInvoiceNo}.pdf`;
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });

      if ('share' in navigator) {
        setPendingShareFile(file);
        setShowSharePDFModal(true);
      } else {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const siCompactStyles = `
    @media (max-width: 991.98px) {
      .si-page .container-fluid { padding-left: 0.4rem; padding-right: 0.4rem; }
      .si-page .card-body { padding: 0.4rem; }
      .si-page .form-control { font-size: 0.8rem; height: 30px; }
      .si-page .btn { font-size: 0.8rem; padding: 0.2rem 0.5rem; }
    }
    
    .challan-print-layout { display: none; }
    @media print {
      @page { margin: 0; size: A4 portrait; }
      body { margin: 0.4cm !important; -webkit-print-color-adjust: exact; background-color: #fff; }
      body * { visibility: hidden; }
      .challan-print-layout, .challan-print-layout * { visibility: visible; }
      .challan-print-layout {
        display: block !important;
        position: absolute;
        left: 0; top: 0;
        width: 100%;
        color: #000;
        font-family: Arial, sans-serif;
        font-size: 11px;
        line-height: 1.3;
      }
      
      .challan-print-layout .invoice-title {
        text-align: center;
        font-size: 15px;
        font-weight: bold;
        letter-spacing: 1px;
        margin-bottom: 5px;
        text-transform: uppercase;
      }
      
      .challan-print-layout .invoice-outer-box {
        border: 1px solid #000;
        margin-top: 5px;
      }
      
      .challan-print-layout .invoice-header-box {
        display: flex;
        border-bottom: 1px solid #000;
        margin: 0 !important;
      }
      
      .challan-print-layout .invoice-header-box .left-side {
        width: 50%;
        border-right: 1px solid #000;
        display: flex;
        flex-direction: column;
      }
      
      .challan-print-layout .invoice-header-box .seller-info {
        padding: 4px 6px;
        border-bottom: 1px solid #000;
        min-height: 55px;
      }
      
      .challan-print-layout .invoice-header-box .seller-info .firm-name {
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 2px;
      }
      
      .challan-print-layout .invoice-header-box .seller-info .firm-address {
        font-size: 10px;
        color: #333;
        margin-bottom: 2px;
      }

      .challan-print-layout .invoice-header-box .seller-info .firm-email {
        font-size: 10px;
        color: #333;
      }
      
      .challan-print-layout .invoice-header-box .buyer-info {
        padding: 4px 6px;
        min-height: 75px;
      }
      
      .challan-print-layout .invoice-header-box .buyer-info .buyer-label {
        font-size: 9px;
        text-decoration: underline;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 2px;
      }
      
      .challan-print-layout .invoice-header-box .buyer-info .buyer-name {
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
      }
      
      .challan-print-layout .invoice-header-box .buyer-info .buyer-address {
        font-size: 10px;
        color: #333;
      }
      
      .challan-print-layout .invoice-header-box .right-side {
        width: 50%;
        display: flex;
        flex-direction: column;
      }
      
      .challan-print-layout .grid-row {
        display: flex;
        width: 100%;
      }
      
      .challan-print-layout .grid-row.border-bottom {
        border-bottom: 1px solid #000;
      }
      
      .challan-print-layout .grid-cell {
        width: 50%;
        padding: 3px 6px;
        min-height: 65px;
        box-sizing: border-box;
      }
      
      .challan-print-layout .grid-cell.border-right {
        border-right: 1px solid #000;
      }
      
      .challan-print-layout .grid-cell-full {
        width: 100%;
        padding: 3px 5px;
        min-height: 40px;
        box-sizing: border-box;
      }
      
      .challan-print-layout .cell-label {
        font-size: 8px;
        color: #444;
        text-transform: capitalize;
      }
      
      .challan-print-layout .cell-value {
        font-size: 10px;
        font-weight: bold;
      }
      
      .challan-print-layout .invoice-table {
        width: 100%;
        border-collapse: collapse;
        border-bottom: 1px solid #000;
        margin: 0 !important;
      }
      
      .challan-print-layout .invoice-table th, 
      .challan-print-layout .invoice-table td {
        border-right: 1px solid #000;
        padding: 3px 5px;
        vertical-align: top;
      }
      
      .challan-print-layout .invoice-table th:last-child, 
      .challan-print-layout .invoice-table td:last-child {
        border-right: none;
      }
      
      .challan-print-layout .invoice-table th {
        border-bottom: 1px solid #000;
        font-weight: bold;
        font-size: 10px;
        background: #f5f5f5 !important;
        text-align: left;
      }
      
      .challan-print-layout .invoice-table tr.blank-row td {
        height: 15px;
      }
      
      .challan-print-layout .invoice-table tr.total-row td {
        border-top: 1px solid #000;
        border-bottom: 1px solid #000;
        font-weight: bold;
        background: #f9f9f9 !important;
      }
      
      .challan-print-layout .invoice-table .text-center {
        text-align: center;
      }
      
      .challan-print-layout .invoice-table .text-right {
        text-align: right;
      }
      
      .challan-print-layout .invoice-footer-box {
        display: flex;
        flex-direction: column;
        margin: 0 !important;
      }
      
      .challan-print-layout .footer-top-row {
        display: flex;
        border-bottom: 1px solid #000;
        padding: 5px;
        justify-content: space-between;
        align-items: center;
      }
      
      .challan-print-layout .words-box {
        display: flex;
        flex-direction: column;
      }
      
      .challan-print-layout .words-box .label {
        font-size: 8px;
        color: #444;
      }
      
      .challan-print-layout .words-box .value {
        font-size: 10px;
        font-weight: bold;
      }
      
      .challan-print-layout .e-oe {
        font-style: italic;
        font-size: 9px;
        font-weight: bold;
      }
      
      .challan-print-layout .footer-bottom-row {
        display: flex;
      }
      
      .challan-print-layout .footer-bottom-row .left-column {
        width: 50%;
        border-right: 1px solid #000;
        padding: 6px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      
      .challan-print-layout .declaration-box {
        font-size: 8.5px;
        line-height: 1.35;
        margin-bottom: 5px;
      }
      
      .challan-print-layout .declaration-title {
        font-weight: bold;
        text-decoration: underline;
        margin-bottom: 3px;
        text-transform: uppercase;
      }
      
      .challan-print-layout .declaration-text {
        color: #000;
      }
      
      .challan-print-layout .footer-bottom-row .right-column {
        width: 50%;
        display: flex;
        flex-direction: column;
      }
      
      .challan-print-layout .bank-details {
        padding: 5px;
        border-bottom: 1px solid #000;
        font-size: 9px;
      }
      
      .challan-print-layout .bank-details .bank-title {
        font-weight: bold;
        text-decoration: underline;
        margin-bottom: 2px;
        text-transform: uppercase;
      }
      
      .challan-print-layout .sign-box {
        padding: 4px 5px;
        text-align: right;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 50px;
      }
      
      .challan-print-layout .company-sign-label {
        font-size: 9px;
        font-weight: bold;
      }
      
      .challan-print-layout .sign-label {
        font-size: 9px;
        font-weight: bold;
      }
      
      .challan-print-layout .computer-generated-tag {
        text-align: center;
        font-size: 9px;
        margin-top: 5px;
        font-style: italic;
      }
    }
  `;

  return (
    <div className="page-body si-page">
      <style>{siCompactStyles}</style>
      <Breadcrumbs mainTitle="Sales Invoice" parent="Inventory" />
      <Container fluid>
        <Card>
          <CardHeaderCommon title="Sales Invoice" tagClass="card-title mb-0" />
          <CardBody>
            <Row className="mb-3 g-3">
              <Col md="2">
                <FormGroup>
                  <Label>Created Sales Invoice</Label>
                  <Input type="select" value={state.formData.F_SalesInvoiceH || ""} onChange={e => handleSIChange(e.target.value)}>
                    <option value="">Select Created Invoice</option>
                    {state.CreatedSalesInvoices?.map(si => (
                      <option key={si.Id} value={si.Id}>{si.InvoiceNo || si.StockNo || si.EntryNo || si.VoucherNo || si.Id}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md="2">
                <FormGroup>
                  <Label>Sales Order</Label>
                  <Input type="select" value={state.formData.F_SalesOrderH || ""} onChange={e => handleSOChange(e.target.value)}>
                    <option value="">Select Sales Order</option>
                    {state.CreatedSalesOrders?.map(so => (
                      <option key={so.Id} value={so.Id}>{so.SoNo || so.Name || so.SONo || so.Id}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md="2">
                <FormGroup>
                  <Label>Stock No <span className="text-danger">*</span></Label>
                  <Input type="text" value={state.formData.StockNo} onChange={e => setState(p => ({ ...p, formData: { ...p.formData, StockNo: e.target.value } }))} placeholder="Auto" disabled={state.isEditMode} />
                </FormGroup>
              </Col>
              <Col md="2">
                <FormGroup>
                  <Label>Stock Date <span className="text-danger">*</span></Label>
                  <DateInput value={state.formData.StockDate} onChange={(e: any) => setState(p => ({ ...p, formData: { ...p.formData, StockDate: e.target.value } }))} disabled={state.isEditMode} />
                </FormGroup>
              </Col>
              <Col md="2">
                <FormGroup>
                  <div className="d-flex justify-content-between align-items-center">
                    <Label>Vendor/Party <span className="text-danger">*</span></Label>
                    <Button color="link" size="sm" className="p-0 text-decoration-none" onClick={openVendorModal} tabIndex={-1}>+ New</Button>
                  </div>
                  <Input type="select" value={state.formData.F_VendorMaster} onChange={e => setState(p => ({ ...p, formData: { ...p.formData, F_VendorMaster: e.target.value } }))}>
                    <option value="">Select Vendor</option>
                    {state.VendorMaster.map(v => (
                      <option key={v.Id} value={v.Id}>{v.CompanyName || v.Name || v.LedgerName}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md="2">
                <FormGroup>
                  <Label>Remarks</Label>
                  <Input type="text" value={state.formData.Remarks} onChange={e => setState(p => ({ ...p, formData: { ...p.formData, Remarks: e.target.value } }))} placeholder="Enter remarks" />
                </FormGroup>
              </Col>
            </Row>

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
              disabled={state.isEditMode}
              saveButtonRef={saveButtonRef}
              defaultColor={state.DefaultColor}
              itemColorApplyMap={state.itemColorApplyMap}
              onQuickAddItem={openQuickItemModal}
            />

            <Row className="mt-3">
              <Col lg="12" className="d-flex gap-2 justify-content-end">
                {!state.isEditMode ? (
                  <>
                    <button
                      ref={saveButtonRef}
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSubmit}
                    >
                      <i className="fa fa-save me-2"></i>Save
                    </button>
                    <Btn color="success" type="button" onClick={handlePrint}><i className="fa fa-print me-2"></i>Print</Btn>
                    <Btn color="danger" type="button" onClick={handlePDFExport}><i className="bx bxs-file-pdf me-2"></i>PDF</Btn>
                    <Btn color="secondary" onClick={handleReset}><i className="fa fa-refresh me-2"></i>Reset</Btn>
                  </>
                ) : (
                  <>
                    <Btn color="primary" onClick={() => setState(p => ({ ...p, isEditMode: false }))}><i className="fa fa-edit me-2"></i>Edit Mode</Btn>
                    <Btn color="success" type="button" onClick={handlePrint}><i className="fa fa-print me-2"></i>Print</Btn>
                    <Btn color="danger" type="button" onClick={handlePDFExport}><i className="bx bxs-file-pdf me-2"></i>PDF</Btn>
                    <Btn color="secondary" onClick={handleReset}><i className="fa fa-times me-2"></i>New / Cancel</Btn>
                  </>
                )}
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Container>

      {/* Quick Item Modal */}
      <Modal isOpen={quickItemModalOpen} toggle={() => setQuickItemModalOpen(false)} size="md">
        <ModalHeader toggle={() => setQuickItemModalOpen(false)}>Quick Add Item</ModalHeader>
        <Form onSubmit={handleQuickItemSubmit}>
          <ModalBody>
            <FormGroup>
              <Label>Item Group</Label>
              <Input type="select" value={quickItemForm.F_ItemGroupMaster} onChange={e => setQuickItemForm(p => ({ ...p, F_ItemGroupMaster: e.target.value }))} required>
                <option value="">Select Group</option>
                {state.ItemGroupMaster.map(g => <option key={g.Id} value={g.Id}>{g.Name || g.GroupName || g.ItemGroupName}</option>)}
              </Input>
            </FormGroup>
            <FormGroup>
              <Label>Item Name</Label>
              <Input type="text" value={quickItemForm.ItemName} onChange={e => setQuickItemForm(p => ({ ...p, ItemName: e.target.value }))} required />
            </FormGroup>
            <FormGroup>
              <Label>Item Code</Label>
              <Input type="text" value={quickItemForm.ItemCode} onChange={e => setQuickItemForm(p => ({ ...p, ItemCode: e.target.value }))} required />
            </FormGroup>
            <FormGroup>
              <Label>Color</Label>
              <Input type="select" value={quickItemForm.F_ColorMaster} onChange={e => setQuickItemForm(p => ({ ...p, F_ColorMaster: e.target.value }))} required>
                <option value="">Select Color</option>
                {state.ColorMaster.map(c => <option key={c.Id} value={c.Id}>{c.Name}</option>)}
              </Input>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" type="submit" disabled={quickItemSubmitting}>Create Item</Button>
            <Button color="secondary" onClick={() => setQuickItemModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Vendor Modal */}
      <Modal isOpen={vendorModalOpen} toggle={() => setVendorModalOpen(false)}>
        <ModalHeader toggle={() => setVendorModalOpen(false)}>Quick Add Party/Vendor</ModalHeader>
        <Form onSubmit={handleVendorSubmit}>
          <ModalBody>
            <FormGroup>
              <Label>Company Name / Party Name</Label>
              <Input type="text" value={vendorForm.CompanyName} onChange={e => setVendorForm(p => ({ ...p, CompanyName: e.target.value }))} required />
            </FormGroup>
            <FormGroup>
              <Label>Phone</Label>
              <Input type="text" value={vendorForm.Phone} onChange={e => setVendorForm(p => ({ ...p, Phone: e.target.value }))} required />
            </FormGroup>
            <FormGroup>
              <Label>Address</Label>
              <Input type="textarea" value={vendorForm.Address} onChange={e => setVendorForm(p => ({ ...p, Address: e.target.value }))} required />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" type="submit" disabled={vendorSubmitting}>Create Party</Button>
            <Button color="secondary" onClick={() => setVendorModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* High-Fidelity Tax Invoice Print Layout matching Shared Image */}
      <div className="challan-print-layout">
        <div className="invoice-title">INVOICE</div>
        <div className="invoice-outer-box">
        
        <div className="invoice-header-box">
          <div className="left-side">
            <div className="seller-info">
              <div className="firm-name">{state.GlobalOptions?.[0]?.FirmName || "INNOVATION SOFTTECH"}</div>
              <div className="firm-address">{state.GlobalOptions?.[0]?.Address || "Krishna Complex, 4th Floor, Mansingh Ka Hatta, Jodhpur"}</div>
              <div className="firm-email">E-Mail : {state.GlobalOptions?.[0]?.Email || "ennovationjodhpur@gmail.com"}</div>
            </div>
            
            <div className="buyer-info">
              <div className="buyer-label">Buyer</div>
              <div className="buyer-name">
                {(() => {
                  const vendor = state.VendorMaster?.find((v: any) => String(v.Id) === String(state.formData.F_VendorMaster));
                  return vendor ? (vendor.CompanyName || vendor.Name || vendor.LedgerName) : "N/A";
                })()}
              </div>
              <div className="buyer-address">
                {(() => {
                  const vendor = state.VendorMaster?.find((v: any) => String(v.Id) === String(state.formData.F_VendorMaster));
                  return vendor ? (vendor.Address || vendor.Address1 || "N/A") : "N/A";
                })()}
              </div>
            </div>
          </div>
          
          <div className="right-side">
            <div className="grid-row border-bottom">
              <div className="grid-cell border-right">
                <div className="cell-label">Invoice No.</div>
                <div className="cell-value">{state.formData.StockNo || "N/A"}</div>
              </div>
              <div className="grid-cell">
                <div className="cell-label">Dated</div>
                <div className="cell-value">{state.formData.StockDate || "N/A"}</div>
              </div>
            </div>
            
            <div className="grid-row">
              <div className="grid-cell border-right">
                <div className="cell-label">Buyer's Order No.</div>
                <div className="cell-value">
                  {(() => {
                    const selectedSO = state.CreatedSalesOrders?.find((so: any) => String(so.Id) === String(state.formData.F_SalesOrderH));
                    return selectedSO ? (selectedSO.SoNo || selectedSO.SONo || selectedSO.VoucherNo || selectedSO.EntryNo || "N/A") : "N/A";
                  })()}
                </div>
              </div>
              <div className="grid-cell">
                <div className="cell-label">Dated</div>
                <div className="cell-value">
                  {(() => {
                    const selectedSO = state.CreatedSalesOrders?.find((so: any) => String(so.Id) === String(state.formData.F_SalesOrderH));
                    return selectedSO ? (selectedSO.EntryDate || selectedSO.StockDate || selectedSO.Date || selectedSO.PODate || "N/A") : "N/A";
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <table className="invoice-table">
          <thead>
            <tr>
              <th style={{ width: "6%", textAlign: "center" }}>Sl No.</th>
              <th style={{ width: "54%" }}>Particulars</th>
              <th style={{ width: "10%", textAlign: "right" }}>Quantity</th>
              <th style={{ width: "10%", textAlign: "right" }}>Rate</th>
              <th style={{ width: "8%" }}>per</th>
              <th style={{ width: "12%", textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {gridRows.map((row, index) => {
              const qty = parseFloat(row.Qty) || 0;
              const rate = parseFloat(row.Rate) || 0;
              const amount = qty * rate;
              
              const groupObj = state.ItemGroupMaster?.find((g: any) => String(g.Id) === String(row.F_ItemGroupMaster));
              const groupName = groupObj ? (groupObj.Name || groupObj.GroupName || groupObj.ItemGroupName) : "";
              
              const itemObj = row.ItemData?.find((i: any) => String(i.Id) === String(row.F_ItemMaster));
              const itemName = itemObj?.ItemName || itemObj?.Name || row.ItemCode || "N/A";
              
              const particulars = groupName ? `${groupName} - ${itemName}` : itemName;
              
              return (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td>
                    <strong>{particulars}</strong>
                  </td>
                  <td className="text-right">{qty || ""}</td>
                  <td className="text-right">{rate ? rate.toFixed(2) : ""}</td>
                  <td>{qty ? "Pcs" : ""}</td>
                  <td className="text-right">{amount ? amount.toFixed(2) : ""}</td>
                </tr>
              );
            })}
            {/* Fill blank rows to align perfectly on A4 like a premium paper bill */}
            {Array.from({ length: Math.max(0, 8 - gridRows.length) }).map((_, idx) => (
              <tr key={`blank-${idx}`} className="blank-row">
                <td className="text-center">&nbsp;</td>
                <td>&nbsp;</td>
                <td className="text-right">&nbsp;</td>
                <td className="text-right">&nbsp;</td>
                <td>&nbsp;</td>
                <td className="text-right">&nbsp;</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan={2} className="text-right">Total</td>
              <td className="text-right">
                {gridRows.reduce((sum, r) => sum + (parseFloat(r.Qty) || 0), 0)}
              </td>
              <td></td>
              <td></td>
              <td className="text-right">
                ₹ {gridRows.reduce((sum, r) => sum + ((parseFloat(r.Qty) || 0) * (parseFloat(r.Rate) || 0)), 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
        
        <div className="invoice-footer-box">
          <div className="footer-top-row">
            <div className="words-box">
              <div className="label">Amount Chargeable (in words)</div>
              <div className="value">
                INR {numberToWords(gridRows.reduce((sum, r) => sum + ((parseFloat(r.Qty) || 0) * (parseFloat(r.Rate) || 0)), 0))} Only
              </div>
            </div>
            <div className="e-oe">E. & O.E</div>
          </div>
          
          <div className="footer-bottom-row">
            <div className="left-column">
              {(() => {
                const voucher = state.VoucherTypes?.find((v: any) => String(v.Id) === "9");
                return (
                  <div className="declaration-box">
                    <div className="declaration-title">Declaration / Terms & Conditions</div>
                    <div className="declaration-text">
                      {voucher?.Disclaimer1 && <div>{voucher.Disclaimer1}</div>}
                      {voucher?.Disclaimer2 && <div>{voucher.Disclaimer2}</div>}
                      {voucher?.Disclaimer3 && <div>{voucher.Disclaimer3}</div>}
                      {voucher?.Disclaimer4 && <div>{voucher.Disclaimer4}</div>}
                      {voucher?.Disclaimer5 && <div>{voucher.Disclaimer5}</div>}
                      {!voucher?.Disclaimer1 && (
                        <>
                          <div>1. Payment made within 7 days.</div>
                          <div>2. If Payment not received within 7 days, Interest @24%.</div>
                          <div>3. Any shortage etc. must be informed within 7 days.</div>
                          <div>4. The payment by A/c Payee cheques or DD is only valid.</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div className="pan-box" style={{ marginTop: "auto" }}>
                <strong>Company's PAN</strong> &nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;<strong>ABWPL4114B</strong>
              </div>
            </div>
            
            <div className="right-column">
              <div className="bank-details">
                <div className="bank-title">Company's Bank Details</div>
                <div>Bank Name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <strong>Innovation Softtech (IndusInd Bank)</strong></div>
                <div>A/c No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <strong>201000634701</strong></div>
                <div>Branch & IFS Code : <strong>Soorsagar & INDB0000452</strong></div>
              </div>
              
              <div className="sign-box">
                <div className="company-sign-label">for INNOVATION SOFTTECH</div>
                <div className="sign-space"></div>
                <div className="sign-label">Authorised Signatory</div>
              </div>
            </div>
          </div>
        </div>
        </div>
        
        <div className="computer-generated-tag">This is a Computer Generated Invoice</div>
      </div>

      {/* Share PDF Modal */}
      <Modal isOpen={showSharePDFModal} toggle={() => setShowSharePDFModal(false)} className="modal-sm" centered>
        <ModalHeader toggle={() => setShowSharePDFModal(false)} className="bg-primary text-white pb-2 pt-2 border-bottom-0">
          <span className="text-white">Share PDF</span>
        </ModalHeader>
        <ModalBody className="text-center pt-4 pb-4">
          <div className="mb-3">
            <i className="bx bxs-file-pdf text-danger" style={{ fontSize: "3rem" }}></i>
          </div>
          <h6>Invoice PDF Ready</h6>
          <p className="text-muted small mb-0">PDF has been generated successfully.</p>
        </ModalBody>
        <ModalFooter className="border-top-0 d-flex justify-content-center pb-3">
          <Button color="secondary" className="btn-sm px-4" onClick={() => setShowSharePDFModal(false)}>
            Close
          </Button>
          <Button color="primary" className="btn-sm px-4 action-btn" onClick={handleSharePDFClick}>
            <i className="bx bx-share-alt me-1"></i>
            Share File
          </Button>
        </ModalFooter>
      </Modal>

    </div>
  );
}

export default SalesInvoice;
