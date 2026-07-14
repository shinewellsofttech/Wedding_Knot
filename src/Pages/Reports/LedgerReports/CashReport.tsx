import React, { useState, useEffect } from "react";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Table, Badge } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  [key: string]: any;
}

interface LedgerMaster {
  Id: number;
  Name: string;
}

const CashReport: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [cashLedgers, setCashLedgers] = useState<LedgerMaster[]>([]);
  const [selectedLedgerId, setSelectedLedgerId] = useState<string>("");
  const [selectedLedgerName, setSelectedLedgerName] = useState<string>("");

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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [balanceType, setBalanceType] = useState<"Dr" | "Cr">("Dr");
  const [printCompanyName, setPrintCompanyName] = useState("");
  const [printFirmAddress, setPrintFirmAddress] = useState("");

  // API URLs
  const LEDGER_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.LedgerMaster}/Id/0`;

  // 1. Fetch ledgers on mount and filter cash accounts
  useEffect(() => {
    const loadLedgers = async () => {
      try {
        const ledgerData = await Fn_FillListData(
          dispatch,
          () => {},
          "ledgers",
          LEDGER_LIST_URL
        );

        if (Array.isArray(ledgerData)) {
          // Filter ledgers whose names suggest they are cash accounts
          const cashList = ledgerData.filter((l: any) => {
            const name = (l.Name || "").toLowerCase().trim();
            return name === "cash" || name === "cash a/c" || name === "cash account" || name.includes("cash");
          });

          setCashLedgers(cashList);

          // Auto-select the best cash ledger
          if (cashList.length > 0) {
            // Prefer exact cash or cash a/c
            const exactCash = cashList.find((l: any) => {
              const name = (l.Name || "").toLowerCase().trim();
              return name === "cash" || name === "cash a/c";
            });
            const defaultLedger = exactCash || cashList[0];
            setSelectedLedgerId(String(defaultLedger.Id));
            setSelectedLedgerName(defaultLedger.Name);
          } else if (ledgerData.length > 0) {
            // Fallback: If no cash ledger is found, use the first ledger but let the user know
            setSelectedLedgerId(String(ledgerData[0].Id));
            setSelectedLedgerName(ledgerData[0].Name);
          }
        }
      } catch (error) {
        console.error("Error loading ledgers:", error);
      }
    };
    loadLedgers();
  }, [dispatch]);

  // Update selected ledger name when ID changes
  useEffect(() => {
    if (selectedLedgerId && cashLedgers.length > 0) {
      const selected = cashLedgers.find((l) => String(l.Id) === selectedLedgerId);
      if (selected) {
        setSelectedLedgerName(selected.Name);
      }
    }
  }, [selectedLedgerId, cashLedgers]);

  // 2. Load Company details for Print Header
  useEffect(() => {
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    const firmName = authUser.FirmName || authUser.CompanyName || authUser.Company || "";
    setPrintCompanyName(firmName);

    Fn_FillListData(dispatch, () => {}, "FirmListPrint", `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.FirmMaster}/Id/0`)
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

  // 3. Fetch Cash Book details
  const fetchCashReport = async () => {
    if (!selectedLedgerId || selectedLedgerId === "" || selectedLedgerId === "0") return;

    try {
      setIsLoading(true);
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = String(authUser?.uid ?? authUser?.Id ?? "0");
      const userToken = authUser?.Token ?? authUser?.token ?? "token";

      const apiURL = `GetCashBookReport/${userId}/${userToken}`;

      const formData = new FormData();
      formData.append("FromDate", fromDate);
      formData.append("ToDate", toDate);
      formData.append("CashLedgerId", String(Number(selectedLedgerId)));

      const arguList = { formData };

      const responseData = await Fn_GetReport(
        dispatch,
        () => {},
        "reportData",
        apiURL,
        { arguList },
        true
      );

      const resolveRows = (raw: any): any[] => {
        if (Array.isArray(raw)) return raw;
        if (raw && Array.isArray(raw.data?.response)) return raw.data.response;
        if (raw && Array.isArray(raw.response)) return raw.response;
        return [];
      };

      const rows = resolveRows(responseData);

      if (rows.length > 0) {
        // Calculate Opening Balance based on the first transaction row's balance
        const first = rows[0];
        let opening = 0;
        let opType: "Dr" | "Cr" = "Dr";
        if (first) {
          const firstBal = Number(first.Balance) || 0;
          const firstDebit = Number(first.Debit) || 0;
          const firstCredit = Number(first.Credit) || 0;
          const firstType = first.BalanceType || "Dr";
          
          const firstBalSigned = firstType === "Cr" ? -firstBal : firstBal;
          const opSigned = firstBalSigned - firstDebit + firstCredit;
          opening = Math.abs(opSigned);
          opType = opSigned >= 0 ? "Dr" : "Cr";
        }
        setOpeningBalance(opening);
        setBalanceType(opType);

        const transactionList: Transaction[] = rows.map((row: any) => {
          return {
            date: row.Date ? formatDateForDisplay(row.Date) : "",
            party: row.Particular || "—",
            voucherNo: row.VoucherNo || "—",
            voucherId: row.F_VoucherMaster ?? row.VoucherId ?? row.Id ?? row.VoucherID ?? "",
            voucherType: row.VoucherType || "",
            debit: Number(row.Debit) || 0,
            credit: Number(row.Credit) || 0,
            balance: Math.abs(Number(row.Balance) || 0),
            balanceType: row.BalanceType || "Dr",
            narration: row.Narration || "",
          };
        });

        setTransactions(transactionList);

        if (transactionList.length > 0) {
          const lastTx = transactionList[transactionList.length - 1];
          setCurrentBalance(lastTx.balance);
          setBalanceType(lastTx.balanceType);
        } else {
          setCurrentBalance(opening);
          setBalanceType(opType);
        }
      } else {
        setTransactions([]);
        setCurrentBalance(0);
        setOpeningBalance(0);
        setBalanceType("Dr");
      }
    } catch (error) {
      console.error("Error fetching cash report:", error);
      setTransactions([]);
      setCurrentBalance(0);
      setOpeningBalance(0);
      setBalanceType("Dr");
    } finally {
      setIsLoading(false);
    }
  };

  // Reload report when inputs change
  useEffect(() => {
    fetchCashReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLedgerId, fromDate, toDate]);

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
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="page-body cash-report-page report-page">
      <style>{`
        .cash-report-page { max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
        .cash-report-page .card-body { padding: 1.25rem; }
        .cash-report-page .report-table-wrapper {
          max-height: 550px;
          overflow-x: auto;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .cash-report-page .report-table-wrapper table { min-width: 700px; margin-bottom: 0; }
        .cash-report-page .report-table-wrapper th,
        .cash-report-page .report-table-wrapper td { vertical-align: middle; }
        .cash-report-page .card-footer {
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
        }
        .cash-report-page .card-footer .btn { margin: 0; }
        .particulars-cell {
          display: flex;
          flex-direction: column;
        }
        .particulars-name {
          font-weight: 500;
        }
        .particulars-narration {
          font-size: 0.85rem;
          color: #6c757d;
          margin-top: 3px;
          white-space: pre-wrap;
          font-style: italic;
        }
        /* ── Print Styles ── */
        .cash-print-layout { display: none; }
        @media print {
          .sidebar-wrapper, .page-header, .breadcrumbs, .card-header, .card-footer, .header-fields-row, .btn, .no-print {
            display: none !important;
          }
          body, html {
            background: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .page-wrapper, .page-body-wrapper, .page-body, .container-fluid, .card, .card-body {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .cash-print-layout {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif;
          }
          .cash-print-layout table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .cash-print-layout th, .cash-print-layout td { border: 1px solid #000; padding: 6px 8px; font-size: 11px; }
          .cash-print-layout th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4 portrait; margin: 10mm; }
        }
      `}</style>
      
      <Breadcrumbs mainTitle="Cash Report" parent="Reports" />
      
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Cash Book Details" tagClass="card-title mb-0" />
              <CardBody>
                <Row className="gy-3 mb-4 align-items-end">
                  {cashLedgers.length > 1 && (
                    <Col xs="12" sm="6" md="3">
                      <FormGroup className="mb-0">
                        <Label className="fw-bold text-muted small">Select Cash Ledger</Label>
                        <Input
                          type="select"
                          value={selectedLedgerId}
                          onChange={(e) => setSelectedLedgerId(e.target.value)}
                        >
                          {cashLedgers.map((l) => (
                            <option key={l.Id} value={l.Id}>
                              {l.Name}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  )}
                  <Col xs="12" sm="6" md="3">
                    <FormGroup className="mb-0">
                      <Label className="fw-bold text-muted small">From Date</Label>
                      <DateInput
                        value={fromDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col xs="12" sm="6" md="3">
                    <FormGroup className="mb-0">
                      <Label className="fw-bold text-muted small">To Date</Label>
                      <DateInput
                        value={toDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col xs="12" sm="6" md="3">
                    <FormGroup className="mb-0">
                      <Label className="fw-bold text-muted small">Current Cash Balance</Label>
                      <Input
                        type="text"
                        value={`${formatCurrency(currentBalance)} ${balanceType}`}
                        readOnly
                        className="fw-bold text-dark bg-light"
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md="12">
                    {isLoading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">Fetching Cash transactions...</p>
                      </div>
                    ) : (
                      <div className="table-responsive report-table-wrapper border rounded">
                        <Table bordered striped hover className="mb-0">
                          <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                            <tr>
                              <th style={{ width: "120px" }}>Voucher No</th>
                              <th style={{ width: "110px" }}>Date</th>
                              <th>Particular</th>
                              <th className="text-end" style={{ width: "130px" }}>Debit</th>
                              <th className="text-end" style={{ width: "130px" }}>Credit</th>
                              <th className="text-end" style={{ width: "150px" }}>Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Opening Balance Row */}
                            <tr className="table-info fw-semibold">
                              <td colSpan={3} className="text-start">
                                Opening Balance
                              </td>
                              <td className="text-end">0.00</td>
                              <td className="text-end">0.00</td>
                              <td className="text-end">
                                {formatCurrency(openingBalance)} {balanceType}
                              </td>
                            </tr>

                            {transactions.length > 0 ? (
                              transactions.map((transaction, index) => (
                                <tr
                                  key={index}
                                  onDoubleClick={() => {
                                    if (transaction.voucherId) {
                                      navigate("/VoucherEntry", { state: { Id: Number(transaction.voucherId) } });
                                    }
                                  }}
                                  style={{ cursor: "pointer" }}
                                  title="Double-click to view voucher details"
                                >
                                  <td>{transaction.voucherNo || "-"}</td>
                                  <td>{transaction.date || "-"}</td>
                                  <td>
                                    <div className="particulars-cell">
                                      <span className="particulars-name">{transaction.party || "-"}</span>
                                      {transaction.narration && (
                                        <span className="particulars-narration">
                                          {transaction.narration}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="text-end text-success">
                                    {transaction.debit > 0 ? formatCurrency(transaction.debit) : "0.00"}
                                  </td>
                                  <td className="text-end text-danger">
                                    {transaction.credit > 0 ? formatCurrency(transaction.credit) : "0.00"}
                                  </td>
                                  <td className="text-end fw-semibold">
                                    {formatCurrency(Math.abs(transaction.balance))} {transaction.balanceType}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="text-center py-4 text-muted">
                                  No transactions found in this date range.
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
              <CardFooter className="text-end d-flex justify-content-end gap-2">
                <Btn color="success" type="button" onClick={handlePrint}>
                  <i className="fa fa-print me-1" /> Print
                </Btn>
                <Btn color="secondary" type="button" onClick={handleBack}>
                  <i className="fa fa-arrow-left me-1" /> Back
                </Btn>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* ── Print Layout ─────────────────────────────── */}
      <div className="cash-print-layout">
        <div className="text-center border-bottom pb-3 mb-3" style={{ borderColor: "#333" }}>
          <h2 className="mb-1" style={{ fontWeight: "bold" }}>{printCompanyName || "—"}</h2>
          {printFirmAddress ? <p className="mb-0" style={{ fontSize: "14px" }}>{printFirmAddress}</p> : null}
        </div>

        <h3 className="text-center text-uppercase mb-4" style={{ fontSize: "16px", fontWeight: "bold", textDecoration: "underline" }}>
          Cash Report
        </h3>

        <table style={{ width: "100%", marginBottom: "15px", fontSize: "13px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%" }}>
                <strong>Ledger Name:</strong> {selectedLedgerName || "—"}
              </td>
              <td style={{ width: "25%" }}>
                <strong>From Date:</strong> {formatDateForAPI(fromDate)}
              </td>
              <td style={{ width: "25%" }}>
                <strong>To Date:</strong> {formatDateForAPI(toDate)}
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ textAlign: "left" }}>Voucher No</th>
              <th style={{ textAlign: "left" }}>Date</th>
              <th style={{ textAlign: "left" }}>Particular</th>
              <th style={{ textAlign: "right" }}>Debit</th>
              <th style={{ textAlign: "right" }}>Credit</th>
              <th style={{ textAlign: "right" }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3}><strong>Opening Balance</strong></td>
              <td style={{ textAlign: "right" }}>0.00</td>
              <td style={{ textAlign: "right" }}>0.00</td>
              <td style={{ textAlign: "right" }}><strong>{formatCurrency(openingBalance)} {balanceType}</strong></td>
            </tr>

            {transactions.map((t, i) => (
              <tr key={i}>
                <td>{t.voucherNo || "—"}</td>
                <td>{t.date || ""}</td>
                <td>
                  <div>{t.party || ""}</div>
                  {t.narration && (
                    <div style={{ fontSize: "10px", color: "#555", fontStyle: "italic", marginTop: "2px" }}>
                      {t.narration}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: "right" }}>{t.debit > 0 ? formatCurrency(t.debit) : "0.00"}</td>
                <td style={{ textAlign: "right" }}>{t.credit > 0 ? formatCurrency(t.credit) : "0.00"}</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(t.balance)} {t.balanceType}</td>
              </tr>
            ))}

            {/* Closing Balance Row */}
            <tr style={{ fontWeight: "bold", borderTop: "2px solid #000" }}>
              <td colSpan={3} style={{ textAlign: "right" }}>Closing Balance:</td>
              <td style={{ textAlign: "right" }}>
                {formatCurrency(transactions.reduce((s, t) => s + t.debit, 0))}
              </td>
              <td style={{ textAlign: "right" }}>
                {formatCurrency(transactions.reduce((s, t) => s + t.credit, 0))}
              </td>
              <td style={{ textAlign: "right" }}>{formatCurrency(currentBalance)} {balanceType}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashReport;
