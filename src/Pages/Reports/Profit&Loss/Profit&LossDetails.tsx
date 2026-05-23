import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Label, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { useDispatch } from "react-redux";
import { Fn_FillListData, Fn_GetReport } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

interface TradingPLDetailRow {
  SNo?: number;
  LedgerGroupId?: number;
  LedgerGroupName?: string;
  LedgerId?: number;
  F_LedgerMaster?: number;
  DrParticular?: string;
  DrAmount?: number | string;
  DrNetAmount?: number | string;
  CrParticular?: string;
  CrAmount?: number | string;
  CrNetAmount?: number | string;
  [key: string]: any;
}

const TRADING_GROUP_IDS = [15, 23, 27, 31, 33, 41];
const PNL_GROUP_IDS = [3, 14, 15, 19];

const isTotalRow = (r: TradingPLDetailRow) =>
  (r.DrParticular || "").trim().toUpperCase() === "TOTAL" && (r.CrParticular || "").trim().toUpperCase() === "TOTAL";

const isGrossProfitOrLossCd = (r: TradingPLDetailRow) => {
  const dr = (r.DrParticular || "").trim();
  const cr = (r.CrParticular || "").trim();
  return /Gross\s*Profit\s*c\/d/i.test(dr) || /Gross\s*Loss\s*c\/d/i.test(dr) || /Gross\s*Profit\s*c\/d/i.test(cr) || /Gross\s*Loss\s*c\/d/i.test(cr);
};

const ProfitAndLossDetails: React.FC = () => {
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
  const [reportData, setReportData] = useState<TradingPLDetailRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [printCompanyName, setPrintCompanyName] = useState("");
  const [printFirmAddress, setPrintFirmAddress] = useState("");

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "";
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
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());
      formData.append("IsDetailed", "1");

      const arguList = { formData };

      const response = await Fn_GetReport(
        dispatch,
        (prev: any) => ({ ...(prev || {}), isProgress: false }),
        "tradingPLDetailReport",
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
      console.error("Error fetching Profit & Loss Detail Report:", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate && toDate) fetchReport();
  }, [fromDate, toDate]);

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

  const { tradingDisplayRows, pnlDisplayRows, tradingTotalDr, tradingTotalCr, pnlTotalDr, pnlTotalCr } = useMemo(() => {
    const buildDisplayRows = (list: TradingPLDetailRow[]) => {
      const totals: Record<number, { dr: number; cr: number }> = {};
      list.forEach((row) => {
        const gid = Number(row.LedgerGroupId ?? 0);
        if (!totals[gid]) totals[gid] = { dr: 0, cr: 0 };
        totals[gid].dr += Number(row.DrAmount) || 0;
        totals[gid].cr += Number(row.CrAmount) || 0;
      });
      return list.map((row, idx) => {
        const gid = Number(row.LedgerGroupId ?? 0);
        const isLastInGroup = idx === list.length - 1 || Number(list[idx + 1]?.LedgerGroupId ?? 0) !== gid;
        const t = totals[gid];
        return {
          ...row,
          DrNetAmount: isLastInGroup && t ? t.dr : undefined,
          CrNetAmount: isLastInGroup && t ? t.cr : undefined,
        };
      });
    };
    const withoutTotal = reportData.filter((r) => !isTotalRow(r));
    const idx = withoutTotal.findIndex(isGrossProfitOrLossCd);
    const tradingList =
      idx >= 0
        ? withoutTotal.slice(0, idx + 1)
        : withoutTotal.filter(
            (r) => TRADING_GROUP_IDS.includes(Number(r.LedgerGroupId ?? -1)) || isGrossProfitOrLossCd(r)
          );
    const pnlList =
      idx >= 0
        ? withoutTotal.slice(idx + 1)
        : withoutTotal.filter(
            (r) =>
              PNL_GROUP_IDS.includes(Number(r.LedgerGroupId ?? -1)) ||
              /Net\s*Profit/i.test((r.DrParticular || "") + (r.CrParticular || "")) ||
              /Net\s*Loss/i.test((r.DrParticular || "") + (r.CrParticular || ""))
          );

    const sumDr = (list: TradingPLDetailRow[]) => list.reduce((s, r) => s + (Number(r.DrAmount) || 0), 0);
    const sumCr = (list: TradingPLDetailRow[]) => list.reduce((s, r) => s + (Number(r.CrAmount) || 0), 0);

    return {
      tradingDisplayRows: buildDisplayRows(tradingList),
      pnlDisplayRows: buildDisplayRows(pnlList),
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
      <style>{`.pnl-detail-print{display:none}@media print{body *{visibility:hidden}.pnl-detail-print,.pnl-detail-print *{visibility:visible}.pnl-detail-print{display:block!important;position:absolute;left:0;top:0;width:100%;padding:20px;background:#fff;color:#000;font-family:Arial,sans-serif}.pnl-detail-print table{width:100%;border-collapse:collapse}.pnl-detail-print th,.pnl-detail-print td{border:1px solid #333;padding:4px 8px;font-size:12px}.pnl-detail-print th{background:#f0f0f0;-webkit-print-color-adjust:exact}`}</style>
      <Breadcrumbs mainTitle="Profit & Loss A/c Detail" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Profit & Loss A/c Detail" tagClass="card-title mb-0" />
              <CardBody>
                <Row className="gy-3 mb-3">
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

                <h5 className="text-center fw-bold mb-2">Trading And P/L Account</h5>
                <p className="text-center text-muted mb-3">As On {formatDateForDisplay(toDate)}</p>

                {isLoading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading Profit & Loss Detail...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table bordered className="mb-0 profit-loss-detail-table">
                      <thead className="table-light">
                        <tr>
                          <th colSpan={3} className="text-center">Dr Side</th>
                          <th colSpan={3} className="text-center">Cr Side</th>
                        </tr>
                        <tr className="table-light">
                          <th>Particulars</th>
                          <th className="text-end">Amount</th>
                          <th className="text-end">NetAmount</th>
                          <th>Particulars</th>
                          <th className="text-end">Amount</th>
                          <th className="text-end">NetAmount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradingDisplayRows.length > 0 && (
                          <>
                            <tr className="table-light fw-bold">
                              <td colSpan={6}>Trading Account</td>
                            </tr>
                            {tradingDisplayRows.map((row, idx) => {
                              const drAmt = row.DrAmount;
                              const drNetAmt = row.DrNetAmount;
                              const crAmt = row.CrAmount;
                              const crNetAmt = row.CrNetAmount;
                              const isCategoryHeader =
                                (row.DrParticular || "").toLowerCase().includes("expenditure account") ||
                                (row.CrParticular || "").toLowerCase().includes("expenses (indirect)");
                              const isBold =
                                (row.DrParticular || "").includes("(B/F)") ||
                                (row.DrParticular || "").includes("(C/F)") ||
                                (row.CrParticular || "").includes("(C/F)") ||
                                (row.CrParticular || "").includes("(B/F)");
                              return (
                                <tr
                                  key={`t-${idx}`}
                                  className={isCategoryHeader ? "table-warning fw-bold" : isBold ? "fw-bold" : ""}
                                >
                                  <td
                                    onDoubleClick={() => row.DrParticular && !isBold && navigate(`${process.env.PUBLIC_URL}/ledgerDetailsReport`, { state: { ledgerId: (row as TradingPLDetailRow).LedgerId != null ? String((row as TradingPLDetailRow).LedgerId) : (row as TradingPLDetailRow).F_LedgerMaster != null ? String((row as TradingPLDetailRow).F_LedgerMaster) : "", ledgerName: row.DrParticular, fromDate, toDate } })}
                                    style={{ cursor: row.DrParticular && !isBold ? "pointer" : "default" }}
                                    title={row.DrParticular && !isBold ? `Double-click to open Ledger Details for ${row.DrParticular}` : ""}
                                  >
                                    {row.DrParticular || ""}
                                  </td>
                                  <td className="text-end">
                                    {typeof drAmt === "number" || (drAmt && !isNaN(Number(drAmt)))
                                      ? formatCurrency(Number(drAmt))
                                      : (row.DrAmount ?? "")}
                                  </td>
                                  <td className="text-end">
                                    {typeof drNetAmt === "number" || (drNetAmt && !isNaN(Number(drNetAmt)))
                                      ? formatCurrency(Number(drNetAmt))
                                      : (row.DrNetAmount ?? "")}
                                  </td>
                                  <td
                                    onDoubleClick={() => row.CrParticular && !isBold && navigate(`${process.env.PUBLIC_URL}/ledgerDetailsReport`, { state: { ledgerId: (row as TradingPLDetailRow).LedgerId != null ? String((row as TradingPLDetailRow).LedgerId) : (row as TradingPLDetailRow).F_LedgerMaster != null ? String((row as TradingPLDetailRow).F_LedgerMaster) : "", ledgerName: row.CrParticular, fromDate, toDate } })}
                                    style={{ cursor: row.CrParticular && !isBold ? "pointer" : "default" }}
                                    title={row.CrParticular && !isBold ? `Double-click to open Ledger Details for ${row.CrParticular}` : ""}
                                  >
                                    {row.CrParticular || ""}
                                  </td>
                                  <td className="text-end">
                                    {typeof crAmt === "number" || (crAmt && !isNaN(Number(crAmt)))
                                      ? formatCurrency(Number(crAmt))
                                      : (row.CrAmount ?? "")}
                                  </td>
                                  <td className="text-end">
                                    {typeof crNetAmt === "number" || (crNetAmt && !isNaN(Number(crNetAmt)))
                                      ? formatCurrency(Number(crNetAmt))
                                      : (row.CrNetAmount ?? "")}
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="table-secondary fw-bold">
                              <td>Total (Trading A/c)</td>
                              <td className="text-end">{formatCurrency(tradingTotalDr)}</td>
                              <td />
                              <td />
                              <td className="text-end">{formatCurrency(tradingTotalCr)}</td>
                              <td />
                            </tr>
                          </>
                        )}
                        {pnlDisplayRows.length > 0 && (
                          <>
                            <tr className="table-light fw-bold">
                              <td colSpan={6}>Profit and Loss Account</td>
                            </tr>
                            {pnlDisplayRows.map((row, idx) => {
                              const drAmt = row.DrAmount;
                              const drNetAmt = row.DrNetAmount;
                              const crAmt = row.CrAmount;
                              const crNetAmt = row.CrNetAmount;
                              const isCategoryHeader =
                                (row.DrParticular || "").toLowerCase().includes("expenditure account") ||
                                (row.CrParticular || "").toLowerCase().includes("expenses (indirect)");
                              const isBold =
                                (row.DrParticular || "").includes("(B/F)") ||
                                (row.DrParticular || "").includes("(C/F)") ||
                                (row.CrParticular || "").includes("(C/F)") ||
                                (row.CrParticular || "").includes("(B/F)");
                              return (
                                <tr
                                  key={`p-${idx}`}
                                  className={isCategoryHeader ? "table-warning fw-bold" : isBold ? "fw-bold" : ""}
                                >
                                  <td
                                    onDoubleClick={() => row.DrParticular && !isBold && navigate(`${process.env.PUBLIC_URL}/ledgerDetailsReport`, { state: { ledgerId: (row as TradingPLDetailRow).LedgerId != null ? String((row as TradingPLDetailRow).LedgerId) : (row as TradingPLDetailRow).F_LedgerMaster != null ? String((row as TradingPLDetailRow).F_LedgerMaster) : "", ledgerName: row.DrParticular, fromDate, toDate } })}
                                    style={{ cursor: row.DrParticular && !isBold ? "pointer" : "default" }}
                                    title={row.DrParticular && !isBold ? `Double-click to open Ledger Details for ${row.DrParticular}` : ""}
                                  >
                                    {row.DrParticular || ""}
                                  </td>
                                  <td className="text-end">
                                    {typeof drAmt === "number" || (drAmt && !isNaN(Number(drAmt)))
                                      ? formatCurrency(Number(drAmt))
                                      : (row.DrAmount ?? "")}
                                  </td>
                                  <td className="text-end">
                                    {typeof drNetAmt === "number" || (drNetAmt && !isNaN(Number(drNetAmt)))
                                      ? formatCurrency(Number(drNetAmt))
                                      : (row.DrNetAmount ?? "")}
                                  </td>
                                  <td
                                    onDoubleClick={() => row.CrParticular && !isBold && navigate(`${process.env.PUBLIC_URL}/ledgerDetailsReport`, { state: { ledgerId: (row as TradingPLDetailRow).LedgerId != null ? String((row as TradingPLDetailRow).LedgerId) : (row as TradingPLDetailRow).F_LedgerMaster != null ? String((row as TradingPLDetailRow).F_LedgerMaster) : "", ledgerName: row.CrParticular, fromDate, toDate } })}
                                    style={{ cursor: row.CrParticular && !isBold ? "pointer" : "default" }}
                                    title={row.CrParticular && !isBold ? `Double-click to open Ledger Details for ${row.CrParticular}` : ""}
                                  >
                                    {row.CrParticular || ""}
                                  </td>
                                  <td className="text-end">
                                    {typeof crAmt === "number" || (crAmt && !isNaN(Number(crAmt)))
                                      ? formatCurrency(Number(crAmt))
                                      : (row.CrAmount ?? "")}
                                  </td>
                                  <td className="text-end">
                                    {typeof crNetAmt === "number" || (crNetAmt && !isNaN(Number(crNetAmt)))
                                      ? formatCurrency(Number(crNetAmt))
                                      : (row.CrNetAmount ?? "")}
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="table-secondary fw-bold">
                              <td>Total (P&amp;L A/c)</td>
                              <td className="text-end">{formatCurrency(pnlTotalDr)}</td>
                              <td />
                              <td />
                              <td className="text-end">{formatCurrency(pnlTotalCr)}</td>
                              <td />
                            </tr>
                          </>
                        )}
                        {tradingDisplayRows.length === 0 && pnlDisplayRows.length === 0 && !isLoading && (
                          <tr>
                            <td colSpan={6} className="text-center text-muted py-4">
                              No data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
              <CardFooter className="text-end">
                <Btn color="primary" type="button" className="me-2" onClick={() => navigate(`${process.env.PUBLIC_URL}/profitAndLoss`)}>
                  Summary View
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
      <div className="pnl-detail-print">
        <div className="text-center border-bottom pb-3 mb-3" style={{ borderColor: "#333" }}>
          <h2 style={{ fontWeight: "bold", marginBottom: "4px" }}>{printCompanyName || "—"}</h2>
          {printFirmAddress ? <p style={{ fontSize: "14px", margin: 0 }}>{printFirmAddress}</p> : null}
        </div>
        <h3 className="text-center text-uppercase mb-3" style={{ fontSize: "16px", fontWeight: "bold", textDecoration: "underline" }}>Trading And P/L Account (Detail)</h3>
        <table style={{ width: "100%", marginBottom: "12px", fontSize: "13px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%" }}><strong>From Date:</strong> {formatDateForDisplay(fromDate)}</td>
              <td style={{ width: "50%" }}><strong>To Date:</strong> {formatDateForDisplay(toDate)}</td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th colSpan={3} style={{ textAlign: "center" }}>Dr Side</th>
              <th colSpan={3} style={{ textAlign: "center" }}>Cr Side</th>
            </tr>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ textAlign: "left" }}>Particulars</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th style={{ textAlign: "right" }}>NetAmount</th>
              <th style={{ textAlign: "left" }}>Particulars</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th style={{ textAlign: "right" }}>NetAmount</th>
            </tr>
          </thead>
          <tbody>
            {tradingDisplayRows.length > 0 && (
              <>
                <tr style={{ fontWeight: "bold", background: "#e9ecef" }}><td colSpan={6}>Trading Account</td></tr>
                {tradingDisplayRows.map((row, idx) => (
                  <tr key={`t-${idx}`}>
                    <td>{row.DrParticular ?? ""}</td>
                    <td style={{ textAlign: "right" }}>{typeof row.DrAmount === "number" || (row.DrAmount && !isNaN(Number(row.DrAmount))) ? formatCurrency(Number(row.DrAmount)) : (row.DrAmount ?? "")}</td>
                    <td style={{ textAlign: "right" }}>{row.DrNetAmount != null ? formatCurrency(Number(row.DrNetAmount)) : ""}</td>
                    <td>{row.CrParticular ?? ""}</td>
                    <td style={{ textAlign: "right" }}>{typeof row.CrAmount === "number" || (row.CrAmount && !isNaN(Number(row.CrAmount))) ? formatCurrency(Number(row.CrAmount)) : (row.CrAmount ?? "")}</td>
                    <td style={{ textAlign: "right" }}>{row.CrNetAmount != null ? formatCurrency(Number(row.CrNetAmount)) : ""}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: "bold", background: "#e9ecef" }}>
                  <td>Total (Trading A/c)</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(tradingTotalDr)}</td>
                  <td></td>
                  <td></td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(tradingTotalCr)}</td>
                  <td></td>
                </tr>
              </>
            )}
            {pnlDisplayRows.length > 0 && (
              <>
                <tr style={{ fontWeight: "bold", background: "#e9ecef" }}><td colSpan={6}>Profit and Loss Account</td></tr>
                {pnlDisplayRows.map((row, idx) => (
                  <tr key={`p-${idx}`}>
                    <td>{row.DrParticular ?? ""}</td>
                    <td style={{ textAlign: "right" }}>{typeof row.DrAmount === "number" || (row.DrAmount && !isNaN(Number(row.DrAmount))) ? formatCurrency(Number(row.DrAmount)) : (row.DrAmount ?? "")}</td>
                    <td style={{ textAlign: "right" }}>{row.DrNetAmount != null ? formatCurrency(Number(row.DrNetAmount)) : ""}</td>
                    <td>{row.CrParticular ?? ""}</td>
                    <td style={{ textAlign: "right" }}>{typeof row.CrAmount === "number" || (row.CrAmount && !isNaN(Number(row.CrAmount))) ? formatCurrency(Number(row.CrAmount)) : (row.CrAmount ?? "")}</td>
                    <td style={{ textAlign: "right" }}>{row.CrNetAmount != null ? formatCurrency(Number(row.CrNetAmount)) : ""}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: "bold", background: "#e9ecef" }}>
                  <td>Total (P&amp;L A/c)</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(pnlTotalDr)}</td>
                  <td></td>
                  <td></td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(pnlTotalCr)}</td>
                  <td></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitAndLossDetails;
