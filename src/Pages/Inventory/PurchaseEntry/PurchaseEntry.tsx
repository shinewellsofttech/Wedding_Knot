import React, { useState, useEffect, useRef } from "react";
import { Col, Row, Card, CardBody, CardFooter, Button, Modal, ModalBody, ModalHeader, ModalFooter, Form, FormGroup, Label, Input, Container } from "reactstrap";
import { Fn_AddEditData, Fn_DisplayData, Fn_FillListData, Fn_GetReport, Fn_DeleteData } from "../../../store/Functions";
import { useDispatch } from "react-redux";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { useLocation, useNavigate } from "react-router-dom";
import GridSystemPurchaseEntry from "./GridSystemPurchaseEntry";
import { getCurrentDateYYYYMMDD, parseDateFromAPI } from "../../../helpers/dateUtils";
import DateInput from "../../../CommonElements/DateInput/DateInput";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import { Btn } from "../../../AbstractElements";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import Select from "react-select";

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
  Photos?: any[];
  ItemData: any[] | null;
  AvailableQty?: number;
  F_PurchaseOrderH?: string | number;
  F_PurchaseOrderL?: string | number;
  F_GSTGroupMaster?: string;
  UnitValue?: number;
}

interface StateData {
  id: number;
  formData: {
    PONo: string;
    PODate: string;
    F_VendorMaster: string;
    Remarks: string;
    F_PurchaseOrderH?: string;
    F_PurchaseEntryH?: string;
    DispatchDocNo?: string;
    DispatchedThrough?: string;
  };
  CreatedPurchaseOrders?: any[];
  PurchaseOrderLinesMap?: Record<string, any[]>;
  CreatedPurchaseEntries?: any[];
  PurchaseEntryLinesMap?: Record<string, any[]>;
  VendorMaster: any[];
  ItemGroupMaster: any[];
  ItemMaster: any[];
  WarehouseMaster: any[];
  ColorMaster: any[];
  BatchMaster: any[];
  DefaultWarehouse: any | null;
  DefaultColor: any | null;
  IsBatchAllowed: boolean;
  itemColorApplyMap: Record<string | number, boolean>;
  isEditMode: boolean;
  isGridEditable: boolean;
  GlobalOptions: any[];
  GSTGroupMaster: any[];
  StateMaster: any[];
  CityMaster: any[];
  OtherChargesLedgers?: any[];
  LedgerGroupMaster?: any[];
}

function PurchaseEntry() {
  const API_URL_SAVE = "PurchaseEntry/0/token";
  const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/PurchaseEntryH/Id";
  const API_URL_LINES = API_WEB_URLS.MASTER + "/0/token/PurchaseEntryL/Id";
  const API_URL_ITEMGROUP = API_WEB_URLS.MASTER + "/0/token/CategoryMaster/Id/0";
  const API_URL_ITEMS = API_WEB_URLS.MASTER + "/0/token/ItemMaster/Id";
  const API_URL_VENDOR = API_WEB_URLS.MASTER + "/0/token/PurchasePartyLedgerMaster/Id/0";
  const API_URL_OTHER_LEDGER = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.LedgerMaster}/TBL.F_LedgerGroupMaster/15`;
  const API_URL_LEDGERGROUP = API_WEB_URLS.MASTER + "/0/token/LedgerGroupMaster/Id/0";
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
      DispatchDocNo: "",
      DispatchedThrough: "",
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
    itemColorApplyMap: {},
    isEditMode: false,
    isGridEditable: true,
    GlobalOptions: [],
    GSTGroupMaster: [],
    OtherChargesLedgers: [],
    LedgerGroupMaster: [],
  });

  const [showSharePDFModal, setShowSharePDFModal] = useState(false);
  const [pendingShareFile, setPendingShareFile] = useState<File | null>(null);

  const [otherChargesRows, setOtherChargesRows] = useState<any[]>([
    { F_LedgerMaster: "", Amount: "" }
  ]);

  const [chargeLedgerModalOpen, setChargeLedgerModalOpen] = useState(false);
  const [chargeLedgerSubmitting, setChargeLedgerSubmitting] = useState(false);
  const [chargeLedgerTargetIndex, setChargeLedgerTargetIndex] = useState<number | null>(null);
  const [chargeLedgerForm, setChargeLedgerForm] = useState({
    Name: "",
    F_LedgerGroupMaster: "",
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

  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const itemGroups = await Fn_FillListData(dispatch, setState, "ItemGroupMaster", API_URL_ITEMGROUP);
        const vendors = await Fn_FillListData(dispatch, setState, "VendorMaster", API_URL_VENDOR);
        const API_URL_PE_LIST = API_WEB_URLS.MASTER + "/0/token/PurchaseEntryData/Id/0";
        const peData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_PE_LIST);
        
        let peDataArray: any[] = [];
        if (Array.isArray(peData)) peDataArray = peData;
        else if (peData?.data?.dataList && Array.isArray(peData.data.dataList)) peDataArray = peData.data.dataList;
        else if (peData?.dataList && Array.isArray(peData.dataList)) peDataArray = peData.dataList;
        else if (peData?.data?.response && Array.isArray(peData.data.response)) peDataArray = peData.data.response;

        const API_URL_GSTGROUP = API_WEB_URLS.MASTER + "/0/token/GSTGroupMaster/Id/0";
        const gstData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_GSTGROUP);
        const otherLedgersData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_OTHER_LEDGER);
        const ledgerGroupData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_LEDGERGROUP);
        const globalOptions = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_GLOBALOPTIONS);

        const API_URL_STATEMASTER = API_WEB_URLS.MASTER + "/0/token/StateMaster/Id/0";
        const stateMasterData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_STATEMASTER);

        const API_URL_CITYMASTER = API_WEB_URLS.MASTER + "/0/token/CityMaster/Id/0";
        const cityMasterData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_CITYMASTER);

        const extractArray = (data: any) => Array.isArray(data) ? data : (data?.data?.dataList || data?.dataList || data?.data?.response || data?.response || []);

        setState((prev) => ({
          ...prev,
          ItemGroupMaster: extractArray(itemGroups),
          VendorMaster: extractArray(vendors),
          CreatedPurchaseEntries: peDataArray,
          GSTGroupMaster: extractArray(gstData),
          OtherChargesLedgers: extractArray(otherLedgersData),
          LedgerGroupMaster: extractArray(ledgerGroupData),
          GlobalOptions: extractArray(globalOptions),
          StateMaster: extractArray(stateMasterData),
          CityMaster: extractArray(cityMasterData),
        }));

        const params = new URLSearchParams(location.search);
        const recordId = params.get("id");
        if (recordId) {
          await fetchPEDataAndPopulateGrid(recordId, peDataArray);
        } else {
          try {
            const API_ENTRY_NO = API_WEB_URLS.MASTER + "/0/token/GetVoucherNoByVoucherTypeId/Id/5";
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const recordId = params.get("id");
    if (recordId && String(state.formData.F_PurchaseEntryH) !== String(recordId)) {
      fetchPEDataAndPopulateGrid(recordId);
    }
  }, [location.search, state.CreatedPurchaseEntries]);

  const fetchPODataAndPopulateGrid = async (poId: string) => {
    if (!poId) return;
    const prevState = state;
    const lines = prevState.PurchaseOrderLinesMap?.[poId] || [];
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
        F_PurchaseOrderH: poId,
        F_PurchaseOrderL: l.PurchaseOrderLId || l.Id || 0,
      }));
      setGridRows(mappedRows);
      setOtherChargesRows([{ F_LedgerMaster: "", Amount: "" }]);
      
      let newVendorMasterId = prevState.formData.F_VendorMaster;
      const poHeader = prevState.CreatedPurchaseOrders?.find((p: any) => String(p.Id) === String(poId));
      if (poHeader && poHeader.F_LedgerMaster) {
         newVendorMasterId = String(poHeader.F_LedgerMaster);
      }
      setState((prev) => ({
        ...prev,
        formData: { ...prev.formData, F_VendorMaster: newVendorMasterId, F_PurchaseOrderH: poId }
      }));
    } else {
      alert("No approved lines found for the selected PO.");
    }
  };

  const fetchPEDataAndPopulateGrid = async (peId: string | number, peList?: any[]) => {
    if (!peId) return;
    const list = peList || state.CreatedPurchaseEntries || [];
    let pe = list.find((p: any) => String(p.Id) === String(peId));
    if (!pe) {
      try {
        const directData = await Fn_FillListData(dispatch, () => ({}), "ignored", `${API_WEB_URLS.MASTER}/0/token/PurchaseEntryData/Id/${peId}`);
        const arr = Array.isArray(directData) ? directData : (directData?.data?.dataList || directData?.dataList || directData?.data?.response || directData?.response || []);
        if (arr.length > 0) pe = arr[0];
      } catch (e) {
        console.error("Error fetching single PE data:", e);
      }
    }
    if (!pe) return;

    let lines: any[] = [];
    try {
      if (pe.PurchaseLDetails) {
        const parsed = typeof pe.PurchaseLDetails === "string" ? JSON.parse(pe.PurchaseLDetails) : pe.PurchaseLDetails;
        lines = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error parsing PurchaseLDetails", e);
    }

    let otherChargesLines: any[] = [];
    try {
      const rawCharges = pe.PurchaseLOtherChargesDetails || pe.OtherChargesDetails || pe.SalesLOtherChargesDetails;
      if (rawCharges) {
        const parsed = typeof rawCharges === "string" ? JSON.parse(rawCharges) : rawCharges;
        otherChargesLines = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error parsing Purchase other charges", e);
    }

    if (otherChargesLines.length > 0) {
      const missingLedgers = otherChargesLines
        .filter((l: any) => l.F_LedgerMaster && !state.OtherChargesLedgers?.some((ol: any) => String(ol.Id) === String(l.F_LedgerMaster)))
        .map((l: any) => ({ Id: l.F_LedgerMaster, Name: l.LedgerName || l.Name || `Ledger ${l.F_LedgerMaster}`, F_LedgerGroupMaster: 15 }));
      if (missingLedgers.length > 0) {
        setState((prev) => ({ ...prev, OtherChargesLedgers: [...(prev.OtherChargesLedgers || []), ...missingLedgers] }));
      }

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
        F_PurchaseEntryH: pe.Id,
        DispatchDocNo: pe.DispatchDocNo || "",
        DispatchedThrough: pe.DispatchedThrough || "",
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
          } else if (cleaned.includes("http://") && cleaned.lastIndexOf("http://") > 0) {
            const firstPart = cleaned.substring(0, cleaned.lastIndexOf("http://"));
            const secondPart = cleaned.substring(cleaned.lastIndexOf("http://"));
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
          F_ItemDesignMaster: String(l.F_ItemDesignMaster || ""),
          F_ColorMaster: state.DefaultColor?.Id || "",
          F_WarehouseMaster: state.DefaultWarehouse?.Id || "",
          F_BatchMaster: "",
          ItemName: l.ItemName || "",
          DesignPhoto: cleanPhoto,
          Variant: l.Variant || l.Varient || "",
          Photos: cleanPhoto ? [{ full: cleanPhoto, thumb: cleanThumb || cleanPhoto }] : [],
          Qty: String(l.Qty || ""),
          Rate: l.Rate ? String(l.Rate) : "",
          ItemData: [{ 
            Id: l.F_ItemMaster, 
            ItemName: l.ItemName || "Scanned Item",
            HSNCode: l.HSNCode || l.HSN || "",
            F_GSTGroupMaster: l.F_GSTGroupMaster || l.GSTGroupMasterId || ""
          }],
          AvailableQty: 0,
          F_PurchaseOrderH: 0,
          F_PurchaseOrderL: 0,
          GSTPercent: parseFloat(l.GSTPercent) || 0,
          F_GSTGroupMaster: l.F_GSTGroupMaster || l.GSTGroupMasterId || "",
        };
      });
      setGridRows(mappedRows);
    } else {
      setGridRows([{ ItemCode: "", F_ItemGroupMaster: "", F_ItemMaster: "", F_WarehouseMaster: state.DefaultWarehouse?.Id || "", F_BatchMaster: "", Variant: "", Qty: "", Rate: "", Photos: [], ItemData: null }]);
      alert("No lines found for the selected Purchase Entry.");
    }
  };

  const loadPurchaseEntryRecord = async (id: number) => {
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
            DispatchDocNo: header.DispatchDocNo || "",
            DispatchedThrough: header.DispatchedThrough || "",
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
                GSTPercent: parseFloat(line.GSTPercent) || 0,
                F_GSTGroupMaster: line.F_GSTGroupMaster || line.GSTGroupMasterId || "",
              };
            })
          );
          setGridRows(rowsData);
        }

        try {
          const rawCharges = header.PurchaseLOtherChargesDetails || header.OtherChargesDetails || header.SalesLOtherChargesDetails;
          if (rawCharges) {
            const parsed = typeof rawCharges === "string" ? JSON.parse(rawCharges) : rawCharges;
            const otherChargesLines = Array.isArray(parsed) ? parsed : [];
            if (otherChargesLines.length > 0) {
              const missingLedgers = otherChargesLines
                .filter((l: any) => l.F_LedgerMaster && !state.OtherChargesLedgers?.some((ol: any) => String(ol.Id) === String(l.F_LedgerMaster)))
                .map((l: any) => ({ Id: l.F_LedgerMaster, Name: l.LedgerName || l.Name || `Ledger ${l.F_LedgerMaster}`, F_LedgerGroupMaster: 15 }));
              if (missingLedgers.length > 0) {
                setState((prev) => ({ ...prev, OtherChargesLedgers: [...(prev.OtherChargesLedgers || []), ...missingLedgers] }));
              }

              setOtherChargesRows(otherChargesLines.map((l: any) => ({
                F_LedgerMaster: String(l.F_LedgerMaster || ""),
                Amount: String(l.Amount || "")
              })));
            } else {
              setOtherChargesRows([{ F_LedgerMaster: "", Amount: "" }]);
            }
          }
        } catch (e) {
          console.error("Error parsing header other charges", e);
        }
      }
    } catch (error) {
      console.error("Error loading purchase entry record:", error);
    }
  };

  const handleFormFieldChange = (field: string, value: any) => {
    setState((prev) => ({ ...prev, formData: { ...prev.formData, [field]: value } }));
  };

  const addRow = () => {
    setTaxOverrides({});
    setGridRows((prevRows) => [
      ...prevRows,
      { ItemCode: "", F_ItemGroupMaster: "", F_ItemMaster: "", F_ColorMaster: state.DefaultColor?.Id || "", F_WarehouseMaster: state.DefaultWarehouse?.Id || "", F_BatchMaster: "", Variant: "", Photos: [], Qty: "", Rate: "", ItemData: null, AvailableQty: 0, UnitValue: 1 },
    ]);
  };

  const handleDeletePE = () => {
    if (!state.formData.F_PurchaseEntryH) return;
    if (window.confirm("Are you sure you want to delete this purchase entry?")) {
      const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/PurchaseEntryH`;
      Fn_DeleteData(dispatch, () => {}, Number(state.formData.F_PurchaseEntryH), DELETE_API_URL)
        .then(() => {
      
          alert("Purchase Entry deleted successfully.");
          window.location.reload();
        })
        .catch((error: any) => {
          
          console.error("Failed to delete purchase entry:", error);
          alert("Failed to delete purchase entry. Please try again.");
        });
    }
  };

  const handleEditPE = () => {
    setState((prev) => ({ ...prev, isGridEditable: true }));
  };

  const removeRow = (index: number) => {
    setTaxOverrides({});
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
    setTaxOverrides({});
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

  const handleBarcodeFetch = async (index: number, barcode: string) => {
    setTaxOverrides({});
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
      const existingQty = parseFloat(updatedRows[duplicateIndex].Qty) || 0;
      updatedRows[duplicateIndex].Qty = String(existingQty + 1);
      
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

        let designs: any[] = [];
        try {
          if (typeof item.DesignDetails === "string") {
            designs = JSON.parse(item.DesignDetails || "[]");
          } else if (Array.isArray(item.DesignDetails)) {
            designs = item.DesignDetails;
          }
        } catch (e) {
          console.error("Error parsing DesignDetails:", e);
        }

        const matchedDesign = designs.find((d: any) => String(d.Barcode) === String(barcode)) || {};

        const groupId = item.F_CategoryMaster || item.F_ItemGroupMaster || "";
        const itemId = item.Id || "";
        const designId = matchedDesign.Id || "";
        
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
          } else if (cleaned.includes("http://") && cleaned.lastIndexOf("http://") > 0) {
            const firstPart = cleaned.substring(0, cleaned.lastIndexOf("http://"));
            const secondPart = cleaned.substring(cleaned.lastIndexOf("http://"));
            if (firstPart.includes("Thumbnail")) {
              const filename = secondPart.substring(secondPart.lastIndexOf("/") + 1);
              return firstPart + filename;
            }
            return secondPart;
          }
          return cleaned;
        };

        const photos = [];
        if (matchedDesign.DesignPhoto) photos.push({ full: cleanUrl(matchedDesign.DesignPhoto), thumb: cleanUrl(matchedDesign.DesignPhoto_Thumb) || cleanUrl(matchedDesign.DesignPhoto) });
        if (matchedDesign.DesignPhoto2) photos.push({ full: cleanUrl(matchedDesign.DesignPhoto2), thumb: cleanUrl(matchedDesign.DesignPhoto2_Thumb) || cleanUrl(matchedDesign.DesignPhoto2) });
        if (matchedDesign.DesignPhoto3) photos.push({ full: cleanUrl(matchedDesign.DesignPhoto3), thumb: cleanUrl(matchedDesign.DesignPhoto3_Thumb) || cleanUrl(matchedDesign.DesignPhoto3) });
        if (matchedDesign.DesignPhoto4) photos.push({ full: cleanUrl(matchedDesign.DesignPhoto4), thumb: cleanUrl(matchedDesign.DesignPhoto4_Thumb) || cleanUrl(matchedDesign.DesignPhoto4) });
        if (matchedDesign.DesignPhoto5) photos.push({ full: cleanUrl(matchedDesign.DesignPhoto5), thumb: cleanUrl(matchedDesign.DesignPhoto5_Thumb) || cleanUrl(matchedDesign.DesignPhoto5) });
        
        let unitVal = parseFloat(matchedDesign.UnitConversion);
        if (isNaN(unitVal) || unitVal === 0) unitVal = 1;

        const updatedRows = [...gridRows];
        updatedRows[index] = {
          ...updatedRows[index],
          ItemCode: matchedDesign.Barcode || barcode,
          F_ItemGroupMaster: String(groupId),
          F_ItemMaster: String(itemId),
          F_ItemDesignMaster: String(designId),
          ItemName: item.ItemName || "Scanned Item",
          DesignPhoto: matchedDesign.DesignPhoto || "",
          Variant: matchedDesign.SizeName || "",
          Photos: photos,
          Qty: "1",
          Rate: matchedDesign.PurchaseRate ? String(matchedDesign.PurchaseRate) : "",
          F_GSTGroupMaster: item.F_GSTGroupMaster || "",
          ItemData: [{ Id: itemId, ItemName: item.ItemName || "Scanned Item", F_GSTGroupMaster: item.F_GSTGroupMaster }],
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
    } finally {
      (window as any).isFetchingBarcode = false;
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
    setTaxOverrides({});
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
      formData.append("F_LedgerGroupMaster", "35");
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

  const openChargeLedgerModal = (rowIndex: number | null = null) => {
    if (!state.isGridEditable) return;
    setChargeLedgerTargetIndex(rowIndex);
    
    // Direct Expenses is Group ID 15 in LedgerGroupMaster
    const directExpGroup = state.LedgerGroupMaster?.find((g: any) => 
      String(g.Id) === "15" ||
      ((g.Name || g.GroupName || "")?.toLowerCase().includes("direct") && 
       (g.Name || g.GroupName || "")?.toLowerCase().includes("exp"))
    );
    const defaultGroupId = directExpGroup ? String(directExpGroup.Id) : "15";

    setChargeLedgerForm({
      Name: "",
      F_LedgerGroupMaster: defaultGroupId,
    });
    setChargeLedgerModalOpen(true);
  };

  const closeChargeLedgerModal = () => {
    if (chargeLedgerSubmitting) return;
    setChargeLedgerModalOpen(false);
    setChargeLedgerTargetIndex(null);
  };

  const handleChargeLedgerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chargeLedgerSubmitting) return;
    const trimmedName = (chargeLedgerForm.Name || "").trim();
    if (!trimmedName) {
      alert("Please enter a charge ledger name (e.g. Freight Charges, Packaging Charges)");
      return;
    }
    setChargeLedgerSubmitting(true);
    try {
      const obj = JSON.parse(localStorage.getItem("user") || "{}");
      const formData = new FormData();
      formData.append("Id", "0");
      formData.append("Name", trimmedName);
      formData.append("Alias", "0");
      formData.append("F_LedgerGroupMaster", chargeLedgerForm.F_LedgerGroupMaster || "15");
      formData.append("Address", "0");
      formData.append("Address1", "0");
      formData.append("F_CountryMaster", "0");
      formData.append("F_StateMaster", "0");
      formData.append("F_CityMaster", "0");
      formData.append("PinCode", "0");
      formData.append("PhoneNo", "0");
      formData.append("MobileNo", "0");
      formData.append("Email", "0");
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
      formData.append("UserId", obj?.uid || "0");
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(dispatch, setState, { arguList: { id: 0, formData } }, API_VENDOR_SAVE, true, "memberid", navigate, "#");
      
      const otherLedgersData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_OTHER_LEDGER);
      const extractArray = (data: any) => Array.isArray(data) ? data : (data?.data?.dataList || data?.dataList || data?.data?.response || data?.response || []);
      const updatedLedgers = extractArray(otherLedgersData);
      
      setState((prev) => ({ ...prev, OtherChargesLedgers: updatedLedgers }));

      const newLedger = updatedLedgers?.find((l: any) => (l.LedgerName || l.Name)?.toLowerCase() === trimmedName.toLowerCase());
      if (newLedger) {
        setOtherChargesRows((prevRows) => {
          const newRows = [...prevRows];
          const target = chargeLedgerTargetIndex !== null ? chargeLedgerTargetIndex : (newRows.length - 1);
          if (newRows[target]) {
            newRows[target].F_LedgerMaster = String(newLedger.Id);
          }
          return newRows;
        });
      }
      setChargeLedgerModalOpen(false);
    } catch (error) {
      console.error("Error creating charge ledger:", error);
      alert("Failed to create charge ledger. Please try again.");
    } finally {
      setChargeLedgerSubmitting(false);
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
      const isInState = vendor ? (vendor.IsInState === true || vendor.IsInState === 1 || vendor.IsInState === "1" || vendor.IsInState === "true") : true;

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
            itemCGST = amount * (cgstP / 100);
            itemSGST = amount * (sgstP / 100);
          } else {
            itemIGST = amount * (igstP / 100);
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
      headerFormData.append("F_StatusMaster", "0");
      headerFormData.append("Remarks", state.formData.Remarks || "");
      headerFormData.append("DispatchDocNo", state.formData.DispatchDocNo || "");
      headerFormData.append("DispatchedThrough", state.formData.DispatchedThrough || "");
      headerFormData.append("UserId", obj?.uid || "0");
      headerFormData.append("TotalCGST", finalCGST.toFixed(2));
      headerFormData.append("TotalSGST", finalSGST.toFixed(2));
      headerFormData.append("TotalIGST", finalIGST.toFixed(2));
      headerFormData.append("F_LedgerMaster_CGST", finalCGST > 0 ? "18" : "0");
      headerFormData.append("F_LedgerMaster_SGST", finalSGST > 0 ? "19" : "0");
      headerFormData.append("F_LedgerMaster_IGST", finalIGST > 0 ? "17" : "0");
      headerFormData.append("TotalTax", finalTotalTax.toFixed(2));
      headerFormData.append("JsonData", JSON.stringify(jsonDataArray));
      headerFormData.append("OtherChargesJson", JSON.stringify(otherChargesArray));
      headerFormData.append("F_CompanyMaster", "0");
      await Fn_AddEditData(dispatch, setState, { arguList: { id: state.id, formData: headerFormData } }, API_URL_SAVE, true, "memberid", navigate, "#");
      if (window.confirm("Purchase Entry saved successfully. Do you want to print it?")) {
        handlePrint();
      }
      window.location.reload();
    } catch (error) {
      console.error("Error saving purchase entry:", error);
    }
  };

  const handlePrint = () => {
    const oldTitle = document.title;
    document.title = "";
    window.print();
    document.title = oldTitle;
  };

  const handleDownloadPdf = async () => {
    const { generateInvoiceHTML } = require('../../../helpers/PDFTemplate');
    const htmlString = generateInvoiceHTML("PURCHASE ENTRY", state, gridRows, otherChargesRows, taxOverrides);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    await new Promise(r => setTimeout(r, 1000));

    const safeInvoiceNo = (state.formData.PONo || "Draft").replace(/[\\/:*?"<>|]/g, "_");

    const html2pdfModule = require("html2pdf.js");
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin:       5,
      filename:     `PurchaseEntry_${safeInvoiceNo}.pdf`,
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
        title: 'Purchase Entry',
        text: 'Please find attached the Purchase Entry',
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
    const safeInvoiceNo = (state.formData.PONo || "Draft").replace(/[\\/:*?"<>|]/g, "_");
    try {
      const pdfBlob = await handleDownloadPdf();
      const filename = `PurchaseEntry_${safeInvoiceNo}.pdf`;
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

  const purchaseEntryCompactStyles = `
    @media (max-width: 991.98px) {
      .purchase-entry-page .container-fluid { padding: 0.4rem !important; }
      .purchase-entry-page .card-body { padding: 0.4rem !important; }
      .purchase-entry-page .card-footer { padding: 0.35rem 0.4rem !important; }
      .purchase-entry-page .form-label { font-size: 0.75rem; margin-bottom: 0.2rem; }
      .purchase-entry-page .form-control { font-size: 0.8rem; height: 26px; padding: 0.2rem 0.35rem; }
      .purchase-entry-page .btn { font-size: 0.8rem; padding: 0.22rem 0.4rem; }
    }
    @media (max-width: 767.98px) {
      .purchase-entry-page .container-fluid { padding: 0.25rem !important; }
      .purchase-entry-page .card-body { padding: 0.3rem !important; }
      .purchase-entry-page .card-footer { padding: 0.25rem 0.3rem !important; }
      .purchase-entry-page .form-label { font-size: 0.7rem; margin-bottom: 0.15rem; }
      .purchase-entry-page .form-control { font-size: 0.75rem; height: 24px; padding: 0.15rem 0.28rem; }
      .purchase-entry-page .btn { font-size: 0.75rem; padding: 0.18rem 0.35rem; }
    }
    .purchase-print-layout { 
      position: absolute; 
      left: -9999px; 
      top: 0; 
      display: block; 
      width: 210mm;
      background: white; 
      color: black; 
    }
    @media print {
      @page { margin: 0; }
      body { margin: 0.2cm; line-height: 1.1; }
      body * { visibility: hidden; }
      .purchase-print-layout, .purchase-print-layout * { visibility: visible; }
      .purchase-print-layout { 
        display: block !important; 
        position: absolute; 
        left: 0; top: 0; 
        width: 100%; 
        padding: 5px; 
        background: white; 
        color: black; 
        font-family: Arial, sans-serif; 
      }
    }
  `;

  return (
    <div className="page-body purchase-entry-page" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <style>{purchaseEntryCompactStyles}</style>
      <Breadcrumbs mainTitle="Purchase Entry" parent="Inventory" />
      <Container fluid className="px-2 px-sm-3">
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title={`${state.isEditMode ? "Edit" : "Add"} Purchase Entry`} tagClass="card-title mb-0" />
              <CardBody className="p-2 p-sm-3">
                <Row className="g-2 g-sm-3">
                  <Col md>
                    <label className="form-label">Created Purchase Entry</label>
                    {(() => {
                      const purchaseEntryOptions = state.CreatedPurchaseEntries?.map((pe: any) => {
                        const vendor = state.VendorMaster?.find((v: any) => String(v.Id) === String(pe.F_LedgerMaster));
                        const vendorName = (pe.VendorName || vendor?.CompanyName || vendor?.Name || vendor?.LedgerName || "").trim();
                        
                        const getValidPhone = (val: any) => {
                          if (!val) return "";
                          const str = String(val).trim();
                          if (str === "0" || str === "0.00" || str === "null" || str === "undefined") return "";
                          return str;
                        };

                        const mobileNo = getValidPhone(pe.MobileNo) || getValidPhone(pe.PhoneNo) || getValidPhone(vendor?.MobileNo) || getValidPhone(vendor?.PhoneNo) || getValidPhone(vendor?.Phone) || "";
                        
                        const labelParts = [
                          pe.EntryNo || `#${pe.Id}`,
                          vendorName,
                          mobileNo
                        ].filter(Boolean);

                        return {
                          value: pe.Id,
                          label: labelParts.join(" - ")
                        };
                      }) || [];

                      const selectedOption = purchaseEntryOptions.find((opt: any) => String(opt.value) === String(state.formData.F_PurchaseEntryH)) || null;

                      return (
                        <Select
                          className="react-select-container"
                          classNamePrefix="react-select"
                          placeholder="Select Purchase Entry..."
                          isClearable
                          isSearchable
                          options={purchaseEntryOptions}
                          value={selectedOption}
                          onChange={(opt: any) => {
                            const val = opt ? opt.value : "";
                            handleFormFieldChange("F_PurchaseEntryH", val);
                            if (!val) window.location.reload();
                            else fetchPEDataAndPopulateGrid(val);
                          }}
                          styles={{
                            control: (base: any) => ({
                              ...base,
                              minHeight: "33px",
                              height: "33px",
                              fontSize: "0.85rem",
                              borderRadius: "0.25rem",
                              borderColor: "#dee2e6",
                              boxShadow: "none",
                              "&:hover": {
                                borderColor: "#86b7fe"
                              }
                            }),
                            valueContainer: (base: any) => ({
                              ...base,
                              padding: "0 6px",
                            }),
                            input: (base: any) => ({
                              ...base,
                              margin: "0",
                              padding: "0",
                            }),
                            indicatorsContainer: (base: any) => ({
                              ...base,
                              height: "33px",
                            }),
                            menu: (base: any) => ({
                              ...base,
                              zIndex: 9999,
                              fontSize: "0.85rem",
                            }),
                            menuPortal: (base: any) => ({
                              ...base,
                              zIndex: 9999,
                            })
                          }}
                          menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                        />
                      );
                    })()}
                  </Col>

                  <Col md>
                    <label className="form-label">Entry No</label>
                    <Input type="text" value={state.formData.PONo} onChange={(e) => handleFormFieldChange("PONo", e.target.value)} disabled={state.isEditMode} placeholder="Auto-generated" />
                  </Col>
                  <Col md>
                    <label className="form-label">Entry Date</label>
                    <DateInput name="poDate" value={state.formData.PODate} onChange={(e: any) => handleFormFieldChange("PODate", e?.target ? e.target.value : e)} />
                  </Col>
                  <Col md>
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
                  <Col md>
                    <label className="form-label">Remarks</label>
                    <Input type="text" value={state.formData.Remarks} onChange={(e) => handleFormFieldChange("Remarks", e.target.value)} placeholder="Enter remarks" />
                  </Col>
                  <Col md>
                    <label className="form-label">Dispatch Doc No.</label>
                    <Input type="text" value={state.formData.DispatchDocNo} onChange={(e) => handleFormFieldChange("DispatchDocNo", e.target.value)} placeholder="Enter doc no" />
                  </Col>
                  <Col md>
                    <label className="form-label">Dispatched through</label>
                    <Input type="text" value={state.formData.DispatchedThrough} onChange={(e) => handleFormFieldChange("DispatchedThrough", e.target.value)} placeholder="Enter dispatched through" />
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col xs="12" className="overflow-auto">
                    <GridSystemPurchaseEntry
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
                
                {/* Other Charges & Tax Summary Section */}
                <Row className="mt-4 align-items-start">
                  {/* Other Charges Table */}
                  <Col md={6} className="mb-3 mb-md-0">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0 text-primary fw-bold">Other Charges (Packaging, Freight, etc.)</h6>
                      <Button 
                        color="link" 
                        size="sm" 
                        className="p-0 text-decoration-none" 
                        onClick={() => openChargeLedgerModal(null)} 
                        disabled={!state.isGridEditable}
                        tabIndex={-1}
                      >
                        + New Charge Ledger
                      </Button>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Ledger</th>
                            <th className="text-end" style={{ width: "130px" }}>Amount</th>
                            <th className="text-center" style={{ width: "90px" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {otherChargesRows.map((row, index) => (
                            <tr key={index}>
                              <td>
                                <div className="d-flex align-items-center gap-1">
                                  <select 
                                    className="form-control form-control-sm"
                                    value={row.F_LedgerMaster}
                                    onChange={(e) => {
                                      setTaxOverrides({});
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
                                  <Button
                                    color="light"
                                    size="sm"
                                    className="p-0 px-2 border"
                                    title="Add New Charge Ledger"
                                    onClick={() => openChargeLedgerModal(index)}
                                    disabled={!state.isGridEditable}
                                    type="button"
                                    style={{ height: "26px", lineHeight: "24px" }}
                                  >
                                    +
                                  </Button>
                                </div>
                              </td>
                              <td>
                                <Input 
                                  type="number"
                                  bsSize="sm"
                                  className="text-end m-0"
                                  placeholder="0.00"
                                  value={row.Amount}
                                  onChange={(e) => {
                                    setTaxOverrides({});
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
                                  onClick={() => { setTaxOverrides({}); setOtherChargesRows([...otherChargesRows, { F_LedgerMaster: "", Amount: "" }]); }}
                                  disabled={!state.isGridEditable}
                                >
                                  <i className="fa fa-plus"></i>
                                </Button>
                                {otherChargesRows.length > 1 && (
                                  <Button 
                                    color="danger" 
                                    size="sm" 
                                    className="p-1 px-2"
                                    onClick={() => { setTaxOverrides({}); setOtherChargesRows(otherChargesRows.filter((_, i) => i !== index)); }}
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

                  {/* Tax Summary Section */}
                  <Col md={{ size: 5, offset: 1 }}>
                    {(() => {
                      let totalCGST = 0;
                      let totalSGST = 0;
                      let totalIGST = 0;
                      let highestCGSTPercent = 0;
                      let highestSGSTPercent = 0;
                      let highestIGSTPercent = 0;

                      const vendor = state.VendorMaster?.find((v: any) => String(v.Id) === String(state.formData.F_VendorMaster));
                      const isInState = vendor ? (vendor.IsInState === true || vendor.IsInState === 1 || vendor.IsInState === "1" || vendor.IsInState === "true") : true;

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

                      const finalCGST = taxOverrides.CGST !== undefined ? parseFloat(taxOverrides.CGST) || 0 : totalCGST;
                      const finalSGST = taxOverrides.SGST !== undefined ? parseFloat(taxOverrides.SGST) || 0 : totalSGST;
                      const finalIGST = taxOverrides.IGST !== undefined ? parseFloat(taxOverrides.IGST) || 0 : totalIGST;

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
                {state.isEditMode && (
                  <>
                    <Btn color="success" type="button" className="m-0" onClick={handlePrint}>
                      <i className="bx bx-printer me-2"></i>Print
                    </Btn>
                    <Btn color="danger" type="button" className="m-0" onClick={handlePDFExport}>
                      <i className="bx bxs-file-pdf me-2"></i>PDF
                    </Btn>
                  </>
                )}
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

      <Modal isOpen={chargeLedgerModalOpen} toggle={closeChargeLedgerModal} size="md">
        <ModalHeader toggle={closeChargeLedgerModal}>Add New Charge Ledger</ModalHeader>
        <ModalBody>
          <Form onSubmit={handleChargeLedgerSubmit}>
            <FormGroup>
              <Label>Ledger Name <span className="text-danger">*</span></Label>
              <Input 
                type="text" 
                placeholder="e.g. Freight Charges, Packaging Charges, Transport"
                value={chargeLedgerForm.Name} 
                onChange={(e) => setChargeLedgerForm({ ...chargeLedgerForm, Name: e.target.value })} 
                autoFocus
              />
              <small className="text-muted d-block mt-1">
                <strong>Accounting Rule:</strong> Purchase par lagne wale charges (Packaging, Freight, Cartage) <strong>Direct Expenses</strong> group me aate hain (Trading Account me Purchase Cost badhane ke liye).
              </small>
            </FormGroup>
            <FormGroup>
              <Label>Ledger Group <span className="text-danger">*</span></Label>
              <select 
                className="form-control" 
                value={chargeLedgerForm.F_LedgerGroupMaster} 
                onChange={(e) => setChargeLedgerForm({ ...chargeLedgerForm, F_LedgerGroupMaster: e.target.value })}
              >
                <option value="">Select Group</option>
                {state.LedgerGroupMaster && state.LedgerGroupMaster.length > 0 ? (
                  state.LedgerGroupMaster.map((g: any) => (
                    <option key={g.Id} value={g.Id}>
                      {g.Name || g.GroupName || `Group ${g.Id}`} {String(g.Id) === "15" ? "(Direct Expenses - Recommended for Purchase)" : ""}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="15">Expenses (Direct) - Group 15</option>
                    <option value="16">Expenses (Indirect) - Group 16</option>
                  </>
                )}
              </select>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleChargeLedgerSubmit} disabled={chargeLedgerSubmitting}>
            {chargeLedgerSubmitting ? "Saving..." : "Save Ledger"}
          </Button>
          <Button color="secondary" onClick={closeChargeLedgerModal}>Cancel</Button>
        </ModalFooter>
      </Modal>

      {/* ── PURCHASE ENTRY PRINT LAYOUT ── */}
      <div 
        className="purchase-print-layout" 
        dangerouslySetInnerHTML={{ 
          __html: require('../../../helpers/PDFTemplate').generateInvoiceHTML("PURCHASE ENTRY", state, gridRows, otherChargesRows, taxOverrides) 
        }} 
      />
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

export default PurchaseEntry;
