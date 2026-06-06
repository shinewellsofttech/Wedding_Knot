import React, { useState, useEffect } from "react";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Label, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { useDispatch } from "react-redux";
import { Fn_GetReport } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

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

const PAGE_CSS = `
  .out-report-wrap .table-responsive { max-height: 520px; overflow-y: auto; }
  @media (max-width: 991.98px) {
    .out-report-wrap .card-body { padding: 0.75rem; }
    .out-report-wrap table th,
    .out-report-wrap table td { padding: 0.35rem 0.5rem; font-size: 0.85rem; }
    .out-report-wrap .table-responsive { max-height: 420px; }
  }
  @media (max-width: 767.98px) {
    .out-report-wrap .card-body { padding: 0.5rem; }
    .out-report-wrap table th,
    .out-report-wrap table td { padding: 0.28rem 0.4rem; font-size: 0.78rem; }
    .out-report-wrap .table-responsive { max-height: 360px; }
  }
  @media (max-width: 575.98px) {
    .out-report-wrap table th,
    .out-report-wrap table td { padding: 0.22rem 0.3rem; font-size: 0.72rem; }
    .out-report-wrap .table-responsive { max-height: 320px; }
  }
  .out-print { display: none; }
  @media print {
    body * { visibility: hidden; }
    .out-print, .out-print * { visibility: visible; }
    .out-print {
      display: block !important;
      position: absolute; left: 0; top: 0;
      width: 100%; padding: 20px;
      background: white; color: black;
      font-family: Arial, sans-serif; font-size: 12px;
    }
    .out-print table { width: 100%; border-collapse: collapse; }
    .out-print th, .out-print td { border: 1px solid #333; padding: 4px 8px; }
    .out-print thead th { background: #f0f0f0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return "0.00";
    return Number(amount).toFixed(2);
  };

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
      const fCompany = authUser?.F_CompanyMaster ?? authUser?.CompanyId ?? authUser?.F_Company ?? "0";

      const formData = new FormData();
      formData.append("FromDate", formatDateForAPI(fromDate));
      formData.append("ToDate", formatDateForAPI(toDate));
      formData.append("UserId", String(userId));
      formData.append("F_CompanyMaster", String(fCompany));

      const response = await Fn_GetReport(
        dispatch,
        () => {},
        "customerOutstandingReport",
        `GetCustomerOutstandingReport/${userId}/${userToken}`,
        { arguList: { formData } },
        true
      );

      const extractList = (r: any): any[] => {
        if (Array.isArray(r)) return r;
        if (Array.isArray(r?.data?.response)) return r.data.response;
        if (Array.isArray(r?.data?.data?.response)) return r.data.data.response;
        if (Array.isArray(r?.dataList)) return r.dataList;
        if (Array.isArray(r?.data?.dataList)) return r.data.dataList;
        if (Array.isArray(r?.data)) return r.data;
        if (Array.isArray(r?.response)) return r.response;
        return [];
      };
      
      setReportData(extractList(response));
    } catch (error) {
      console.error("Error fetching Customer Outstanding Report:", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate && toDate) fetchReport();
  }, [fromDate, toDate]);

  const handlePrint = () => window.print();
  const handleClose = () => window.history.back();

  return (
    <div className="page-body out-report-wrap report-page">
      <style>{PAGE_CSS}</style>
      <Breadcrumbs mainTitle="Customer Outstanding Report" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Customer Outstanding Report" tagClass="card-title mb-0" />
              <CardBody>
                <Row className="gy-3 mb-3 align-items-end">
                  <Col md="3">
                    <FormGroup>
                      <Label>From Date</Label>
                      <DateInput value={fromDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label>To Date</Label>
                      <DateInput value={toDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)} />
                    </FormGroup>
                  </Col>
                </Row>

                <h5 className="text-center fw-bold mb-1">Customer Outstanding Report</h5>
                <p className="text-center text-muted mb-3">From {formatDateForDisplay(fromDate)} To {formatDateForDisplay(toDate)}</p>

                <div className="table-responsive">
                  <Table bordered hover className="mb-0">
                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        <th>Customer Name</th>
                        <th>City</th>
                        <th>Mobile</th>
                        <th className="text-end">Credit Limit</th>
                        <th className="text-end">Credit Days</th>
                        <th className="text-end">Outstanding</th>
                        <th className="text-end">Not Due</th>
                        <th className="text-end">Overdue</th>
                        <th className="text-center">Last Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={9} className="text-center p-4">
                            <div className="spinner-border" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 mb-0">Loading Outstanding Data...</p>
                          </td>
                        </tr>
                      ) : (
                        <>
                          {reportData.map((row, idx) => {
                            const name = row.CustomerName || row.Name || row.LedgerName || "";
                            const city = row.City || row.CityName || "";
                            const mobile = row.Mobile || row.MobileNo || "";
                            
                            const creditLimit = Number(row.CreditLimit ?? 0);
                            const creditDays = Number(row.CreditDays ?? 0);
                            const outstanding = Number(row.Outstanding ?? row.ClosingBalance ?? row.Balance ?? 0);
                            const notDue = Number(row.NotDue ?? 0);
                            const overdue = Number(row.Overdue ?? 0);
                            const lastPayment = row.LastPayment || row.LastPaymentDate || "-";

                            return (
                              <tr key={idx}>
                                <td>{name}</td>
                                <td>{city}</td>
                                <td>{mobile}</td>
                                <td className="text-end">{formatCurrency(creditLimit)}</td>
                                <td className="text-end">{creditDays}</td>
                                <td className="text-end fw-bold">{formatCurrency(outstanding)}</td>
                                <td className="text-end">{formatCurrency(notDue)}</td>
                                <td className="text-end text-danger">{formatCurrency(overdue)}</td>
                                <td className="text-center">{formatDateForDisplay(lastPayment)}</td>
                              </tr>
                            );
                          })}
                          {reportData.length === 0 && (
                            <tr>
                              <td colSpan={9} className="text-center text-muted py-4">
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
              <CardFooter className="text-end">
                <Btn color="success" type="button" className="me-2" onClick={handlePrint}>
                  Print
                </Btn>
                <Btn color="secondary" type="button" onClick={handleClose}>
                  Close
                </Btn>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Print View */}
      <div className="out-print">
        <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "10px", marginBottom: "12px" }}>
          {printCompanyName && <h2 style={{ margin: "0 0 4px", fontWeight: "bold" }}>{printCompanyName}</h2>}
          {printFirmAddress && <p style={{ margin: "0 0 4px", fontSize: "14px" }}>{printFirmAddress}</p>}
          <h3 style={{ margin: "0 0 4px" }}>Customer Outstanding Report</h3>
          <p style={{ margin: 0, fontSize: "13px" }}>From {formatDateForDisplay(fromDate)} To {formatDateForDisplay(toDate)}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Customer Name</th>
              <th style={{ textAlign: "left" }}>City</th>
              <th style={{ textAlign: "left" }}>Mobile</th>
              <th style={{ textAlign: "right" }}>Credit Limit</th>
              <th style={{ textAlign: "right" }}>Credit Days</th>
              <th style={{ textAlign: "right" }}>Outstanding</th>
              <th style={{ textAlign: "right" }}>Not Due</th>
              <th style={{ textAlign: "right" }}>Overdue</th>
              <th style={{ textAlign: "center" }}>Last Payment</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, idx) => {
              const name = row.CustomerName || row.Name || row.LedgerName || "";
              const city = row.City || row.CityName || "";
              const mobile = row.Mobile || row.MobileNo || "";
              
              const creditLimit = Number(row.CreditLimit ?? 0);
              const creditDays = Number(row.CreditDays ?? 0);
              const outstanding = Number(row.Outstanding ?? row.ClosingBalance ?? row.Balance ?? 0);
              const notDue = Number(row.NotDue ?? 0);
              const overdue = Number(row.Overdue ?? 0);
              const lastPayment = row.LastPayment || row.LastPaymentDate || "-";

              return (
                <tr key={idx}>
                  <td>{name}</td>
                  <td>{city}</td>
                  <td>{mobile}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(creditLimit)}</td>
                  <td style={{ textAlign: "right" }}>{creditDays}</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>{formatCurrency(outstanding)}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(notDue)}</td>
                  <td style={{ textAlign: "right", color: "red" }}>{formatCurrency(overdue)}</td>
                  <td style={{ textAlign: "center" }}>{formatDateForDisplay(lastPayment)}</td>
                </tr>
              );
            })}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "10px" }}>
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
