import React, { useState, useEffect, useRef } from "react";
import { Col, Row, Card, CardBody, CardFooter, Button, Modal, ModalBody, ModalHeader, ModalFooter, Form, FormGroup, Label, Input, Container } from "reactstrap";
import { Fn_AddEditData, Fn_DisplayData, Fn_FillListData, Fn_GetReport, Fn_DeleteData } from "../../../store/Functions";
import { useDispatch } from "react-redux";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { useLocation, useNavigate } from "react-router-dom";
import GridSystemPurchaseReturn from "./GridSystemPurchaseReturn";
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
  F_PurchaseEntryH?: string | number;
  F_PurchaseEntryL?: string | number;
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
    F_PurchaseEntryH?: string;
    F_PurchaseReturnH?: string;
  };
  CreatedPurchaseEntries?: any[];
  PurchaseEntryLinesMap?: Record<string, any[]>;
  CreatedPurchaseReturnEntries?: any[];
  PurchaseReturnLinesMap?: Record<string, any[]>;
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
}

function PurchaseReturn() {
  const API_URL_SAVE = "PurchaseReturn/0/token";
  const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/PurchaseReturnH/Id";
  const API_URL_LINES = API_WEB_URLS.MASTER + "/0/token/PurchaseReturnL/Id";
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
    itemColorApplyMap: {},
    isEditMode: false,
    isGridEditable: true,
    GlobalOptions: [],
    GSTGroupMaster: [],
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
        const API_URL_PE_LIST = API_WEB_URLS.MASTER + "/0/token/PurchaseReturnData/Id/0";
        const peData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_PE_LIST);
        
        let peDataArray: any[] = [];
        if (Array.isArray(peData)) peDataArray = peData;
        else if (peData?.data?.dataList && Array.isArray(peData.data.dataList)) peDataArray = peData.data.dataList;
        else if (peData?.dataList && Array.isArray(peData.dataList)) peDataArray = peData.dataList;
        else if (peData?.data?.response && Array.isArray(peData.data.response)) peDataArray = peData.data.response;

        const API_URL_GSTGROUP = API_WEB_URLS.MASTER + "/0/token/GSTGroupMaster/Id/0";
        const gstData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_GSTGROUP);
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
          CreatedPurchaseReturnEntries: peDataArray,
          GSTGroupMaster: extractArray(gstData),
          GlobalOptions: extractArray(globalOptions),
          StateMaster: extractArray(stateMasterData),
          CityMaster: extractArray(cityMasterData),
        }));

        const params = new URLSearchParams(location.search);
        const recordId = params.get("id");
        if (recordId) {
          await loadPurchaseReturnRecord(parseInt(recordId));
        } else {
          try {
            const API_ENTRY_NO = API_WEB_URLS.MASTER + "/0/token/GetVoucherNoByVoucherTypeId/Id/7";
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
    const lines = prevState.PurchaseEntryLinesMap?.[poId] || [];
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
        F_PurchaseEntryH: poId,
        F_PurchaseEntryL: l.PurchaseEntryLId || l.Id || 0,
      }));
      setGridRows(mappedRows);
      
      let newVendorMasterId = prevState.formData.F_VendorMaster;
      const poHeader = prevState.CreatedPurchaseEntries?.find((p: any) => String(p.Id) === String(poId));
      if (poHeader && poHeader.F_LedgerMaster) {
         newVendorMasterId = String(poHeader.F_LedgerMaster);
      }
      setState((prev) => ({
        ...prev,
        formData: { ...prev.formData, F_VendorMaster: newVendorMasterId, F_PurchaseEntryH: poId }
      }));
    } else {
      alert("No approved lines found for the selected PO.");
    }
  };

  const fetchPEDataAndPopulateGrid = async (peId: string) => {
    if (!peId) return;
    const prevState = state;
    const pe = prevState.CreatedPurchaseReturnEntries?.find((p: any) => String(p.Id) === String(peId));
    if (!pe) return;

    let lines: any[] = [];
    try {
      if (pe.PurchaseReturnLDetails) {
        const parsed = typeof pe.PurchaseReturnLDetails === "string" ? JSON.parse(pe.PurchaseReturnLDetails) : pe.PurchaseReturnLDetails;
        lines = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error parsing PurchaseReturnLDetails", e);
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
        F_PurchaseReturnH: pe.Id,
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
          F_PurchaseEntryH: 0,
          F_PurchaseEntryL: 0,
        };
      });
      setGridRows(mappedRows);
    } else {
      setGridRows([{ ItemCode: "", F_ItemGroupMaster: "", F_ItemMaster: "", F_WarehouseMaster: state.DefaultWarehouse?.Id || "", F_BatchMaster: "", Variant: "", Qty: "", Rate: "", Photos: [], ItemData: null }]);
      alert("No lines found for the selected Purchase Return.");
    }
  };

  const loadPurchaseReturnRecord = async (id: number) => {
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
      console.error("Error loading Purchase Return record:", error);
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
    if (!state.formData.F_PurchaseReturnH) return;
    if (window.confirm("Are you sure you want to delete this Purchase Return?")) {
      const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/PurchaseReturnH`;
      Fn_DeleteData(dispatch, () => {}, Number(state.formData.F_PurchaseReturnH), DELETE_API_URL)
        .then(() => {
          alert("Purchase Return deleted successfully.");
          window.location.reload();
        })
        .catch((error: any) => {
          console.error("Failed to delete Purchase Return:", error);
          alert("Failed to delete Purchase Return. Please try again.");
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
    if (!barcode) return;

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
        
        const photos = [];
        if (matchedDesign.DesignPhoto) photos.push(matchedDesign.DesignPhoto);
        if (matchedDesign.DesignPhoto2) photos.push(matchedDesign.DesignPhoto2);
        if (matchedDesign.DesignPhoto3) photos.push(matchedDesign.DesignPhoto3);
        if (matchedDesign.DesignPhoto4) photos.push(matchedDesign.DesignPhoto4);
        if (matchedDesign.DesignPhoto5) photos.push(matchedDesign.DesignPhoto5);
        
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
          Rate: "",
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
          if (isInState) {
            itemCGST = amount * (parseFloat(gstGroup.CGSTPercent) / 100);
            itemSGST = amount * (parseFloat(gstGroup.SGSTPercent) / 100);
          } else {
            itemIGST = amount * (parseFloat(gstGroup.IGSTPercent) / 100);
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
      headerFormData.append("UserId", obj?.uid || "0");
      headerFormData.append("TotalCGST", finalCGST.toFixed(2));
      headerFormData.append("TotalSGST", finalSGST.toFixed(2));
      headerFormData.append("TotalIGST", finalIGST.toFixed(2));
      headerFormData.append("TotalTax", finalTotalTax.toFixed(2));
      headerFormData.append("JsonData", JSON.stringify(jsonDataArray));
      headerFormData.append("F_CompanyMaster", "0");
      await Fn_AddEditData(dispatch, setState, { arguList: { id: state.id, formData: headerFormData } }, API_URL_SAVE, true, "memberid", navigate, "#");
      alert("Purchase Return saved successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error saving Purchase Return:", error);
    }
  };

  const handlePrint = () => {
    const oldTitle = document.title;
    document.title = "";
    window.print();
    document.title = oldTitle;
  };

  const PurchaseReturnCompactStyles = `
    @media (max-width: 991.98px) {
      .purchase-return-page .container-fluid { padding: 0.4rem !important; }
      .purchase-return-page .card-body { padding: 0.4rem !important; }
      .purchase-return-page .card-footer { padding: 0.35rem 0.4rem !important; }
      .purchase-return-page .form-label { font-size: 0.75rem; margin-bottom: 0.2rem; }
      .purchase-return-page .form-control { font-size: 0.8rem; height: 26px; padding: 0.2rem 0.35rem; }
      .purchase-return-page .btn { font-size: 0.8rem; padding: 0.22rem 0.4rem; }
    }
    @media (max-width: 767.98px) {
      .purchase-return-page .container-fluid { padding: 0.25rem !important; }
      .purchase-return-page .card-body { padding: 0.3rem !important; }
      .purchase-return-page .card-footer { padding: 0.25rem 0.3rem !important; }
      .purchase-return-page .form-label { font-size: 0.7rem; margin-bottom: 0.15rem; }
      .purchase-return-page .form-control { font-size: 0.75rem; height: 24px; padding: 0.15rem 0.28rem; }
      .purchase-return-page .btn { font-size: 0.75rem; padding: 0.18rem 0.35rem; }
    }
    .purchase-return-print-layout { display: none; }
    @media print {
      @page { margin: 0; }
      body { margin: 0.2cm; line-height: 1.1; }
      body * { visibility: hidden; }
      .purchase-return-print-layout, .purchase-return-print-layout * { visibility: visible; }
      .purchase-return-print-layout { 
        display: block !important; 
        position: absolute; 
        left: 0; top: 0; 
        width: 100%; 
        padding: 5px; 
        background: white; 
        color: black; 
        font-family: Arial, sans-serif; 
      }
      .purchase-return-print-layout .print-header { text-align: center; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 2px; }
      .purchase-return-print-layout .firm-name { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 0; }
      .purchase-return-print-layout .print-title { font-size: 14px; font-weight: bold; margin-top: 0; }
      .purchase-return-print-layout .print-details { margin-bottom: 5px; }
      .purchase-return-print-layout .detail-row { display: flex; justify-content: space-between; margin-bottom: 1px; font-size: 11px; }
      .purchase-return-print-layout table { width: 100%; border-collapse: collapse; margin-top: 2px; }
      .purchase-return-print-layout th, .purchase-return-print-layout td { border: 1px solid #000; padding: 2px 4px; text-align: left; font-size: 11px; }
      .purchase-return-print-layout th { background: #eee !important; -webkit-print-color-adjust: exact; }
      .purchase-return-print-layout .text-right { text-align: right; }
      .purchase-return-print-layout .total-row { font-weight: bold; }
    }
  `;

  return (
    <div className="page-body purchase-return-page" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <style>{PurchaseReturnCompactStyles}</style>
      <Breadcrumbs mainTitle="Purchase Return" parent="Inventory" />
      <Container fluid className="px-2 px-sm-3">
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title={`${state.isEditMode ? "Edit" : "Add"} Purchase Return`} tagClass="card-title mb-0" />
              <CardBody className="p-2 p-sm-3">
                <Row className="g-2 g-sm-3">
                  <Col md="2">
                    <label className="form-label">Created Purchase Return</label>
                    <select className="form-control" value={state.formData.F_PurchaseReturnH || ""} onChange={(e) => { 
                      const val = e.target.value;
                      handleFormFieldChange("F_PurchaseReturnH", val); 
                      if (!val) window.location.reload();
                      else fetchPEDataAndPopulateGrid(val); 
                    }}>
                      <option value="">Select PE</option>
                      {state.CreatedPurchaseReturnEntries?.map((pe: any) => (
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
                    <GridSystemPurchaseReturn
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
                
                {/* Tax Summary Section */}
                <Row className="mt-4">
                  <Col md={{ size: 4, offset: 8 }}>
                    {(() => {
                      let totalCGST = 0;
                      let totalSGST = 0;
                      let totalIGST = 0;

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
                          if (isInState) {
                            totalCGST += amount * (parseFloat(gstGroup.CGSTPercent) / 100);
                            totalSGST += amount * (parseFloat(gstGroup.SGSTPercent) / 100);
                          } else {
                            totalIGST += amount * (parseFloat(gstGroup.IGSTPercent) / 100);
                          }
                        }
                      });

                      const finalCGST = taxOverrides.CGST !== undefined ? parseFloat(taxOverrides.CGST) || 0 : totalCGST;
                      const finalSGST = taxOverrides.SGST !== undefined ? parseFloat(taxOverrides.SGST) || 0 : totalSGST;
                      const finalIGST = taxOverrides.IGST !== undefined ? parseFloat(taxOverrides.IGST) || 0 : totalIGST;

                      const totalTax = finalCGST + finalSGST + finalIGST;
                      const subTotal = gridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.Rate) || 0)), 0);
                      const grandTotal = subTotal + totalTax;

                      return (
                        <div className="table-responsive">
                          <table className="table table-bordered table-sm mb-0 align-middle">
                            <tbody>
                              <tr>
                                <th className="text-end w-50">Sub Total:</th>
                                <td className="text-end fw-bold">{subTotal.toFixed(2)}</td>
                              </tr>
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
                <Btn color="success" type="button" className="m-0" onClick={handlePrint}>
                  <i className="bx bx-printer me-2"></i>Print
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

      <div className="purchase-return-print-layout">
        <div className="print-header">
          <div className="firm-name">{state.GlobalOptions[0]?.FirmName || "FIRM NAME"}</div>
          <div style={{ fontSize: "12px", marginTop: "4px", color: "#555", fontWeight: "normal" }}>
            {[
              state.GlobalOptions[0]?.FirmAddress,
              state.GlobalOptions[0]?.CityName || state.GlobalOptions[0]?.City || state.CityMaster?.find(c => String(c.Id) === String(state.GlobalOptions[0]?.F_CityMaster))?.Name,
              state.GlobalOptions[0]?.StateName || state.GlobalOptions[0]?.State || state.GlobalOptions[0]?.StateMasterName || state.StateMaster?.find(s => String(s.Id) === String(state.GlobalOptions[0]?.F_StateMaster))?.StateName
            ].filter(Boolean).join(", ")}
          </div>
          <div className="print-title">PURCHASE RETURN INVOICE</div>
        </div>
        <div className="print-details">
          <div className="detail-row">
            <div><strong>Purchase Return Invoice No.:</strong> {state.formData.PONo || "N/A"}</div>
            <div><strong>Date:</strong> {state.formData.PODate || "N/A"}</div>
          </div>
          <div className="detail-row">
            <div>
              <strong>Vendor:</strong>{" "}
              {(() => {
                const vendor = state.VendorMaster?.find((v: any) => String(v.Id) === String(state.formData.F_VendorMaster));
                return vendor ? (vendor.CompanyName || vendor.Name || vendor.LedgerName) : "N/A";
              })()}
            </div>
          </div>
          {state.formData.Remarks && <div className="detail-row"><div><strong>Remarks:</strong> {state.formData.Remarks}</div></div>}
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Barcode</th>
              <th>Category</th>
              <th>Item Name</th>
              <th>Varient</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {gridRows.map((row, index) => {
              const qty = parseFloat(row.Qty) || 0;
              const rate = parseFloat(row.Rate) || 0;
              
              const groupObj = state.ItemGroupMaster?.find((g: any) => String(g.Id) === String(row.F_ItemGroupMaster));
              const groupName = groupObj ? (groupObj.Name || groupObj.GroupName) : "N/A";
              
              const itemObj = row.ItemData?.find((i: any) => String(i.Id) === String(row.F_ItemMaster));
              const stateItemObj = state.ItemMaster?.find((i: any) => String(i.Id) === String(row.F_ItemMaster));
              const itemName = itemObj?.ItemName || itemObj?.Name || stateItemObj?.ItemName || stateItemObj?.Name || row.ItemCode || "N/A";
              
              const colorName = state.ColorMaster?.find((c: any) => String(c.Id) === String(row.F_ColorMaster))?.Name || "N/A";
              const warehouseName = state.WarehouseMaster?.find((w: any) => String(w.Id) === String(row.F_WarehouseMaster))?.Name || "N/A";
              
              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{row.ItemCode || "N/A"}</td>
                  <td>{groupName}</td>
                  <td>{itemName}</td>
                  <td>{row.Variant || "N/A"}</td>
                  <td className="text-right">{qty}</td>
                  <td className="text-right">{rate.toFixed(2)}</td>
                  <td className="text-right">{(qty * rate).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {(() => {
              let totalCGST = 0;
              let totalSGST = 0;
              let totalIGST = 0;
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
                  if (isInState) {
                    totalCGST += amount * (parseFloat(gstGroup.CGSTPercent) / 100);
                    totalSGST += amount * (parseFloat(gstGroup.SGSTPercent) / 100);
                  } else {
                    totalIGST += amount * (parseFloat(gstGroup.IGSTPercent) / 100);
                  }
                }
              });

              const finalCGST = Math.round(taxOverrides.CGST !== undefined ? parseFloat(taxOverrides.CGST) || 0 : totalCGST);
              const finalSGST = Math.round(taxOverrides.SGST !== undefined ? parseFloat(taxOverrides.SGST) || 0 : totalSGST);
              const finalIGST = Math.round(taxOverrides.IGST !== undefined ? parseFloat(taxOverrides.IGST) || 0 : totalIGST);

              const totalTax = finalCGST + finalSGST + finalIGST;
              const subTotal = gridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.Rate) || 0)), 0);
              const grandTotal = subTotal + totalTax;

              return (
                <>
                  <tr className="total-row">
                    <td colSpan={5} className="text-right">Total Qty:</td>
                    <td className="text-right">{gridRows.reduce((sum, row) => sum + (parseFloat(row.Qty) || 0), 0)}</td>
                    <td className="text-right">Sub Total:</td>
                    <td className="text-right">{subTotal.toFixed(2)}</td>
                  </tr>
                  {isInState ? (
                    <>
                      <tr className="total-row">
                        <td colSpan={6}></td>
                        <td className="text-right">Total CGST:</td>
                        <td className="text-right">{finalCGST.toFixed(2)}</td>
                      </tr>
                      <tr className="total-row">
                        <td colSpan={6}></td>
                        <td className="text-right">Total SGST:</td>
                        <td className="text-right">{finalSGST.toFixed(2)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr className="total-row">
                      <td colSpan={6}></td>
                      <td className="text-right">Total IGST:</td>
                      <td className="text-right">{finalIGST.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <td colSpan={6}></td>
                    <td className="text-right">Total Tax:</td>
                    <td className="text-right">{totalTax.toFixed(2)}</td>
                  </tr>
                  <tr className="total-row" style={{fontSize: '1.2em', fontWeight: 'bold'}}>
                    <td colSpan={6}></td>
                    <td className="text-right">Grand Total:</td>
                    <td className="text-right">{grandTotal.toFixed(2)}</td>
                  </tr>
                </>
              );
            })()}
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default PurchaseReturn;

