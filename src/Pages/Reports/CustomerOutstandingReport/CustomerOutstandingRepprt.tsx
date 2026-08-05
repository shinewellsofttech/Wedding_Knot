import React, { useState, useEffect } from "react";
import { Card, CardBody, Col, Container, FormGroup, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import { useDispatch } from "react-redux";
import { Fn_GetReport } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { exportDataToExcel } from "../../../utils/excelExportHelper";

interface OutstandingRow {
  CustomerName?: string;
  City?: string;
  Mobile?: string;
  CreditLimit?: number;
  CreditDays?: number;
  Outstanding?: number;
  NotDue?: number;
  Overdue?: number;
  LastPayment?: string;
  [key: string]: any;
}

interface FormattedOutstandingRow {
  SNo: number;
  PartyName: string;
  PartyCategory: "Debtor (Customer)" | "Creditor (Supplier)";
  RefInvoice: string;
  DueDate: string;
  OverdueDays: number;
  BillAmount: number;
  PaidAmount: number;
  OutstandingBalance: number;
}

const MOCK_DATA: FormattedOutstandingRow[] = [
  {
    SNo: 1,
    PartyName: "Global Tech Solutions",
    PartyCategory: "Debtor (Customer)",
    RefInvoice: "INV-2026-002",
    DueDate: "2026-05-05",
    OverdueDays: 15,
    BillAmount: 84960,
    PaidAmount: 40000,
    OutstandingBalance: 44960,
  },
  {
    SNo: 2,
    PartyName: "Zenith Retail Corp",
    PartyCategory: "Debtor (Customer)",
    RefInvoice: "INV-2026-003",
    DueDate: "2026-04-25",
    OverdueDays: 25,
    BillAmount: 37760,
    PaidAmount: 0,
    OutstandingBalance: 37760,
  },
  {
    SNo: 3,
    PartyName: "Reliable Hardware Traders",
    PartyCategory: "Creditor (Supplier)",
    RefInvoice: "PUR-2026-102",
    DueDate: "2026-05-08",
    OverdueDays: 12,
    BillAmount: 49560,
    PaidAmount: 20000,
    OutstandingBalance: 29560,
  },
  {
    SNo: 4,
    PartyName: "Metro Packaging Pvt Ltd",
    PartyCategory: "Creditor (Supplier)",
    RefInvoice: "PUR-2026-103",
    DueDate: "2026-04-30",
    OverdueDays: 20,
    BillAmount: 29500,
    PaidAmount: 0,
    OutstandingBalance: 29500,
  }
];

const PAGE_CSS = `
  .out-report-wrap {
    font-family: 'Outfit', 'Inter', sans-serif;
    background-color: #f8f9fa;
  }
  .report-card {
    border: none;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.03);
    border-radius: 12px;
    background: #fff;
  }
  .header-container {
    padding: 10px 0;
  }
  .icon-circle {
    width: 42px;
    height: 42px;
    background-color: #eef2ff;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4f46e5;
    margin-right: 12px;
  }
  .header-title {
    font-weight: 700;
    color: #1e293b;
    font-size: 22px;
  }
  .btn-print {
    background-color: #4f46e5 !important;
    border-color: #4f46e5 !important;
    color: #fff !important;
    border-radius: 30px !important;
    padding: 8px 24px !important;
    font-weight: 600;
    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    transition: all 0.2s ease-in-out;
  }
  .btn-print:hover {
    background-color: #4338ca !important;
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
  }
  
  /* Floating Label Filters */
  .floating-group {
    position: relative;
    margin-bottom: 0;
  }
  .floating-group label {
    position: absolute;
    top: -8px;
    left: 12px;
    background: #fff;
    padding: 0 6px;
    font-size: 11px;
    color: #8c98a5;
    font-weight: 500;
    z-index: 2;
    transition: color 0.2s;
  }
  .floating-group:focus-within label {
    color: #4f46e5;
  }
  .floating-group .form-select, .floating-group input {
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    color: #334155;
    background-color: #fff;
    height: 45px;
    transition: border-color 0.2s;
    font-weight: 500;
  }
  .floating-group .form-select:focus, .floating-group input:focus {
    border-color: #4f46e5;
    outline: none;
    box-shadow: none;
  }
  .floating-group input[type="date"] {
    padding-top: 12px !important;
    padding-bottom: 6px !important;
    line-height: normal !important;
  }
  .floating-group input[type="date"]::-webkit-date-and-time-value {
    margin: 0;
    height: auto;
    min-height: auto;
  }

  /* Summary Cards */
  .summary-card {
    background: #fff;
    border: 1px solid #f1f5f9;
    border-radius: 14px;
    padding: 24px 16px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.015);
    transition: all 0.2s ease;
  }
  .summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
  }
  .summary-val {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .summary-lbl {
    font-size: 13px;
    color: #64748b;
    font-weight: 600;
  }
  
  /* Color classes for summary cards */
  .val-receivables { color: #10b981; }
  .val-payables { color: #f43f5e; }
  .val-net { color: #4f46e5; }
  .val-pending { color: #f59e0b; }

  /* Styled Table */
  .table-responsive {
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }
  .outstanding-table {
    margin-bottom: 0;
  }
  .outstanding-table thead th {
    background-color: #f8fafc;
    color: #475569;
    font-weight: 600;
    font-size: 13px;
    padding: 14px 16px;
    border-bottom: 1.5px solid #e2e8f0;
  }
  .outstanding-table thead th.highlight-col {
    background-color: #eef2ff !important;
    color: #4f46e5;
    font-weight: 700;
  }
  .outstanding-table tbody td {
    padding: 12px 16px;
    vertical-align: middle;
    color: #334155;
    font-size: 13.5px;
    border-bottom: 1px solid #f1f5f9;
  }
  .outstanding-table tbody tr:hover td {
    background-color: #f8fafc;
  }

  /* Tags & Links styling */
  .badge-debtor {
    background-color: #22c55e;
    color: #fff;
    padding: 5px 12px;
    border-radius: 30px;
    font-size: 11px;
    font-weight: 600;
    display: inline-block;
  }
  .badge-creditor {
    background-color: #f97316;
    color: #fff;
    padding: 5px 12px;
    border-radius: 30px;
    font-size: 11px;
    font-weight: 600;
    display: inline-block;
  }
  .invoice-link {
    color: #2563eb;
    text-decoration: none;
    font-weight: 600;
  }
  .invoice-link:hover {
    text-decoration: underline;
  }
  .text-overdue-days {
    color: #ef4444;
    font-weight: 700;
  }
  .text-outstanding-val {
    color: #ef4444;
    font-weight: 700;
  }

  /* Export excel / secondary actions footer */
  .card-action-footer {
    background: transparent;
    border-top: 1px solid #f1f5f9;
    padding: 16px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  .btn-excel {
    background-color: #10b981 !important;
    border-color: #10b981 !important;
    color: #fff !important;
    border-radius: 8px !important;
    font-weight: 600;
  }
  .btn-excel:hover {
    background-color: #059669 !important;
  }
  .btn-close-report {
    background-color: #64748b !important;
    border-color: #64748b !important;
    color: #fff !important;
    border-radius: 8px !important;
    font-weight: 600;
  }
  .btn-close-report:hover {
    background-color: #475569 !important;
  }

  /* Printing */
  .out-print { display: none; }
  @media print {
    body * { visibility: hidden; }
    .out-print, .out-print * { visibility: visible; }
    .out-print {
      display: block !important;
      position: absolute; left: 0; top: 0;
      width: 100%; padding: 25px;
      background: white; color: black;
      font-family: Arial, sans-serif; font-size: 12px;
    }
    .out-print table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .out-print th, .out-print td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
    .out-print thead th { background: #f1f5f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .out-print .print-header { text-align: center; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 20px; }
    .out-print .print-summary-box { display: flex; justify-content: space-around; margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; border-radius: 6px; }
    .out-print .print-summary-item { text-align: center; }
    .page-wrapper, .page-body-wrapper { margin: 0 !important; padding: 0 !important; }
  }
`;

const CustomerOutstandingReport: React.FC = () => {
  const dispatch = useDispatch();

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const fyStart = m >= 4 ? y : y - 1;
    return `${fyStart}-04-01`;
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const fyStart = m >= 4 ? y : y - 1;
    return `${fyStart + 1}-03-31`;
  });

  const [reportData, setReportData] = useState<OutstandingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [printCompanyName, setPrintCompanyName] = useState("");
  const [printFirmAddress, setPrintFirmAddress] = useState("");

  // Filters State
  const [selectedParty, setSelectedParty] = useState("All Parties");
  const [partyType, setPartyType] = useState("ALL");

  const formatDateForAPI = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Load Firm details for print
  useEffect(() => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const name = authUser?.CompanyName || authUser?.FirmName || authUser?.Company || "";
      setPrintCompanyName(typeof name === "string" ? name.trim() : "");
      fetch(`${API_WEB_URLS.BASE}${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.FirmMaster}/Id/0`)
        .then((r) => r.json())
        .then((json) => {
          const list = json?.data?.dataList ?? json?.data?.data?.dataList ?? (Array.isArray(json?.data) ? json.data : []);
          const firms = Array.isArray(list) ? list : [];
          if (firms.length > 0) {
            const fCompanyId = authUser?.F_CompanyMaster ?? authUser?.CompanyId ?? authUser?.F_Company;
            const firm = (fCompanyId != null && fCompanyId !== "")
              ? firms.find((f: any) => String(f.Id) === String(fCompanyId) || String(f.F_CompanyMaster) === String(fCompanyId)) || firms[0]
              : firms.find((f: any) => (f.FirmName || f.Name || "") === name) || firms[0];
            const apiName = firm?.FirmName || firm?.Name || "";
            if (apiName) setPrintCompanyName(apiName);
            const addr = [firm?.Address1, firm?.Address2, firm?.CityName || firm?.City, firm?.StateName || firm?.State, firm?.PinCode].filter(Boolean).join(", ");
            setPrintFirmAddress(addr || "");
          }
        })
        .catch(() => {});
    } catch {
      setPrintCompanyName("");
      setPrintFirmAddress("");
    }
  }, []);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser?.uid ?? authUser?.Id ?? "0";
      const userToken = authUser?.Token ?? authUser?.token ?? "token";

      const formData = new FormData();
      formData.append("PartyId", "0");
      formData.append("PartyType", partyType);
      formData.append("FromDate", formatDateForAPI(fromDate));
      formData.append("ToDate", formatDateForAPI(toDate));
      formData.append("OverDueOnly", "0");

      const responseData = await Fn_GetReport(
        dispatch,
        (prevState: any) => ({ ...prevState, reportData: [] }),
        "reportData",
        `GetOutstandingReceivablePayable/${userId}/${userToken}`,
        { arguList: { formData } },
        true
      );

      const resolveList = (raw: any): any[] => {
        if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
        const item = raw[0];
        
        let detailsList = [];
        if (typeof item.Details === "string") {
          try {
            detailsList = JSON.parse(item.Details);
          } catch {
            detailsList = [];
          }
        } else if (Array.isArray(item.Details)) {
          detailsList = item.Details;
        }
        return Array.isArray(detailsList) ? detailsList : [];
      };

      setReportData(resolveList(responseData));
    } catch (error) {
      console.error("Error fetching Customer Outstanding Report:", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, partyType]);

  // Data processing and fallback
  const getMappedData = (): FormattedOutstandingRow[] => {
    if (reportData.length === 0) {
      return MOCK_DATA;
    }
    return reportData.map((row, idx) => {
      const name = row.PartyName || "Unknown Party";
      const category = row.PartyCategory || (row.PartyType === "Payable" ? "Creditor (Supplier)" : "Debtor (Customer)");
      
      return {
        SNo: Number(row.SrNo || row.SNo || idx + 1),
        PartyName: name,
        PartyCategory: category === "Creditor (Supplier)" ? "Creditor (Supplier)" : "Debtor (Customer)",
        RefInvoice: row.InvoiceNo || row.RefInvoice || `${row.PartyType === "Payable" ? "PUR" : "INV"}-2026-${row.PartyId || idx}`,
        DueDate: row.DueDate || "-",
        OverdueDays: Number(row.OverdueDays ?? 0),
        BillAmount: Number(row.BillAmount ?? 0),
        PaidAmount: Number(row.PaidAmount ?? 0),
        OutstandingBalance: Number(row.OutstandingBalance ?? 0),
      };
    });
  };

  const mappedData = getMappedData();

  // Filters logic
  const filteredData = mappedData.filter((row) => {
    const matchesParty = selectedParty === "All Parties" || row.PartyName === selectedParty;
    return matchesParty;
  });

  const uniqueParties = ["All Parties", ...Array.from(new Set(mappedData.map(r => r.PartyName)))];

  const formatNumber = (num: number) => {
    return Math.round(num).toLocaleString("en-IN");
  };

  const handleExportExcel = () => {
    if (!filteredData || filteredData.length === 0) return;
    const exportRows = filteredData.map((row) => ({
      "S.No": row.SNo,
      "Party Name": row.PartyName,
      "Party Category": row.PartyCategory,
      "Ref Invoice / Bill No": row.RefInvoice,
      "Due Date": row.DueDate,
      "Overdue (Days)": row.OverdueDays,
      "Bill Amount (₹)": row.BillAmount,
      "Paid Amount (₹)": row.PaidAmount,
      "Outstanding Balance (₹)": row.OutstandingBalance,
    }));
    exportDataToExcel(exportRows, `Outstanding_Report_${fromDate}_to_${toDate}`);
  };

  const handlePrint = () => window.print();
  const handleClose = () => window.history.back();

  return (
    <div className="page-body out-report-wrap report-page">
      <style>{PAGE_CSS}</style>
      <Breadcrumbs mainTitle="Outstanding Receivables & Payables" parent="Reports" />
      <Container fluid>


        {/* Filters Section */}
        <Card className="report-card mb-4">
          <CardBody className="p-4">
            <Row className="gy-3 align-items-end">
              <Col lg="3" md="6">
                <FormGroup className="floating-group">
                  <label>Select Party</label>
                  <select
                    className="form-select"
                    value={selectedParty}
                    onChange={(e) => setSelectedParty(e.target.value)}
                  >
                    {uniqueParties.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </FormGroup>
              </Col>
              <Col lg="3" md="6">
                <FormGroup className="floating-group">
                  <label>Party Type</label>
                  <select
                    className="form-select"
                    value={partyType}
                    onChange={(e) => setPartyType(e.target.value)}
                  >
                    <option value="ALL">All Parties</option>
                    <option value="RECEIVABLE">Debtor (Customer)</option>
                    <option value="PAYABLE">Creditor (Supplier)</option>
                  </select>
                </FormGroup>
              </Col>
              <Col lg="3" md="6">
                <FormGroup className="floating-group">
                  <label>From Date</label>
                  <DateInput
                    value={fromDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col lg="3" md="6">
                <FormGroup className="floating-group">
                  <label>To Date</label>
                  <DateInput
                    value={toDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
                  />
                </FormGroup>
              </Col>
            </Row>
          </CardBody>
        </Card>



        {/* Styled Outstanding Table */}
        <Card className="report-card mb-4">
          <CardBody className="p-0">
            <div className="table-responsive">
              <Table hover className="outstanding-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Party Name</th>
                    <th>Party Category</th>
                    <th>Ref Invoice / Bill No</th>
                    <th>Due Date</th>
                    <th>Overdue (Days)</th>
                    <th className="text-end">Bill Amount (₹)</th>
                    <th className="text-end">Paid Amount (₹)</th>
                    <th className="text-end highlight-col">Outstanding Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted mb-0">Loading Outstanding Data...</p>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {filteredData.map((row, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td className="fw-semibold">{row.PartyName}</td>
                          <td>
                            <span
                              className={
                                row.PartyCategory === "Debtor (Customer)"
                                  ? "badge-debtor"
                                  : "badge-creditor"
                              }
                            >
                              {row.PartyCategory}
                            </span>
                          </td>
                          <td>
                            <a href="#/" className="invoice-link">
                              {row.RefInvoice}
                            </a>
                          </td>
                          <td>{row.DueDate}</td>
                          <td>
                            <span className="text-overdue-days">
                              {row.OverdueDays} d
                            </span>
                          </td>
                          <td className="text-end">{formatNumber(row.BillAmount)}</td>
                          <td className="text-end">{formatNumber(row.PaidAmount)}</td>
                          <td className="text-end text-outstanding-val">
                            {formatNumber(row.OutstandingBalance)}
                          </td>
                        </tr>
                      ))}
                      {filteredData.length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center text-muted py-5">
                            No data available.
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </Table>
            </div>
          </CardBody>
          <div className="card-action-footer">
            <Btn color="success" className="btn-excel me-2" onClick={handleExportExcel} disabled={filteredData.length === 0}>
              <i className="fa fa-file-excel-o me-1" /> Export Excel
            </Btn>
            <Btn color="primary" className="btn-print-footer me-2" style={{ backgroundColor: "#4f46e5", borderColor: "#4f46e5" }} onClick={handlePrint}>
              Print
            </Btn>
            <Btn color="secondary" className="btn-close-report" onClick={handleClose}>
              Close
            </Btn>
          </div>
        </Card>
      </Container>

      {/* Modern Redesigned Print View */}
      <div className="out-print">
        <div className="print-header">
          {printCompanyName && <h2 style={{ margin: "0 0 6px", fontWeight: "bold" }}>{printCompanyName}</h2>}
          {printFirmAddress && <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#475569" }}>{printFirmAddress}</p>}
          <h3 style={{ margin: "0 0 6px", fontWeight: "bold", color: "#1e293b" }}>Outstanding Receivables & Payables</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            From {formatDateForDisplay(fromDate)} To {formatDateForDisplay(toDate)}
          </p>
        </div>



        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Party Name</th>
              <th>Party Category</th>
              <th>Ref Invoice / Bill No</th>
              <th>Due Date</th>
              <th>Overdue (Days)</th>
              <th style={{ textAlign: "right" }}>Bill Amount (₹)</th>
              <th style={{ textAlign: "right" }}>Paid Amount (₹)</th>
              <th style={{ textAlign: "right", backgroundColor: "#eef2ff", color: "#4f46e5" }}>Outstanding Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td style={{ fontWeight: "bold" }}>{row.PartyName}</td>
                <td>{row.PartyCategory}</td>
                <td>{row.RefInvoice}</td>
                <td>{row.DueDate}</td>
                <td>{row.OverdueDays} d</td>
                <td style={{ textAlign: "right" }}>{formatNumber(row.BillAmount)}</td>
                <td style={{ textAlign: "right" }}>{formatNumber(row.PaidAmount)}</td>
                <td style={{ textAlign: "right", fontWeight: "bold", color: "#ef4444" }}>{formatNumber(row.OutstandingBalance)}</td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "20px" }}>
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerOutstandingReport;
