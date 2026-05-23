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
  Table,
} from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import DateInput from "../../../CommonElements/DateInput";
import { Fn_AddEditData, Fn_DisplayData, Fn_FillListData, Fn_DeleteData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { getCurrentUserId } from "../../../utils/formUtils";
import GridSystemPO from "./GridSystemPO";

interface GridRow {
  ItemCode: string;
  F_ItemGroup: string;
  F_ItemMaster: string;
  F_ColorMaster?: string;
  Qty: string;
  Rate: string;
  ItemData: any[] | null;
}

interface FormData {
  PNo: string;
  PDate: string;
  F_LedgerMaster: string;
  Remarks: string;
  F_PurchaseMaster: string;
}

const getCurrentDateYYYYMMDD = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const PurchaseOrder = () => {
  const API_URL_SAVE = "PurchaseOrder/0/token";
  const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/PurchaseMasterH/Id`;
  const API_LEDGER_LIST = `${API_WEB_URLS.MASTER}/0/token/GetLedgerNamesForPoSoApproval/Id/0`;
  const API_ITEM_GROUP_LIST = `${API_WEB_URLS.MASTER}/0/token/ItemGroup/Id/0`;
  const API_ITEM_BY_GROUP = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.ItemMaster}/Id`;
  const API_CREATED_PO = `${API_WEB_URLS.MASTER}/0/token/PurchaseOrderData/Id/0`;
  const API_PO_H = `${API_WEB_URLS.MASTER}/0/token/PurchaseMasterH`;
  const API_PO_L = `${API_WEB_URLS.MASTER}/0/token/PurchaseMasterLById`;
  const API_ITEM_SAVE = `${API_WEB_URLS.ItemMaster}/0/token`;
  const API_LEDGER_SAVE = `${API_WEB_URLS.LedgerMaster}/0/token`;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<FormData>({
    PNo: "",
    PDate: getCurrentDateYYYYMMDD(),
    F_LedgerMaster: "",
    Remarks: "",
    F_PurchaseMaster: "",
  });

  const [gridRows, setGridRows] = useState<GridRow[]>([
    {
      ItemCode: "",
      F_ItemGroup: "",
      F_ItemMaster: "",
      F_ColorMaster: "",
      Qty: "",
      Rate: "",
      ItemData: null,
    },
  ]);

  const [ledgerMaster, setLedgerMaster] = useState<any[]>([]);
  const [itemGroupMaster, setItemGroupMaster] = useState<any[]>([]);
  const [colorMaster, setColorMaster] = useState<any[]>([]);
  const [createdPurchaseOrders, setCreatedPurchaseOrders] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [firmName, setFirmName] = useState("FIRM NAME");

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

  // Set initial focus to Select PO field
  useEffect(() => {
    setTimeout(() => {
      const selectPOField = document.getElementById("po-select-input") as HTMLSelectElement;
      if (selectPOField) {
        selectPOField.focus();
      }
    }, 300);
  }, []);

  const fetchVoucherNo = async () => {
    try {
      const res = await Fn_FillListData(dispatch, () => ({}), "voucherNo", `${API_WEB_URLS.MASTER}/0/token/GetVoucherNoByVoucherTypeId/Id/16`);
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

  const parsePurchaseOrderData = (data: any) => {
    let parsed: any[] = [];
    if (data && Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.Header) {
          try {
            const headerObj = JSON.parse(item.Header);
            const linesObj = item.Lines ? JSON.parse(item.Lines) : [];
            
            if (Array.isArray(headerObj)) {
              headerObj.forEach((hdr: any) => {
                parsed.push({
                  ...hdr,
                  Lines: Array.isArray(linesObj) ? linesObj.filter((l: any) => String(l.F_PurchaseOrderH) === String(hdr.Id)) : linesObj
                });
              });
            } else {
              parsed.push({
                ...headerObj,
                Lines: Array.isArray(linesObj) ? linesObj.filter((l: any) => String(l.F_PurchaseOrderH) === String(headerObj.Id)) : linesObj
              });
            }
          } catch (e) {
            parsed.push(item);
          }
        } else {
          parsed.push(item);
        }
      });
    } else {
      parsed = data || [];
    }
    return parsed;
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

        const poData = await Fn_FillListData(dispatch, () => ({}), "createdPurchaseOrders", API_CREATED_PO);
        const parsed = parsePurchaseOrderData(poData);
        setCreatedPurchaseOrders(parsed);

        const locationState = location.state as { Id?: number } | undefined;
        const recordId = locationState?.Id ?? 0;
        if (recordId > 0) {
          await loadPurchaseOrderRecord(recordId, parsed);
        } else {
          const vNo = await fetchVoucherNo();
          if (vNo) {
            setFormData(prev => ({ ...prev, PNo: vNo }));
          }
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
        resetPurchaseOrderToBlank();
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
        case "SelectPO":
          // Focus PO No
          const poNoInput = document.getElementById("po-no-input") as HTMLInputElement;
          if (poNoInput) {
            poNoInput.focus();
          }
          break;
        case "PNo":
          // Focus PO Date
          const poDateInput = document.getElementById("po-date-input") as HTMLInputElement;
          if (poDateInput) {
            poDateInput.focus();
          }
          break;
        case "PDate":
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

  // Keyboard navigation for grid rows
  const handleGridKeyDown = (event: React.KeyboardEvent, rowIndex: number, fieldName: string) => {
    if (event.key === "Enter") {
      event.preventDefault();

      switch (fieldName) {
        case "ItemCode":
          const itemGroupSelect = document.querySelector(
            `select[data-row="${rowIndex}"][data-field="F_ItemGroup"]`
          ) as HTMLSelectElement;
          if (itemGroupSelect) {
            itemGroupSelect.focus();
          }
          break;
        case "F_ItemGroup":
          const itemMasterSelect = document.querySelector(
            `select[data-row="${rowIndex}"][data-field="F_ItemMaster"]`
          ) as HTMLSelectElement;
          if (itemMasterSelect) {
            itemMasterSelect.focus();
          }
          break;
        case "F_ItemMaster":
          const colorSelect = document.querySelector(
            `select[data-row="${rowIndex}"][data-field="F_ColorMaster"]`
          ) as HTMLSelectElement;
          if (colorSelect) {
            colorSelect.focus();
          }
          break;
        case "F_ColorMaster":
          const qtyInput = document.querySelector(
            `input[data-row="${rowIndex}"][data-field="Qty"]`
          ) as HTMLInputElement;
          if (qtyInput) {
            qtyInput.focus();
          }
          break;
        case "Qty":
          // Move to + button (Rate column is hidden)
          const addButton = document.querySelector(
            `button[data-row="${rowIndex}"][data-action="add"]`
          ) as HTMLButtonElement;
          if (addButton) {
            addButton.focus();
          }
          break;
        default:
          break;
      }
    } else if (event.key === "Tab") {
      // Tab navigation within grid row
      if (fieldName === "ItemCode") {
        event.preventDefault();
        const itemGroupSelect = document.querySelector(
          `select[data-row="${rowIndex}"][data-field="F_ItemGroup"]`
        ) as HTMLSelectElement;
        if (itemGroupSelect) {
          itemGroupSelect.focus();
        }
      } else if (fieldName === "F_ItemGroup") {
        event.preventDefault();
        const itemMasterSelect = document.querySelector(
          `select[data-row="${rowIndex}"][data-field="F_ItemMaster"]`
        ) as HTMLSelectElement;
        if (itemMasterSelect) {
          itemMasterSelect.focus();
        }
      } else if (fieldName === "F_ItemMaster") {
        event.preventDefault();
        const colorSelect = document.querySelector(
          `select[data-row="${rowIndex}"][data-field="F_ColorMaster"]`
        ) as HTMLSelectElement;
        if (colorSelect) {
          colorSelect.focus();
        }
      } else if (fieldName === "F_ColorMaster") {
        event.preventDefault();
        const qtyInput = document.querySelector(
          `input[data-row="${rowIndex}"][data-field="Qty"]`
        ) as HTMLInputElement;
        if (qtyInput) {
          qtyInput.focus();
        }
      } else if (fieldName === "Qty") {
        event.preventDefault();
        const addButton = document.querySelector(
          `button[data-row="${rowIndex}"][data-action="add"]`
        ) as HTMLButtonElement;
        if (addButton) {
          addButton.focus();
        }
      }
    }
  };

  // Keyboard navigation for grid action buttons
  const handleGridButtonKeyDown = (event: React.KeyboardEvent, rowIndex: number, buttonType: string) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (buttonType === "add") {
        addRow();
        // Focus Item Code of new row
        setTimeout(() => {
          const newRowItemCode = document.querySelector(
            `input[data-row="${rowIndex + 1}"][data-field="ItemCode"]`
          ) as HTMLInputElement;
          if (newRowItemCode) {
            newRowItemCode.focus();
          }
        }, 50);
      } else if (buttonType === "remove") {
        removeRow(rowIndex);
      }
    } else if (event.key === "Tab") {
      event.preventDefault();
      if (buttonType === "add") {
        // Tab from add button to remove button
        const removeButton = document.querySelector(
          `button[data-row="${rowIndex}"][data-action="remove"]`
        ) as HTMLButtonElement;
        if (removeButton) {
          removeButton.focus();
        }
      } else if (buttonType === "remove") {
        // Tab from remove button to save button
        const saveButton = document.querySelector(
          'button[data-action="save"]'
        ) as HTMLButtonElement;
        if (saveButton) {
          saveButton.focus();
        }
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
          'input[type="text"], input[type="number"], input[type="tel"], input[type="email"], select:not([tabindex="-1"])'
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

  const loadPurchaseOrderRecord = async (recordId: number, poList?: any[]) => {
    if (!recordId) return;

    setIsEditMode(true);

    const listToSearch = poList || createdPurchaseOrders;
    const poRecord = listToSearch.find(po => String(po.Id) === String(recordId));

    let header = null;
    let lines: any[] = [];

    if (poRecord) {
      header = poRecord;
      if (poRecord.Lines) {
        try {
          lines = typeof poRecord.Lines === "string" ? JSON.parse(poRecord.Lines) : poRecord.Lines;
        } catch(e) {
          console.error("Failed to parse Lines");
        }
      }
    } else {
      const hData = await Fn_FillListData(dispatch, () => ({}), "hData", `${API_PO_H}/Id/${recordId}`);
      const lData = await Fn_FillListData(dispatch, () => ({}), "lData", `${API_PO_L}/Id/${recordId}`);

      header = Array.isArray(hData) && hData.length > 0 ? hData[0] : null;
      lines = Array.isArray(lData) ? lData : [];
    }

    if (header) {
      setFormData({
        PNo: header.PONo || header.PNo || "",
        PDate: header.PODate ? header.PODate.split("T")[0] : (header.PDate ? header.PDate.split("T")[0] : ""),
        F_LedgerMaster: header.F_LedgerMaster || "",
        Remarks: header.Remarks || "",
        F_PurchaseMaster: String(recordId),
      });
    }

    const mappedRows: GridRow[] =
      lines.length > 0
        ? lines.map((l: any) => ({
            ItemCode: l.Code || l.ItemCode || "",
            F_ItemGroup: l.F_ItemGroupMaster || l.F_ItemGroup || "",
            F_ItemMaster: l.F_ItemMaster || "",
            F_ColorMaster: l.F_ColorMaster || "",
            Qty: String(l.OrderedQty || l.Qty || ""),
            Rate: String(l.Rate || ""),
            ItemData: null,
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

    if (lines.length > 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const itemGroupId = line.F_ItemGroupMaster || line.F_ItemGroup;
        if (itemGroupId) {
          try {
            const itemRes = await Fn_FillListData(dispatch, () => ({}), "CallingData", `${API_ITEM_BY_GROUP}/${itemGroupId}`);
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
        F_ColorMaster: "",
        Qty: "",
        Rate: "",
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
            Rate: row.Rate,
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
    if (!formData.PNo || String(formData.PNo).trim() === "") {
      alert("Please enter Purchase No");
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
    formDataSubmit.append("PODate", formData.PDate);
    formDataSubmit.append("F_LedgerMaster", formData.F_LedgerMaster);
    formDataSubmit.append("Remarks", formData.Remarks || "");
    formDataSubmit.append("UserId", String(Number(userId) || 0));
    formDataSubmit.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

    // Build JsonData array as per API spec: F_ItemGroupMaster, F_ItemMaster, Code, F_ColorMaster, OrderedQty, Rate
    const jsonDataArray = gridRows.map((r) => ({
      F_ItemGroupMaster: r.F_ItemGroup || "0",
      F_ItemMaster: r.F_ItemMaster || "0",
      Code: r.ItemCode || "",
      F_ColorMaster: r.F_ColorMaster || "0",
      OrderedQty: r.Qty || "0",
      Rate: r.Rate || "0",
    }));
    formDataSubmit.append("JsonData", JSON.stringify(jsonDataArray));

    await Fn_AddEditData(
      dispatch,
      () => undefined,
      { arguList: { id: formData.F_PurchaseMaster ? Number(formData.F_PurchaseMaster) : 0, formData: formDataSubmit } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "#"
    );

    const updatedPurchaseOrders = await Fn_FillListData(dispatch, () => ({}), "createdPurchaseOrders", API_CREATED_PO);
    const parsed = parsePurchaseOrderData(updatedPurchaseOrders);
    setCreatedPurchaseOrders(parsed);

    resetPurchaseOrderToBlank();
  };

  const handleDelete = async () => {
    if (!formData.F_PurchaseMaster) {
      alert("Please select a purchase order to delete.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this Purchase Order?");
    if (!confirmed) return;

    try {
      const result = await Fn_DeleteData(dispatch, Number(formData.F_PurchaseMaster), API_PO_H, `${API_PO_H}/Id/0`);

      if (result?.success) {
        resetPurchaseOrderToBlank();
        const updated = await Fn_FillListData(dispatch, () => ({}), "createdPurchaseOrders", API_CREATED_PO);
        const parsed = parsePurchaseOrderData(updated);
        setCreatedPurchaseOrders(parsed);
      } else {
        alert("Failed to delete the Purchase Order.");
      }
    } catch (error) {
      console.error("Error deleting PO:", error);
      alert("An error occurred while deleting the PO.");
    }
  };

  const resetPurchaseOrderToBlank = async () => {
    const today = getCurrentDateYYYYMMDD();
    const vNo = await fetchVoucherNo();
    setFormData({
      PNo: vNo,
      PDate: today,
      F_LedgerMaster: "",
      Remarks: "",
      F_PurchaseMaster: "",
    });
    setIsEditMode(false);
    setGridRows([
      {
        ItemCode: "",
        F_ItemGroup: "",
        F_ItemMaster: "",
        F_ColorMaster: "",
        Qty: "",
        Rate: "",
        ItemData: null,
      },
    ]);
  };

  const handleCreatedPOChange = async (poId: string) => {
    if (!poId) return;
    await loadPurchaseOrderRecord(Number(poId));
  };

  const handlePrint = () => {
    const oldTitle = document.title;
    document.title = "";
    window.print();
    document.title = oldTitle;
  };

  const purchaseOrderCompactStyles = `
    .purchase-print-layout { display: none; }
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
      .purchase-print-layout .print-header { text-align: center; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 2px; }
      .purchase-print-layout .firm-name { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 0; }
      .purchase-print-layout .print-title { font-size: 14px; font-weight: bold; margin-top: 0; }
      .purchase-print-layout .print-details { margin-bottom: 5px; }
      .purchase-print-layout .detail-row { display: flex; justify-content: space-between; margin-bottom: 1px; font-size: 11px; }
      .purchase-print-layout table { width: 100%; border-collapse: collapse; margin-top: 2px; }
      .purchase-print-layout th, .purchase-print-layout td { border: 1px solid #000; padding: 2px 4px; text-align: left; font-size: 11px; }
      .purchase-print-layout th { background: #eee !important; -webkit-print-color-adjust: exact; }
      .purchase-print-layout .text-right { text-align: right; }
      .purchase-print-layout .total-row { font-weight: bold; }
    }
  `;

  return (
    <div className="page-body">
      <style>{purchaseOrderCompactStyles}</style>
      <Breadcrumbs mainTitle="Purchase Order" parent="Transactions" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Purchase Order" tagClass="card-title mb-0" />
              <CardBody>
                <Row className="mb-3 g-3">
                  <Col md="2">
                    <FormGroup>
                      <Label>Select Purchase Order</Label>
                      <Input
                        id="po-select-input"
                        type="select"
                        value={formData.F_PurchaseMaster}
                        onChange={(e) => {
                          const id = e.target.value;
                          setFormData((prev) => ({ ...prev, F_PurchaseMaster: id }));
                          handleCreatedPOChange(id);
                        }}
                        onKeyDown={(e) => handleFormKeyDown(e, "SelectPO")}
                      >
                        <option value="">Select PO</option>
                        {createdPurchaseOrders.map((po) => (
                          <option key={po.Id} value={String(po.Id)}>
                            {po.PONo || po.PNo || po.Name || po.Id}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md="2">
                    <FormGroup>
                      <Label>PO No <span className="text-danger">*</span></Label>
                      <Input
                        id="po-no-input"
                        type="text"
                        value={formData.PNo}
                        placeholder="Auto-generated or enter"
                        onChange={(e) => setFormData((prev) => ({ ...prev, PNo: e.target.value }))}
                        onKeyDown={(e) => handleFormKeyDown(e, "PNo")}
                        disabled={isEditMode}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="2">
                    <FormGroup>
                      <Label>PO Date <span className="text-danger">*</span></Label>
                      <DateInput
                        id="po-date-input"
                        value={formData.PDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, PDate: e.target.value }))}
                        onKeyDown={(e: any) => handleFormKeyDown(e, "PDate")}
                        disabled={isEditMode}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label>Party <span className="text-danger">*</span></Label>
                      <div className="d-flex gap-2">
                        <Input
                          id="party-select"
                          type="select"
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
                        </Input>
                        <Btn
                          type="button"
                          color="success"
                          onClick={openLedgerModal}
                          disabled={isEditMode}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          <i className="fa fa-plus"></i>
                        </Btn>
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label>Remarks</Label>
                      <Input
                        id="remarks-input"
                        type="text"
                        value={formData.Remarks}
                        placeholder="Enter remarks"
                        onChange={(e) => setFormData((prev) => ({ ...prev, Remarks: e.target.value }))}
                        onKeyDown={(e) => handleFormKeyDown(e, "Remarks")}
                        disabled={isEditMode}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                {/* Grid Table */}
                <GridSystemPO
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
                  <Btn type="button" color="success" onClick={handlePrint}>
                    <i className="fa fa-print me-1"></i> Print
                  </Btn>
                  <Btn type="button" color="secondary" onClick={resetPurchaseOrderToBlank}>
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

      <div className="purchase-print-layout">
        <div className="print-header">
          <div className="firm-name">{firmName}</div>
          <div className="print-title">PURCHASE ORDER</div>
        </div>
        <div className="print-details">
          <div className="detail-row">
            <div><strong>Purchase Order No.:</strong> {formData.PNo || "N/A"}</div>
            <div><strong>Date:</strong> {formData.PDate || "N/A"}</div>
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
              const rate = parseFloat(row.Rate) || 0;
              
              const groupObj = itemGroupMaster?.find((g: any) => String(g.Id) === String(row.F_ItemGroup));
              const groupName = groupObj ? (groupObj.Name || groupObj.GroupName) : "N/A";
              
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
              <td className="text-right">{gridRows.reduce((sum, row) => sum + ((parseFloat(row.Qty) || 0) * (parseFloat(row.Rate) || 0)), 0).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};  

export default PurchaseOrder;   