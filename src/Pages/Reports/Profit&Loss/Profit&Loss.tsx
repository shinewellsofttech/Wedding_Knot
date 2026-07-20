import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { useDispatch } from "react-redux";
import { Fn_FillListData, Fn_GetReport } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

interface TradingPLRow {
  SNo?: number;
  LedgerGroupId?: number;
  LedgerGroupName?: string;
  DrParticular?: string;
  DrAmount?: number | string;
  CrParticular?: string;
  CrAmount?: number | string;
  [key: string]: any;
}

const TRADING_GROUP_IDS = [15, 23, 27, 31, 33, 41];
const PNL_GROUP_IDS = [3, 14, 15, 19];

const isTotalRow = (r: TradingPLRow) =>
  (r.DrParticular || "").trim().toUpperCase() === "TOTAL" && (r.CrParticular || "").trim().toUpperCase() === "TOTAL";

const canDrillGroup = (name: string | undefined) => {
  const n = (name || "").trim();
  if (!n) return false;
  const upper = n.toUpperCase();
  return (
    upper !== "TOTAL" &&
    !upper.includes("GROSS PROFIT") &&
    !upper.includes("GROSS LOSS") &&
    !upper.includes("NET PROFIT") &&
    !upper.includes("NET LOSS")
  );
};

const isGrossProfitOrLossCd = (r: TradingPLRow) => {
  const dr = (r.DrParticular || "").trim();
  const cr = (r.CrParticular || "").trim();
  return /Gross\s*(Profit|Loss)/i.test(dr) || /Gross\s*(Profit|Loss)/i.test(cr);
};

const ProfitAndLoss: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  // IsDetailed state (false = 0 / Summarized, true = 1 / Detailed)
  const [isDetailed, setIsDetailed] = useState(false);

  const [reportData, setReportData] = useState<TradingPLRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [printCompanyName, setPrintCompanyName] = useState("");
  const [printFirmAddress, setPrintFirmAddress] = useState("");

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "0.00";
    return Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
      const userId = authUser.uid || "0";
      const userToken = "token";

      const formData = new FormData();
      formData.append("FromDate", formatDateForAPI(fromDate));
      formData.append("ToDate", formatDateForAPI(toDate));
      formData.append("UserId", userId);
      formData.append("F_CompanyMaster", String(authUser?.F_CompanyMaster ?? authUser?.CompanyId ?? authUser?.F_Company ?? "0"));
      formData.append("IsDetailed", isDetailed ? "1" : "0");

      const arguList = { formData };

      const response = await Fn_GetReport(
        dispatch,
        (prev: any) => ({ ...(prev || {}), isProgress: false }),
        "tradingPLReport",
        `${API_WEB_URLS.GetTradingAndPL_Report}/${userId}/${userToken}`,
        { arguList },
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
      console.error("Error fetching Trading & P/L Report:", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate && toDate) fetchReport();
  }, [fromDate, toDate, isDetailed]);

  useEffect(() => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const name = authUser?.CompanyName || authUser?.FirmName || authUser?.Company || "";
      setPrintCompanyName(typeof name === "string" ? name.trim() : "");
      Fn_FillListData(dispatch, () => {}, "FirmListPrint", `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.FirmMaster}/Id/0`).then((firms: any) => {
        if (!Array.isArray(firms) || firms.length === 0) return;
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        const fCompanyId = authUser?.F_CompanyMaster ?? authUser?.CompanyId ?? authUser?.F_Company;
        const firm = (fCompanyId != null && fCompanyId !== "")
          ? firms.find((f: any) => String(f.Id) === String(fCompanyId) || String(f.F_CompanyMaster) === String(fCompanyId)) || firms[0]
          : firms.find((f: any) => (f.FirmName || f.Name || "") === name) || firms[0];
        const apiName = firm?.FirmName || firm?.Name || "";
        if (apiName) setPrintCompanyName(apiName);
        const addr = [firm?.Address1, firm?.Address2, firm?.CityName || firm?.City, firm?.StateName || firm?.State, firm?.PinCode].filter(Boolean).join(", ");
        setPrintFirmAddress(addr || "");
      }).catch(() => {});
    } catch {
      setPrintCompanyName("");
      setPrintFirmAddress("");
    }
  }, []);

  type ReportRow = {
    sno: number;
    drParticular: string;
    drAmount: string;
    crParticular: string;
    crAmount: string;
    ledgerGroupName: string;
    ledgerGroupId: number;
  };

  const toReportRow = (row: TradingPLRow): ReportRow => {
    const drAmt = row.DrAmount;
    const crAmt = row.CrAmount;
    return {
      sno: Number(row.SNo) || 0,
      drParticular: row.DrParticular ?? "",
      drAmount: typeof drAmt === "number" || (typeof drAmt === "string" && drAmt !== "" && !isNaN(Number(drAmt))) ? formatCurrency(Number(drAmt)) : (row.DrAmount as string) ?? "",
      crParticular: row.CrParticular ?? "",
      crAmount: typeof crAmt === "number" || (typeof crAmt === "string" && crAmt !== "" && !isNaN(Number(crAmt))) ? formatCurrency(Number(crAmt)) : (row.CrAmount as string) ?? "",
      ledgerGroupName: row.LedgerGroupName ?? "",
      ledgerGroupId: Number(row.LedgerGroupId) || 0,
    };
  };

  const { tradingRows, pnlRows, tradingTotalDr, tradingTotalCr, pnlTotalDr, pnlTotalCr } = useMemo(() => {
    const withoutTotal = reportData.filter((r) => !isTotalRow(r));
    const idx = withoutTotal.findIndex(isGrossProfitOrLossCd);
    const tradingList = idx >= 0 ? withoutTotal.slice(0, idx + 1) : withoutTotal.filter((r) => TRADING_GROUP_IDS.includes(Number(r.LedgerGroupId ?? -1)) || isGrossProfitOrLossCd(r));
    const pnlList = idx >= 0 ? withoutTotal.slice(idx + 1) : withoutTotal.filter((r) => PNL_GROUP_IDS.includes(Number(r.LedgerGroupId ?? -1)) || /Net\s*Profit/i.test((r.DrParticular || "") + (r.CrParticular || "")) || /Net\s*Loss/i.test((r.DrParticular || "") + (r.CrParticular || "")));

    const sumDr = (list: TradingPLRow[]) => list.reduce((s, r) => s + (Number(r.DrAmount) || 0), 0);
    const sumCr = (list: TradingPLRow[]) => list.reduce((s, r) => s + (Number(r.CrAmount) || 0), 0);

    return {
      tradingRows: tradingList.map(toReportRow),
      pnlRows: pnlList.map(toReportRow),
      tradingTotalDr: sumDr(tradingList),
      tradingTotalCr: sumCr(tradingList),
      pnlTotalDr: sumDr(pnlList),
      pnlTotalCr: sumCr(pnlList),
    };
  }, [reportData]);

  const handlePrint = () => window.print();
  const handleClose = () => window.history.back();

  return (
    <div className="page-body report-page">
      <style>{`
        .pnl-print { display: none; }
        @media print {
          body * { visibility: hidden; }
          .pnl-print, .pnl-print * { visibility: visible; }
          .pnl-print { display: block !important; position: absolute; left: 0; top: 0; width: 100%; padding: 20px; background: #fff; color: #000; font-family: Arial, sans-serif; }
          .pnl-print table { width: 100%; border-collapse: collapse; }
          .pnl-print th, .pnl-print td { border: 1px solid #333; padding: 4px 8px; font-size: 12px; }
          .pnl-print th { background: #f0f0f0; -webkit-print-color-adjust: exact; }
        }
        .cursor-pointer { cursor: pointer; }
      `}</style>
      <Breadcrumbs mainTitle="Profit & Loss A/c" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Profit & Loss A/c" tagClass="card-title mb-0" />
              <CardBody>
                <Row className="gy-3 mb-4 align-items-center">
                  <Col md="3">
                    <FormGroup className="mb-0">
                      <Label className="fw-bold">From Date</Label>
                      <DateInput value={fromDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup className="mb-0">
                      <Label className="fw-bold">To Date</Label>
                      <DateInput value={toDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md="3" className="pt-4">
                    <FormGroup check className="mb-0">
                      <Input
                        type="checkbox"
                        id="pnl-detailed"
                        checked={isDetailed}
                        onChange={(e) => setIsDetailed(e.target.checked)}
                      />
                      <Label check htmlFor="pnl-detailed" className="fw-bold cursor-pointer">
                        Detailed View
                      </Label>
                    </FormGroup>
                  </Col>
                </Row>

                <h5 className="text-center fw-bold mb-2">Trading And P/L Account</h5>
                <p className="text-center text-muted mb-3">As On {formatDateForDisplay(toDate)}</p>

                <div className="table-responsive">
                  <Table bordered className="mb-0 profit-loss-table">
                    <thead className="table-light">
                      <tr>
                        <th className="text-center" style={{ width: "60px" }}>SNo</th>
                        <th>Dr Particular</th>
                        <th className="text-end" style={{ width: "140px" }}>Dr Amount</th>
                        <th>Cr Particular</th>
                        <th className="text-end" style={{ width: "140px" }}>Cr Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="text-center p-4">
                            <div className="spinner-border" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 mb-0">Loading Profit & Loss data...</p>
                          </td>
                        </tr>
                      ) : (
                        <>
                          {tradingRows.length > 0 && (
                            <>
                              <tr className="table-light fw-bold">
                                <td colSpan={5}>Trading Account</td>
                              </tr>
                              {tradingRows.map((row, idx) => {
                                const drillDr = canDrillGroup(row.drParticular);
                                const drillCr = canDrillGroup(row.crParticular);
                                return (
                                  <tr key={`t-${idx}`}>
                                    <td className="text-center">{row.sno}</td>
                                    <td
                                      onDoubleClick={() =>
                                        drillDr &&
                                        navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
                                          state: {
                                            ledgerGroupName: (isDetailed && row.ledgerGroupName ? row.ledgerGroupName : row.drParticular || "").trim(),
                                            fromDate,
                                            toDate,
                                          },
                                        })
                                      }
                                      className={drillDr ? "cursor-pointer" : ""}
                                      title={drillDr ? "Double-click for Group Ledger Summary" : undefined}
                                    >
                                      <div>{row.drParticular || ""}</div>
                                      {isDetailed && row.ledgerGroupName && row.drParticular && row.ledgerGroupName !== row.drParticular && (
                                        <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                                          Group: {row.ledgerGroupName}
                                        </small>
                                      )}
                                    </td>
                                    <td className="text-end">{row.drAmount || ""}</td>
                                    <td
                                      onDoubleClick={() =>
                                        drillCr &&
                                        navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
                                          state: {
                                            ledgerGroupName: (isDetailed && row.ledgerGroupName ? row.ledgerGroupName : row.crParticular || "").trim(),
                                            fromDate,
                                            toDate,
                                          },
                                        })
                                      }
                                      className={drillCr ? "cursor-pointer" : ""}
                                      title={drillCr ? "Double-click for Group Ledger Summary" : undefined}
                                    >
                                      <div>{row.crParticular || ""}</div>
                                      {isDetailed && row.ledgerGroupName && row.crParticular && row.ledgerGroupName !== row.crParticular && (
                                        <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                                          Group: {row.ledgerGroupName}
                                        </small>
                                      )}
                                    </td>
                                    <td className="text-end">{row.crAmount || ""}</td>
                                  </tr>
                                );
                              })}
                              <tr className="table-secondary fw-bold">
                                <td colSpan={2}>Total (Trading A/c)</td>
                                <td className="text-end">{formatCurrency(tradingTotalDr)}</td>
                                <td colSpan={1} />
                                <td className="text-end">{formatCurrency(tradingTotalCr)}</td>
                              </tr>
                            </>
                          )}
                          {pnlRows.length > 0 && (
                            <>
                              <tr className="table-light fw-bold">
                                <td colSpan={5}>Profit and Loss Account</td>
                              </tr>
                              {pnlRows.map((row, idx) => {
                                const drillDr = canDrillGroup(row.drParticular);
                                const drillCr = canDrillGroup(row.crParticular);
                                return (
                                  <tr key={`p-${idx}`}>
                                    <td className="text-center">{row.sno}</td>
                                    <td
                                      onDoubleClick={() =>
                                        drillDr &&
                                        navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
                                          state: {
                                            ledgerGroupName: (isDetailed && row.ledgerGroupName ? row.ledgerGroupName : row.drParticular || "").trim(),
                                            fromDate,
                                            toDate,
                                          },
                                        })
                                      }
                                      className={drillDr ? "cursor-pointer" : ""}
                                      title={drillDr ? "Double-click for Group Ledger Summary" : undefined}
                                    >
                                      <div>{row.drParticular || ""}</div>
                                      {isDetailed && row.ledgerGroupName && row.drParticular && row.ledgerGroupName !== row.drParticular && (
                                        <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                                          Group: {row.ledgerGroupName}
                                        </small>
                                      )}
                                    </td>
                                    <td className="text-end">{row.drAmount || ""}</td>
                                    <td
                                      onDoubleClick={() =>
                                        drillCr &&
                                        navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
                                          state: {
                                            ledgerGroupName: (isDetailed && row.ledgerGroupName ? row.ledgerGroupName : row.crParticular || "").trim(),
                                            fromDate,
                                            toDate,
                                          },
                                        })
                                      }
                                      className={drillCr ? "cursor-pointer" : ""}
                                      title={drillCr ? "Double-click for Group Ledger Summary" : undefined}
                                    >
                                      <div>{row.crParticular || ""}</div>
                                      {isDetailed && row.ledgerGroupName && row.crParticular && row.ledgerGroupName !== row.crParticular && (
                                        <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                                          Group: {row.ledgerGroupName}
                                        </small>
                                      )}
                                    </td>
                                    <td className="text-end">{row.crAmount || ""}</td>
                                  </tr>
                                );
                              })}
                              <tr className="table-secondary fw-bold">
                                <td colSpan={2}>Total (P&amp;L A/c)</td>
                                <td className="text-end">{formatCurrency(pnlTotalDr)}</td>
                                <td colSpan={1} />
                                <td className="text-end">{formatCurrency(pnlTotalCr)}</td>
                              </tr>
                            </>
                          )}
                          {tradingRows.length === 0 && pnlRows.length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center text-muted py-4">No data</td>
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
              <CardFooter className="text-end">
                <Btn
                  color={isDetailed ? "warning" : "primary"}
                  type="button"
                  className="me-2"
                  onClick={() => setIsDetailed(!isDetailed)}
                >
                  {isDetailed ? "Summarized View" : "Detail View"}
                </Btn>
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

      {/* Dynamic Print Layout */}
      <div className="pnl-print">
        <div className="text-center border-bottom pb-3 mb-3" style={{ borderColor: "#333" }}>
          <h2 style={{ fontWeight: "bold", marginBottom: "4px" }}>{printCompanyName || "—"}</h2>
          {printFirmAddress ? <p style={{ fontSize: "14px", margin: 0 }}>{printFirmAddress}</p> : null}
        </div>
        <h3 className="text-center text-uppercase mb-3" style={{ fontSize: "16px", fontWeight: "bold", textDecoration: "underline" }}>Trading And P/L Account</h3>
        <table style={{ width: "100%", marginBottom: "12px", fontSize: "13px" }}>
          <tbody>
            <tr>
              <td style={{ width: "33.3%" }}><strong>From Date:</strong> {formatDateForDisplay(fromDate)}</td>
              <td style={{ width: "33.3%" }}><strong>To Date:</strong> {formatDateForDisplay(toDate)}</td>
              <td style={{ width: "33.3%" }}><strong>View:</strong> {isDetailed ? "Detailed" : "Summarized"}</td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ textAlign: "center", width: "60px" }}>SNo</th>
              <th style={{ textAlign: "left" }}>Dr Particular</th>
              <th style={{ textAlign: "right" }}>Dr Amount</th>
              <th style={{ textAlign: "left" }}>Cr Particular</th>
              <th style={{ textAlign: "right" }}>Cr Amount</th>
            </tr>
          </thead>
          <tbody>
            {tradingRows.length > 0 && (
              <>
                <tr style={{ fontWeight: "bold", background: "#e9ecef" }}><td colSpan={5}>Trading Account</td></tr>
                {tradingRows.map((row, idx) => (
                  <tr key={`t-${idx}`}>
                    <td style={{ textAlign: "center" }}>{row.sno}</td>
                    <td>
                      <div>{row.drParticular || ""}</div>
                      {isDetailed && row.ledgerGroupName && row.drParticular && row.ledgerGroupName !== row.drParticular && (
                        <small style={{ fontSize: "10px", color: "#666", display: "block" }}>
                          Group: {row.ledgerGroupName}
                        </small>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>{row.drAmount || ""}</td>
                    <td>
                      <div>{row.crParticular || ""}</div>
                      {isDetailed && row.ledgerGroupName && row.crParticular && row.ledgerGroupName !== row.crParticular && (
                        <small style={{ fontSize: "10px", color: "#666", display: "block" }}>
                          Group: {row.ledgerGroupName}
                        </small>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>{row.crAmount || ""}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: "bold", background: "#e9ecef" }}>
                  <td colSpan={2}>Total (Trading A/c)</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(tradingTotalDr)}</td>
                  <td></td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(tradingTotalCr)}</td>
                </tr>
              </>
            )}
            {pnlRows.length > 0 && (
              <>
                <tr style={{ fontWeight: "bold", background: "#e9ecef" }}><td colSpan={5}>Profit and Loss Account</td></tr>
                {pnlRows.map((row, idx) => (
                  <tr key={`p-${idx}`}>
                    <td style={{ textAlign: "center" }}>{row.sno}</td>
                    <td>
                      <div>{row.drParticular || ""}</div>
                      {isDetailed && row.ledgerGroupName && row.drParticular && row.ledgerGroupName !== row.drParticular && (
                        <small style={{ fontSize: "10px", color: "#666", display: "block" }}>
                          Group: {row.ledgerGroupName}
                        </small>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>{row.drAmount || ""}</td>
                    <td>
                      <div>{row.crParticular || ""}</div>
                      {isDetailed && row.ledgerGroupName && row.crParticular && row.ledgerGroupName !== row.crParticular && (
                        <small style={{ fontSize: "10px", color: "#666", display: "block" }}>
                          Group: {row.ledgerGroupName}
                        </small>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>{row.crAmount || ""}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: "bold", background: "#e9ecef" }}>
                  <td colSpan={2}>Total (P&amp;L A/c)</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(pnlTotalDr)}</td>
                  <td></td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(pnlTotalCr)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitAndLoss;
