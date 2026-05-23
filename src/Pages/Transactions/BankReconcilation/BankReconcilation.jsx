import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Table, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_GetReport, Fn_AddEditData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import * as XLSX from "xlsx";

const BankReconcilation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State for form fields
  const [bankAccountId, setBankAccountId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [openingBalance, setOpeningBalance] = useState(0); // Bank Books Opening Balance (AUTO FILL)
  const [openingBalanceType, setOpeningBalanceType] = useState("CR"); // CR or DR
  const [bankStatementOpeningBalance, setBankStatementOpeningBalance] = useState(""); // Bank Statement Opening Balance (MANUAL)
  const [bankStatementOpeningBalanceType, setBankStatementOpeningBalanceType] = useState("DR"); // DR or CR

  // State for data: left = bank book (from API), right = bank statement (from Excel import)
  const [bankAccountList, setBankAccountList] = useState([]);
  const [transactionList, setTransactionList] = useState([]); // Left side - Bank Book
  const [bankStatementList, setBankStatementList] = useState([]); // Right side - Imported statement
  const [isLoading, setIsLoading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0); // Key to force file input reset
  const fileInputRef = useRef(null);
  
  // State for reconciliation
  const [unmatchedEntries, setUnmatchedEntries] = useState([]);
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);

  // Load bank accounts on mount
  useEffect(() => {
    const loadBankAccounts = async () => {
      try {
        // API format: GetBankNames/Id/4 (where 4 is F_LedgerGroupMaster for Bank Accounts)
        const bankAccounts = await Fn_FillListData(
          dispatch,
          (prevState) => ({ ...prevState, bankAccounts: [] }),
          "bankAccounts",
          `${API_WEB_URLS.MASTER}/0/token/GetBankNames/Id/4`
        );
        console.log("Bank Accounts Data:", bankAccounts);
        setBankAccountList(bankAccounts || []);
      } catch (error) {
        console.error("Error loading bank accounts:", error);
        setBankAccountList([]);
      }
    };
    loadBankAccounts();
  }, [dispatch]);


  // Set default dates (Financial Year: 01/04/2025 to 31/03/2026)
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // If current month is April or later, financial year starts from current year
    // Otherwise, it starts from previous year
    const financialYearStart = currentMonth >= 4 ? currentYear : currentYear - 1;
    const financialYearEnd = financialYearStart + 1;

    const fromDateStr = `${financialYearStart}-04-01`;
    const toDateStr = `${financialYearEnd}-03-31`;

    setFromDate(fromDateStr);
    setToDate(toDateStr);
  }, []);

  // Format date for display (YYYY-MM-DD to DD/MM/YYYY)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  // Convert date to input format (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      // If already in YYYY-MM-DD format
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      // If in DD/MM/YYYY or DD-MM-YYYY format
      if (dateString.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)) {
        const [day, month, year] = dateString.split(/[\/\-]/);
        return `${year}-${month}-${day}`;
      }
      // Try parsing as date
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  // Handle date change in transaction list
  const handleTransactionDateChange = (index, newDate) => {
    setTransactionList((prevList) => {
      const updatedList = [...prevList];
      if (updatedList[index]) {
        updatedList[index].Date = newDate;
        updatedList[index].VoucherDate = newDate;
        if (updatedList[index].ChqDate) {
          updatedList[index].ChqDate = newDate;
        }
        if (updatedList[index].ChequeDate) {
          updatedList[index].ChequeDate = newDate;
        }
      }
      return updatedList;
    });
  };

  // Handle Bank Date change in transaction list
  const handleBankDateChange = (index, newDate) => {
    console.log("📅 [Bank Date] Changing bank date for transaction", index, "to:", newDate);
    setTransactionList((prevList) => {
      const updatedList = [...prevList];
      if (updatedList[index]) {
        const oldStatus = updatedList[index].reconciliationStatus;
        updatedList[index].BankDate = newDate;
        // If manually changed, mark as partial match
        if (updatedList[index].reconciliationStatus === "reconciled") {
          updatedList[index].reconciliationStatus = "partial";
          console.log("⚠️ [Bank Date] Status changed from 'reconciled' to 'partial' for transaction", index);
        }
        console.log("✅ [Bank Date] Bank date updated. Status:", oldStatus, "->", updatedList[index].reconciliationStatus);
      }
      return updatedList;
    });
  };

  // Auto-match statement entries with table rows
  const autoMatchTransactions = (importedTransactions, existingTransactions) => {
    console.log("🔍 [Auto-Match] Starting auto-matching process...");
    console.log("🔍 [Auto-Match] Imported transactions count:", importedTransactions.length);
    console.log("🔍 [Auto-Match] Existing transactions count:", existingTransactions?.length || 0);
    
    if (!existingTransactions || existingTransactions.length === 0) {
      // If no existing transactions, all imported are unmatched
      console.log("⚠️ [Auto-Match] No existing transactions found. All imported entries will be unmatched.");
      setUnmatchedEntries(importedTransactions);
      return importedTransactions.map(t => ({ ...t, reconciliationStatus: "unmatched" }));
    }

    const matchedTransactions = [...existingTransactions];
    const unmatched = [];
    console.log("🔍 [Auto-Match] Using EXACT value matching (no tolerance)");

    importedTransactions.forEach((imported, importIndex) => {
      const importedAmount = Math.abs(Number(imported.Amount || imported.Dr || imported.Cr || 0));
      const importedChqNo = String(imported.ChqNo || imported.ChequeNo || "").trim().toLowerCase();
      const importedDate = imported.Date || imported.VoucherDate || "";
      const importedNarration = String(imported.Particulars || imported.Narration || "").trim().toLowerCase();

      console.log(`\n🔍 [Auto-Match] Processing imported transaction ${importIndex + 1}/${importedTransactions.length}:`, {
        Amount: importedAmount,
        ChequeNo: importedChqNo || "N/A",
        Date: importedDate || "N/A",
        Narration: importedNarration.substring(0, 50) || "N/A"
      });

      let bestMatch = null;
      let bestMatchScore = 0;
      let matchIndex = -1;

      console.log(`  🔍 [Auto-Match] Checking against ${matchedTransactions.length} existing transactions...`);
      
      for (let idx = 0; idx < matchedTransactions.length; idx++) {
        const existing = matchedTransactions[idx];
        
        if (existing.reconciliationStatus === "reconciled") {
          console.log(`    ⏭️ [Auto-Match] Transaction ${idx + 1} already reconciled, skipping`);
          continue; // Skip already reconciled transactions
        }

        const existingAmount = Math.abs(Number(existing.Amount || existing.Dr || existing.Cr || 0));
        const existingChqNo = String(existing.ChqNo || existing.ChequeNo || "").trim().toLowerCase();
        const existingDate = existing.Date || existing.VoucherDate || "";
        const existingNarration = String(existing.Particulars || existing.Narration || "").trim().toLowerCase();

        console.log(`    🔍 [Auto-Match] Checking transaction ${idx + 1}:`, {
          Id: existing.Id,
          Amount: existingAmount,
          ChequeNo: existingChqNo || "N/A"
        });

        // Match only on ChequeNo and Amount - EXACT match required
        // Check Amount match first - EXACT value match (no tolerance)
        const amountMatches = importedAmount === existingAmount;
        
        if (!amountMatches) {
          const amountDiff = Math.abs(importedAmount - existingAmount);
          console.log(`      ❌ [Auto-Match] Amount mismatch! Imported: ${importedAmount}, Existing: ${existingAmount}, Diff: ${amountDiff.toFixed(2)}`);
          continue; // Amount doesn't match exactly, skip this transaction
        }
        
        console.log(`      ✅ [Auto-Match] Amount EXACT match! Imported: ${importedAmount}, Existing: ${existingAmount}`);

        // Check Cheque Number match
        const chequeNoMatches = importedChqNo && existingChqNo && importedChqNo === existingChqNo;
        
        if (!chequeNoMatches) {
          console.log(`      ❌ [Auto-Match] Cheque number mismatch. Imported: "${importedChqNo || "N/A"}", Existing: "${existingChqNo || "N/A"}"`);
          continue; // Cheque number doesn't match, skip this transaction
        }
        
        console.log(`      ✅ [Auto-Match] Cheque number match! Imported: "${importedChqNo}", Existing: "${existingChqNo}"`);

        // Both ChequeNo and Amount match - this is a full match
        if (amountMatches && chequeNoMatches) {
          bestMatchScore = 100; // Full match score
          bestMatch = existing;
          matchIndex = idx;
          console.log(`      🎯 [Auto-Match] FULL MATCH FOUND! Both ChequeNo and Amount match. Index: ${idx}`);
          break; // Found perfect match, no need to check further
        }
      }

      // Determine match status - Only full match (both ChequeNo and Amount) is considered
      if (bestMatch && bestMatchScore >= 100) {
        // Full match - both ChequeNo and Amount match - reconcile
        console.log(`  ✅ [Auto-Match] FULL MATCH found! Both ChequeNo and Amount match - Marking as RECONCILED`);
        console.log(`  ✅ [Auto-Match] Matched with transaction ID: ${bestMatch.Id}, Index: ${matchIndex}`);
        matchedTransactions[matchIndex] = {
          ...bestMatch,
          BankDate: importedDate,
          reconciliationStatus: "reconciled",
          matchedWith: imported
        };
      } else {
        // No match found - either ChequeNo or Amount doesn't match
        console.log(`  ❌ [Auto-Match] NO MATCH found! - Adding to unmatched`);
        console.log(`  ❌ [Auto-Match] Reasons:`);
        console.log(`     - Imported ChequeNo: "${importedChqNo || "N/A"}", Amount: ${importedAmount}`);
        console.log(`     - Checked ${matchedTransactions.length} existing transactions`);
        console.log(`     - No transaction found with matching ChequeNo AND Amount`);
        unmatched.push(imported);
      }
    });

    const reconciledCount = matchedTransactions.filter(t => t.reconciliationStatus === "reconciled").length;
    const partialCount = matchedTransactions.filter(t => t.reconciliationStatus === "partial").length;
    
    console.log("\n📊 [Auto-Match] Matching Summary:");
    console.log(`  ✅ Reconciled: ${reconciledCount}`);
    console.log(`  ⚠️ Partial: ${partialCount}`);
    console.log(`  ❌ Unmatched: ${unmatched.length}`);
    console.log(`  📝 Total processed: ${importedTransactions.length}`);
    
    setUnmatchedEntries(unmatched);
    return matchedTransactions;
  };

  // Calculate string similarity (simple Levenshtein-based)
  const calculateStringSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    
    // Check for exact substring match
    if (longer.includes(shorter) || shorter.includes(longer)) {
      return 0.8;
    }

    // Simple character overlap
    const set1 = new Set(longer.toLowerCase());
    const set2 = new Set(shorter.toLowerCase());
    let intersection = 0;
    set1.forEach(char => {
      if (set2.has(char)) intersection++;
    });
    return intersection / Math.max(set1.size, set2.size);
  };

  // Format date for API (DD-MMM-YYYY) - SSMS format
  const formatDateForAPI = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return "";
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "";
    return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Fetch Bank Books Opening Balance
  const fetchBankOpeningBalance = async (accountId) => {
    console.log("💰 [Opening Balance] Fetching bank opening balance...");
    console.log("💰 [Opening Balance] Account ID:", accountId);
    console.log("💰 [Opening Balance] From Date:", fromDate);
    console.log("💰 [Opening Balance] To Date:", toDate);
    
    if (!accountId || accountId === "0" || accountId === "") {
      console.log("⚠️ [Opening Balance] Invalid account ID, skipping fetch");
      return;
    }

    if (!fromDate || !toDate) {
      console.log("⚠️ [Opening Balance] Missing dates, skipping fetch");
      return;
    }

    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser.uid || "0";
      const userToken = "token";

      // API: GetBankAccountOpeningBalance (without BASE as Fn_GetReport adds it automatically)
      const apiURL = `GetBankAccountOpeningBalance/${userId}/${userToken}`;
      console.log("💰 [Opening Balance] API URL:", apiURL);

      const formData = new FormData();
      formData.append("FromDate", formatDateForAPI(fromDate));
      formData.append("ToDate", formatDateForAPI(toDate));
      formData.append("F_LedgerMaster", String(Number(accountId)));
      formData.append("UserId", String(Number(userId) || 0));
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      console.log("💰 [Opening Balance] FormData:", {
        FromDate: formatDateForAPI(fromDate),
        ToDate: formatDateForAPI(toDate),
        F_LedgerMaster: accountId,
        UserId: userId
      });

      const arguList = {
        formData: formData,
      };

      console.log("💰 [Opening Balance] Calling API...");
      const responseData = await Fn_GetReport(
        dispatch,
        (prevState) => ({ ...prevState, openingBalanceData: [] }),
        "openingBalanceData",
        apiURL,
        { arguList },
        true
      );

      console.log("💰 [Opening Balance] API Response:", responseData);

      // Handle response format: { data: { response: [{ OpeningBalance, CrDrType, DrAmt, CrAmt, ... }] } }
      // Fn_GetReport already extracts response.data.response, so responseData is the array
      if (responseData && Array.isArray(responseData) && responseData.length > 0) {
        const balanceData = responseData[0];
        console.log("💰 [Opening Balance] Balance data:", balanceData);
        
        // Use OpeningBalance from response, or calculate from DrAmt/CrAmt if OpeningBalance is 0
        let openingBal = Number(balanceData.OpeningBalance) || 0;
        let crDrType = balanceData.CrDrType || "Dr";
        
        // If OpeningBalance is 0 but DrAmt or CrAmt exists, use that
        if (openingBal === 0) {
          const drAmt = Number(balanceData.DrAmt) || 0;
          const crAmt = Number(balanceData.CrAmt) || 0;
          console.log("💰 [Opening Balance] OpeningBalance is 0, checking DrAmt:", drAmt, "CrAmt:", crAmt);
          if (drAmt > 0) {
            openingBal = drAmt;
            crDrType = "Dr";
          } else if (crAmt > 0) {
            openingBal = crAmt;
            crDrType = "Cr";
          }
        }
        
        console.log("💰 [Opening Balance] Final opening balance:", Math.abs(openingBal), crDrType === "Dr" ? "DR" : "CR");
        setOpeningBalance(Math.abs(openingBal));
        setOpeningBalanceType(crDrType === "Dr" ? "DR" : "CR");
      } else if (responseData && !Array.isArray(responseData)) {
        // Handle single object response
        console.log("💰 [Opening Balance] Single object response:", responseData);
        let openingBal = Number(responseData.OpeningBalance) || 0;
        let crDrType = responseData.CrDrType || "Dr";
        
        // If OpeningBalance is 0 but DrAmt or CrAmt exists, use that
        if (openingBal === 0) {
          const drAmt = Number(responseData.DrAmt) || 0;
          const crAmt = Number(responseData.CrAmt) || 0;
          if (drAmt > 0) {
            openingBal = drAmt;
            crDrType = "Dr";
          } else if (crAmt > 0) {
            openingBal = crAmt;
            crDrType = "Cr";
          }
        }
        
        console.log("💰 [Opening Balance] Final opening balance:", Math.abs(openingBal), crDrType === "Dr" ? "DR" : "CR");
        setOpeningBalance(Math.abs(openingBal));
        setOpeningBalanceType(crDrType === "Dr" ? "DR" : "CR");
      } else {
        console.log("⚠️ [Opening Balance] No valid response data, setting to 0");
        setOpeningBalance(0);
        setOpeningBalanceType("CR");
      }
    } catch (error) {
      console.error("❌ [Opening Balance] Error fetching bank opening balance:", error);
      setOpeningBalance(0);
      setOpeningBalanceType("CR");
    }
  };

  // Fetch Bank Report Data (GetBankReport API)
  const fetchBankReport = async (accountId) => {
    console.log("📊 [Bank Report] Fetching bank report data...");
    console.log("📊 [Bank Report] Account ID:", accountId);
    console.log("📊 [Bank Report] From Date:", fromDate);
    console.log("📊 [Bank Report] To Date:", toDate);
    
    if (!accountId || accountId === "0" || accountId === "") {
      console.log("⚠️ [Bank Report] Invalid account ID, clearing transaction list");
      setTransactionList([]);
      return;
    }

    if (!fromDate || !toDate) {
      console.log("⚠️ [Bank Report] Missing dates, clearing transaction list");
      setTransactionList([]);
      return;
    }

    try {
      setIsLoading(true);
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser.uid || "0";
      const userToken = "token";

      // API: GetBankReport (without BASE as Fn_GetReport adds it automatically)
      const apiURL = `GetBankReport/${userId}/${userToken}`;
      console.log("📊 [Bank Report] API URL:", apiURL);

      const formData = new FormData();
      formData.append("FromDate", formatDateForAPI(fromDate));
      formData.append("ToDate", formatDateForAPI(toDate));
      formData.append("F_LedgerMaster", String(Number(accountId)));
      formData.append("UserId", String(Number(userId) || 0));
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      console.log("📊 [Bank Report] FormData:", {
        FromDate: formatDateForAPI(fromDate),
        ToDate: formatDateForAPI(toDate),
        F_LedgerMaster: accountId,
        UserId: userId
      });

      const arguList = {
        formData: formData,
      };

      console.log("📊 [Bank Report] Calling API...");
      const responseData = await Fn_GetReport(
        dispatch,
        (prevState) => ({ ...prevState, bankReportData: [] }),
        "bankReportData",
        apiURL,
        { arguList },
        true
      );
      
      console.log("📊 [Bank Report] API Response:", responseData);

      // Handle response format: { data: { response: [{ BankName, Id, F_VoucherH, Amount, VoucherNo, VoucherDate, ChequeNo, ... }] } }
      // Fn_GetReport already extracts response.data.response, so responseData is the array
      let normalizedData = [];
      
      if (responseData && Array.isArray(responseData) && responseData.length > 0) {
        normalizedData = responseData;
        console.log("📊 [Bank Report] Response is array, count:", normalizedData.length);
      } else if (responseData && !Array.isArray(responseData)) {
        // Handle single object or wrapped response
        console.log("📊 [Bank Report] Response is object, extracting data...");
        if (responseData.data && Array.isArray(responseData.data.response)) {
          normalizedData = responseData.data.response;
          console.log("📊 [Bank Report] Found data.response array, count:", normalizedData.length);
        } else if (responseData.data && Array.isArray(responseData.data)) {
          normalizedData = responseData.data;
          console.log("📊 [Bank Report] Found data array, count:", normalizedData.length);
        } else if (Array.isArray(responseData.response)) {
          normalizedData = responseData.response;
          console.log("📊 [Bank Report] Found response array, count:", normalizedData.length);
        } else {
          normalizedData = [responseData];
          console.log("📊 [Bank Report] Single object, wrapping in array");
        }
      } else {
        console.log("⚠️ [Bank Report] No valid data found in response");
      }
      
      console.log("📊 [Bank Report] Normalized data count:", normalizedData.length);
      if (normalizedData.length > 0) {
        console.log("📊 [Bank Report] Sample normalized data:", normalizedData[0]);
      }

      // Map API response to transaction list format
      const mappedTransactions = normalizedData.map((item, index) => {
        // Convert VoucherDate to YYYY-MM-DD format
        let formattedDate = "";
        if (item.VoucherDate) {
          try {
            const date = new Date(item.VoucherDate);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split("T")[0];
            }
          } catch (e) {
            console.error("Error parsing VoucherDate:", e);
          }
        }

        // Convert ChequeDate to YYYY-MM-DD format
        let formattedChequeDate = "";
        if (item.ChequeDate) {
          try {
            const date = new Date(item.ChequeDate);
            if (!isNaN(date.getTime())) {
              formattedChequeDate = date.toISOString().split("T")[0];
            }
          } catch (e) {
            console.error("Error parsing ChequeDate:", e);
          }
        }

        // Determine Dr/Cr based on Amount and F_LedgerMasterDr/F_LedgerMasterCr
        const amount = Number(item.Amount) || 0;
        const ledgerMasterDr = item.F_LedgerMasterDr;
        const ledgerMasterCr = item.F_LedgerMasterCr;
        const isDebit = ledgerMasterDr && String(ledgerMasterDr) === String(accountId);
        const isCredit = ledgerMasterCr && String(ledgerMasterCr) === String(accountId);

        return {
          Id: item.Id || item.ID || index + 1,
          F_VoucherH: item.F_VoucherH || 0,
          F_LedgerMasterDr: item.F_LedgerMasterDr || 0,
          F_LedgerMasterCr: item.F_LedgerMasterCr || 0,
          Amount: amount,
          F_VoucherTypeMaster: item.F_VoucherTypeMaster || 0,
          VoucherNo: item.VoucherNo || "",
          VoucherDate: formattedDate,
          Date: formattedDate,
          IsCheque: item.IsCheque || false,
          ChequeNo: item.ChequeNo || "",
          ChqNo: item.ChequeNo || "",
          ChequeDate: formattedChequeDate,
          ChqDate: formattedChequeDate,
          ChequeAm: Number(item.ChequeAm) || 0,
          BankName: item.BankName || "",
          BankDate: "", // Will be filled during reconciliation
          reconciliationStatus: "unmatched", // unmatched, partial, reconciled
          // For display purposes
          Dr: isDebit ? amount : 0,
          Cr: isCredit ? amount : 0,
          Debit: isDebit ? amount : 0,
          Credit: isCredit ? amount : 0,
          Particulars: item.BankName || "",
          Narration: item.BankName || "",
          Description: item.BankName || "",
          Party: item.BankName || "",
          PartyName: item.BankName || "",
        };
      });

      console.log("📊 [Bank Report] Mapped transactions count:", mappedTransactions.length);
      if (mappedTransactions.length > 0) {
        console.log("📊 [Bank Report] All mapped transactions:", mappedTransactions.map(t => ({
          Id: t.Id,
          Amount: t.Amount,
          Dr: t.Dr,
          Cr: t.Cr,
          ChequeNo: t.ChequeNo || t.ChqNo || "N/A",
          Date: t.Date || t.VoucherDate || "N/A",
          Narration: (t.Particulars || t.Narration || "").substring(0, 30) || "N/A"
        })));
      }
      setTransactionList(mappedTransactions);
      console.log("✅ [Bank Report] Transaction list updated successfully");
    } catch (error) {
      console.error("❌ [Bank Report] Error fetching bank report:", error);
      setTransactionList([]);
      alert("Failed to fetch bank report data. Please try again.");
    } finally {
      setIsLoading(false);
      console.log("📊 [Bank Report] Loading completed");
    }
  };

  // Calculate closing balance
  const { closingBalance, closingBalanceType } = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    transactionList.forEach((transaction) => {
      totalDebit += parseFloat(transaction.Dr || transaction.Debit || 0);
      totalCredit += parseFloat(transaction.Cr || transaction.Credit || 0);
    });

    const openingBal = openingBalanceType === "DR" ? openingBalance : -openingBalance;
    const closingBal = openingBal + totalCredit - totalDebit;
    const closingBalType = closingBal >= 0 ? "DR" : "CR";

    return {
      closingBalance: Math.abs(closingBal),
      closingBalanceType: closingBalType,
    };
  }, [transactionList, openingBalance, openingBalanceType]);

  // Handle bank account change
  const handleBankAccountChange = async (e) => {
    const selectedId = e.target.value;
    console.log("🏦 [Bank Account] Bank account changed to:", selectedId);
    setBankAccountId(selectedId);
    if (selectedId && selectedId !== "0" && selectedId !== "") {
      console.log("🏦 [Bank Account] Fetching opening balance and bank report...");
      // Fetch Bank Books Opening Balance and Bank Report Data when bank account is selected
      await Promise.all([
        fetchBankOpeningBalance(selectedId),
        fetchBankReport(selectedId)
      ]);
      console.log("✅ [Bank Account] Data fetch completed");
    } else {
      console.log("🏦 [Bank Account] No account selected, clearing data");
      setTransactionList([]);
      setBankStatementList([]);
      setOpeningBalance(0);
      setOpeningBalanceType("CR");
      setBankStatementOpeningBalance("");
      setBankStatementOpeningBalanceType("DR");
    }
  };

  // Handle date change
  const handleDateChange = async () => {
    console.log("📅 [Date Change] Dates changed - From:", fromDate, "To:", toDate);
    if (bankAccountId && bankAccountId !== "0") {
      console.log("📅 [Date Change] Refreshing data for account:", bankAccountId);
      // Fetch opening balance and bank report data when dates change
      await Promise.all([
        fetchBankOpeningBalance(bankAccountId),
        fetchBankReport(bankAccountId)
      ]);
      console.log("✅ [Date Change] Data refresh completed");
    } else {
      console.log("⚠️ [Date Change] No bank account selected, skipping refresh");
    }
  };

  // Handle Print button
  const handlePrint = () => {
    window.print();
  };

  // Handle Save button
  const handleSave = async () => {
    console.log("💾 [Save] Save button clicked");
    console.log("💾 [Save] Bank Account ID:", bankAccountId);
    console.log("💾 [Save] From Date:", fromDate);
    console.log("💾 [Save] To Date:", toDate);
    console.log("💾 [Save] Transaction count:", transactionList.length);
    
    if (!bankAccountId || bankAccountId === "0" || bankAccountId === "") {
      console.log("❌ [Save] Validation failed: No bank account selected");
      alert("Please select a bank account");
      return;
    }

    if (!fromDate || !toDate) {
      console.log("❌ [Save] Validation failed: Missing dates");
      alert("Please select both From Date and To Date");
      return;
    }

    if (transactionList.length === 0) {
      console.log("❌ [Save] Validation failed: No transactions");
      alert("No transactions to save. Please import Excel file or fetch data.");
      return;
    }

    try {
      setIsLoading(true);
      console.log("💾 [Save] Starting save process...");
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = String(authUser.Id ?? authUser.uid ?? "0");
      const userToken = authUser.Token ?? authUser.token ?? "token";

      // POST /api/V1/BankReconciliation/{UserId}/{UserToken}
      // Content-Type: multipart/form-data
      // Body: F_BankMaster (number), BankStatementOBManual (number), UserId (number), StrVoucherL (string)
      const apiURL = `BankReconciliation/${userId}/${userToken}`;

      // StrVoucherL = 'F_VoucherH~ChequeDate#' per row, rows joined by #
      const strVoucherL = transactionList
        .map((t) => {
          const fVoucherH = t.F_VoucherH ?? t.Id ?? t.ID ?? 0;
          const chequeDate = formatDateForAPI(t.BankDate || t.ChequeDate || t.ChqDate || t.Date || t.VoucherDate || "");
          return `${fVoucherH}~${chequeDate}`;
        })
        .join("#") + "#";

      const formData = new FormData();
      formData.append("F_BankMaster", String(Number(bankAccountId)));
      formData.append("BankStatementOBManual", String(Number(bankStatementOpeningBalance) || 0));
      formData.append("UserId", String(Number(userId) || 0));
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());
      formData.append("StrVoucherL", strVoucherL);

      console.log("💾 [Save] Calling save API...");
      await Fn_AddEditData(
        dispatch,
        (prevState) => ({ ...prevState }),
        { arguList: { id: 0, formData } },
        apiURL,
        true,
        "memberid",
        navigate,
        "#"
      );

      console.log("✅ [Save] Bank reconciliation saved successfully");
      alert("Bank reconciliation saved successfully");
      // Refresh opening balance after save
      if (bankAccountId && bankAccountId !== "0") {
        console.log("💾 [Save] Refreshing opening balance...");
        await fetchBankOpeningBalance(bankAccountId);
      }
    } catch (error) {
      console.error("❌ [Save] Error saving bank reconciliation:", error);
      alert("Failed to save bank reconciliation. Please try again.");
    } finally {
      setIsLoading(false);
      console.log("💾 [Save] Save process completed");
    }
  };

  // Handle Close button
  const handleClose = () => {
    navigate(-1);
  };

  // Handle Import Excel file
  const handleImportExcel = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle Excel file read and parse
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      alert("Please select a valid Excel file (.xlsx, .xls, or .csv)");
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result);
        const workbook = XLSX.read(data, { type: "array" });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON (raw rows for header detection)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        
        if (jsonData.length < 2) {
          alert("Excel file is empty or has no data rows");
          return;
        }

        // Normalize header cell for matching (trim, lowercase, collapse spaces)
        const norm = (h) => String(h || "").trim().toLowerCase().replace(/\s+/g, " ");
        // Find which row contains transaction table headers (supports PNB, HDFC, etc. with header not on row 0)
        const isDateHeader = (h) => /^(txn\s*date|transaction\s*date|date|value\s*dt|value\s*date)$/.test(norm(h)) || norm(h) === "date";
        const isNarrationHeader = (h) => /(narration|description|particulars|remarks)/.test(norm(h));
        const isDrHeader = (h) => /^(dr\s*amount|debit\s*amount|debit|dr|withdrawal\s*amt\.?|withdrawal\s*amount|withdrawal)$/.test(norm(h)) || norm(h) === "dr";
        const isCrHeader = (h) => /^(cr\s*amount|credit\s*amount|credit|cr|deposit\s*amt\.?|deposit\s*amount|deposit)$/.test(norm(h)) || norm(h) === "cr";
        const isChqHeader = (h) => /(cheque\s*no\.?|cheque\s*number|chq\s*no|chqno|chq\.?\/ref\.?\s*no\.?|ref\.?\s*no\.?)/.test(norm(h));
        const isBalanceHeader = (h) => /(balance|closing\s*balance)/.test(norm(h));

        let headerRowIndex = 0;
        for (let r = 0; r < Math.min(jsonData.length, 30); r++) {
          const row = jsonData[r];
          if (!row || !Array.isArray(row)) continue;
          const headers = row.map((h) => norm(h));
          const hasDate = headers.some(isDateHeader);
          const hasDr = headers.some(isDrHeader);
          const hasCr = headers.some(isCrHeader);
          if (hasDate && (hasDr || hasCr)) {
            headerRowIndex = r;
            break;
          }
        }

        const headerRow = jsonData[headerRowIndex] || [];
        const headers = headerRow.map((h) => norm(h));

        const dateIndex = headers.findIndex((h) => isDateHeader(h) || h === "date");
        const narrationIndex = headers.findIndex((h) => isNarrationHeader(h));
        const chqNoIndex = headers.findIndex((h) => isChqHeader(h));
        const drIndex = headers.findIndex((h) => isDrHeader(h));
        const crIndex = headers.findIndex((h) => isCrHeader(h));
        const balanceIndex = headers.findIndex((h) => isBalanceHeader(h));

        // Parse balance cell: "1000.14 Cr." or "23320" or 23320
        const parseBalance = (val) => {
          if (val === undefined || val === null || val === "") return { amount: 0, type: "DR" };
          const str = String(val).trim();
          const numMatch = str.replace(/,/g, "").match(/(-?\d+\.?\d*)/);
          const amount = numMatch ? Math.abs(parseFloat(numMatch[1])) : 0;
          const isCr = /cr\.?$/i.test(str);
          return { amount, type: isCr ? "CR" : "DR" };
        };

        // Parse date: Excel number, DD-MM-YYYY, DD/MM/YYYY, DD/MM/YY
        const parseStatementDate = (dateValue) => {
          if (dateValue === undefined || dateValue === null || dateValue === "") return "";
          if (typeof dateValue === "number") {
            const excelEpoch = new Date(1899, 11, 30);
            const jsDate = new Date(excelEpoch.getTime() + dateValue * 86400000);
            return jsDate.toISOString().split("T")[0];
          }
          if (dateValue instanceof Date) return dateValue.toISOString().split("T")[0];
          const dateStr = String(dateValue).trim();
          const d2 = dateStr.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{2})$/); // DD/MM/YY
          if (d2) {
            const [, day, month, yy] = d2;
            const year = parseInt(yy, 10) < 100 ? 2000 + parseInt(yy, 10) : parseInt(yy, 10);
            return `${year}-${month}-${day}`;
          }
          const d4 = dateStr.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/); // DD/MM/YYYY or DD-MM-YYYY
          if (d4) {
            const [, day, month, year] = d4;
            return `${year}-${month}-${day}`;
          }
          const parsed = new Date(dateStr);
          return !isNaN(parsed.getTime()) ? parsed.toISOString().split("T")[0] : dateStr;
        };

        const dataStartRow = headerRowIndex + 1;
        const importedTransactions = [];
        let foundOpeningBalance = false;
        let openingBalanceValue = 0;
        let openingBalanceTypeValue = "DR";

        for (let i = dataStartRow; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.every((cell) => cell === undefined || cell === null || cell === "")) continue;

          const dateValue = dateIndex >= 0 ? row[dateIndex] : null;
          const narrationValue = narrationIndex >= 0 ? String(row[narrationIndex] || "").trim() : "";
          const chqNoValue = chqNoIndex >= 0 ? String(row[chqNoIndex] || "").trim() : "";
          const drRaw = drIndex >= 0 ? row[drIndex] : null;
          const crRaw = crIndex >= 0 ? row[crIndex] : null;
          const drValue = typeof drRaw === "number" ? drRaw : (parseFloat(String(drRaw || "").replace(/,/g, "")) || 0);
          const crValue = typeof crRaw === "number" ? crRaw : (parseFloat(String(crRaw || "").replace(/,/g, "")) || 0);
          const balanceParsed = balanceIndex >= 0 ? parseBalance(row[balanceIndex]) : { amount: 0, type: "DR" };
          const balanceValue = balanceParsed.amount;

          // Skip header-like or separator rows
          if (norm(row[dateIndex >= 0 ? dateIndex : 0]) === "date" || String(row[0] || "").trim().match(/^\*+$/)) continue;

          const isOpeningBalanceRow = narrationValue.toLowerCase().includes("opening balance") ||
                                     narrationValue.toLowerCase().includes("opening bal") ||
                                     narrationValue.toLowerCase().includes("op bal");

          if (isOpeningBalanceRow && !foundOpeningBalance) {
            if (balanceValue > 0) {
              openingBalanceValue = balanceValue;
              openingBalanceTypeValue = balanceParsed.type;
            } else if (drValue > 0) {
              openingBalanceValue = drValue;
              openingBalanceTypeValue = "DR";
            } else if (crValue > 0) {
              openingBalanceValue = crValue;
              openingBalanceTypeValue = "CR";
            }
            foundOpeningBalance = true;
            continue;
          }

          const formattedDate = parseStatementDate(dateValue);

          importedTransactions.push({
            Id: i,
            Date: formattedDate,
            VoucherDate: formattedDate,
            VoucherNo: chqNoValue || "",
            ChqNo: chqNoValue,
            ChequeNo: chqNoValue,
            Party: narrationValue,
            PartyName: narrationValue,
            Amount: drValue > 0 ? drValue : crValue,
            Dr: drValue,
            Cr: crValue,
            Debit: drValue,
            Credit: crValue,
            BankDate: formattedDate, // Statement transaction date
            Particulars: narrationValue,
            Narration: narrationValue,
            Description: narrationValue,
            Balance: balanceValue,
            reconciliationStatus: "unmatched", // Will be updated during matching
          });
        }

        // Set opening balance if found in Excel
        if (foundOpeningBalance && openingBalanceValue > 0) {
          setBankStatementOpeningBalance(String(openingBalanceValue));
          setBankStatementOpeningBalanceType(openingBalanceTypeValue);
        }

        if (importedTransactions.length > 0) {
          // Right side: show imported statement as-is
          setBankStatementList(importedTransactions);

          console.log("📥 [Excel Import] Starting auto-matching process...");
          const existingTransactions = transactionList.length > 0 ? transactionList : [];
          console.log("📥 [Excel Import] Existing (book) transactions before matching:", existingTransactions.length);
          console.log("📥 [Excel Import] Imported statement transactions:", importedTransactions.length);

          const matchedTransactions = autoMatchTransactions(importedTransactions, existingTransactions);
          setTransactionList(existingTransactions.length > 0 ? matchedTransactions : []);

          // Reset file input key to allow same file to be selected again
          setFileInputKey((prev) => prev + 1);

          console.log("📥 [Excel Import] Imported:", importedTransactions.length);
        } else {
          console.log("⚠️ [Excel Import] No valid transactions found in Excel file");
          alert("No valid transactions found in the Excel file.");
          // Reset file input even if no data
          setFileInputKey((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Error reading Excel file:", error);
        alert("Error reading Excel file. Please make sure the file format is correct.");
        // Reset file input on error
        setFileInputKey((prev) => prev + 1);
      }
    };

    reader.onerror = () => {
      alert("Error reading file. Please try again.");
      setFileInputKey((prev) => prev + 1);
    };

    reader.readAsArrayBuffer(file);
  };

  // Get selected bank account name
  const selectedBankAccount = bankAccountList.find(
    (account) => String(account.Id || account.ID) === String(bankAccountId)
  );
  const bankName = selectedBankAccount
    ? selectedBankAccount.Name || selectedBankAccount.BankName || ""
    : "";

  // Bank Statement: show only rows within From date and To date
  const filteredBankStatementList = useMemo(() => {
    if (!fromDate || !toDate || !bankStatementList.length) return bankStatementList;
    return bankStatementList.filter((entry) => {
      const d = entry.Date || entry.VoucherDate || "";
      if (!d) return false;
      return d >= fromDate && d <= toDate;
    });
  }, [bankStatementList, fromDate, toDate]);

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Bank Reconciliation" parent="Transactions" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Bank Reconciliation" tagClass="card-title mb-0" />
              <CardBody>
                {/* Header Section */}
                <Row className="mb-3">
                  <Col md="3">
                    <FormGroup>
                      <Label>Bank Name</Label>
                      <Input
                        type="select"
                        value={bankAccountId}
                        onChange={handleBankAccountChange}
                      >
                        <option value="">Select Bank Account</option>
                        {bankAccountList.map((account) => (
                          <option key={account.Id || account.ID} value={account.Id || account.ID}>
                            {account.Name || account.BankName || ""}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md="2">
                    <FormGroup>
                      <Label>From</Label>
                      <DateInput
                        value={fromDate}
                        onChange={(e) => {
                          setFromDate(e.target.value);
                          handleDateChange();
                        }}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="2">
                    <FormGroup>
                      <Label>To</Label>
                      <DateInput
                        value={toDate}
                        onChange={(e) => {
                          setToDate(e.target.value);
                          handleDateChange();
                        }}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="2">
                    <FormGroup>
                      <Label>Bank Books Opening Balance (AUTO FILL)</Label>
                      <Input
                        type="text"
                        value={`${formatCurrency(openingBalance)} ${openingBalanceType}`}
                        readOnly
                        style={{ color: "red", fontWeight: "bold" }}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label>Closing Bal(Bank Book)</Label>
                      <Input
                        type="text"
                        value={`${formatCurrency(closingBalance)} ${closingBalanceType}`}
                        readOnly
                        style={{ color: "red", fontWeight: "bold" }}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                {/* Single table: Bank Statement (top) + partition + Bank Book (bottom) */}
                {isLoading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading transactions...</p>
                  </div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto", overflowX: "auto" }}>
                    <Table bordered striped hover size="sm" className="mb-0 bank-recon-table" style={{ tableLayout: "auto", width: "100%" }}>
                      <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th colSpan={7} className="bg-success text-white text-center py-2">
                            Bank Statement (Import Excel)
                          </th>
                          <th style={{ width: "4px", minWidth: "4px", padding: 0, borderLeft: "3px solid #333", background: "#333" }}></th>
                          <th colSpan={7} className="bg-primary text-white text-center py-2">
                            Bank Book
                          </th>
                        </tr>
                        <tr>
                          <th style={{ whiteSpace: "nowrap" }}>Sr.</th>
                          <th style={{ whiteSpace: "nowrap" }}>Date</th>
                          <th>Particular</th>
                          <th style={{ whiteSpace: "nowrap" }}>Cheque No.</th>
                          <th className="text-end" style={{ whiteSpace: "nowrap" }}>Debit</th>
                          <th className="text-end" style={{ whiteSpace: "nowrap" }}>Credit</th>
                          <th className="text-end" style={{ whiteSpace: "nowrap" }}>Amount</th>
                          <th style={{ borderLeft: "3px solid #333", background: "#f8f9fa" }}></th>
                          <th style={{ whiteSpace: "nowrap" }}>Sr.</th>
                          <th style={{ whiteSpace: "nowrap" }}>Date</th>
                          <th>Particular</th>
                          <th style={{ whiteSpace: "nowrap" }}>Cheque No.</th>
                          <th className="text-end" style={{ whiteSpace: "nowrap" }}>Dr_Amt</th>
                          <th className="text-end" style={{ whiteSpace: "nowrap" }}>Cr_Amt</th>
                          <th style={{ whiteSpace: "nowrap" }}>Bank Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBankStatementList.length > 0 ? (
                          filteredBankStatementList.map((entry, index) => (
                            <tr key={`stmt-${entry.Id != null ? entry.Id : index}`}>
                              <td>{index + 1}</td>
                              <td>{formatDateForDisplay(entry.Date || entry.VoucherDate || "")}</td>
                              <td>{(entry.Particulars || entry.Narration || entry.Description || "-").substring(0, 25)}{((entry.Particulars || entry.Narration || "").length > 25 ? "…" : "")}</td>
                              <td>{entry.ChqNo || entry.ChequeNo || "-"}</td>
                              <td className="text-end">{formatCurrency(entry.Dr || entry.Debit || 0)}</td>
                              <td className="text-end">{formatCurrency(entry.Cr || entry.Credit || 0)}</td>
                              <td className="text-end">{formatCurrency(entry.Amount || 0)}</td>
                              <td style={{ borderLeft: "3px solid #333", background: "#f8f9fa", width: "4px" }}></td>
                              <td colSpan={7}></td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-3 text-muted">Import Excel to see statement details here.</td>
                            <td style={{ borderLeft: "3px solid #333", background: "#f8f9fa" }}></td>
                            <td colSpan={7}></td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan={15} className="p-0" style={{ borderTop: "3px solid #333", height: "2px", lineHeight: 0, background: "#333" }}></td>
                        </tr>
                        {transactionList.length > 0 ? (
                          transactionList.map((transaction, index) => {
                            const reconciliationStatus = transaction.reconciliationStatus || "unmatched";
                            const rowStyle = {
                              backgroundColor:
                                reconciliationStatus === "reconciled" ? "#d4edda" :
                                reconciliationStatus === "partial" ? "#fff3cd" : "transparent"
                            };
                            const drAmt = transaction.Dr ?? transaction.Debit ?? 0;
                            const crAmt = transaction.Cr ?? transaction.Credit ?? 0;
                            return (
                              <tr key={`book-${transaction.Id || transaction.ID || index}`} style={rowStyle} title={reconciliationStatus === "partial" ? "Verify bank date manually" : ""}>
                                <td colSpan={7}></td>
                                <td style={{ borderLeft: "3px solid #333", background: "#f8f9fa", width: "4px" }}></td>
                                <td>{index + 1}</td>
                                <td>{formatDateForDisplay(transaction.Date || transaction.ChqDate || transaction.ChequeDate || transaction.VoucherDate || "")}</td>
                                <td>{(transaction.Particulars || transaction.Narration || transaction.Description || "-").substring(0, 20)}{((transaction.Particulars || transaction.Narration || "").length > 20 ? "…" : "")}</td>
                                <td>{transaction.ChqNo || transaction.ChequeNo || "-"}</td>
                                <td className="text-end">{formatCurrency(drAmt)}</td>
                                <td className="text-end">{formatCurrency(crAmt)}</td>
                                <td>
                                  <DateInput
                                    value={formatDateForInput(transaction.BankDate || "")}
                                    onChange={(e) => handleBankDateChange(index, e.target.value)}
                                    style={{ minWidth: "90px", width: "100%" }}
                                  />
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7}></td>
                            <td style={{ borderLeft: "3px solid #333", background: "#f8f9fa" }}></td>
                            <td colSpan={7} className="text-center py-3 text-muted">
                              {bankAccountId ? "No transactions for the selected period." : "Select bank account to load details."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
              <CardFooter className="text-end">
                <input
                  key={fileInputKey}
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <Btn color="warning" type="button" className="me-2" onClick={handleImportExcel} disabled={isLoading}>
                  Import Excel
                </Btn>
                <Btn color="secondary" type="button" className="me-2" onClick={handlePrint}>
                  Print
                </Btn>
                <Btn color="success" type="button" className="me-2" onClick={handleSave} disabled={isLoading || !bankAccountId}>
                  Save
                </Btn>
                <Btn color="secondary" type="button" onClick={handleClose}>
                  Close
                </Btn>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Unmatched Entries Modal */}
      <Modal isOpen={showUnmatchedModal} toggle={() => setShowUnmatchedModal(false)} size="lg">
        <ModalHeader toggle={() => setShowUnmatchedModal(false)}>
          Unmatched Statement Entries ({unmatchedEntries.length})
        </ModalHeader>
        <ModalBody>
          <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto", overflowX: "auto" }}>
            <Table bordered striped hover className="mb-0" style={{ tableLayout: "auto", width: "max-content" }}>
              <thead className="table-light">
                <tr>
                  <th style={{ whiteSpace: "nowrap" }}>Sr. No.</th>
                  <th style={{ whiteSpace: "nowrap" }}>Date</th>
                  <th>Narration</th>
                  <th style={{ whiteSpace: "nowrap" }}>Cheque No.</th>
                  <th className="text-end" style={{ whiteSpace: "nowrap" }}>Debit</th>
                  <th className="text-end" style={{ whiteSpace: "nowrap" }}>Credit</th>
                  <th className="text-end" style={{ whiteSpace: "nowrap" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {unmatchedEntries.length > 0 ? (
                  unmatchedEntries.map((entry, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{formatDateForDisplay(entry.Date || entry.VoucherDate || "")}</td>
                      <td>{entry.Particulars || entry.Narration || entry.Description || "-"}</td>
                      <td>{entry.ChqNo || entry.ChequeNo || "-"}</td>
                      <td className="text-end">{formatCurrency(entry.Dr || entry.Debit || 0)}</td>
                      <td className="text-end">{formatCurrency(entry.Cr || entry.Credit || 0)}</td>
                      <td className="text-end">{formatCurrency(entry.Amount || 0)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No unmatched entries.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </ModalBody>
        <ModalFooter>
          <Btn color="secondary" onClick={() => setShowUnmatchedModal(false)}>
            Close
          </Btn>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default BankReconcilation;
