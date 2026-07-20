import React, { useState, useEffect } from "react";
import {
    Card, CardBody, CardFooter, Col, Container,
    FormGroup, Input, Label, Row, Table
} from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Fn_GetReport } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

/** API response row: data.response[] */
interface BalanceSheetRow {
  RowNo?: number;
  LiabilityParticular?: string | null;
  LAmount?: number | null;
  LNetAmount?: number | null;
  AssetParticular?: string | null;
  AAmount?: number | null;
  ANetAmount?: number | null;
  Particular?: string | null;
  Amount?: number | null;
  NetAmount?: number | null;
  [key: string]: any;
}

const PAGE_CSS = `
  .bs-trad-wrap .table-responsive { max-height: 520px; overflow-y: auto; }
  @media (max-width: 991.98px) {
    .bs-trad-wrap .card-body { padding: 0.75rem; }
    .bs-trad-wrap table th,
    .bs-trad-wrap table td { padding: 0.35rem 0.5rem; font-size: 0.85rem; }
    .bs-trad-wrap .table-responsive { max-height: 420px; }
  }
  @media (max-width: 767.98px) {
    .bs-trad-wrap .card-body { padding: 0.5rem; }
    .bs-trad-wrap table th,
    .bs-trad-wrap table td { padding: 0.28rem 0.4rem; font-size: 0.78rem; }
    .bs-trad-wrap .table-responsive { max-height: 360px; }
  }
  @media (max-width: 575.98px) {
    .bs-trad-wrap table th,
    .bs-trad-wrap table td { padding: 0.22rem 0.3rem; font-size: 0.72rem; }
    .bs-trad-wrap .table-responsive { max-height: 320px; }
  }
  .bs-trad-print { display: none; }
  @media print {
    body * { visibility: hidden; }
    .bs-trad-print, .bs-trad-print * { visibility: visible; }
    .bs-trad-print {
      display: block !important;
      position: absolute; left: 0; top: 0;
      width: 100%; padding: 20px;
      background: white; color: black;
      font-family: Arial, sans-serif; font-size: 12px;
    }
    .bs-trad-print table { width: 100%; border-collapse: collapse; }
    .bs-trad-print th, .bs-trad-print td { border: 1px solid #333; padding: 4px 8px; }
    .bs-trad-print thead th { background: #f0f0f0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  .cursor-pointer { cursor: pointer; }
`;

const BalanceSheetTraditional: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // IsDetailed state (1 = Detailed Traditional, 2 = Summarized Traditional, 3 = Vertical / Single Column)
  const [isDetailed, setIsDetailed] = useState<number>(2);

  const calculateFinancialYearStart = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const fyStart = m >= 4 ? y : y - 1;
    return `${fyStart}-04-01`;
  };

  const drillDown = (particular: string | null | undefined) => {
    if (!particular || particular.trim() === "" || /^total\s*(liabilities|assets)?$/i.test(particular.trim())) return;
    const fyFromDate = calculateFinancialYearStart(toDate);
    navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
      state: { ledgerGroupName: particular.trim(), fromDate: fyFromDate, toDate },
    });
  };

  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [reportData, setReportData] = useState<BalanceSheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [printCompanyName, setPrintCompanyName] = useState("");
  const [printFirmAddress, setPrintFirmAddress] = useState("");

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return "";
    return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser?.uid ?? authUser?.Id ?? "0";
      const userToken = authUser?.Token ?? authUser?.token ?? "token";
      const fCompany = authUser?.F_CompanyMaster ?? authUser?.CompanyId ?? authUser?.F_Company ?? "0";

      const formData = new FormData();
      formData.append("DateAsOn", formatDateForAPI(toDate));
      formData.append("UserId", String(userId));
      formData.append("F_CompanyMaster", String(fCompany));
      formData.append("IsDetailed", String(isDetailed));

      const response = await Fn_GetReport(
        dispatch,
        (prev: any) => ({ ...(prev || {}), isProgress: false }),
        "balanceSheetReport",
        `${API_WEB_URLS.GetBalanceSheetReport}/${userId}/${userToken}`,
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
      const list = extractList(response);
      setReportData(list);
    } catch (error) {
      console.error("Error fetching Balance Sheet:", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (toDate) fetchReport();
  }, [toDate, isDetailed]);

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

  const handlePrint = () => window.print();
  const handleClose = () => window.history.back();

  return (
    <div className="page-body bs-trad-wrap report-page">
      <style>{PAGE_CSS}</style>
      <Breadcrumbs mainTitle="Balance Sheet" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Balance Sheet" tagClass="card-title mb-0" />
              <CardBody>
                {/* Control Panel */}
                <Row className="gy-3 mb-4 align-items-center">
                  <Col md="4">
                    <FormGroup className="mb-0">
                      <Label className="fw-bold">As On</Label>
                      <DateInput value={toDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup className="mb-0">
                      <Label className="fw-bold">Report Format</Label>
                      <Input
                        type="select"
                        value={isDetailed}
                        onChange={(e) => setIsDetailed(Number(e.target.value))}
                      >
                        <option value={1}>Detailed Traditional</option>
                        <option value={2}>Summarized Traditional</option>
                        <option value={3}>Vertical / Single Column</option>
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>

                <h5 className="text-center fw-bold mb-1">Balance Sheet</h5>
                <p className="text-center text-muted mb-3">As On {formatDateForDisplay(toDate)}</p>

                <div className="table-responsive">
                  {isLoading ? (
                    <div className="text-center p-4">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 mb-0">Loading Balance Sheet...</p>
                    </div>
                  ) : reportData.length > 0 ? (
                    <Table bordered hover className="mb-0">
                      {/* Format 1: Detailed Traditional */}
                      {isDetailed === 1 && (
                        <>
                          <thead className="table-light sticky-top">
                            <tr>
                              <th>Liabilities</th>
                              <th className="text-end" style={{ width: "120px" }}>Amount</th>
                              <th className="text-end" style={{ width: "130px" }}>Net Amount</th>
                              <th>Assets</th>
                              <th className="text-end" style={{ width: "120px" }}>Amount</th>
                              <th className="text-end" style={{ width: "130px" }}>Net Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.map((row, idx) => {
                              const canDrillLiab = row.LiabilityParticular && !/^total\s*(liabilities|assets)?$/i.test(row.LiabilityParticular);
                              const canDrillAsset = row.AssetParticular && !/^total\s*(liabilities|assets)?$/i.test(row.AssetParticular);

                              // Traditional group headers/totals have NetAmount but LAmount is null
                              const isLiabGroup = row.LNetAmount !== null && row.LAmount === null;
                              const isAssetGroup = row.ANetAmount !== null && row.AAmount === null;
                              const isTotal = row.LiabilityParticular === "Total Liabilities";

                              return (
                                <tr key={idx} className={isTotal ? "table-secondary fw-bold" : ""}>
                                  <td
                                    className={isTotal || isLiabGroup ? "fw-bold" : "ps-4 text-muted"}
                                    onDoubleClick={() => canDrillLiab && drillDown(row.LiabilityParticular)}
                                    style={{ cursor: canDrillLiab ? "pointer" : "default" }}
                                  >
                                    {row.LiabilityParticular || ""}
                                  </td>
                                  <td className="text-end">{formatCurrency(row.LAmount)}</td>
                                  <td className={`text-end ${isTotal || isLiabGroup ? "fw-bold text-dark" : ""}`}>
                                    {formatCurrency(row.LNetAmount)}
                                  </td>
                                  <td
                                    className={isTotal || isAssetGroup ? "fw-bold" : "ps-4 text-muted"}
                                    onDoubleClick={() => canDrillAsset && drillDown(row.AssetParticular)}
                                    style={{ cursor: canDrillAsset ? "pointer" : "default" }}
                                  >
                                    {row.AssetParticular || ""}
                                  </td>
                                  <td className="text-end">{formatCurrency(row.AAmount)}</td>
                                  <td className={`text-end ${isTotal || isAssetGroup ? "fw-bold text-dark" : ""}`}>
                                    {formatCurrency(row.ANetAmount)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </>
                      )}

                      {/* Format 2: Summarized Traditional */}
                      {isDetailed === 2 && (
                        <>
                          <thead className="table-light sticky-top">
                            <tr>
                              <th>Liabilities</th>
                              <th className="text-end" style={{ width: "140px" }}>Amount</th>
                              <th>Assets</th>
                              <th className="text-end" style={{ width: "140px" }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.map((row, idx) => {
                              const isLiabTotal = /^total/i.test(row.LiabilityParticular || "");
                              const isAssetTotal = /^total/i.test(row.AssetParticular || "");
                              const canDrillLiab = row.LiabilityParticular && !isLiabTotal;
                              const canDrillAsset = row.AssetParticular && !isAssetTotal;

                              return (
                                <tr key={idx} className={isLiabTotal || isAssetTotal ? "table-secondary fw-bold" : ""}>
                                  <td
                                    onDoubleClick={() => canDrillLiab && drillDown(row.LiabilityParticular)}
                                    style={{ cursor: canDrillLiab ? "pointer" : "default" }}
                                    className={isLiabTotal ? "fw-bold" : ""}
                                  >
                                    {row.LiabilityParticular || ""}
                                  </td>
                                  <td className="text-end">{formatCurrency(row.LAmount)}</td>
                                  <td
                                    onDoubleClick={() => canDrillAsset && drillDown(row.AssetParticular)}
                                    style={{ cursor: canDrillAsset ? "pointer" : "default" }}
                                    className={isAssetTotal ? "fw-bold" : ""}
                                  >
                                    {row.AssetParticular || ""}
                                  </td>
                                  <td className="text-end">{formatCurrency(row.AAmount)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </>
                      )}

                      {/* Format 3: Vertical / Single Column */}
                      {isDetailed === 3 && (
                        <>
                          <thead className="table-light sticky-top">
                            <tr>
                              <th>Particulars</th>
                              <th className="text-end" style={{ width: "160px" }}>Amount</th>
                              <th className="text-end" style={{ width: "160px" }}>Net Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.map((row, idx) => {
                              const upperPart = (row.Particular || "").toUpperCase().trim();
                              const isHeader = upperPart === "ASSETS" || upperPart === "LIABILITIES";
                              const isTotalRow = upperPart.includes("TOTAL") || upperPart.includes("LIABILITIES TOTAL");
                              const canDrill = row.Particular && !isHeader && !isTotalRow;

                              return (
                                <tr
                                  key={idx}
                                  className={isHeader ? "table-light fw-bold text-uppercase" : isTotalRow ? "table-secondary fw-bold" : ""}
                                >
                                  <td
                                    onDoubleClick={() => canDrill && drillDown(row.Particular)}
                                    style={{ cursor: canDrill ? "pointer" : "default" }}
                                    className={isHeader || isTotalRow ? "fw-bold" : "ps-4"}
                                  >
                                    {row.Particular || ""}
                                  </td>
                                  <td className="text-end">{formatCurrency(row.Amount)}</td>
                                  <td className="text-end fw-bold">{formatCurrency(row.NetAmount)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </>
                      )}
                    </Table>
                  ) : (
                    <div className="text-center p-4 text-muted">
                      No Balance Sheet data available.
                    </div>
                  )}
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

      {/* Print View Layout */}
      <div className="bs-trad-print">
        <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "10px", marginBottom: "12px" }}>
          {printCompanyName && <h2 style={{ margin: "0 0 4px", fontWeight: "bold" }}>{printCompanyName}</h2>}
          {printFirmAddress && <p style={{ margin: "0 0 4px", fontSize: "14px" }}>{printFirmAddress}</p>}
          <h3 style={{ margin: "0 0 4px" }}>Balance Sheet</h3>
          <p style={{ margin: 0, fontSize: "13px" }}>As On: {formatDateForDisplay(toDate)}</p>
        </div>

        {reportData.length > 0 && (
          <>
            {isDetailed === 1 && (
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Liabilities</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "right" }}>Net Amount</th>
                    <th style={{ textAlign: "left" }}>Assets</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "right" }}>Net Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => {
                    const isLiabGroup = row.LNetAmount !== null && row.LAmount === null;
                    const isAssetGroup = row.ANetAmount !== null && row.AAmount === null;
                    const isTotal = row.LiabilityParticular === "Total Liabilities";

                    return (
                      <tr key={idx} style={{ fontWeight: isTotal || isLiabGroup || isAssetGroup ? "bold" : "normal", background: isTotal ? "#e9ecef" : "transparent" }}>
                        <td style={{ paddingLeft: isTotal || isLiabGroup ? "8px" : "20px" }}>{row.LiabilityParticular || ""}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(row.LAmount)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(row.LNetAmount)}</td>
                        <td style={{ paddingLeft: isTotal || isAssetGroup ? "8px" : "20px" }}>{row.AssetParticular || ""}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(row.AAmount)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(row.ANetAmount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {isDetailed === 2 && (
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Liabilities</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "left" }}>Assets</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => {
                    const isLiabTotal = /^total/i.test(row.LiabilityParticular || "");
                    const isAssetTotal = /^total/i.test(row.AssetParticular || "");
                    return (
                      <tr key={idx} style={{ fontWeight: isLiabTotal || isAssetTotal ? "bold" : "normal", background: isLiabTotal || isAssetTotal ? "#e9ecef" : "transparent" }}>
                        <td>{row.LiabilityParticular || ""}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(row.LAmount)}</td>
                        <td>{row.AssetParticular || ""}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(row.AAmount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {isDetailed === 3 && (
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Particulars</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "right" }}>Net Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => {
                    const upperPart = (row.Particular || "").toUpperCase().trim();
                    const isHeader = upperPart === "ASSETS" || upperPart === "LIABILITIES";
                    const isTotalRow = upperPart.includes("TOTAL") || upperPart.includes("LIABILITIES TOTAL");

                    return (
                      <tr key={idx} style={{ fontWeight: isHeader || isTotalRow ? "bold" : "normal", background: isTotalRow ? "#e9ecef" : "transparent" }}>
                        <td style={{ paddingLeft: isHeader || isTotalRow ? "8px" : "20px" }}>{row.Particular || ""}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(row.Amount)}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>{formatCurrency(row.NetAmount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BalanceSheetTraditional;
