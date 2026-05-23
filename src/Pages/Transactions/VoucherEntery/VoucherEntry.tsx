import React, { useState, useEffect, useRef } from "react";
import { Col, Row, Card, CardBody, CardFooter, Input, Container } from "reactstrap";
import { toast } from "react-toastify";
import { Fn_AddEditData, Fn_DisplayData, Fn_FillListData, Fn_DeleteData } from "../../../store/Functions";
import { useDispatch } from "react-redux";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { useLocation, useNavigate } from "react-router-dom";
import GridSystemVoucherEntry from "./GridSystemVoucherEntry";
import { getCurrentDateYYYYMMDD } from "../../../helpers/dateUtils";
import DateInput from "../../../CommonElements/DateInput";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import { Btn } from "../../../AbstractElements";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";


interface FormData {
  VoucherNo: string;
  VoucherDate: string;
  ChequeNo: string;
  ChequeDate: string;
  ReceiptNo: string;
  ReceiptDate: string;
  F_VoucherMaster: string;
  F_VoucherType: string;
  Narration: string;
  Amount: string;
  PaymentMode: string;
  Discount: string;
  // DCCType (DebitNote, CreditNote, Contra) specific fields
  RequestNo: string;
  CBC: string;
  EBC: string;
  ODC: string;
  F_BankMaster1: string;
  F_BankBranchMaster1: string;
  F_BankAccountNo1: string;
  F_BankMaster2: string;
  F_BankBranchMaster2: string;
  F_BankAccountNo2: string;
  DDCharge: string;
  IsReceiptPrinted: boolean;
  AutoReceiptNo: string;
  PenaltyAmount: string;
}

interface GridRow {
  Type: string;
  F_AccountMaster: string;
  NameOfAccounts: string;
  DebitAmt: string;
  CreditAmt: string;  
  Balance: string;
}

interface VoucherState {
  id: number;
  formData: FormData;
  VoucherMaster: any[];
  VoucherTypeMaster: any[];
  AccountMaster: any[];
  AccountMasterBankAndCash: any[];
  CreatedVouchers: any[];
  isEditMode: boolean;
  VoucherNo: string;
  focusNewRowIndex: number | null;
  amountInWords: string;
  printCompanyName: string;
  printFirmAddress: string;
}

const VoucherEntry: React.FC = () => {
  // Single save API for all voucher types: /api/V1/VoucherH/{UserId}/{UserToken}
  const API_SAVE = "VoucherH/0/token";

  const [state, setState] = useState<VoucherState>({
    id: 0,
    formData: {
      VoucherNo: "",
      VoucherDate: getCurrentDateYYYYMMDD(),
      ChequeNo: "",
      ChequeDate: "",
      ReceiptNo: "",
      ReceiptDate: "",
      F_VoucherMaster: "",
      F_VoucherType: "",
      Narration: "",
      Amount: "",
      PaymentMode: "",
      Discount: "",
      RequestNo: "",
      CBC: "",
      EBC: "",
      ODC: "",
      F_BankMaster1: "",
      F_BankBranchMaster1: "",
      F_BankAccountNo1: "",
      F_BankMaster2: "",
      F_BankBranchMaster2: "",
      F_BankAccountNo2: "",
      DDCharge: "",
      IsReceiptPrinted: false,
      AutoReceiptNo: "",
      PenaltyAmount: "",
    },
    VoucherMaster: [],
    VoucherTypeMaster: [],
    AccountMaster: [],
    AccountMasterBankAndCash: [],
    CreatedVouchers: [],
    isEditMode: false,
    VoucherNo: "",
    focusNewRowIndex: null,
    amountInWords: "",
    printCompanyName: "",
    printFirmAddress: "",
  });

  // Separate state for grid rows
  const [gridRows, setGridRows] = useState<GridRow[]>([
    {
      Type: "Cr",
      F_AccountMaster: "",
      NameOfAccounts: "",
      DebitAmt: "",
      CreditAmt: "",
      Balance: "",
    },
  ]);

  const API_GetVoucherNoByVoucherTypeId = `${API_WEB_URLS.MASTER}/0/token/GetVoucherNoByVoucherTypeId`;

  const getVoucherNoApiUrl = (voucherTypeId: string) => {
    const id = String(voucherTypeId || "").trim() || "1";
    return `${API_GetVoucherNoByVoucherTypeId}/Id/${id}`;
  };

  const API_URL_Account = `${API_WEB_URLS.MASTER}/0/token/LedgerMaster`;
  const API_URL_Account_BankAndCash = `${API_WEB_URLS.MASTER}/0/token/GetLedgerMasterForBankAndCash/Id/0`;
  const API_URL_Account_ExceptBankAndCash = `${API_WEB_URLS.MASTER}/0/token/GetLedgerMasterExceptBankAndCash/Id/0`;
  const API_URL_Created = `${API_WEB_URLS.MASTER}/0/token/CreatedVouchers`;
  const API_URL_VoucherType = `${API_WEB_URLS.MASTER}/0/token/VoucherTypeMaster/Id/0`;
  const API_H = `${API_WEB_URLS.MASTER}/0/token/VoucherH`;
  const API_L = `${API_WEB_URLS.MASTER}/0/token/VoucherLById`;


  
  // Refs for form fields
  const voucherNoRef = useRef<HTMLInputElement>(null);
  const voucherDateRef = useRef<HTMLInputElement>(null);
  const voucherTypeRef = useRef<HTMLSelectElement>(null);
  const referenceNoRef = useRef<HTMLInputElement>(null);
  const referenceDateRef = useRef<HTMLInputElement>(null);
  const receiptNoRef = useRef<HTMLInputElement>(null);
  const receiptDateRef = useRef<HTMLInputElement>(null);
  const narrationRef = useRef<HTMLTextAreaElement>(null);
  const searchVoucherRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const baseAmountRef = useRef<number>(0);

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Calculate totals
  const calculateTotals = () => {
    const totalDebit = gridRows.reduce((sum, row) => sum + (parseFloat(row.DebitAmt) || 0), 0);
    const totalCredit = gridRows.reduce((sum, row) => sum + (parseFloat(row.CreditAmt) || 0), 0);
    const balance = totalDebit - totalCredit;
    return { totalDebit, totalCredit, balance };
  };

  const totals = calculateTotals();


  
  // Ctrl+S (Cmd+S on mac) to Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isSaveCombo = (e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S");
      const isEditCombo = (e.ctrlKey || e.metaKey) && (e.key === "e" || e.key === "E");
      const isResetCombo = (e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R");
      const isSearchCombo = e.key === "F11";
      const isEscape = e.key === "Escape";

      if (isSaveCombo) {
        e.preventDefault();
        handleSubmit();
      }

      if (isEditCombo && state.isEditMode) {
        e.preventDefault();
        setState((prev) => ({ ...prev, isEditMode: false }));
        setTimeout(() => voucherTypeRef.current?.focus(), 100);
      }

      if (isResetCombo) {
        e.preventDefault();
        handleReset();
      }

      if (isSearchCombo) {
        e.preventDefault();
        const selectElement = document.querySelector('select[name="F_VoucherMaster"]') as HTMLSelectElement;
        if (selectElement) {
          selectElement.focus();
        }
      }

      if (isEscape) {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isEditMode, navigate]);

  // Fetch Bank & Cash ledgers from Masters/0/token/GetLedgerMasterForBankAndCash/Id/0
  const fetchBankAndCashLedgers = async (): Promise<any[]> => {
    try {
      const dataList = await Fn_FillListData(dispatch, setState, "AccountMasterBankAndCash", API_URL_Account_BankAndCash);
      return Array.isArray(dataList) ? dataList : [];
    } catch (err) {
      console.error("Error fetching Bank & Cash ledgers:", err);
      return [];
    }
  };

  // Fetch ledgers EXCEPT Bank & Cash (VT 1, 4, 5)
  const fetchLedgersExceptBankAndCash = async (): Promise<any[]> => {
    try {
      const dataList = await Fn_FillListData(dispatch, setState, "AccountMaster", API_URL_Account_ExceptBankAndCash);
      return Array.isArray(dataList) ? dataList : [];
    } catch (err) {
      console.error("Error fetching ledgers except Bank & Cash:", err);
      return [];
    }
  };

  // Fetch AccountMaster (ledgers) based on voucher type
  // VT 1, 4, 5 = GetLedgerMasterExceptBankAndCash; VT 6 = Bank & Cash only; VT 2/3 need both; others = all ledgers
  const fetchAccountMasterByVoucherType = async (voucherTypeId: string): Promise<any[]> => {
    if (voucherTypeId === "6") return fetchBankAndCashLedgers();
    if (voucherTypeId === "1" || voucherTypeId === "4" || voucherTypeId === "5") return fetchLedgersExceptBankAndCash();
    const dataList = await Fn_FillListData(dispatch, setState, "AccountMaster", API_URL_Account + "/Id/0");
    return Array.isArray(dataList) ? dataList : [];
  };

  useEffect(() => {
    const fetchData = async () => {
      const locState = (location.state || {}) as { Id?: number; searchVoucherNo?: string };
      const Id = locState.Id || 0;
      const searchVoucherNo = locState.searchVoucherNo || "";

      try {
        const createdList = await Fn_FillListData(dispatch, setState, "CreatedVouchers", API_H + "/Id/0");
        const accountMasterData = await Fn_FillListData(dispatch, setState, "AccountMaster", API_URL_Account + "/Id/0");
        await Fn_FillListData(dispatch, setState, "VoucherTypeMaster", API_URL_VoucherType);

        let voucherIdToLoad = Id;
        if (voucherIdToLoad <= 0 && searchVoucherNo.trim()) {
          const list = Array.isArray(createdList) ? createdList : [];
          const found = list.find(
            (v: any) => String(v.VoucherNo || "").trim() === String(searchVoucherNo).trim()
          );
          if (found && (found.Id || found.id || found.ID)) {
            voucherIdToLoad = Number(found.Id ?? found.id ?? found.ID) || 0;
          }
        }

        if (voucherIdToLoad > 0) {
          setState((prevState) => ({ ...prevState, id: voucherIdToLoad }));
          await DataFillFunction(voucherIdToLoad, accountMasterData || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [dispatch, location.state]);

  // When VoucherType changes: VT 6 = Bank & Cash only; VT 2 = Dr rows Bank&Cash, Cr all; VT 3 = Cr rows Bank&Cash, Dr all
  useEffect(() => {
    const vt = state.formData.F_VoucherType || "";
    if (!vt) return;

    let cancelled = false;
    const load = async () => {
      try {
        if (vt === "6") {
          const list = await fetchBankAndCashLedgers();
          if (!cancelled) {
            setState((prev) => ({ ...prev, AccountMaster: list, AccountMasterBankAndCash: [] }));
            setGridRows((prev) =>
              prev.map((row) => ({ ...row, F_AccountMaster: "", NameOfAccounts: "", Balance: "" }))
            );
          }
        } else if (vt === "2" || vt === "3") {
          const [allLedgers, bankCashLedgers] = await Promise.all([
            Fn_FillListData(dispatch, setState, "AccountMaster", API_URL_Account + "/Id/0").then((dataList) =>
              Array.isArray(dataList) ? dataList : []
            ),
            fetchBankAndCashLedgers(),
          ]);
          if (!cancelled) {
            setState((prev) => ({ ...prev, AccountMaster: allLedgers, AccountMasterBankAndCash: bankCashLedgers }));
          }
        } else {
          const list = await fetchAccountMasterByVoucherType(vt);
          if (!cancelled) {
            setState((prev) => ({ ...prev, AccountMaster: list, AccountMasterBankAndCash: [] }));
          }
        }
      } catch (err) {
        if (!cancelled) console.error("Error loading ledgers by voucher type:", err);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [state.formData.F_VoucherType]);

  // Default focus on Voucher Type when page loads
  useEffect(() => {
    if (voucherTypeRef.current) {
      voucherTypeRef.current.focus();
    }
  }, []);

  // Load company name and firm address for print
  useEffect(() => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const firmName =
        authUser?.CompanyName || authUser?.FirmName || authUser?.Company || authUser?.companyName || "";
      setState((prev) => ({ ...prev, printCompanyName: typeof firmName === "string" ? firmName.trim() : "" }));

      Fn_FillListData(
        dispatch,
        () => {},
        "FirmListPrint",
        `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.FirmMaster}/Id/0`
      ).then((firms: any) => {
        if (Array.isArray(firms) && firms.length > 0) {
          const fCompanyId = authUser?.F_CompanyMaster ?? authUser?.CompanyId ?? authUser?.F_Company;
          const firm = (fCompanyId != null && fCompanyId !== "")
            ? firms.find((f: any) => String(f.Id) === String(fCompanyId) || String(f.F_CompanyMaster) === String(fCompanyId)) || firms[0]
            : firms.find(
                (f: any) =>
                  (f.FirmName || f.Name || "") === firmName || (f.FirmName || f.Name || "").trim() === firmName.trim()
              ) || firms[0];
          const apiName = firm?.FirmName || firm?.Name || firmName;
          const addr = [firm?.Address1, firm?.Address2, firm?.CityName || firm?.City, firm?.StateName || firm?.State, firm?.PinCode]
            .filter(Boolean)
            .join(", ");
          setState((prev) => ({
            ...prev,
            printCompanyName: apiName ? String(apiName).trim() : prev.printCompanyName,
            printFirmAddress: addr || "",
          }));
        }
      }).catch(() => {});
    } catch {
      setState((prev) => ({ ...prev, printCompanyName: "", printFirmAddress: "" }));
    }
  }, [dispatch]);

  // Grid row management functions - new row only when current row has amount
  // Auto-fill: first new row gets same amount as row 1; if row 1 was modified, new row gets remaining
  const addRow = (rowIndex: number) => {
    const row = gridRows[rowIndex];
    if (!row) return;
    const hasAmount = parseFloat(String(row.DebitAmt || "0")) > 0 || parseFloat(String(row.CreditAmt || "0")) > 0;
    if (!hasAmount) return; // Don't add new row until current row has amount

    const newRowIndex = gridRows.length;
    setState((prev) => ({ ...prev, focusNewRowIndex: newRowIndex }));
    setGridRows((prevRows) => {
      const firstRowType = prevRows.length > 0 && prevRows[0].Type ? prevRows[0].Type : "Cr";
      const defaultType = firstRowType === "Cr" ? "Dr" : "Cr";

      // Base amount: set when adding 2nd row (first row's amount at that moment)
      const firstRowAmount = parseFloat(prevRows[0]?.DebitAmt || prevRows[0]?.CreditAmt || "0") || 0;
      if (prevRows.length === 1) {
        baseAmountRef.current = firstRowAmount;
      }

      // Remaining = baseAmount - sum of amounts in rows with same type as new row
      const sumSameType = prevRows.reduce((sum, r) => {
        if (r.Type === defaultType) {
          const amt = parseFloat(r.DebitAmt || r.CreditAmt || "0") || 0;
          return sum + amt;
        }
        return sum;
      }, 0);
      const remaining = Math.max(0, baseAmountRef.current - sumSameType);
      const fillAmount = remaining > 0 ? String(remaining) : "";

      const newRow: GridRow = {
        Type: defaultType,
        F_AccountMaster: "",
        NameOfAccounts: "",
        DebitAmt: defaultType === "Dr" ? fillAmount : "",
        CreditAmt: defaultType === "Cr" ? fillAmount : "",
        Balance: "",
      };

      return [...prevRows, newRow];
    });
  };

  const removeRow = (index: number) => {
    if (gridRows.length > 1) {
      setGridRows((prevRows) => prevRows.filter((_, i) => i !== index));
    }
  };

  const updateGridRow = (index: number, field: string, value: string) => {
    // Validation for Type field - Only first row can change Type
    if (field === "Type") {
      // If trying to change Type of any row other than first row, prevent it
      if (index !== 0) {
        alert("Only the first row's Type can be changed. Other rows will automatically have the opposite type.");
        return;
      }
    }

    setGridRows((prevRows) =>
      prevRows.map((row, i): GridRow => {
        if (i !== index) {
          // If first row's Type is being changed, update all other rows to opposite type
          if (field === "Type" && index === 0) {
            const newFirstRowType = value;
            const oppositeType = newFirstRowType === "Cr" ? "Dr" : "Cr";
            let updatedOtherRow: GridRow = {
              ...row,
              Type: oppositeType,
              DebitAmt: oppositeType === "Dr" ? row.DebitAmt : "",
              CreditAmt: oppositeType === "Cr" ? row.CreditAmt : "",
            };
            const vt = state.formData.F_VoucherType || "";
            if (vt === "2" || vt === "3") {
              const bankCash = state.AccountMasterBankAndCash || [];
              const allLedgers = state.AccountMaster || [];
              const allowedList = (vt === "2" && oppositeType === "Dr") || (vt === "3" && oppositeType === "Cr") ? bankCash : allLedgers;
              const isInList = row.F_AccountMaster && allowedList.some((acc) => String(acc.Id) === String(row.F_AccountMaster));
              if (!isInList) {
                updatedOtherRow.F_AccountMaster = "";
                updatedOtherRow.NameOfAccounts = "";
                updatedOtherRow.Balance = "";
              }
            }
            if (updatedOtherRow.F_AccountMaster) {
              updatedOtherRow.Balance = row.Balance || "";
            } else if (!updatedOtherRow.Balance) {
              const debitAmt = parseFloat(updatedOtherRow.DebitAmt || "0");
              const creditAmt = parseFloat(updatedOtherRow.CreditAmt || "0");
              updatedOtherRow.Balance = (debitAmt - creditAmt).toFixed(2);
            }
            return updatedOtherRow;
          }
          return row;
        }

        const updatedRow: GridRow = { ...row, [field]: value };

        // If Type changes, clear and disable the opposite amount field; clear account if not in new ledger list (VT 2/3)
        if (field === "Type") {
          if (value === "Cr") {
            updatedRow.DebitAmt = "";
            updatedRow.CreditAmt = updatedRow.CreditAmt || "";
          } else if (value === "Dr") {
            updatedRow.CreditAmt = "";
            updatedRow.DebitAmt = updatedRow.DebitAmt || "";
          }
          const vt = state.formData.F_VoucherType || "";
          if (vt === "2" || vt === "3") {
            const bankCash = state.AccountMasterBankAndCash || [];
            const allLedgers = state.AccountMaster || [];
            const allowedList = (vt === "2" && value === "Dr") || (vt === "3" && value === "Cr") ? bankCash : allLedgers;
            const isInList = updatedRow.F_AccountMaster && allowedList.some((acc) => String(acc.Id) === String(updatedRow.F_AccountMaster));
            if (!isInList) {
              updatedRow.F_AccountMaster = "";
              updatedRow.NameOfAccounts = "";
              updatedRow.Balance = "";
            }
          }
        }

        // If AccountMaster changes, update NameOfAccounts and Balance from account
        if (field === "F_AccountMaster") {
          if (value) {
            // Check if this account is already selected in another row
            const isDuplicate = prevRows.some(
              (row, i) => i !== index && row.F_AccountMaster && String(row.F_AccountMaster) === String(value)
            );
            
            if (isDuplicate) {
              alert("This account is already selected in another row. Please select a different account.");
              return row; // Prevent update, return current row
            }

            // Account selected - get balance from account data
            const selectedAccount = state.AccountMaster.find((acc) => String(acc.Id) === String(value));
            if (selectedAccount) {
              updatedRow.NameOfAccounts = selectedAccount.Name || "";
              // Set Balance from account's current balance (if available in API response)
              // Check for Balance, CurrentBalance, or BalanceAmount fields
              const accountBalance =
                selectedAccount.Balance !== undefined
                  ? selectedAccount.Balance
                  : selectedAccount.CurrentBalance !== undefined
                  ? selectedAccount.CurrentBalance
                  : selectedAccount.BalanceAmount !== undefined
                  ? selectedAccount.BalanceAmount
                  : null;

              updatedRow.Balance =
                accountBalance !== undefined && accountBalance !== null ? String(parseFloat(String(accountBalance)).toFixed(2)) : "";
            } else {
              updatedRow.NameOfAccounts = "";
              updatedRow.Balance = "";
            }
          } else {
            // Account cleared - clear NameOfAccounts and Balance
            updatedRow.NameOfAccounts = "";
            updatedRow.Balance = "";
          }
        }

        // Balance calculation logic:
        // - If account is selected: Use account's balance (already set above)
        // - If account is NOT selected: Clear balance (don't show calculated balance)
        if (field === "Type" || field === "DebitAmt" || field === "CreditAmt") {
          if (updatedRow.F_AccountMaster) {
            // Account is selected - keep account balance (already set above in AccountMaster change handler)
            // Don't recalculate from amounts
          } else {
            // Account is NOT selected - clear balance (don't show any balance)
            updatedRow.Balance = "";
          }
        }

        // If AccountMaster is cleared, also clear balance
        if (field === "F_AccountMaster" && !value) {
          updatedRow.Balance = "";
        }

        return updatedRow;
      })
    );
  };

  // Load an existing Voucher's header and lines
  const DataFillFunction = async (id: number, accountMasterData?: any[]) => {
    if (!id || id === 0) {
      throw new Error("Invalid voucher ID");
    }

    try {
      setState((prev) => ({ ...prev, isEditMode: true }));

      // First fetch header from generic API to determine voucher type
      const hData = await Fn_FillListData(dispatch, setState, "hData", API_H + "/Id/" + id);
      
      const voucherType = String((Array.isArray(hData) && hData[0]) ? (hData[0].F_VoucherType ?? hData[0].VoucherType ?? hData[0].F_VoucherTypeMaster ?? "") : "");
      let accountMaster: any[] = accountMasterData || state.AccountMaster || [];
      let bankCashList: any[] = [];

      if (voucherType === "6") {
        const list = await fetchBankAndCashLedgers();
        if (Array.isArray(list) && list.length > 0) {
          accountMaster = list;
          setState((prev) => ({ ...prev, AccountMaster: list, AccountMasterBankAndCash: [] }));
        }
      } else if (voucherType === "2" || voucherType === "3") {
        const [allLedgers, bankCash] = await Promise.all([
          Fn_FillListData(dispatch, setState, "AccountMaster", API_URL_Account + "/Id/0").then((dataList) =>
            Array.isArray(dataList) ? dataList : (accountMasterData || [])
          ),
          fetchBankAndCashLedgers(),
        ]);
        accountMaster = Array.isArray(allLedgers) && allLedgers.length > 0 ? allLedgers : (accountMasterData || []);
        bankCashList = Array.isArray(bankCash) ? bankCash : [];
        setState((prev) => ({ ...prev, AccountMaster: accountMaster, AccountMasterBankAndCash: bankCashList }));
      } else {
        const list = await fetchAccountMasterByVoucherType(voucherType);
        if (Array.isArray(list) && list.length > 0) {
          accountMaster = list;
          setState((prev) => ({ ...prev, AccountMaster: list, AccountMasterBankAndCash: [] }));
        }
      }
      
      // Determine voucher type from header data for field mapping and API selection
      let isJournal = false;
      let isReceipt = false;
      let isPayment = false;
      let isDCCType = false;
      
      const header = Array.isArray(hData) && hData.length > 0 ? hData[0] : null;
      
      if (header) {
        const voucherType = String(header.F_VoucherType || header.VoucherType || header.F_VoucherTypeMaster || "");
        if (voucherType === "1") isJournal = true;
        else if (voucherType === "2") isReceipt = true;
        else if (voucherType === "3") isPayment = true;
        else if (voucherType && !["1", "2", "3"].includes(voucherType)) isDCCType = true;
      }
      
      // Fetch line data using VoucherLById (API may return { data: { dataList: [...] } })
      const lDataRaw = await Fn_FillListData(dispatch, setState, "lData", API_L + "/Id/" + id);
      const lData = Array.isArray(lDataRaw)
        ? lDataRaw
        : Array.isArray((lDataRaw as any)?.data?.dataList)
          ? (lDataRaw as any).data.dataList
          : Array.isArray((lDataRaw as any)?.dataList)
            ? (lDataRaw as any).dataList
            : [];

    const lines = lData;

    if (!header) {
      // Still set the F_VoucherMaster even if no header data
      setState((prev) => ({ 
        ...prev, 
        formData: { ...prev.formData, F_VoucherMaster: String(id) },
        isEditMode: false 
      }));
      baseAmountRef.current = 0;
      setGridRows([
        {
          Type: "Cr",
          F_AccountMaster: "",
          NameOfAccounts: "",
          DebitAmt: "",
          CreditAmt: "",
          Balance: "",
        },
      ]);
      return;
    }

    if (header) {
      const toLocalDateString = (dateVal: any): string => {
        if (dateVal == null || dateVal === "") return "";
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return "";
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };
      const voucherDate = toLocalDateString(header.VoucherDate);
      const chequeDate = toLocalDateString(header.ChequeDate || header.ReferenceDate);
      const receiptDate = toLocalDateString(header.ReceiptDate);
      const emptyIfZero = (v: any) => { const s = String(v ?? ""); return s === "0" ? "" : s; };

      if (isJournal) {
        // Journal (Internal Adjustment) specific fields
        setState((prev) => ({
          ...prev,
          formData: {
            ...prev.formData,
            VoucherNo: header.VoucherNo || "",
            VoucherDate: voucherDate,
            ReceiptNo: emptyIfZero(header.ReceiptNo),
            ReceiptDate: receiptDate,
            ChequeNo: emptyIfZero(header.ReferenceNo || header.ChequeNo),
            ChequeDate: chequeDate,
            F_VoucherType: String(header.F_VoucherType || header.VoucherType || header.F_VoucherTypeMaster || "1"),
            Narration: emptyIfZero(header.Narration),
            Amount: String(header.Amount || ""),
            PaymentMode: String(header.PaymentMode || ""),
            Discount: String(header.Discount || ""),
          },
        }));
      } else if (isDCCType) {
        // DCCType (DebitNote, CreditNote, Contra) specific fields
        setState((prev) => ({
          ...prev,
          formData: {
            ...prev.formData,
            VoucherNo: header.VoucherNo || "",
            VoucherDate: voucherDate,
            ReceiptNo: emptyIfZero(header.ReceiptNo),
            ReceiptDate: receiptDate,
            ChequeNo: emptyIfZero(header.ReferenceNo || header.ChequeNo),
            ChequeDate: chequeDate,
            F_VoucherType: String(header.F_VoucherType || header.VoucherType || header.F_VoucherTypeMaster || ""),
            Narration: emptyIfZero(header.Narration),
            Amount: String(header.Amount || ""),
            PaymentMode: String(header.PaymentMode || ""),
            Discount: String(header.Discount || ""),
            RequestNo: String(header.RequestNo || ""),
            CBC: String(header.CBC || ""),
            EBC: String(header.EBC || ""),
            ODC: String(header.ODC || ""),
            F_BankMaster1: String(header.F_BankMaster1 || ""),
            F_BankBranchMaster1: String(header.F_BankBranchMaster1 || ""),
            F_BankAccountNo1: String(header.F_BankAccountNo1 || ""),
            F_BankMaster2: String(header.F_BankMaster2 || ""),
            F_BankBranchMaster2: String(header.F_BankBranchMaster2 || ""),
            F_BankAccountNo2: String(header.F_BankAccountNo2 || ""),
            DDCharge: String(header.DDCharge || ""),
            IsReceiptPrinted: Boolean(header.IsReceiptPrinted),
            AutoReceiptNo: String(header.AutoReceiptNo || ""),
            PenaltyAmount: String(header.PenaltyAmount || ""),
          },
        }));
      } else if (isReceipt || isPayment) {
        // Receipt/Payment specific fields (same structure)
        setState((prev) => ({
          ...prev,
          formData: {
            ...prev.formData,
            VoucherNo: header.VoucherNo || "",
            VoucherDate: voucherDate,
            ReceiptNo: emptyIfZero(header.ReceiptNo),
            ReceiptDate: receiptDate,
            ChequeNo: emptyIfZero(header.ReferenceNo || header.ChequeNo),
            ChequeDate: chequeDate,
            F_VoucherType: String(header.F_VoucherType || header.VoucherType || header.F_VoucherTypeMaster || (isReceipt ? "2" : "3")),
            Narration: emptyIfZero(header.Narration),
            Amount: String(header.Amount || ""),
            PaymentMode: String(header.PaymentMode || ""),
            Discount: String(header.Discount || ""),
          },
        }));
      } else {
        // Default VoucherEntry fields
        setState((prev) => ({
          ...prev,
          formData: {
            ...prev.formData,
            VoucherNo: header.VoucherNo || "",
            VoucherDate: voucherDate,
            ChequeNo: emptyIfZero(header.ChequeNo),
            ChequeDate: chequeDate,
            ReceiptNo: emptyIfZero(header.ReceiptNo),
            ReceiptDate: receiptDate,
            F_VoucherType: String(header.F_VoucherType || header.VoucherType || header.F_VoucherTypeMaster || ""),
            Narration: emptyIfZero(header.Narration),
            Amount: "",
            PaymentMode: "",
            Discount: "",
          },
        }));
      }

      setState((prev) => ({ ...prev, formData: { ...prev.formData, F_VoucherMaster: String(id) } }));
    }

    // Store AmountInWords from VoucherH for print
    setState((prev) => ({
      ...prev,
      amountInWords: header?.AmountInWords ?? header?.AmountInWord ?? "",
    }));

    // Map lines according to API response format with F_LedgerMasterDr and F_LedgerMasterCr
    const mappedRows: GridRow[] = [];
    
    if (lines.length > 0) {
      lines.forEach((l: any) => {
        const amount = parseFloat(l.Amount || l.AmountL || "0");
        const ledgerDr = Number(l.F_LedgerMasterDr);
        const ledgerCr = Number(l.F_LedgerMasterCr);
        const lineType = String(l.CrDrType || l.Type || "").toLowerCase();

        const drLedgerName = l.DrLedgerName ?? (l as any).drLedgerName ?? "";
        const crLedgerName = l.CrLedgerName ?? (l as any).crLedgerName ?? "";

        // Preferred mapping: one API line => one grid row, based on CrDrType
        if (lineType === "dr" && ledgerDr) {
          const drAccount = accountMaster.find(
            (acc) => String(acc.Id) === String(l.F_LedgerMasterDr)
          );
          const drBalance = drAccount?.Balance !== undefined
            ? String(parseFloat(String(drAccount.Balance)).toFixed(2))
            : drAccount?.CurrentBalance !== undefined
              ? String(parseFloat(String(drAccount.CurrentBalance)).toFixed(2))
              : drAccount?.BalanceAmount !== undefined
                ? String(parseFloat(String(drAccount.BalanceAmount)).toFixed(2))
                : "";

          mappedRows.push({
            Type: "Dr",
            F_AccountMaster: String(l.F_LedgerMasterDr || ""),
            NameOfAccounts: drLedgerName || drAccount?.Name || "",
            DebitAmt: amount > 0 ? String(amount) : "",
            CreditAmt: "",
            Balance: drBalance,
          });
        } else if (lineType === "cr" && ledgerCr) {
          const crAccount = accountMaster.find(
            (acc) => String(acc.Id) === String(l.F_LedgerMasterCr)
          );
          const crBalance = crAccount?.Balance !== undefined
            ? String(parseFloat(String(crAccount.Balance)).toFixed(2))
            : crAccount?.CurrentBalance !== undefined
              ? String(parseFloat(String(crAccount.CurrentBalance)).toFixed(2))
              : crAccount?.BalanceAmount !== undefined
                ? String(parseFloat(String(crAccount.BalanceAmount)).toFixed(2))
                : "";

          mappedRows.push({
            Type: "Cr",
            F_AccountMaster: String(l.F_LedgerMasterCr || ""),
            NameOfAccounts: crLedgerName || crAccount?.Name || "",
            DebitAmt: "",
            CreditAmt: amount > 0 ? String(amount) : "",
            Balance: crBalance,
          });
        } else {
          // Backward compatibility for responses without CrDrType.
          if (ledgerDr) {
            const drAccount = accountMaster.find(
              (acc) => String(acc.Id) === String(l.F_LedgerMasterDr)
            );
            const drBalance = drAccount?.Balance !== undefined
              ? String(parseFloat(String(drAccount.Balance)).toFixed(2))
              : drAccount?.CurrentBalance !== undefined
                ? String(parseFloat(String(drAccount.CurrentBalance)).toFixed(2))
                : drAccount?.BalanceAmount !== undefined
                  ? String(parseFloat(String(drAccount.BalanceAmount)).toFixed(2))
                  : "";

            mappedRows.push({
              Type: "Dr",
              F_AccountMaster: String(l.F_LedgerMasterDr || ""),
              NameOfAccounts: drLedgerName || drAccount?.Name || "",
              DebitAmt: amount > 0 ? String(amount) : "",
              CreditAmt: "",
              Balance: drBalance,
            });
          }
          if (ledgerCr) {
            const crAccount = accountMaster.find(
              (acc) => String(acc.Id) === String(l.F_LedgerMasterCr)
            );
            const crBalance = crAccount?.Balance !== undefined
              ? String(parseFloat(String(crAccount.Balance)).toFixed(2))
              : crAccount?.CurrentBalance !== undefined
                ? String(parseFloat(String(crAccount.CurrentBalance)).toFixed(2))
                : crAccount?.BalanceAmount !== undefined
                  ? String(parseFloat(String(crAccount.BalanceAmount)).toFixed(2))
                  : "";

            mappedRows.push({
              Type: "Cr",
              F_AccountMaster: String(l.F_LedgerMasterCr || ""),
              NameOfAccounts: crLedgerName || crAccount?.Name || "",
              DebitAmt: "",
              CreditAmt: amount > 0 ? String(amount) : "",
              Balance: crBalance,
            });
          }
        }
        
        // Fallback: If neither F_LedgerMasterDr nor F_LedgerMasterCr exists, use old format
        if (!l.F_LedgerMasterDr && !l.F_LedgerMasterCr) {
          const account = l.F_AccountMaster 
            ? accountMaster.find((acc) => String(acc.Id) === String(l.F_AccountMaster))
            : null;
          const accountBalance = account?.Balance !== undefined 
            ? String(parseFloat(String(account.Balance)).toFixed(2))
            : account?.CurrentBalance !== undefined
            ? String(parseFloat(String(account.CurrentBalance)).toFixed(2))
            : account?.BalanceAmount !== undefined
            ? String(parseFloat(String(account.BalanceAmount)).toFixed(2))
            : "";
          
          mappedRows.push({
            Type: l.Type || "Cr",
            F_AccountMaster: String(l.F_AccountMaster || ""),
            NameOfAccounts: l.NameOfAccounts || account?.Name || "",
            DebitAmt: String(l.DebitAmt || ""),
            CreditAmt: String(l.CreditAmt || ""),
            Balance: l.Balance || accountBalance,
          });
        }
      });
    }

    // Merge rows: same Type + same Ledger => one row (sum amounts), merged rows at top
    const mergeMap = new Map<string, { row: GridRow; count: number }>();
    for (const row of mappedRows) {
      const key = `${row.Type}-${row.F_AccountMaster || "empty"}`;
      if (!row.F_AccountMaster) {
        mergeMap.set(key + "-" + Math.random(), { row: { ...row }, count: 1 });
        continue;
      }
      if (!mergeMap.has(key)) {
        mergeMap.set(key, { row: { ...row }, count: 1 });
      } else {
        const existing = mergeMap.get(key)!;
        existing.count += 1;
        const amt = parseFloat(row.DebitAmt || row.CreditAmt || "0");
        const existingAmt = parseFloat(existing.row.DebitAmt || existing.row.CreditAmt || "0");
        const total = existingAmt + amt;
        if (row.Type === "Dr") {
          existing.row.DebitAmt = total > 0 ? String(total) : "";
        } else {
          existing.row.CreditAmt = total > 0 ? String(total) : "";
        }
      }
    }
    const mergedRows: GridRow[] = [];
    const nonMergedRows: GridRow[] = [];
    mergeMap.forEach(({ row, count }) => {
      if (count > 1) mergedRows.push(row);
      else nonMergedRows.push(row);
    });
    let finalRows: GridRow[] = [...mergedRows, ...nonMergedRows];

    // Set base amount from first row when loading existing voucher (for add-row remaining logic)
    if (finalRows.length > 0) {
      const firstAmt = parseFloat(finalRows[0].DebitAmt || finalRows[0].CreditAmt || "0") || 0;
      baseAmountRef.current = firstAmt;
    } else {
      baseAmountRef.current = 0;
    }
    
    // If no rows were mapped, add a default empty row
    if (finalRows.length === 0) {
      finalRows = [{
        Type: "Cr",
        F_AccountMaster: "",
        NameOfAccounts: "",
        DebitAmt: "",
        CreditAmt: "",
        Balance: "",
      }];
    }
    
    setGridRows(finalRows);
    } catch (error) {
      setState((prev) => ({ ...prev, isEditMode: false }));
      throw error; // Re-throw to be caught by handleCreatedVoucherChange
    }
  };

  // Form field navigation: Enter/Tab = next, Shift+Tab = previous
  const handleFormKeyDown = (event: React.KeyboardEvent, fieldName: string) => {
    if (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey)) {
      event.preventDefault();
      switch (fieldName) {
        case "VoucherType":
          voucherNoRef.current?.focus();
          break;
        case "VoucherNo":
          voucherDateRef.current?.focus();
          break;
        case "VoucherDate":
          referenceNoRef.current?.focus();
          break;
        case "ReferenceNo":
          referenceDateRef.current?.focus();
          break;
        case "ReferenceDate":
          if (state.formData.F_VoucherType === "2" || state.formData.F_VoucherType === "3") {
            receiptNoRef.current?.focus();
          } else {
            if (gridRows.length > 0) {
              setTimeout(() => {
                const firstTypeRef = document.querySelector('select[data-row="0"][data-field="Type"]') as HTMLSelectElement;
                if (firstTypeRef) firstTypeRef.focus();
              }, 50);
            }
          }
          break;
        case "ReceiptNo":
          receiptDateRef.current?.focus();
          break;
        case "ReceiptDate":
          if (gridRows.length > 0) {
            setTimeout(() => {
              const firstTypeRef = document.querySelector('select[data-row="0"][data-field="Type"]') as HTMLSelectElement;
              if (firstTypeRef) firstTypeRef.focus();
            }, 50);
          }
          break;
        default:
          break;
      }
    } else if (event.key === "Tab" && event.shiftKey) {
      event.preventDefault();
      switch (fieldName) {
        case "VoucherNo":
          voucherTypeRef.current?.focus();
          break;
        case "VoucherDate":
          voucherNoRef.current?.focus();
          break;
        case "ReferenceNo":
          voucherDateRef.current?.focus();
          break;
        case "ReferenceDate":
          referenceNoRef.current?.focus();
          break;
        case "ReceiptNo":
          referenceDateRef.current?.focus();
          break;
        case "ReceiptDate":
          receiptNoRef.current?.focus();
          break;
        case "VoucherType":
          searchVoucherRef.current?.focus();
          break;
        default:
          break;
      }
    }
  };

  const handleSubmit = async () => {
    if (!state.formData.VoucherNo || String(state.formData.VoucherNo).trim() === "") {
      alert("Please enter Voucher No");
      setTimeout(() => voucherNoRef.current?.focus(), 0);
      return;
    }

    
    // Validate grid rows
    for (let i = 0; i < gridRows.length; i++) {
      const row = gridRows[i];
      const hasAccount = !!row.F_AccountMaster;
      const hasDebit = parseFloat(row.DebitAmt) > 0;
      const hasCredit = parseFloat(row.CreditAmt) > 0;
      const hasAmount = hasDebit || hasCredit;

      // Security validation: Check Type and Amount combination (prevents devtools manipulation)
      if (row.Type === "Cr") {
        // If Type is Credit, DebitAmt must be 0 or empty, CreditAmt must be > 0
        const debitValue = parseFloat(row.DebitAmt) || 0;
        const creditValue = parseFloat(row.CreditAmt) || 0;

        if (debitValue > 0) {
          alert(`Row ${i + 1}: Invalid data! When Type is "Cr", Debit Amount must be zero. Please correct the data.`);
          return;
        }

        if (creditValue <= 0) {
          alert(`Row ${i + 1}: Invalid data! When Type is "Cr", Credit Amount must be greater than zero.`);
          return;
        }
      } else if (row.Type === "Dr") {
        // If Type is Debit, CreditAmt must be 0 or empty, DebitAmt must be > 0
        const debitValue = parseFloat(row.DebitAmt) || 0;
        const creditValue = parseFloat(row.CreditAmt) || 0;

        if (creditValue > 0) {
          alert(`Row ${i + 1}: Invalid data! When Type is "Dr", Credit Amount must be zero. Please correct the data.`);
          return;
        }

        if (debitValue <= 0) {
          alert(`Row ${i + 1}: Invalid data! When Type is "Dr", Debit Amount must be greater than zero.`);
          return;
        }
      }

      if (!hasAccount || !hasAmount) {
        const missing = [];
        if (!hasAccount) missing.push("Name Of Accounts");
        if (!hasAmount) missing.push("Debit Amount or Credit Amount");
        alert(`Row ${i + 1}: Please fill ${missing.join(", ")}`);
        return;
      }
    }

    // Validate totals - Debit should equal Credit
    if (Math.abs(totals.totalDebit - totals.totalCredit) > 0.01) {
      alert(`Total Debit (${totals.totalDebit.toFixed(2)}) must equal Total Credit (${totals.totalCredit.toFixed(2)})`);
      return;
    }

    const obj = JSON.parse(localStorage.getItem("user") || "{}");
    
    let formData = new FormData();

    // StrVoucherL format: F_LedgerMasterDr~F_LedgerMasterCr~Amount#
    // Example: 3~2~1000#
    const buildCommonStrL = (rows: GridRow[]) => {
      const debits: Array<{ ledgerId: string; amount: number }> = [];
      const credits: Array<{ ledgerId: string; amount: number }> = [];

      rows.forEach((r) => {
        const account = state.AccountMaster.find((acc) => String(acc.Id) === String(r.F_AccountMaster));
        const ledgerId = String(account?.F_LedgerMaster || account?.Id || r.F_AccountMaster || "0");
        const debitAmt = parseFloat(r.DebitAmt || "0") || 0;
        const creditAmt = parseFloat(r.CreditAmt || "0") || 0;

        if (debitAmt > 0) debits.push({ ledgerId, amount: debitAmt });
        if (creditAmt > 0) credits.push({ ledgerId, amount: creditAmt });
      });

      const rowStrings: string[] = [];
      let d = 0;
      let c = 0;

      // Pair debit and credit amounts sequentially to build StrL rows.
      while (d < debits.length && c < credits.length) {
        const pairAmount = Math.min(debits[d].amount, credits[c].amount);
        if (pairAmount > 0) {
          rowStrings.push([debits[d].ledgerId, credits[c].ledgerId, String(pairAmount)].join("~"));
        }

        debits[d].amount -= pairAmount;
        credits[c].amount -= pairAmount;

        if (debits[d].amount <= 0.000001) d++;
        if (credits[c].amount <= 0.000001) c++;
      }

      return rowStrings;
    };

    // VoucherH parameters: F_VoucherTypeMaster, VoucherNo, VoucherDate, ChequeNo, ChequeDate, ReceiptNo, ReceiptDate, Amount, Narration, UserId, StrVoucherL
    formData.append("F_VoucherTypeMaster", state.formData.F_VoucherType || "0");
    formData.append("VoucherNo", state.formData.VoucherNo || "0");
    formData.append("VoucherDate", state.formData.VoucherDate || "");
    formData.append("ChequeNo", state.formData.ChequeNo || "0");
    formData.append("ChequeDate", state.formData.ChequeDate || "");
    formData.append("ReceiptNo", state.formData.ReceiptNo || "0");
    formData.append("ReceiptDate", state.formData.ReceiptDate || "");
    formData.append("Amount", String(totals.totalDebit + totals.totalCredit)); // Dr + Cr total (e.g. 5000+5000=10000)
    formData.append("Narration", state.formData.Narration || "0");
    formData.append("UserId", obj === undefined || obj === null ? "0" : String(obj.uid || obj.id || "0"));
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

    const rowStrings = buildCommonStrL(gridRows);
    const gridDataString = rowStrings.join("#") + "#";
    formData.append("StrVoucherL", gridDataString);

    const voucherId = Number(state.formData.F_VoucherMaster || 0);
    if (voucherId > 0) {
      formData.append("Id", String(voucherId));
    }

    const res = await Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: voucherId > 0 ? voucherId : 0, formData } },
      API_SAVE,
      true,
      undefined,
      navigate,
      "#"
    );
    
    // Refresh CreatedVouchers list
    const updatedVouchers = await Fn_FillListData(dispatch, setState, "CreatedVouchers", API_H + "/Id/0");

    // New voucher save: always reset page. Edit mode: load saved record.
    const wasNewVoucher = voucherId === 0;
    const nextRecordId = (res as any)?.id || state.formData.F_VoucherMaster || getLastCreatedVoucherId(updatedVouchers);

    if (nextRecordId && !wasNewVoucher) {
      // Edit/Update: Load the saved voucher record
      await loadVoucherRecord(nextRecordId);
    } else {
      // After successful save, fetch new Voucher No and reset form
      const today = getCurrentDateYYYYMMDD();

      try {
        const voucherType = state.formData.F_VoucherType || "1";
        const res = await Fn_FillListData(dispatch, setState, "GetVoucherNo", getVoucherNoApiUrl(voucherType));

        const newVoucherNo = res && res.length > 0 && res[0].VoucherNo ? res[0].VoucherNo : "";

        setState((prevState) => ({
          ...prevState,
          VoucherNo: newVoucherNo || prevState.VoucherNo || "",
          formData: {
            VoucherNo: newVoucherNo || prevState.VoucherNo || "",
            VoucherDate: today,
            ChequeNo: "",
            ChequeDate: "",
            ReceiptNo: "",
            ReceiptDate: "",
            F_VoucherMaster: "",
            F_VoucherType: "",
            Narration: "",
            Amount: "",
            PaymentMode: "",
            Discount: "",
            RequestNo: "",
            CBC: "",
            EBC: "",
            ODC: "",
            F_BankMaster1: "",
            F_BankBranchMaster1: "",
            F_BankAccountNo1: "",
            F_BankMaster2: "",
            F_BankBranchMaster2: "",
            F_BankAccountNo2: "",
            DDCharge: "",
            IsReceiptPrinted: false,
            AutoReceiptNo: "",
            PenaltyAmount: "",
          },
          isEditMode: false,
        }));
      } catch (error) {
        console.error("Error fetching new Voucher No:", error);
        // Fallback: just reset with empty voucher no
        setState((prevState) => ({
          ...prevState,
          formData: {
            VoucherNo: "",
            VoucherDate: today,
            ChequeNo: "",
            ChequeDate: "",
            ReceiptNo: "",
            ReceiptDate: "",
            F_VoucherMaster: "",
            F_VoucherType: "",
            Narration: "",
            Amount: "",
            PaymentMode: "",
            Discount: "",
            RequestNo: "",
            CBC: "",
            EBC: "",
            ODC: "",
            F_BankMaster1: "",
            F_BankBranchMaster1: "",
            F_BankAccountNo1: "",
            F_BankMaster2: "",
            F_BankBranchMaster2: "",
            F_BankAccountNo2: "",
            DDCharge: "",
            IsReceiptPrinted: false,
            AutoReceiptNo: "",
            PenaltyAmount: "",
          },
          isEditMode: false,
        }));
      }

      baseAmountRef.current = 0;
      setGridRows([
        {
          Type: "Cr",
          F_AccountMaster: "",
          NameOfAccounts: "",
          DebitAmt: "",
          CreditAmt: "",
          Balance: "",
        },
      ]);
    }

    setTimeout(() => {
      voucherNoRef.current?.focus();
    }, 0);  
  };

  // Helper functions similar to purchaseOrder.js
  const getLastCreatedVoucherId = (sourceList?: any[]) => {
    const list = Array.isArray(sourceList) && sourceList.length > 0
      ? sourceList
      : (state.CreatedVouchers || []);

    if (!Array.isArray(list) || list.length === 0) {
      return null;
    }

    const lastEntry = list[list.length - 1];
    return (
      lastEntry?.ID ??
      lastEntry?.Id ??
      lastEntry?.id ??
      lastEntry?.F_VoucherMaster ??
      lastEntry?.VoucherId ??
      null
    );
  };

  const setSelectedVoucher = (voucherId: string) => {
    setState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        F_VoucherMaster: voucherId || "",
      },
    }));
  };

  const loadVoucherRecord = async (recordId: number | string) => {
    if (!recordId) return false;
    const numericId = Number(recordId);
    if (isNaN(numericId) || numericId <= 0) {
      return false;
    }
    
    try {
      await DataFillFunction(numericId, state.AccountMaster);
      setSelectedVoucher(String(numericId));
      return true;
    } catch (error) {
      alert("Failed to load voucher data. Please try again.");
      // Don't reset the dropdown on error - let user see what they selected
      return false;
    }
  };

  const selectLastVoucherRecord = async (listOverride?: any[]) => {
    const targetId = getLastCreatedVoucherId(listOverride);
    if (!targetId) return null;
    const success = await loadVoucherRecord(targetId);
    return success ? targetId : null;
  };

  const handleCreatedVoucherChange = async (voucherId: string) => {
    if (!voucherId || voucherId === "" || voucherId === "0") {
      // Reset form when no voucher is selected
      setState((prev) => ({ ...prev, isEditMode: false, amountInWords: "" }));
      baseAmountRef.current = 0;
      setGridRows([
        {
          Type: "Cr",
          F_AccountMaster: "",
          NameOfAccounts: "",
          DebitAmt: "",
          CreditAmt: "",
          Balance: "",
        },
      ]);
      return;
    }
    
    try {
      await loadVoucherRecord(voucherId);
    } catch (error) {
      // Don't reset dropdown - keep the selection
    }
  };

  const handleVoucherTypeChange = async (voucherTypeId: string) => {
    if (state.isEditMode) return;
    if (!voucherTypeId || voucherTypeId.trim() === "") {
      setState((prev) => ({
        ...prev,
        VoucherNo: "",
        formData: { ...prev.formData, VoucherNo: "" },
      }));
      return;
    }
    try {
      const res = await Fn_FillListData(dispatch, setState, "GetVoucherNo", getVoucherNoApiUrl(voucherTypeId));
      const newVoucherNo = res && res.length > 0 && res[0].VoucherNo ? res[0].VoucherNo : "";
      setState((prev) => ({
        ...prev,
        VoucherNo: newVoucherNo,
        formData: { ...prev.formData, VoucherNo: newVoucherNo },
      }));
    } catch (error) {
      console.error("Error fetching Voucher No for type:", voucherTypeId, error);
      setState((prev) => ({
        ...prev,
        VoucherNo: "",
        formData: { ...prev.formData, VoucherNo: "" },
      }));
    }
  };

  const handleDelete = async () => {
    if (!state.formData.F_VoucherMaster) {
      alert("Please select a voucher to delete.");
      return;
    }
    const F_VoucherMasterH = state.formData.F_VoucherMaster;
    const confirmed = window.confirm("Are you sure you want to delete this Voucher?");
    if (!confirmed) return;
    try {
      await Fn_DeleteData(dispatch, setState, Number(F_VoucherMasterH), API_H, API_H + "/Id/0");
      toast.success("Data deleted successfully");
      // Reset form and grid on success
      const today = getCurrentDateYYYYMMDD();
      setState((prevState) => ({
          ...prevState,
          formData: {
            VoucherNo: prevState.VoucherNo || "",
            VoucherDate: today,
            ChequeNo: "",
            ChequeDate: "",
            ReceiptNo: "",
            ReceiptDate: "",
            F_VoucherMaster: "",
            F_VoucherType: "",
            Narration: "",
            Amount: "",
            PaymentMode: "",
            Discount: "",
            RequestNo: "",
            CBC: "",
            EBC: "",
            ODC: "",
            F_BankMaster1: "",
            F_BankBranchMaster1: "",
            F_BankAccountNo1: "",
            F_BankMaster2: "",
            F_BankBranchMaster2: "",
            F_BankAccountNo2: "",
            DDCharge: "",
            IsReceiptPrinted: false,
            AutoReceiptNo: "",
            PenaltyAmount: "",
          },
        isEditMode: false,
      }));

      baseAmountRef.current = 0;
      setGridRows([
          {
            Type: "Cr",
            F_AccountMaster: "",
            NameOfAccounts: "",
            DebitAmt: "",
            CreditAmt: "",
            Balance: "",
        },
      ]);

      // Refresh Voucher list
      await Fn_FillListData(dispatch, setState, "CreatedVouchers", API_H + "/Id/0");
    } catch (error) {
      console.error("Error deleting Voucher:", error);
      alert("An error occurred while deleting the Voucher.");
    }
  };

  const handleReset = () => {
    const today = getCurrentDateYYYYMMDD();
    setState((prevState) => ({
      ...prevState,
      formData: {
        VoucherNo: prevState.VoucherNo || "",
        VoucherDate: today,
        ChequeNo: "",
        ChequeDate: "",
        ReceiptNo: "",
        ReceiptDate: "",
        F_VoucherMaster: "",
        F_VoucherType: "",
        Narration: "",
        Amount: "",
        PaymentMode: "",
        Discount: "",
        RequestNo: "",
        CBC: "",
        EBC: "",
        ODC: "",
        F_BankMaster1: "",
        F_BankBranchMaster1: "",
        F_BankAccountNo1: "",
        F_BankMaster2: "",
        F_BankBranchMaster2: "",
        F_BankAccountNo2: "",
        DDCharge: "",
        IsReceiptPrinted: false,
        AutoReceiptNo: "",
        PenaltyAmount: "",
      },
      isEditMode: false,
      amountInWords: "",
    }));
    baseAmountRef.current = 0;
    setGridRows([
      {
        Type: "Cr",
        F_AccountMaster: "",
        NameOfAccounts: "",
        DebitAmt: "",
        CreditAmt: "",
        Balance: "",
      },
    ]);
    setTimeout(() => voucherTypeRef.current?.focus(), 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const voucherEntryCompactStyles = `
    @media (max-width: 991.98px) {
      .voucher-entry-page .container-fluid { padding-left: 0.4rem !important; padding-right: 0.4rem !important; }
      .voucher-entry-page .card-body { padding: 0.4rem !important; }
      .voucher-entry-page .card-footer { padding: 0.35rem 0.4rem !important; }
      .voucher-entry-page .form-label { font-size: 0.75rem; margin-bottom: 0.2rem; }
      .voucher-entry-page .form-control, .voucher-entry-page input, .voucher-entry-page select, .voucher-entry-page textarea {
        font-size: 0.8rem; height: calc(1.4em + 0.35rem); padding: 0.2rem 0.35rem; min-height: 26px;
      }
      .voucher-entry-page textarea.form-control { min-height: 48px; }
      .voucher-entry-page .btn { font-size: 0.8rem; padding: 0.22rem 0.4rem; }
      .voucher-entry-page .card-title { font-size: 0.9rem; }
      .voucher-entry-page .row.g-2, .voucher-entry-page .row.g-3 { --bs-gutter-y: 0.3rem; --bs-gutter-x: 0.3rem; }
    }
    @media (max-width: 767.98px) {
      .voucher-entry-page .container-fluid { padding-left: 0.25rem !important; padding-right: 0.25rem !important; }
      .voucher-entry-page .card-body { padding: 0.3rem !important; }
      .voucher-entry-page .card-footer { padding: 0.25rem 0.3rem !important; }
      .voucher-entry-page .form-label { font-size: 0.7rem; margin-bottom: 0.15rem; }
      .voucher-entry-page .form-control, .voucher-entry-page input, .voucher-entry-page select, .voucher-entry-page textarea {
        font-size: 0.75rem; height: calc(1.35em + 0.3rem); padding: 0.15rem 0.28rem; min-height: 24px;
      }
      .voucher-entry-page textarea.form-control { min-height: 42px; }
      .voucher-entry-page .btn { font-size: 0.75rem; padding: 0.18rem 0.35rem; }
      .voucher-entry-page .card-title { font-size: 0.85rem; }
      .voucher-entry-page .row.g-2, .voucher-entry-page .row.g-3 { --bs-gutter-y: 0.25rem; --bs-gutter-x: 0.25rem; }
    }
    /* ── Voucher Print Layout ── */
    .voucher-print-layout { display: none; }
    @media print {
      body * { visibility: hidden; }
      .voucher-print-layout, .voucher-print-layout * { visibility: visible; }
      .voucher-print-layout {
        display: block !important;
        position: absolute;
        left: 0; top: 0;
        width: 100%;
        padding: 20px;
        background: white;
        color: black;
        font-family: Arial, sans-serif;
      }
      .voucher-print-layout table { width: 100%; border-collapse: collapse; }
      .voucher-print-layout th, .voucher-print-layout td { border: 1px solid #333; padding: 6px 8px; font-size: 12px; }
      .voucher-print-layout th { background: #f0f0f0; -webkit-print-color-adjust: exact; }
      .page-wrapper, .page-body-wrapper { margin: 0 !important; padding: 0 !important; }
    }
  `;

  return (
    <div className="page-body voucher-entry-page" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <style>{voucherEntryCompactStyles}</style>
      <Breadcrumbs mainTitle="Voucher Entry" parent="Transactions" />
      <Container fluid className="px-2 px-sm-3">
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title={`${state.isEditMode ? "Edit" : "Add"} Voucher Entry`} tagClass="card-title mb-0" />
              <CardBody className="p-2 p-sm-3">
                <Row className="g-2 g-sm-3">
                  <Col xs="12" sm="6" lg="3">
                    <label htmlFor="F_VoucherMaster" className="form-label">
                      Select Voucher
                    </label>
                    <Input
                      type="select"
                      name="F_VoucherMaster"
                      value={state.formData.F_VoucherMaster || ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        
                        if (!id || id === "") {
                          setState((prev) => ({
                            ...prev,
                            formData: {
                              ...prev.formData,
                              F_VoucherMaster: "",
                            },
                            isEditMode: false,
                            amountInWords: "",
                          }));
                          baseAmountRef.current = 0;
                          setGridRows([
                            {
                              Type: "Cr",
                              F_AccountMaster: "",
                              NameOfAccounts: "",
                              DebitAmt: "",
                              CreditAmt: "",
                              Balance: "",
                            },
                          ]);
                          return;
                        }
                        
                        // Update state immediately to reflect dropdown selection
                        setState((prev) => ({
                          ...prev,
                          formData: {
                            ...prev.formData,
                            F_VoucherMaster: id,
                          },
                        }));
                        // Then load voucher data asynchronously
                        handleCreatedVoucherChange(id).catch(() => {
                          // Error already handled in loadVoucherRecord
                        });
                      }}
                      innerRef={searchVoucherRef as any}
                    >
                      <option value="">Select Voucher...</option>
                      {state.CreatedVouchers && Array.isArray(state.CreatedVouchers) && state.CreatedVouchers.map((voucher, index) => {
                        const voucherId = voucher.Id || voucher.id || voucher.ID || "";
                        const voucherValue = String(voucherId);
                        return (
                          <option key={voucherId ? `voucher-${voucherId}` : `voucher-${index}`} value={voucherValue}>
                            {voucher.VoucherNo || voucher.Name || voucherId || `Voucher ${index + 1}`}
                          </option>
                        );
                      })}
                    </Input>
                  </Col>

                  <Col xs="12" sm="6" lg="3">
                    <label htmlFor="F_VoucherType" className="form-label">
                      Voucher Type
                    </label>
                    <Input
                      innerRef={voucherTypeRef as any}
                      type="select"
                      name="F_VoucherType"
                      value={state.formData.F_VoucherType}
                      onKeyDown={(e) => handleFormKeyDown(e, "VoucherType")}
                      onChange={async (e) => {
                        const voucherTypeId = e.target.value;
                        setState((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, F_VoucherType: voucherTypeId },
                        }));
                        await handleVoucherTypeChange(voucherTypeId);
                      }}
                      disabled={state.isEditMode}
                    >
                      <option value="">Select Voucher Type...</option>
                      {state.VoucherTypeMaster.map((voucherType, index) => (
                        <option key={voucherType.Id || voucherType.ID || `voucherType-${index}`} value={String(voucherType.Id || voucherType.ID || "")}>
                          {voucherType.Name || voucherType.VoucherType || voucherType.Id || voucherType.ID}
                        </option>
                      ))}
                    </Input>
                  </Col>
                  <Col xs="12" sm="6" lg="3">
                    <label htmlFor="VoucherNo" className="form-label">
                      Voucher No.
                    </label>
                    <Input
                      innerRef={voucherNoRef}
                      type="text"
                      name="VoucherNo"
                      value={state.formData.VoucherNo}
                      placeholder="Enter Voucher No"
                      onKeyDown={(e) => handleFormKeyDown(e, "VoucherNo")}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, VoucherNo: e.target.value },
                        }))
                      }
                      disabled={state.isEditMode}
                    />
                  </Col>
                  <Col xs="12" sm="6" lg="3">
                    <label htmlFor="VoucherDate" className="form-label">
                      Voucher Date
                    </label>
                    <DateInput
                      innerRef={voucherDateRef}
                      name="VoucherDate"
                      value={state.formData.VoucherDate}
                      onKeyDown={(e: React.KeyboardEvent) => handleFormKeyDown(e, "VoucherDate")}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setState((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, VoucherDate: e.target.value },
                        }))
                      }
                      disabled={state.isEditMode}
                    />
                  </Col>
                  <Col xs="12" sm="6" lg="3">
                    <label htmlFor="ChequeNo" className="form-label">
                      Reference No.
                    </label>
                    <Input
                      innerRef={referenceNoRef}
                      type="text"
                      name="ChequeNo"
                      value={state.formData.ChequeNo}
                      onKeyDown={(e) => handleFormKeyDown(e, "ReferenceNo")}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, ChequeNo: e.target.value },
                        }))
                      }
                      disabled={state.isEditMode}
                    />
                  </Col>
                  <Col xs="12" sm="6" lg="3">
                    <label htmlFor="ChequeDate" className="form-label">
                      Reference Date
                    </label>
                    <DateInput
                      innerRef={referenceDateRef}
                      name="ChequeDate"
                      value={state.formData.ChequeDate}
                      onKeyDown={(e: React.KeyboardEvent) => handleFormKeyDown(e, "ReferenceDate")}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setState((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, ChequeDate: e.target.value },
                        }))
                      }
                      disabled={state.isEditMode}
                    />
                  </Col>
                  {(state.formData.F_VoucherType === "2" || state.formData.F_VoucherType === "3") && (
                    <>
                      <Col xs="12" sm="6" lg="3">
                        <label htmlFor="ReceiptNo" className="form-label">
                          Receipt No.
                        </label>
                        <Input
                          innerRef={receiptNoRef}
                          type="text"
                          name="ReceiptNo"
                          value={state.formData.ReceiptNo}
                          onKeyDown={(e) => handleFormKeyDown(e, "ReceiptNo")}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              formData: { ...prev.formData, ReceiptNo: e.target.value },
                            }))
                          }
                          disabled={state.isEditMode}
                        />
                      </Col>
                      <Col xs="12" sm="6" lg="3">
                        <label htmlFor="ReceiptDate" className="form-label">
                          Receipt Date
                        </label>
                        <DateInput
                          innerRef={receiptDateRef}
                          name="ReceiptDate"
                          value={state.formData.ReceiptDate}
                          onKeyDown={(e: React.KeyboardEvent) => handleFormKeyDown(e, "ReceiptDate")}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setState((prev) => ({
                              ...prev,
                              formData: { ...prev.formData, ReceiptDate: e.target.value },
                            }))
                          }
                          disabled={state.isEditMode}
                        />
                      </Col>
                    </>
                  )}
                </Row>

                <Row className="mt-3">
                  <Col xs="12" className="overflow-auto">
                    <GridSystemVoucherEntry
                      gridRows={gridRows}
                      accountMaster={state.AccountMaster}
                      accountMasterBankAndCash={state.AccountMasterBankAndCash}
                      voucherTypeId={state.formData.F_VoucherType}
                      onAddRow={addRow}
                      onRemoveRow={removeRow}
                      onUpdateRow={updateGridRow}
                      onRemoveButtonTabFocus={narrationRef}
                      onShiftTabToForm={() => {
                        if (state.formData.F_VoucherType === "2" || state.formData.F_VoucherType === "3") {
                          receiptDateRef.current?.focus();
                        } else {
                          referenceDateRef.current?.focus();
                        }
                      }}
                      focusNewRowIndex={state.focusNewRowIndex}
                      onFocusNewRowComplete={() => setState((prev) => ({ ...prev, focusNewRowIndex: null }))}
                      disabled={state.isEditMode}
                    />
                  </Col>
                </Row>

                <Row className="mt-3 g-2 g-sm-3">
                  <Col xs="12" md="6">
                    <label htmlFor="Narration" className="form-label">
                      Narration
                    </label>
                    <Input
                      innerRef={narrationRef}
                      type="textarea"
                      name="Narration"
                      rows={3}
                      value={state.formData.Narration}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, Narration: e.target.value },
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
                          e.preventDefault();
                          saveButtonRef.current?.focus();
                        }
                      }}
                      disabled={state.isEditMode}
                      placeholder="Enter narration..."
                    />
                  </Col>
                  <Col xs="12" md="6">
                    <Row className="g-2 mt-2 mt-md-4">
                      <Col xs="12" sm="4">
                        <label className="form-label">Tot Dr.</label>
                        <Input
                          type="text"
                          className="form-control"
                          value={totals.totalDebit.toFixed(2)}
                          readOnly
                          style={{ textAlign: "right" }}
                        />
                      </Col>
                      <Col xs="12" sm="4">
                        <label className="form-label">Tot Cr.</label>
                        <Input
                          type="text"
                          className="form-control"
                          value={totals.totalCredit.toFixed(2)}
                          readOnly
                          style={{ textAlign: "right" }}
                        />
                      </Col>
                      <Col xs="12" sm="4">
                        <label className="form-label">Cur. Bal.</label>
                        <Input
                          type="text"
                          className="form-control"
                          value={totals.balance.toFixed(2)}
                          readOnly
                          style={{ textAlign: "right" }}
                        />
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter className="d-flex flex-row flex-nowrap gap-2 justify-content-end p-2 p-sm-3">
                {state.isEditMode && (
                  <Btn
                    color="warning"
                    type="button"
                    className="m-0"
                    onClick={() => {
                      setState((prev) => ({ ...prev, isEditMode: false }));
                      setTimeout(() => voucherTypeRef.current?.focus(), 100);
                    }}
                  >
                    Edit
                  </Btn>
                )}
                {state.isEditMode && (
                  <Btn color="danger" type="button" className="m-0" onClick={handleDelete}>
                    Delete
                  </Btn>
                )}
                {!state.isEditMode && (
                  <button
                    ref={saveButtonRef}
                    type="button"
                    className="btn btn-primary m-0"
                    onClick={() => handleSubmit()}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  >
                    Save
                  </button>
                )}
                <Btn color="secondary" type="button" className="m-0" onClick={handleReset}>
                  Reset
                </Btn>
                <Btn color="success" type="button" className="m-0" onClick={handlePrint}>
                  Print
                </Btn>
                <Btn color="secondary" type="button" className="m-0" onClick={() => navigate(-1)}>
                  Cancel
                </Btn>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Hidden Print Layout */}
      <div className="voucher-print-layout">
        <div className="text-center border-bottom pb-3 mb-3" style={{ borderColor: "#333" }}>
          <h2 style={{ fontWeight: "bold", marginBottom: "4px" }}>{state.printCompanyName || "—"}</h2>
          {state.printFirmAddress ? (
            <p style={{ fontSize: "14px", margin: "0" }}>{state.printFirmAddress}</p>
          ) : null}
        </div>

        <h3 className="text-center text-uppercase mb-3" style={{ fontSize: "16px", fontWeight: "bold", textDecoration: "underline" }}>
          {(state.VoucherTypeMaster || []).find((v: any) => String(v.Id || v.ID) === String(state.formData.F_VoucherType))?.Name ||
            (state.VoucherTypeMaster || []).find((v: any) => String(v.Id || v.ID) === String(state.formData.F_VoucherType))?.VoucherType ||
            "Voucher"}
        </h3>

        <table style={{ width: "100%", marginBottom: "12px", fontSize: "13px", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "33.33%", verticalAlign: "top", padding: "2px 8px 4px 0" }}>
                <strong>Voucher No:</strong> {state.formData.VoucherNo || "—"}
              </td>
              <td style={{ width: "33.33%", verticalAlign: "top", padding: "2px 8px 4px 0" }}>
                <strong>Voucher Date:</strong> {state.formData.VoucherDate || "—"}
              </td>
              <td style={{ width: "33.33%", verticalAlign: "top", padding: "2px 0 4px 0" }}>
                <strong>Reference No:</strong> {state.formData.ChequeNo || "—"}
              </td>
            </tr>
            <tr>
              <td style={{ width: "33.33%", verticalAlign: "top", padding: "2px 8px 0 0" }}>
                <strong>Reference Date:</strong> {state.formData.ChequeDate || "—"}
              </td>
              <td style={{ width: "33.33%", verticalAlign: "top", padding: "2px 8px 0 0" }}>
                <strong>Receipt No:</strong> {state.formData.F_VoucherType === "2" || state.formData.F_VoucherType === "3" ? (state.formData.ReceiptNo || "—") : "—"}
              </td>
              <td style={{ width: "33.33%", verticalAlign: "top", padding: "2px 0 0 0" }}>
                <strong>Receipt Date:</strong> {state.formData.F_VoucherType === "2" || state.formData.F_VoucherType === "3" ? (state.formData.ReceiptDate || "—") : "—"}
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ textAlign: "left", padding: "6px 8px", border: "1px solid #333" }}>Type</th>
              <th style={{ textAlign: "left", padding: "6px 8px", border: "1px solid #333" }}>Name Of Accounts</th>
              <th style={{ textAlign: "right", padding: "6px 8px", border: "1px solid #333" }}>Debit</th>
              <th style={{ textAlign: "right", padding: "6px 8px", border: "1px solid #333" }}>Credit</th>
            </tr>
          </thead>
          <tbody>
            {gridRows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ padding: "6px 8px", border: "1px solid #333" }}>{row.Type}</td>
                <td style={{ padding: "6px 8px", border: "1px solid #333" }}>{row.NameOfAccounts || "—"}</td>
                <td style={{ textAlign: "right", padding: "6px 8px", border: "1px solid #333" }}>
                  {row.DebitAmt ? parseFloat(row.DebitAmt).toFixed(2) : "0.00"}
                </td>
                <td style={{ textAlign: "right", padding: "6px 8px", border: "1px solid #333" }}>
                  {row.CreditAmt ? parseFloat(row.CreditAmt).toFixed(2) : "0.00"}
                </td>
              </tr>
            ))}
            <tr style={{ fontWeight: "bold", borderTop: "2px solid #333" }}>
              <td colSpan={2} style={{ textAlign: "right", padding: "6px 8px", border: "1px solid #333" }}>Total</td>
              <td style={{ textAlign: "right", padding: "6px 8px", border: "1px solid #333" }}>{totals.totalDebit.toFixed(2)}</td>
              <td style={{ textAlign: "right", padding: "6px 8px", border: "1px solid #333" }}>{totals.totalCredit.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {state.amountInWords ? (
          <p style={{ marginTop: "12px", marginBottom: "8px", fontSize: "13px" }}>
            <strong>Amount in words:</strong> {state.amountInWords}
          </p>
        ) : null}

        {state.formData.Narration ? (
          <p style={{ marginTop: "8px", marginBottom: "12px", fontSize: "13px" }}>
            <strong>Narration:</strong> {state.formData.Narration}
          </p>
        ) : null}

        <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ fontSize: "12px" }}>E &amp; O E</span>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "13px" }}>For {state.printCompanyName || "—"}</div>
            <div style={{ fontSize: "12px", marginTop: "4px" }}>Authorised Signatory</div>
          </div>
        </div>
        <hr style={{ marginTop: "8px", border: "none", borderTop: "1px solid #333" }} />
      </div>
    </div>
  );
};

export default VoucherEntry;
