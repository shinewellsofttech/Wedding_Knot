import React, { useState, useEffect } from "react";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Fn_FillListData, Fn_GetReport } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

interface Transaction {
  date?: string;
  party?: string;
  voucherNo?: string;
  voucherId?: number | string;
  debit: number;
  credit: number;
  balance: number;
  balanceType: "Dr" | "Cr";
  narration?: string;
  voucherType?: string;
  creditDays?: number;
}

interface LedgerReportResponse {
  LedgerName?: string;
  OpeningBalance?: number;
  DrAmt?: number;
  CrAmt?: number;
  ClosingBalance?: number;
  CrDrType?: "Dr" | "Cr";
  VoucherDate?: string;
  PartyName?: string;
  VoucherNo?: string;
  VoucherType?: string;
  Narration?: string;
  CreditDays?: number;
  [key: string]: any;
}

interface LedgerMaster {
  Id: number;
  Name: string;
  Address?: string;
}

interface VoucherTypeMaster {
  Id: number;
  Name: string;
}

const LedgerDetailsReport: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [ledgerId, setLedgerId] = useState<string>("");
  const [ledgerName, setLedgerName] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(() => {
    const today = new Date();
    const fyStart = today.getMonth() + 1 >= 4 ? today.getFullYear() : today.getFullYear() - 1;
    return `${fyStart}-04-01`;
  });
  const [toDate, setToDate] = useState<string>(() => {
    const today = new Date();
    const fyStart = today.getMonth() + 1 >= 4 ? today.getFullYear() : today.getFullYear() - 1;
    return `${fyStart + 1}-03-31`;
  });
  const [voucherTypeId, setVoucherTypeId] = useState<string>("0");
  const [viewType, setViewType] = useState("Summarised");
  const [balanceView, setBalanceView] = useState("Daily");
  const [showNarration, setShowNarration] = useState(true);
  const [showVoucherNo, setShowVoucherNo] = useState(true);
  const [showPartyName, setShowPartyName] = useState(true);
  const [showVoucherType, setShowVoucherType] = useState(false);


  const [ledgerList, setLedgerList] = useState<LedgerMaster[]>([]);
  const [voucherTypeList, setVoucherTypeList] = useState<VoucherTypeMaster[]>([]);
  const [reportData, setReportData] = useState<LedgerReportResponse[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [balanceType, setBalanceType] = useState<"Dr" | "Cr">("Dr");
  const [openingBalance, setOpeningBalance] = useState(0);
  const [printCompanyName, setPrintCompanyName] = useState("");
  const [printFirmAddress, setPrintFirmAddress] = useState("");

  // API URLs
  const LEDGER_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.LedgerMaster}/Id/0`;
  const VOUCHER_TYPE_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/VoucherTypeMaster/Id/0`;

  // Pre-select ledger if navigated from another report (by ledgerId or ledgerName)
  useEffect(() => {
    const state = (location.state as any);
    if (!state) return;
    if (state.fromDate) setFromDate(state.fromDate);
    if (state.toDate) setToDate(state.toDate);
    if (state?.ledgerId && state.ledgerId !== "" && state.ledgerId !== "0") {
      setLedgerId(state.ledgerId);
      if (state.ledgerName) setLedgerName(state.ledgerName);
    } else if (state?.ledgerName && typeof state.ledgerName === "string" && state.ledgerName.trim() !== "") {
      setLedgerName(state.ledgerName.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When ledgerList is loaded and state had ledgerName but no ledgerId, select by name
  useEffect(() => {
    const state = (location.state as any);
    if (!state?.ledgerName || ledgerList.length === 0) return;
    const name = String(state.ledgerName).trim();
    if (!name) return;
    if (state?.ledgerId && state.ledgerId !== "" && state.ledgerId !== "0") return;
    const match = ledgerList.find((l: any) => (l.Name || "").trim().toLowerCase() === name.toLowerCase());
    if (match) {
      setLedgerId(String(match.Id));
      setLedgerName(match.Name || name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerList, location.state]);

  // Load dropdowns on mount
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const ledgerData = await Fn_FillListData(
          dispatch,
          (prevState: any) => ({ ...prevState, ledgers: [] }),
          "ledgers",
          LEDGER_LIST_URL
        );
        setLedgerList(ledgerData || []);

        const voucherTypeData = await Fn_FillListData(
          dispatch,
          (prevState: any) => ({ ...prevState, voucherTypes: [] }),
          "voucherTypes",
          VOUCHER_TYPE_LIST_URL
        );
        setVoucherTypeList(voucherTypeData || []);
      } catch (error) {
        console.error("Error loading dropdowns:", error);
      }
    };
    loadDropdowns();
  }, [dispatch]);



  // Load company name and firm address from localStorage / API for print
  useEffect(() => {
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    const firmName = authUser.FirmName || authUser.CompanyName || authUser.Company || "";
    setPrintCompanyName(firmName);

    Fn_FillListData(dispatch, () => { }, "FirmListPrint", `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.FirmMaster}/Id/0`)
      .then((firms: any) => {
        if (!Array.isArray(firms) || firms.length === 0) return;
        const fCompanyId = authUser?.F_CompanyMaster ?? authUser?.CompanyId ?? authUser?.F_Company;
        let firm = (fCompanyId != null && fCompanyId !== "")
          ? firms.find((f: any) => String(f.Id) === String(fCompanyId) || String(f.F_CompanyMaster) === String(fCompanyId)) || firms[0]
          : firms.find((f: any) => f.FirmName === firmName || f.Name === firmName) || firms[0];
        const apiName = firm.FirmName || firm.Name || firmName;
        if (apiName) setPrintCompanyName(apiName);
        const addr = [firm.Address1, firm.Address2, firm.CityName || firm.City, firm.StateName || firm.State, firm.PinCode]
          .filter(Boolean).join(", ");
        setPrintFirmAddress(addr);
      }).catch(console.error);
  }, [dispatch]);

  // Handle ledger selection
  useEffect(() => {
    if (ledgerId && ledgerList.length > 0) {
      const selectedLedger = ledgerList.find((l) => l.Id === Number(ledgerId));
      if (selectedLedger) {
        setLedgerName(selectedLedger.Name);
      }
    }
  }, [ledgerId, ledgerList]);

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForAPI = (dateString: string): string => {
    // Convert YYYY-MM-DD to DD-MMM-YYYY format (e.g., 2025-04-01 to 01-Apr-2025)
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchLedgerReport = async () => {
    if (!ledgerId || ledgerId === "0" || ledgerId === "") {
      alert("Please select a ledger");
      return;
    }


    try {
      setIsLoading(true);
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = String(authUser?.uid ?? authUser?.Id ?? "0");
      const userToken = authUser?.Token ?? authUser?.token ?? "token";

      // POST /api/V1/GetLedgerDetails/{UserId}/{UserToken}
      // Content-Type: multipart/form-data
      const apiURL = `GetLedgerDetails/${userId}/${userToken}`;

      // Request body (multipart/form-data) - match API spec
      // FromDate, ToDate: string($date-time) in yyyy-mm-dd
      // F_LedgerMaster, ReportType, ViewType, F_VoucherTypeMaster, UserId: number($double)
      const reportType = balanceView === "Daily" ? 1 : balanceView === "Monthly" ? 2 : 1;
      const viewTypeValue = viewType === "Summarised" ? 1 : 2;

      const formData = new FormData();
      formData.append("FromDate", fromDate); // yyyy-mm-dd
      formData.append("ToDate", toDate); // yyyy-mm-dd
      formData.append("F_LedgerMaster", String(Number(ledgerId)));
      formData.append("ReportType", String(reportType));
      formData.append("ViewType", String(viewTypeValue));
      formData.append("F_VoucherTypeMaster", String(Number(voucherTypeId) || 0));
      // F_CompanyMaster and UserId are not in the Swagger body schema, so omit them or keep them if backend requires.
      // We will remove them to perfectly match the image.

      const arguList = { formData };

      const responseData = await Fn_GetReport(
        dispatch,
        (prevState: any) => ({ ...prevState, reportData: [] }),
        "reportData",
        apiURL,
        { arguList },
        true
      );

      // Support both raw array and nested {data:{response:[]}} format
      const resolveRows = (raw: any): any[] => {
        if (Array.isArray(raw)) return raw;
        if (raw && Array.isArray(raw.data?.response)) return raw.data.response;
        if (raw && Array.isArray(raw.response)) return raw.response;
        return [];
      };

      const rows = resolveRows(responseData);

      if (rows.length > 0) {
        setReportData(rows);

        // Find Opening Balance row
        const openingRow = rows.find((r: any) => !r.Date || r.Date === "" || r.Party === "Op. Bal.");
        const opening = Number(openingRow?.Balance) || 0;
        setOpeningBalance(Math.abs(opening));
        
        // Calculate CrDrType manually since it's not in the response
        let currentRunBal = (Number(openingRow?.Dr) || 0) - (Number(openingRow?.Cr) || 0);
        if (openingRow?.Balance !== undefined) {
            // Best guess for opening balance type if Dr/Cr is 0
            if (currentRunBal === 0 && opening > 0) {
                // If we don't know, default to Dr
                currentRunBal = opening; 
            }
        }
        setBalanceType(currentRunBal >= 0 ? "Dr" : "Cr");

        // Transaction rows
        const txRows = rows.filter((r: any) => r.Date && r.Party !== "Op. Bal.");

        // Calculate running balances and determine Dr/Cr
        let runBal = currentRunBal;
        const transactionList: Transaction[] = txRows.map((row: any) => {
          runBal = runBal + (Number(row.Dr) || 0) - (Number(row.Cr) || 0);
          return {
            date: row.Date ? formatDateForDisplay(row.Date) : "",
            party: row.Party || row.DrLedger || row.CrLedger || "",
            voucherNo: row.VoucherNo || "",
            voucherId: row.F_VoucherMaster ?? row.VoucherId ?? row.Id ?? row.VoucherID ?? "",
            voucherType: row.VoucherType || "",
            debit: Number(row.Dr) || 0,
            credit: Number(row.Cr) || 0,
            balance: Math.abs(Number(row.Balance) || runBal),
            balanceType: runBal >= 0 ? "Dr" : "Cr",
            narration: row.Narration || "",
            creditDays: Number(row.CreditDays) || 0,
          };
        });

        if (transactionList.length > 0) {
          const lastTx = transactionList[transactionList.length - 1];
          setCurrentBalance(lastTx.balance);
          setBalanceType(lastTx.balanceType);
        } else {
          setCurrentBalance(Math.abs(opening));
          setBalanceType(currentRunBal >= 0 ? "Dr" : "Cr");
        }

        setTransactions(transactionList);
      } else {
        setReportData([]);
        setTransactions([]);
        setCurrentBalance(0);
        setOpeningBalance(0);
        setBalanceType("Dr");
      }
    } catch (error) {
      console.error("Error fetching ledger report:", error);
      setReportData([]);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh when filters change
  useEffect(() => {
    if (ledgerId && ledgerId !== "0" && ledgerId !== "") {
      fetchLedgerReport();
    }
  }, [ledgerId, fromDate, toDate, voucherTypeId, viewType, balanceView]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete?")) {
      console.log("Deleting...");
    }
  };

  const handleNext = () => {
    console.log("Next page...");
  };

  return (
    <div className="page-body ledger-details-report report-page">
      <style>{`
        .ledger-details-report { max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
        .ledger-details-report .card-body { padding: 1rem; }
        .ledger-details-report .report-table-wrapper {
          max-height: 500px;
          overflow-x: auto;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .ledger-details-report .report-table-wrapper table { min-width: 600px; margin-bottom: 0; }
        .ledger-details-report .report-table-wrapper th,
        .ledger-details-report .report-table-wrapper td { vertical-align: middle; }
        .ledger-details-report .display-options { flex-wrap: wrap; gap: 0.5rem 1rem; }
        .ledger-details-report .card-footer {
          flex-wrap: wrap;
          gap: 0.35rem;
          padding: 0.75rem 1rem;
        }
        .ledger-details-report .card-footer .btn { margin: 0; }
        @media (max-width: 991.98px) {
          .ledger-details-report .header-fields-row {
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            margin-left: -0.25rem;
            margin-right: -0.25rem;
            padding-left: 0.25rem;
            padding-right: 0.25rem;
          }
          .ledger-details-report .header-fields-row > [class*="col-"] {
            flex: 0 0 auto;
            min-width: 130px;
            max-width: none;
          }
        }
        @media (max-width: 767.98px) {
          .ledger-details-report .header-fields-row > [class*="col-"] { min-width: 115px; }
        }
        @media (max-width: 575.98px) {
          .ledger-details-report .header-fields-row > [class*="col-"] { min-width: 100px; }
        }
        @media (max-width: 991.98px) {
          .ledger-details-report .card-body { padding: 0.75rem; }
          .ledger-details-report .report-table-wrapper { max-height: 420px; }
          .ledger-details-report .report-table-wrapper th,
          .ledger-details-report .report-table-wrapper td { padding: 0.4rem 0.5rem; font-size: 0.875rem; }
          .ledger-details-report .card-footer { padding: 0.6rem 0.75rem; }
          .ledger-details-report .card-footer .btn { font-size: 0.875rem; padding: 0.35rem 0.6rem; }
        }
        @media (max-width: 767.98px) {
          .ledger-details-report .card-body { padding: 0.5rem; }
          .ledger-details-report .gy-3 > [class*="col-"] { margin-bottom: 0.5rem; }
          .ledger-details-report .display-options { gap: 0.4rem 0.75rem; }
          .ledger-details-report .display-options .form-check-inline { margin-right: 0; }
          .ledger-details-report .report-table-wrapper {
            max-height: 360px;
            margin-left: -0.5rem;
            margin-right: -0.5rem;
            padding-left: 0.25rem;
            padding-right: 0.25rem;
          }
          .ledger-details-report .report-table-wrapper table { min-width: 550px; }
          .ledger-details-report .report-table-wrapper th,
          .ledger-details-report .report-table-wrapper td { padding: 0.32rem 0.4rem; font-size: 0.8rem; }
          .ledger-details-report .card-footer { padding: 0.5rem; }
          .ledger-details-report .card-footer .btn { padding: 0.3rem 0.5rem; font-size: 0.85rem; }
        }
        @media (max-width: 575.98px) {
          .ledger-details-report .card-body { padding: 0.4rem; }
          .ledger-details-report .card-header .card-title { font-size: 0.95rem !important; }
          .ledger-details-report .display-options { font-size: 0.85rem; }
          .ledger-details-report .report-table-wrapper { max-height: 320px; }
          .ledger-details-report .report-table-wrapper th,
          .ledger-details-report .report-table-wrapper td { padding: 0.28rem 0.35rem; font-size: 0.75rem; }
          .ledger-details-report .card-footer .btn { padding: 0.28rem 0.45rem; font-size: 0.8rem; }
        }
        /* ── Print Styles ── */
        .ledger-print-layout { display: none; }
        @media print {
          body * { visibility: hidden; }
          .ledger-print-layout, .ledger-print-layout * { visibility: visible; }
          .ledger-print-layout {
            display: block !important;
            position: absolute;
            left: 0; top: 0;
            width: 100%;
            padding: 20px;
            background: white;
            color: black;
            font-family: Arial, sans-serif;
          }
          .ledger-print-layout table { width: 100%; border-collapse: collapse; }
          .ledger-print-layout th, .ledger-print-layout td { border: 1px solid black; padding: 4px 8px; font-size: 12px; }
          .ledger-print-layout th { background: #f0f0f0; -webkit-print-color-adjust: exact; }
          .page-wrapper, .page-body-wrapper { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
      <Breadcrumbs mainTitle="Ledger Details Report" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Ledger Details" tagClass="card-title mb-0" />
              <CardBody>
                <Row className="gy-3 mb-3 header-fields-row">
                  <Col xs="12" sm="6" md="3">
                    <FormGroup>
                      <Label>Ledger</Label>
                      <Input
                        type="select"
                        value={ledgerId}
                        onChange={(e) => setLedgerId(e.target.value)}
                      >
                        <option value="">Select Ledger</option>
                        {ledgerList.map((ledger) => (
                          <option key={ledger.Id} value={ledger.Id}>
                            {ledger.Name}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col xs="12" sm="6" md="2">
                    <FormGroup>
                      <Label>From</Label>
                      <DateInput
                        value={fromDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col xs="12" sm="6" md="2">
                    <FormGroup>
                      <Label>To</Label>
                      <DateInput
                        value={toDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col xs="12" sm="6" md="2">
                    <FormGroup>
                      <Label>Current Bal</Label>
                      <Input
                        type="text"
                        value={`${formatCurrency(currentBalance)} ${balanceType}`}
                        readOnly
                        className="fw-bold"
                      />
                    </FormGroup>
                  </Col>
                  <Col xs="12" sm="6" md="3">
                    <FormGroup>
                      <Label>V.Type</Label>
                      <Input
                        type="select"
                        value={voucherTypeId}
                        onChange={(e) => setVoucherTypeId(e.target.value)}
                      >
                        <option value="0">All Voucher Types</option>
                        {voucherTypeList.map((voucherType) => (
                          <option key={voucherType.Id} value={voucherType.Id}>
                            {voucherType.Name}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>

                <Row className="gy-3 mb-3">
                  <Col xs="12" sm="6" md="6">
                    <FormGroup>
                      <Label>View</Label>
                      <div>
                        <FormGroup check inline>
                          <Input
                            type="radio"
                            name="viewType"
                            checked={viewType === "Summarised"}
                            onChange={() => setViewType("Summarised")}
                          />
                          <Label check>Summarised</Label>
                        </FormGroup>
                        <FormGroup check inline className="ms-2">
                          <Input
                            type="radio"
                            name="viewType"
                            checked={viewType === "Detailed"}
                            onChange={() => setViewType("Detailed")}
                          />
                          <Label check>Detailed</Label>
                        </FormGroup>
                      </div>
                    </FormGroup>
                  </Col>
                  <Col xs="12" sm="6" md="6">
                    <FormGroup>
                      <Label>Balance</Label>
                      <div>
                        <FormGroup check inline>
                          <Input
                            type="radio"
                            name="balanceView"
                            checked={balanceView === "Daily"}
                            onChange={() => setBalanceView("Daily")}
                          />
                          <Label check>Daily</Label>
                        </FormGroup>
                        <FormGroup check inline className="ms-2">
                          <Input
                            type="radio"
                            name="balanceView"
                            checked={balanceView === "Monthly"}
                            onChange={() => setBalanceView("Monthly")}
                          />
                          <Label check>Monthly</Label>
                        </FormGroup>
                      </div>
                    </FormGroup>
                  </Col>
                </Row>



                <Row className="mb-3">
                  <Col xs="12">
                    <div className="d-flex align-items-center flex-wrap display-options">
                      <Label className="me-2 mb-0">Display Options:</Label>
                      <FormGroup check inline className="mb-0 ms-0 me-2">
                        <Input
                          type="checkbox"
                          checked={showNarration}
                          onChange={(e) => setShowNarration(e.target.checked)}
                        />
                        <Label check>Narration</Label>
                      </FormGroup>
                      <FormGroup check inline className="mb-0 me-2">
                        <Input
                          type="checkbox"
                          checked={showVoucherNo}
                          onChange={(e) => setShowVoucherNo(e.target.checked)}
                        />
                        <Label check>Voucher No.</Label>
                      </FormGroup>
                      <FormGroup check inline className="mb-0 me-2">
                        <Input
                          type="checkbox"
                          checked={showPartyName}
                          onChange={(e) => setShowPartyName(e.target.checked)}
                        />
                        <Label check>Party Name</Label>
                      </FormGroup>
                      <FormGroup check inline className="mb-0 me-2">
                        <Input
                          type="checkbox"
                          checked={showVoucherType}
                          onChange={(e) => setShowVoucherType(e.target.checked)}
                        />
                        <Label check>Voucher Type</Label>
                      </FormGroup>

                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md="12">
                    {isLoading ? (
                      <div className="text-center p-4">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading report data...</p>
                      </div>
                    ) : (
                      <div className="table-responsive report-table-wrapper">
                        <Table bordered striped hover className="mb-0">
                          <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                            <tr>
                              <th>Date</th>
                              {showPartyName && <th>Party</th>}
                              {showVoucherNo && <th>V. No.</th>}
                              {showVoucherType && <th>V. Type</th>}
                              <th>Dr</th>
                              <th>Cr</th>
                              <th>Balance</th>
                              {showNarration && <th>Narration</th>}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td colSpan={showPartyName ? (showVoucherNo ? (showVoucherType ? 4 : 3) : 2) : 1} className="fw-bold" style={{ whiteSpace: "nowrap" }}>
                                Op. Bal.
                              </td>
                              <td className="text-end">0.00</td>
                              <td className="text-end">0.00</td>
                              <td className="text-end">
                                {formatCurrency(openingBalance)} {balanceType}
                              </td>
                              {showNarration && <td></td>}
                            </tr>
                            {transactions.length > 0 ? (
                              transactions.map((transaction, index) => (
                                <tr
                                  key={index}
                                  onDoubleClick={() => {
                                    if (viewType === "Detailed" && (transaction.voucherNo || transaction.voucherId)) {
                                      const voucherId = transaction.voucherId != null && transaction.voucherId !== "" ? Number(transaction.voucherId) : 0;
                                      if (voucherId > 0) {
                                        navigate("/VoucherEntry", { state: { Id: voucherId } });
                                      } else {
                                        navigate("/VoucherEntry", { state: { searchVoucherNo: transaction.voucherNo } });
                                      }
                                    }
                                  }}
                                  style={viewType === "Detailed" && (transaction.voucherNo || transaction.voucherId) ? { cursor: "pointer" } : {}}
                                  title={viewType === "Detailed" && (transaction.voucherNo || transaction.voucherId) ? "Double-click to open voucher" : undefined}
                                >
                                  <td>{transaction.date || "-"}</td>
                                  {showPartyName && <td>{transaction.party || "-"}</td>}
                                  {showVoucherNo && <td>{transaction.voucherNo || "-"}</td>}
                                  {showVoucherType && <td>{transaction.voucherType || "-"}</td>}
                                  <td className="text-end">{transaction.debit > 0 ? formatCurrency(transaction.debit) : "0.00"}</td>
                                  <td className="text-end">{transaction.credit > 0 ? formatCurrency(transaction.credit) : "0.00"}</td>
                                  <td className="text-end">
                                    {formatCurrency(Math.abs(transaction.balance))} {transaction.balanceType}
                                  </td>
                                  {showNarration && <td>{transaction.narration || "-"}</td>}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7 + (showNarration ? 1 : 0)} className="text-center">
                                  No data available. Select a ledger to load data.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Col>
                </Row>
              </CardBody>
              <CardFooter className="text-end d-flex flex-wrap gap-2 justify-content-end">
                <Btn color="primary" type="button" onClick={handleNext}>
                  Next
                </Btn>
                <Btn color="success" type="button" onClick={handlePrint}>
                  Print
                </Btn>
                <Btn color="secondary" type="button" onClick={handleBack}>
                  Back
                </Btn>
                <Btn color="danger" type="button" onClick={handleDelete}>
                  Delete
                </Btn>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* ── Hidden Print Layout ─────────────────────────────── */}
      <div className="ledger-print-layout">
        {/* 1. Company name and address – top */}
        <div className="text-center border-bottom pb-3 mb-3" style={{ borderColor: "#333" }}>
          <h2 className="mb-1" style={{ fontWeight: "bold" }}>{printCompanyName || "—"}</h2>
          {printFirmAddress ? <p className="mb-0" style={{ fontSize: "14px" }}>{printFirmAddress}</p> : null}
        </div>

        {/* 2. Report title */}
        <h3 className="text-center text-uppercase mb-3" style={{ fontSize: "16px", fontWeight: "bold", textDecoration: "underline" }}>
          Ledger Details Report
        </h3>

        {/* 3. Header details – 2 rows, 3 columns */}
        <table style={{ width: "100%", marginBottom: "12px", fontSize: "13px", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "33.33%", verticalAlign: "top", padding: "2px 8px 4px 0" }}>
                <strong>Ledger:</strong> {ledgerName || "—"}
              </td>
              <td style={{ width: "33.33%", verticalAlign: "top", padding: "2px 8px 4px 0" }}>
                <strong>From Date:</strong> {formatDateForAPI(fromDate)}
              </td>
              <td style={{ width: "33.33%", verticalAlign: "top", padding: "2px 0 4px 0" }}>
                <strong>To Date:</strong> {formatDateForAPI(toDate)}
              </td>
            </tr>
            <tr>
              <td style={{ width: "33.33%", verticalAlign: "top", padding: "2px 8px 0 0" }}>
                <strong>View Type:</strong> {viewType}
              </td>
              <td style={{ width: "33.33%", verticalAlign: "top", padding: "2px 8px 0 0" }}>
                <strong>Balance View:</strong> {balanceView}
              </td>
              <td style={{ width: "33.33%", verticalAlign: "top", padding: "2px 0 0 0" }}>
                <strong>Voucher Type:</strong> {voucherTypeId && voucherTypeId !== "0" ? (voucherTypeList.find((vt) => String(vt.Id) === voucherTypeId)?.Name || "—") : "All"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 4. Grid data */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ textAlign: "left" }}>Date</th>
              <th style={{ textAlign: "left" }}>Particulars</th>
              {viewType === "Detailed" && <th style={{ textAlign: "left" }}>V. No.</th>}
              {viewType === "Detailed" && <th style={{ textAlign: "left" }}>V. Type</th>}
              <th style={{ textAlign: "right" }}>Debit</th>
              <th style={{ textAlign: "right" }}>Credit</th>
              <th style={{ textAlign: "right" }}>Balance</th>
              {viewType === "Detailed" && <th style={{ textAlign: "left" }}>Narration</th>}
            </tr>
          </thead>
          <tbody>
            {/* Opening Balance Row */}
            <tr>
              <td></td>
              <td><strong>Opening Balance</strong></td>
              {viewType === "Detailed" && <td></td>}
              {viewType === "Detailed" && <td></td>}
              <td style={{ textAlign: "right" }}>0.00</td>
              <td style={{ textAlign: "right" }}>0.00</td>
              <td style={{ textAlign: "right" }}><strong>{formatCurrency(openingBalance)} {balanceType}</strong></td>
              {viewType === "Detailed" && <td></td>}
            </tr>

            {/* Transaction Rows */}
            {transactions.map((t, i) => (
              <tr key={i}>
                <td>{t.date || ""}</td>
                <td>{t.party || ""}</td>
                {viewType === "Detailed" && <td>{t.voucherNo || ""}</td>}
                {viewType === "Detailed" && <td>{t.voucherType || ""}</td>}
                <td style={{ textAlign: "right" }}>{t.debit > 0 ? formatCurrency(t.debit) : "0.00"}</td>
                <td style={{ textAlign: "right" }}>{t.credit > 0 ? formatCurrency(t.credit) : "0.00"}</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(t.balance)} {t.balanceType}</td>
                {viewType === "Detailed" && <td>{t.narration || ""}</td>}
              </tr>
            ))}

            {/* Closing Balance Row */}
            <tr style={{ fontWeight: "bold", borderTop: "2px solid black" }}>
              <td colSpan={viewType === "Detailed" ? 4 : 1} style={{ textAlign: "right" }}>Closing Balance:</td>
              <td style={{ textAlign: "right" }}>
                {formatCurrency(transactions.reduce((s, t) => s + t.debit, 0))}
              </td>
              <td style={{ textAlign: "right" }}>
                {formatCurrency(transactions.reduce((s, t) => s + t.credit, 0))}
              </td>
              <td style={{ textAlign: "right" }}>{formatCurrency(currentBalance)} {balanceType}</td>
              {viewType === "Detailed" && <td></td>}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LedgerDetailsReport;

