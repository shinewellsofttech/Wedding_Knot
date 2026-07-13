import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardFooter,
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
import GridSystemSO from "./GridSystemSO";
import { Fn_AddEditData, Fn_DisplayData, Fn_FillListData, Fn_DeleteData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { getCurrentUserId } from "../../../utils/formUtils";

const getCurrentDateYYYYMMDD = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface GridRow {
  ItemCode: string;
  F_ItemGroup: string;
  F_ItemMaster: string;
  F_ColorMaster?: string;
  Rate?: string;
  Qty: string;
  ItemData: any[] | null;
}

interface FormData {
  SoNo: string;
  SODate: string;
  F_LedgerMaster: string;
  Remarks: string;
  F_SalesMaster: string;
}

const SalesOrder = () => {
  const API_URL_SAVE = "SalesOrder/0/token";
  const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/SalesMasterH/Id`;
  const API_LEDGER_LIST = `${API_WEB_URLS.MASTER}/0/token/GetLedgerNamesForPoSoApproval/Id/0`;
  const API_ITEM_GROUP_LIST = `${API_WEB_URLS.MASTER}/0/token/ItemGroup/Id/0`;
  const API_ITEM_BY_GROUP = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.ItemMaster}/Id`;
  const API_CREATED_SO = `${API_WEB_URLS.MASTER}/0/token/salesorderdata/Id/0`;
  const API_SO_H = `${API_WEB_URLS.MASTER}/0/token/SalesMasterH`;
  const API_SO_L = `${API_WEB_URLS.MASTER}/0/token/SalesMasterLById`;
  const API_ITEM_SAVE = `${API_WEB_URLS.ItemMaster}/0/token`;
  const API_LEDGER_SAVE = `${API_WEB_URLS.LedgerMaster}/0/token`;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<FormData>({
    SoNo: "",
    SODate: getCurrentDateYYYYMMDD(),
    F_LedgerMaster: "",
    Remarks: "",
    F_SalesMaster: "",
  });

  const [gridRows, setGridRows] = useState<GridRow[]>([
    {
      ItemCode: "",
      F_ItemGroup: "",
      F_ItemMaster: "",
      Qty: "",
      ItemData: null,
    },
  ]);

  const [ledgerMaster, setLedgerMaster] = useState<any[]>([]);
  const [itemGroupMaster, setItemGroupMaster] = useState<any[]>([]);
  const [colorMaster, setColorMaster] = useState<any[]>([]);
  const [createdSalesOrders, setCreatedSalesOrders] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [firmName, setFirmName] = useState("FIRM NAME");
  const [showSharePDFModal, setShowSharePDFModal] = useState(false);
  const [pendingShareFile, setPendingShareFile] = useState<File | null>(null);

  const [quickItemModalOpen, setQuickItemModalOpen] = useState(false);
  const [quickItemTargetRow, setQuickItemTargetRow] = useState<number | null>(null);
  const [quickItemSubmitting, setQuickItemSubmitting] = useState(false);
  const [quickItemForm, setQuickItemForm] = useState({
    ItemName: "",
    ItemCode: "",
    F_ItemGroup: "",
  });

  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerSubmitting, setLedgerSubmitting] = useState(false);
  const [ledgerForm, setLedgerForm] = useState({
    CompanyName: "",
    Phone: "",
    Address: "",
    Email: "",
  });

  // Set initial focus to Select SO field
  const parseSalesOrderData = (data: any) => {
    let rawList: any[] = [];
    if (data && data.data && data.data.dataList) {
      rawList = data.data.dataList;
    } else if (Array.isArray(data)) {
      rawList = data;
    } else if (data && data.dataList) {
      rawList = data.dataList;
    }

    return rawList.map((item: any) => {
      try {
        const header = JSON.parse(item.Header)[0];
        const lines = JSON.parse(item.Lines);
        return {
          ...header,
          Lines: lines,
          Name: header.SONo || `SO/${header.Id}`
        };
      } catch (e) {
        console.error("Error parsing SO data", e);
        return item;
      }
    });
  };

  useEffect(() => {
    setTimeout(() => {
      const selectSOField = document.getElementById("so-select-input") as HTMLSelectElement;
      if (selectSOField) {
        selectSOField.focus();
      }
    }, 300);
  }, []);

  const fetchVoucherNo = async () => {
    try {
      const res = await Fn_FillListData(dispatch, () => ({}), "voucherNo", `${API_WEB_URLS.MASTER}/0/token/GetVoucherNoByVoucherTypeId/Id/18`);
      if (res) {
        if (Array.isArray(res) && res.length > 0) {
          return res[0].VoucherNo || "";
        } else if (res.VoucherNo) {
          return res.VoucherNo;
        }
      }
    } catch (error) {
      console.error("Error fetching voucher no:", error);
    }
    return "";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Fn_FillListData(dispatch, (prevState: any) => ({ ...prevState, ledgerMaster: [] }), "ledgerMaster", API_LEDGER_LIST).then((data) => setLedgerMaster(data || []));
        await Fn_FillListData(dispatch, (prevState: any) => ({ ...prevState, itemGroupMaster: [] }), "itemGroupMaster", API_ITEM_GROUP_LIST).then((data) => setItemGroupMaster(data || []));
        await Fn_FillListData(dispatch, (prevState: any) => ({ ...prevState, colorMaster: [] }), "colorMaster", `${API_WEB_URLS.MASTER}/0/token/ColorMaster/Id/0`).then((data) => setColorMaster(data || []));
        
        // Fetch FirmName from GlobalOptions
        const globalOptions = await Fn_FillListData(dispatch, () => ({}), "GlobalOptions", `${API_WEB_URLS.MASTER}/0/token/GlobalOptions/Id/0`);
        if (Array.isArray(globalOptions) && globalOptions.length > 0) {
          setFirmName(globalOptions[0]?.FirmName || "FIRM NAME");
        }

        await Fn_FillListData(dispatch, (prevState: any) => ({ ...prevState, createdSalesOrders: [] }), "createdSalesOrders", API_CREATED_SO).then((data) => {
          const parsed = parseSalesOrderData(data);
          setCreatedSalesOrders(parsed);
        });

        const locationState = location.state as { Id?: number } | undefined;
        const recordId = locationState?.Id ?? 0;
        if (recordId > 0) {
          await loadSalesOrderRecord(recordId);
        } else {
          const vNo = await fetchVoucherNo();
          setFormData(prev => ({ ...prev, SoNo: vNo }));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    // Global keyboard shortcuts: Ctrl+S (Save), Ctrl+E (Edit), Ctrl+R (Reset)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isSaveCombo = (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S');
      const isEditCombo = (e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E');
      const isResetCombo = (e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R');

      if (isSaveCombo) {
        e.preventDefault();
        handleSubmit();
      } else if (isEditCombo && isEditMode) {
        e.preventDefault();
        setIsEditMode(false);
      } else if (isResetCombo) {
        e.preventDefault();
        resetSalesOrderToBlank();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [dispatch, location.state, isEditMode]);

  // Keyboard navigation for form fields
  const handleFormKeyDown = (event: React.KeyboardEvent, fieldName: string) => {
    if (event.key === "Enter") {
      event.preventDefault();

      switch (fieldName) {
        case "SelectSO":
          // Focus SO No
          const soNoInput = document.getElementById("so-no-input") as HTMLInputElement;
          if (soNoInput) {
            soNoInput.focus();
          }
          break;
        case "SoNo":
          // Focus SO Date
          const soDateInput = document.getElementById("so-date-input") as HTMLInputElement;
          if (soDateInput) {
            soDateInput.focus();
          }
          break;
        case "SODate":
          // Focus Party dropdown
          const partySelect = document.getElementById("party-select") as HTMLSelectElement;
          if (partySelect) {
            partySelect.focus();
          }
          break;
        case "Party":
          // Focus Remarks
          const remarksInput = document.getElementById("remarks-input") as HTMLInputElement;
          if (remarksInput) {
            remarksInput.focus();
          }
          break;
        case "Remarks":
          // Move to first grid row - Item Code
          const firstItemCodeInput = document.querySelector(
            'input[data-row="0"][data-field="ItemCode"]'
          ) as HTMLInputElement;
          if (firstItemCodeInput) {
            firstItemCodeInput.focus();
          }
          break;
        default:
          break;
      }
    }
  };

  // Keyboard navigation for modals
  const handleModalKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const form = event.currentTarget.closest("form");
      if (!form) return;

      const fields = Array.from(
        form.querySelectorAll(
          'input[type="text"], input[type="number"], select:not([tabindex="-1"])'
        )
      ) as HTMLElement[];

      const currentIndex = fields.indexOf(event.target as HTMLElement);
      if (currentIndex < fields.length - 1) {
        const nextField = fields[currentIndex + 1];
        if (nextField && !(nextField as HTMLInputElement).disabled) {
          (nextField as HTMLInputElement).focus();
        }
      } else {
        // Focus submit button
        const submitButton = form.querySelector(
          'button[type="submit"]'
        ) as HTMLButtonElement;
        if (submitButton) submitButton.focus();
      }
    }
  };

  const loadSalesOrderRecord = async (recordId: number) => {
    if (!recordId) return;

    setIsEditMode(true);

    const hData = await Fn_FillListData(dispatch, () => ({}), "hData", `${API_SO_H}/Id/${recordId}`);
    const lData = await Fn_FillListData(dispatch, () => ({}), "lData", `${API_SO_L}/Id/${recordId}`);

    const header = Array.isArray(hData) && hData.length > 0 ? hData[0] : null;
    const lines = Array.isArray(lData) ? lData : [];

    if (header) {
      setFormData({
        SoNo: header.SoNo || "",
        SODate: header.SODate ? header.SODate.split("T")[0] : "",
        F_LedgerMaster: header.F_LedgerMaster || "",
        Remarks: header.Remarks || "",
        F_SalesMaster: String(recordId),
      });
    }

    const mappedRows: GridRow[] =
      lines.length > 0
        ? await Promise.all(lines.map(async (l: any) => {
            let items = null;
            if (l.F_ItemGroup) {
              items = await Fn_FillListData(dispatch, () => ({}), "itemData", `${API_ITEM_BY_GROUP}/${l.F_ItemGroup}`);
            }
            return {
              ItemCode: l.ItemCode || "",
              F_ItemGroup: l.F_ItemGroup || "",
              F_ItemMaster: l.F_ItemMaster || "",
              Qty: String(l.Qty || ""),
              ItemData: items,
            };
          }))
        : [
            {
              ItemCode: "",
              F_ItemGroup: "",
              F_ItemMaster: "",
              Qty: "",
              ItemData: null,
            },
          ];

    setGridRows(mappedRows);

    if (lines.length > 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.F_ItemGroup) {
          try {
            const itemRes = await Fn_FillListData(dispatch, () => ({}), "CallingData", `${API_ITEM_BY_GROUP}/${line.F_ItemGroup}`);
            setGridRows((prevRows) =>
              prevRows.map((row, idx) => (idx === i ? { ...row, ItemData: itemRes } : row))
            );
          } catch (error) {
            console.error(`Error fetching ItemData for existing row ${i}:`, error);
          }
        }
      }
    }
  };

  const addRow = () => {
    setGridRows((prevRows) => [
      ...prevRows,
      {
        ItemCode: "",
        F_ItemGroup: "",
        F_ItemMaster: "",
        Qty: "",
        ItemData: null,
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (gridRows.length > 1) {
      setGridRows((prevRows) => prevRows.filter((_, i) => i !== index));
    }
  };

  const updateGridRow = async (index: number, field: string, value: any) => {
    if (field === "ItemCode") {
      setGridRows((prevRows) =>
        prevRows.map((row, i) => (i === index ? { ...row, ItemCode: value } : row))
      );
      return;
    } else if (field === "F_ItemGroup") {
      if (!value) {
        setGridRows((prevRows) =>
          prevRows.map((row, i) =>
            i === index ? { ...row, [field]: value, ItemData: null, F_ItemMaster: "" } : row
          )
        );
        return;
      }

      try {
        const res = await Fn_FillListData(dispatch, () => ({}), "CallingData", `${API_ITEM_BY_GROUP}/${value}`);

        setGridRows((prevRows) =>
          prevRows.map((row, i) =>
            i === index ? { ...row, [field]: value, ItemData: res, F_ItemMaster: "" } : row
          )
        );
      } catch (error) {
        alert(`Error loading items for the selected item group. Please try again.`);

        setGridRows((prevRows) =>
          prevRows.map((row, i) =>
            i === index ? { ...row, [field]: "", ItemData: null, F_ItemMaster: "" } : row
          )
        );
      }
    } else {
      setGridRows((prevRows) =>
        prevRows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
      );
    }
  };

  const openQuickItemModal = (rowIndex: number) => {
    if (isEditMode) return;
    setQuickItemTargetRow(rowIndex);
    const row = gridRows[rowIndex];
    setQuickItemForm({
      ItemName: "",
      ItemCode: row?.ItemCode || "",
      F_ItemGroup: row?.F_ItemGroup || "",
    });
    setQuickItemModalOpen(true);
  };

  const closeQuickItemModal = () => {
    if (quickItemSubmitting) return;
    setQuickItemModalOpen(false);
    setQuickItemTargetRow(null);
    setQuickItemForm({
      ItemName: "",
      ItemCode: "",
      F_ItemGroup: "",
    });
  };

  const handleQuickItemSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (quickItemSubmitting) return;
    if (!Number.isInteger(quickItemTargetRow)) {
      alert("Something went wrong while identifying the target row.");
      return;
    }

    const trimmedName = (quickItemForm.ItemName || "").trim();
    const trimmedCode = (quickItemForm.ItemCode || "").trim();

    if (!trimmedName) {
      alert("Please enter Item Name");
      return;
    }
    if (!trimmedCode) {
      alert("Please enter Item Code");
      return;
    }
    if (!quickItemForm.F_ItemGroup) {
      alert("Please select Item Group");
      return;
    }

    setQuickItemSubmitting(true);
    try {
      const userId = getCurrentUserId();
      const formDataItem = new FormData();
      formDataItem.append("ItemName", trimmedName);
      formDataItem.append("ItemCode", trimmedCode);
      formDataItem.append("F_ItemGroup", quickItemForm.F_ItemGroup);
      formDataItem.append("UserId", String(Number(userId) || 0));
      formDataItem.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      const quickAddResult = await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: 0, formData: formDataItem } },
        API_ITEM_SAVE,
        true,
        "memberid",
        navigate,
        "#"
      );

      const groupItems = await Fn_FillListData(
        dispatch,
        () => ({}),
        "_QuickItemGroup",
        `${API_ITEM_BY_GROUP}/${quickItemForm.F_ItemGroup}`
      );

      const resolvedItemId = quickAddResult?.id || 0;

      setGridRows((prevRows) =>
        prevRows.map((row, idx) => {
          if (idx !== quickItemTargetRow) return row;
          return {
            ...row,
            ItemCode: trimmedCode,
            F_ItemGroup: quickItemForm.F_ItemGroup,
            F_ItemMaster: resolvedItemId || row.F_ItemMaster,
            ItemData: groupItems || row.ItemData,
          };
        })
      );

      closeQuickItemModal();
    } catch (error) {
      console.error("Error creating quick item:", error);
      alert("Failed to create item. Please try again.");
    } finally {
      setQuickItemSubmitting(false);
    }
  };

  const openLedgerModal = () => {
    if (isEditMode) return;
    setLedgerForm({ CompanyName: "", Phone: "", Address: "", Email: "" });
    setLedgerModalOpen(true);
  };

  const closeLedgerModal = () => {
    if (ledgerSubmitting) return;
    setLedgerModalOpen(false);
    setLedgerForm({ CompanyName: "", Phone: "", Address: "", Email: "" });
  };

  const handleLedgerSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (ledgerSubmitting) return;

    const companyName = (ledgerForm.CompanyName || "").trim();
    const phone = (ledgerForm.Phone || "").trim();
    const address = (ledgerForm.Address || "").trim();

    if (!companyName) {
      alert("Please enter Company Name / Party Name");
      return;
    }
    if (!phone) {
      alert("Please enter Phone");
      return;
    }
    if (!address) {
      alert("Please enter Address");
      return;
    }

    setLedgerSubmitting(true);
    try {
      const userId = getCurrentUserId();
      const obj = JSON.parse(localStorage.getItem("user") || "{}");
      const formDataLedger = new FormData();
      formDataLedger.append("Id", "0");
      formDataLedger.append("Name", companyName);
      formDataLedger.append("Alias", "0");
      formDataLedger.append("F_LedgerGroupMaster", "40");
      formDataLedger.append("Address", address);
      formDataLedger.append("Address1", "0");
      formDataLedger.append("F_CountryMaster", "0");
      formDataLedger.append("F_StateMaster", "0");
      formDataLedger.append("F_CityMaster", "0");
      formDataLedger.append("PinCode", "0");
      formDataLedger.append("PhoneNo", "0");
      formDataLedger.append("MobileNo", phone);
      formDataLedger.append("Email", ledgerForm.Email || "0");
      formDataLedger.append("GSTIN", "0");
      formDataLedger.append("PANNo", "0");
      formDataLedger.append("CreditDays", "0");
      formDataLedger.append("CreditLimit", "0");
      formDataLedger.append("Rate", "0");
      formDataLedger.append("F_Type", "0");
      formDataLedger.append("F_CalculationType", "0");
      formDataLedger.append("F_AddLess", "0");
      formDataLedger.append("YesNoActs", "false");
      formDataLedger.append("F_GSTGroupMaster", "0");
      formDataLedger.append("F_TaxPayerType", "0");
      formDataLedger.append("F_LedgerMasterSales", "0");
      formDataLedger.append("F_LedgerMasterPurchase", "0");
      formDataLedger.append("F_YearScheme", "0");
      formDataLedger.append("F_IntCalcMethod", "0");
      formDataLedger.append("BankName", "0");
      formDataLedger.append("BankAccountNo", "0");
      formDataLedger.append("BankIFSCCode", "0");
      formDataLedger.append("ISDalal", "false");
      formDataLedger.append("F_LedgerMasterDalal", "0");
      formDataLedger.append("IsTransport", "false");
      formDataLedger.append("F_TCSonSales", "0");
      formDataLedger.append("UserId", String(userId || obj?.uid || "0"));
      formDataLedger.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      const res = await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: 0, formData: formDataLedger } },
        API_LEDGER_SAVE,
        true,
        "memberid",
        navigate,
        "#"
      );

      const refreshed = await Fn_FillListData(dispatch, () => ({}), "ledgerMaster", API_LEDGER_LIST);
      const parsedRefreshed = Array.isArray(refreshed) ? refreshed : (refreshed?.data?.dataList || refreshed?.dataList || []);
      setLedgerMaster(parsedRefreshed);

      let resolvedLedgerId = res?.id || 0;
      if (!resolvedLedgerId && companyName) {
        const matched = parsedRefreshed.find((v: any) => (v.CompanyName || v.Name || v.LedgerName)?.toLowerCase() === companyName.toLowerCase());
        if (matched) resolvedLedgerId = matched.Id;
      }

      if (resolvedLedgerId) {
        setFormData((prev) => ({
          ...prev,
          F_LedgerMaster: String(resolvedLedgerId),
        }));
      }

      closeLedgerModal();
    } catch (error) {
      console.error("Error saving Ledger:", error);
      alert("Failed to save Party. Please try again.");
    } finally {
      setLedgerSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.SoNo || String(formData.SoNo).trim() === "") {
      alert("Please enter Sales No");
      return;
    }
    if (!formData.F_LedgerMaster || String(formData.F_LedgerMaster).trim() === "") {
      alert("Please select Party");
      return;
    }

    for (let i = 0; i < gridRows.length; i++) {
      const row = gridRows[i];
      const hasItemGroup = !!row.F_ItemGroup;
      const hasItem = !!row.F_ItemMaster;
      const qtyVal = parseFloat(row.Qty);
      const hasQty = !isNaN(qtyVal) && qtyVal > 0;

      if (!hasItemGroup || !hasItem || !hasQty) {
        const missing = [];
        if (!hasItemGroup) missing.push("Item Group");
        if (!hasItem) missing.push("Item");
        if (!hasQty) missing.push("Quantity");
        alert(`Row ${i + 1}: Please fill ${missing.join(", ")}`);
        return;
      }
    }

    const userId = getCurrentUserId();
    const formDataSubmit = new FormData();
    formDataSubmit.append("SoNo", formData.SoNo);
    formDataSubmit.append("SODate", formData.SODate);
    formDataSubmit.append("F_LedgerMaster", formData.F_LedgerMaster);
    formDataSubmit.append("F_StatusMaster", "0");
    formDataSubmit.append("Remarks", formData.Remarks || "");
    formDataSubmit.append("UserId", String(Number(userId) || 0));
    formDataSubmit.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

    const jsonDataArray = gridRows.map((r) => ({
      F_ItemGroupMaster: r.F_ItemGroup || "0",
      F_ItemMaster: r.F_ItemMaster || "0",
      Code: r.ItemCode || "",
      F_ColorMaster: "0",
      OrderedQty: r.Qty || "0",
      ApprovedQty: "0",
      Rate: "0",
      BarCodeId: ""
    }));

    formDataSubmit.append("JsonData", JSON.stringify(jsonDataArray));

    const result = await Fn_AddEditData(
      dispatch,
      () => undefined,
      { arguList: { id: formData.F_SalesMaster ? Number(formData.F_SalesMaster) : 0, formData: formDataSubmit } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "#"
    );

    if (result && result.success) {
      if (window.confirm("Sales Order saved successfully. Do you want to print it?")) {
        handlePrint();
      }
      const updated = await Fn_FillListData(dispatch, () => ({}), "createdSalesOrders", API_CREATED_SO);
      const parsed = parseSalesOrderData(updated);
      setCreatedSalesOrders(parsed);
      resetSalesOrderToBlank();
    }
  };

  const handleDelete = async () => {
    if (!formData.F_SalesMaster) {
      alert("Please select a sales order to delete.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this Sales Order?");
    if (!confirmed) return;

    try {
      const result = await Fn_DeleteData(dispatch, Number(formData.F_SalesMaster), API_SO_H, `${API_SO_H}/Id/0`);

      if (result?.success) {
        resetSalesOrderToBlank();
        const updated = await Fn_FillListData(dispatch, () => ({}), "createdSalesOrders", API_CREATED_SO);
        const parsed = parseSalesOrderData(updated);
        setCreatedSalesOrders(parsed);
      } else {
        alert("Failed to delete the Sales Order.");
      }
    } catch (error) {
      console.error("Error deleting SO:", error);
      alert("An error occurred while deleting the SO.");
    }
  };

  const resetSalesOrderToBlank = async () => {
    const today = getCurrentDateYYYYMMDD();
    const vNo = await fetchVoucherNo();
    setFormData({
      SoNo: vNo,
      SODate: today,
      F_LedgerMaster: "",
      Remarks: "",
      F_SalesMaster: "",
    });
    setIsEditMode(false);
    setGridRows([
      {
        ItemCode: "",
        F_ItemGroup: "",
        F_ItemMaster: "",
        Qty: "",
        ItemData: null,
      },
    ]);
  };

  const handleCreatedSOChange = async (soId: string) => {
    if (!soId) {
      resetSalesOrderToBlank();
      return;
    }

    const selectedSO = createdSalesOrders.find((so) => String(so.Id) === String(soId));
    if (selectedSO) {
      setIsEditMode(true);
      setFormData({
        SoNo: selectedSO.SONo || "",
        SODate: selectedSO.SODate ? selectedSO.SODate.split("T")[0] : "",
        F_LedgerMaster: selectedSO.F_LedgerMaster || "",
        Remarks: selectedSO.Remarks || "",
        F_SalesMaster: String(soId),
      });

      const mappedRows: GridRow[] = selectedSO.Lines && selectedSO.Lines.length > 0
        ? await Promise.all(selectedSO.Lines.map(async (l: any) => {
            let items = null;
            if (l.F_ItemGroupMaster) {
              items = await Fn_FillListData(dispatch, () => ({}), "itemData", `${API_ITEM_BY_GROUP}/${l.F_ItemGroupMaster}`);
            }
            return {
              ItemCode: l.Code || "",
              F_ItemGroup: l.F_ItemGroupMaster || "",
              F_ItemMaster: l.F_ItemMaster || "",
              F_ColorMaster: String(l.F_ColorMaster || ""),
              Qty: String(l.OrderedQty || ""),
              Rate: String(l.Rate || ""),
              ItemData: items,
            };
          }))
        : [
            {
              ItemCode: "",
              F_ItemGroup: "",
              F_ItemMaster: "",
              F_ColorMaster: "",
              Qty: "",
              Rate: "",
              ItemData: null,
            },
          ];

      setGridRows(mappedRows);
    } else {
      await loadSalesOrderRecord(Number(soId));
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
    const htmlString = generateInvoiceHTML("SALES ORDER", { formData, VendorMaster: ledgerMaster, GlobalOptions: [{FirmName: firmName}], ItemMaster: [], GSTGroupMaster: [] }, gridRows, [], {});

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    await new Promise(r => setTimeout(r, 1000));

    const safeInvoiceNo = (formData.SoNo || "Draft").replace(/[\\/:*?"<>|]/g, "_");

    const html2pdfModule = require("html2pdf.js");
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin:       5,
      filename:     `SalesOrder_${safeInvoiceNo}.pdf`,
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
        title: 'Sales Order',
        text: 'Please find attached the Sales Order',
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
    const safeInvoiceNo = (formData.SoNo || "Draft").replace(/[\\/:*?"<>|]/g, "_");
    try {
      const pdfBlob = await handleDownloadPdf();
      const filename = `SalesOrder_${safeInvoiceNo}.pdf`;
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

  const salesOrderCompactStyles = `
    .sales-order-page .card-body { padding: 0.5rem !important; }
    .sales-order-page .card-footer { padding: 0.5rem !important; }
    .sales-order-page .form-label { font-size: 0.8rem; margin-bottom: 0.2rem; font-weight: 500; }
    .sales-order-page .form-control, .sales-order-page input, .sales-order-page select, .sales-order-page textarea {
      font-size: 0.8rem; height: calc(1.5em + 0.5rem); padding: 0.2rem 0.4rem; min-height: 28px;
    }
    .sales-order-page textarea.form-control { min-height: 50px; }
    .sales-order-page .btn { font-size: 0.8rem; padding: 0.25rem 0.5rem; }
    .sales-order-page .card-title { font-size: 0.9rem; }
    .sales-order-page .row.g-2, .sales-order-page .row.g-3 { --bs-gutter-y: 0.3rem; --bs-gutter-x: 0.3rem; }

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
    <div className="page-body sales-order-page">
      <style>{salesOrderCompactStyles}</style>
      <Breadcrumbs mainTitle="Sales Order" parent="Transactions" />
      <Container fluid className="px-2 px-sm-3">
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Sales Order" tagClass="card-title mb-0" />
              <CardBody className="p-2 p-sm-3">
                <Row className="mb-3 g-2 g-sm-3">
                  <Col xs="12" md="2">
                    <label htmlFor="so-select-input" className="form-label">Select Sales Order</label>
                    <select
                      id="so-select-input"
                      className="form-control"
                      value={formData.F_SalesMaster}
                      onChange={(e) => {
                        const id = e.target.value;
                        setFormData((prev) => ({ ...prev, F_SalesMaster: id }));
                        handleCreatedSOChange(id);
                      }}
                      onKeyDown={(e) => handleFormKeyDown(e, "SelectSO")}
                    >
                      <option value="">Select SO</option>
                      {createdSalesOrders.map((so) => (
                        <option key={so.Id} value={String(so.Id)}>
                          {so.SoNo || so.Name || so.Id}
                        </option>
                      ))}
                    </select>
                  </Col>
                  <Col xs="12" md="2">
                    <label htmlFor="so-no-input" className="form-label">SO No <span className="text-danger">*</span></label>
                    <Input
                      id="so-no-input"
                      type="text"
                      value={formData.SoNo}
                      placeholder="Auto-generated or enter"
                      onChange={(e) => setFormData((prev) => ({ ...prev, SoNo: e.target.value }))}
                      onKeyDown={(e) => handleFormKeyDown(e, "SoNo")}
                    />
                  </Col>
                  <Col xs="12" md="2">
                    <label htmlFor="so-date-input" className="form-label">SO Date <span className="text-danger">*</span></label>
                    <DateInput
                      id="so-date-input"
                      value={formData.SODate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, SODate: e.target.value }))}
                      onKeyDown={(e: any) => handleFormKeyDown(e, "SODate")}
                    />
                  </Col>
                  <Col xs="12" md="3">
                    <label htmlFor="party-select" className="form-label">Party <span className="text-danger">*</span></label>
                    <div className="d-flex gap-2">
                      <select
                        id="party-select"
                        className="form-control"
                        value={formData.F_LedgerMaster}
                        onChange={(e) => setFormData((prev) => ({ ...prev, F_LedgerMaster: e.target.value }))}
                        onKeyDown={(e) => handleFormKeyDown(e, "Party")}
                        disabled={isEditMode}
                        style={{ flex: 1 }}
                      >
                        <option value="">Select Party</option>
                        {ledgerMaster.map((ledger) => (
                          <option key={ledger.Id} value={ledger.Id}>
                            {ledger.Name || ledger.LedgerName}
                          </option>
                        ))}
                      </select>
                      <Btn
                        type="button"
                        color="success"
                        onClick={openLedgerModal}
                        disabled={isEditMode}
                        className="m-0"
                      >
                        <i className="fa fa-plus"></i>
                      </Btn>
                    </div>
                  </Col>
                  <Col xs="12" md="3">
                    <label htmlFor="remarks-input" className="form-label">Remarks</label>
                    <Input
                      id="remarks-input"
                      type="text"
                      value={formData.Remarks}
                      placeholder="Enter remarks"
                      onChange={(e) => setFormData((prev) => ({ ...prev, Remarks: e.target.value }))}
                      onKeyDown={(e) => handleFormKeyDown(e, "Remarks")}
                    />
                  </Col>
                </Row>

                {/* Grid System */}
                <GridSystemSO
                  gridRows={gridRows}
                  itemGroupMaster={itemGroupMaster}
                  colorMaster={colorMaster}
                  onAddRow={addRow}
                  onRemoveRow={removeRow}
                  onUpdateRow={updateGridRow}
                  onQuickAddItem={openQuickItemModal}
                  disabled={isEditMode}
                />

                {/* Total Quantity */}
                <Row className="mb-3">
                  <Col xs="12" className="text-end">
                    <strong>
                      Total Quantity: {gridRows.reduce((total, row) => total + (parseInt(row.Qty) || 0), 0)}
                    </strong>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <div className="d-flex justify-content-end gap-2">
                  {isEditMode && (
                    <Btn
                      type="button"
                      color="warning"
                      onClick={() => {
                        setIsEditMode(false);
                      }}
                    >
                      <i className="fa fa-edit me-1"></i> Edit
                    </Btn>
                  )}
                  {isEditMode && (
                    <Btn type="button" color="danger" onClick={handleDelete}>
                      <i className="fa fa-trash me-1"></i> Delete
                    </Btn>
                  )}
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    data-action="save"
                    onKeyDown={(e: any) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  >
                    <i className="fa fa-save me-1"></i> Save
                  </button>
                  {isEditMode && (
                    <>
                      <Btn type="button" color="success" onClick={handlePrint}>
                        <i className="fa fa-print me-1"></i> Print
                      </Btn>
                      <Btn type="button" color="danger" onClick={handlePDFExport}>
                        <i className="bx bxs-file-pdf me-1"></i> PDF
                      </Btn>
                    </>
                  )}
                  <Btn type="button" color="secondary" onClick={resetSalesOrderToBlank}>
                    <i className="fa fa-redo me-1"></i> Reset
                  </Btn>
                  <Btn type="button" color="light" onClick={() => navigate(-1)}>
                    <i className="fa fa-times me-1"></i> Cancel
                  </Btn>
                </div>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Quick Add Item Modal */}
      <Modal isOpen={quickItemModalOpen} toggle={closeQuickItemModal} backdrop="static" centered>
        <Form onSubmit={handleQuickItemSubmit}>
          <ModalHeader toggle={closeQuickItemModal}>Quick Add Item</ModalHeader>
          <ModalBody>
            <Row className="g-3">
              <Col md="12">
                <FormGroup>
                  <Label>Item Name <span className="text-danger">*</span></Label>
                  <Input
                    type="text"
                    value={quickItemForm.ItemName}
                    onChange={(e) =>
                      setQuickItemForm((prev) => ({ ...prev, ItemName: e.target.value }))
                    }
                    onKeyDown={handleModalKeyDown}
                    placeholder="Enter item name"
                    autoFocus
                  />
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup>
                  <Label>Item Code <span className="text-danger">*</span></Label>
                  <Input
                    type="text"
                    value={quickItemForm.ItemCode}
                    onChange={(e) =>
                      setQuickItemForm((prev) => ({ ...prev, ItemCode: e.target.value }))
                    }
                    onKeyDown={handleModalKeyDown}
                    placeholder="Enter item code"
                  />
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup>
                  <Label>Item Group <span className="text-danger">*</span></Label>
                  <Input
                    type="select"
                    value={quickItemForm.F_ItemGroup}
                    onChange={(e) =>
                      setQuickItemForm((prev) => ({ ...prev, F_ItemGroup: e.target.value }))
                    }
                    onKeyDown={handleModalKeyDown}
                  >
                    <option value="">Select Item Group</option>
                    {itemGroupMaster.map((group) => (
                      <option key={group.Id} value={group.Id}>
                        {group.Name || group.GroupName}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter>
            <Btn type="submit" color="primary" disabled={quickItemSubmitting}>
              {quickItemSubmitting ? "Saving..." : "Save Item"}
            </Btn>
            <Btn type="button" color="secondary" onClick={closeQuickItemModal} disabled={quickItemSubmitting}>
              Cancel
            </Btn>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Add Party Modal */}
      <Modal isOpen={ledgerModalOpen} toggle={closeLedgerModal} backdrop="static" centered>
        <Form onSubmit={handleLedgerSubmit}>
          <ModalHeader toggle={closeLedgerModal}>Quick Add Party / Vendor</ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label>Company Name / Party Name <span className="text-danger">*</span></Label>
              <Input
                type="text"
                value={ledgerForm.CompanyName}
                onChange={(e) => setLedgerForm((prev) => ({ ...prev, CompanyName: e.target.value }))}
                placeholder="Enter company or party name"
                required
                autoFocus
              />
            </FormGroup>
            <FormGroup>
              <Label>Phone <span className="text-danger">*</span></Label>
              <Input
                type="text"
                value={ledgerForm.Phone}
                onChange={(e) => setLedgerForm((prev) => ({ ...prev, Phone: e.target.value }))}
                placeholder="Enter phone number"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>Address <span className="text-danger">*</span></Label>
              <Input
                type="textarea"
                value={ledgerForm.Address}
                onChange={(e) => setLedgerForm((prev) => ({ ...prev, Address: e.target.value }))}
                placeholder="Enter address"
                required
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Btn type="submit" color="primary" disabled={ledgerSubmitting}>
              {ledgerSubmitting ? "Saving..." : "Create Party"}
            </Btn>
            <Btn type="button" color="secondary" onClick={closeLedgerModal} disabled={ledgerSubmitting}>
              Cancel
            </Btn>
          </ModalFooter>
        </Form>
      </Modal>

      <div className="sales-print-layout">
        <div className="print-header">
          <div className="firm-name">{firmName}</div>
          <div className="print-title">SALES ORDER</div>
        </div>
        <div className="print-details">
          <div className="detail-row">
            <div><strong>Sales Order No.:</strong> {formData.SoNo || "N/A"}</div>
            <div><strong>Date:</strong> {formData.SODate || "N/A"}</div>
          </div>
          <div className="detail-row">
            <div>
              <strong>Party:</strong>{" "}
              {(() => {
                const party = ledgerMaster?.find((l: any) => String(l.Id) === String(formData.F_LedgerMaster));
                return party ? (party.CompanyName || party.Name || party.LedgerName) : "N/A";
              })()}
            </div>
          </div>
          {formData.Remarks && <div className="detail-row"><div><strong>Remarks:</strong> {formData.Remarks}</div></div>}
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item Group Name</th>
              <th>Item Name</th>
              <th>Color</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {gridRows.map((row, index) => {
              const qty = parseFloat(row.Qty) || 0;
              const rate = parseFloat(row.Rate || "0") || 0;
              
              const groupObj = itemGroupMaster?.find((g: any) => String(g.Id) === String(row.F_ItemGroup));
              const groupName = groupObj ? (groupObj.GroupName || groupObj.Name) : "N/A";
              
              const itemObj = row.ItemData?.find((i: any) => String(i.Id) === String(row.F_ItemMaster));
              const itemName = itemObj?.ItemName || itemObj?.Name || row.ItemCode || "N/A";
              
              const colorName = colorMaster?.find((c: any) => String(c.Id) === String(row.F_ColorMaster))?.Name || "N/A";
              
              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{groupName}</td>
                  <td>{itemName}</td>
                  <td>{colorName}</td>
                  <td className="text-right">{qty}</td>
                  <td className="text-right">{rate.toFixed(2)}</td>
                  <td className="text-right">{(qty * rate).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan={4} className="text-right">Total:</td>
              <td className="text-right">{gridRows.reduce((sum, row) => sum + (parseFloat(row.Qty) || 0), 0)}</td>
              <td></td>
              <td className="text-right">{gridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.Rate || "0") || 0)), 0).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
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
};

export default SalesOrder;
