import React, { useState, useEffect } from "react";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { useDispatch } from "react-redux";
import { Fn_FillListData, Fn_GetReport } from "../../../store/Functions";
import { useNavigate } from "react-router-dom";
import { API_WEB_URLS } from "../../../constants/constAPI";

interface TrialBalanceItem {
  Id?: number;
  Particular?: string;
  Particulars?: string;
  LedgerGroup?: string;
  LedgerGroupShort?: string;
  DrAmount_OB?: number;
  CrAmount_OB?: number;
  OpeningBalance?: number;
  OpeningBalance_Dr?: number;
  OpeningBalance_Cr?: number;
  DrAmount_Trans?: number;
  CrAmount_Trans?: number;
  ClosingBalance_Dr?: number;
  ClosingBalance_Cr?: number;
  [key: string]: any;
}

const TrialBalanceDetail: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Set default dates (Financial Year: 01/04/2025 to 31/03/2026)
  const [fromDate, setFromDate] = useState(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const financialYearStart = currentMonth >= 4 ? currentYear : currentYear - 1;
    return `${financialYearStart}-04-01`;
  });
  const [toDate, setToDate] = useState(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const financialYearStart = currentMonth >= 4 ? currentYear : currentYear - 1;
    const financialYearEnd = financialYearStart + 1;
    return `${financialYearEnd}-03-31`;
  });
  const [showOnlyOpeningBalance, setShowOnlyOpeningBalance] = useState(false);
  const [reportData, setReportData] = useState<TrialBalanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [printCompanyName, setPrintCompanyName] = useState("");
  const [printFirmAddress, setPrintFirmAddress] = useState("");

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "0.00";
    return Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatCurrencyBlankIfZero = (amount: number | undefined | null) => {
    const num = Number(amount) || 0;
    return num === 0 ? "-" : formatCurrency(num);
  };

  const formatDateForAPI = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchTrialBalance = async () => {
    try {
      setIsLoading(true);
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser.uid || "0";
      const userToken = "token";

      // API: GetTrialBalance (without BASE as Fn_GetReport adds it automatically)
      const apiURL = `GetTrialBalance/${userId}/${userToken}`;

      const formData = new FormData();
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser") || "{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch (e) { return "0"; } })());
      formData.append("FromDate", formatDateForAPI(fromDate));
      formData.append("ToDate", formatDateForAPI(toDate));
      formData.append("IsSummarized", "0"); // boolean: false = Details
      formData.append("IsShowOnlyOB", showOnlyOpeningBalance ? "true" : "false"); // boolean: Show Only Opening Balance

      const arguList = {
        formData: formData,
      };

      const responseData = await Fn_GetReport(
        dispatch,
        (prevState: any) => ({ ...prevState, trialBalanceDetailData: [] }),
        "trialBalanceDetailData",
        apiURL,
        { arguList },
        true
      );

      // API can return either an array directly OR an object with data.response (as per backend format)
      const normalizedResponse: any[] =
        Array.isArray(responseData)
          ? responseData
          : Array.isArray((responseData as any)?.data?.response)
            ? (responseData as any).data.response
            : Array.isArray((responseData as any)?.data)
              ? (responseData as any).data
              : [];

      setReportData(normalizedResponse);
    } catch (error) {
      console.error("Error fetching trial balance detail:", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch data when dates or checkbox changes
  useEffect(() => {
    if (fromDate && toDate) {
      fetchTrialBalance();
    }
  }, [fromDate, toDate, showOnlyOpeningBalance]);

  useEffect(() => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const name = authUser?.CompanyName || authUser?.FirmName || authUser?.Company || "";
      setPrintCompanyName(typeof name === "string" ? name.trim() : "");
      Fn_FillListData(dispatch, () => {}, "FirmListPrint", `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.FirmMaster}/Id/0`).then((firms: any) => {
        if (!Array.isArray(firms) || firms.length === 0) return;
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

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    window.history.back();
  };

  const handleNext = () => {
    console.log("Next page...");
  };

  // Group data by LedgerGroup for display
  const groupedData = React.useMemo(() => {
    if (!reportData || reportData.length === 0) return [];

    // If Show Only Opening Balance is true, response format is different
    // Response only contains LedgerGroup level data (no Particular/Particulars)
    if (showOnlyOpeningBalance) {
      // Directly map group-level data
      return reportData.map((item) => ({
        groupName: item.LedgerGroup || item.LedgerGroupShort || "Others",
        items: [item], // Single item per group (group-level data only)
      }));
    }

    // Normal format - group by LedgerGroup with individual ledgers
    const groups: { [key: string]: TrialBalanceItem[] } = {};

    reportData.forEach((item) => {
      const groupName = item.LedgerGroup || item.LedgerGroupShort || "Others";
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(item);
    });

    return Object.entries(groups).map(([groupName, items]) => ({
      groupName,
      items,
    }));
  }, [reportData, showOnlyOpeningBalance]);

  // Calculate totals
  const totals = React.useMemo(() => {
    let totalDr = 0;
    let totalCr = 0;

    if (showOnlyOpeningBalance) {
      // For opening balance, sum OpeningBalance_Dr and OpeningBalance_Cr (group-level data only)
      reportData.forEach((item) => {
        if (!item.Particular && !item.Particulars) {
          totalDr += Number(item.OpeningBalance_Dr) || 0;
          totalCr += Number(item.OpeningBalance_Cr) || 0;
        }
      });
    } else {
      // For normal view, sum DrAmount_Trans and CrAmount_Trans (group totals only, not individual particulars)
      reportData.forEach((item) => {
        if (!item.Particular && !item.Particulars) {
          totalDr += Number(item.DrAmount_Trans) || 0;
          totalCr += Number(item.CrAmount_Trans) || 0;
        }
      });
    }

    return { totalDr, totalCr };
  }, [reportData, showOnlyOpeningBalance]);

  return (
    <div className="page-body report-page">
      <style>{`.tb-detail-print{display:none}@media print{body *{visibility:hidden}.tb-detail-print,.tb-detail-print *{visibility:visible}.tb-detail-print{display:block!important;position:absolute;left:0;top:0;width:100%;padding:20px;background:#fff;color:#000;font-family:Arial,sans-serif}.tb-detail-print table{width:100%;border-collapse:collapse}.tb-detail-print th,.tb-detail-print td{border:1px solid #333;padding:4px 8px;font-size:12px}.tb-detail-print th{background:#f0f0f0;-webkit-print-color-adjust:exact}`}</style>
      <Breadcrumbs mainTitle="Trial Balance (Detail)" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Trial Balance (Detail)" tagClass="card-title mb-0" />
              <CardBody>
                <Row className="gy-3 mb-3 align-items-end">
                  <Col md="3">
                    <FormGroup>
                      <Label>From Date</Label>
                      <DateInput
                        value={fromDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label>To Date</Label>
                      <DateInput
                        value={toDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup check className="mb-0">
                      <Input
                        type="checkbox"
                        id="tb-detail-show-ob"
                        checked={showOnlyOpeningBalance}
                        onChange={(e) => setShowOnlyOpeningBalance(e.target.checked)}
                      />
                      <Label check htmlFor="tb-detail-show-ob">Show Only Opening Balance</Label>
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md="12">
                    {isLoading ? (
                      <div className="text-center p-4">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading trial balance detail data...</p>
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ maxHeight: "600px", overflowY: "auto" }}>
                        <Table bordered hover className="mb-0">
                          <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                            <tr>
                              {showOnlyOpeningBalance ? (
                                <>
                                  <th>LedgerGroup</th>
                                  <th className="text-end">OpeningBalance_Dr</th>
                                  <th className="text-end">OpeningBalance_Cr</th>
                                </>
                              ) : (
                                <>
                                  <th>Group Names</th>
                                  <th>Particulars</th>
                                  <th className="text-end">Dr Amt</th>
                                  <th className="text-end">Cr Amt</th>
                                  <th className="text-end">Balance</th>
                                  <th>Dr/Cr</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {groupedData.length > 0 ? (
                              <>
                                {groupedData.map((group, groupIndex) => (
                                  <React.Fragment key={groupIndex}>
                                    {!showOnlyOpeningBalance && (
                                      <tr
                                        className="table-info"
                                        onDoubleClick={() => navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
                                          state: { ledgerGroupName: group.groupName, fromDate, toDate }
                                        })}
                                        style={{ cursor: "pointer" }}
                                        title={`Double-click to open Group Ledger Summary for ${group.groupName}`}
                                      >
                                        <td colSpan={6} className="fw-bold">
                                          {group.groupName}
                                        </td>
                                      </tr>
                                    )}
                                    {/* When Show Only Opening Balance is true, show group-level data only (no Particular) */}
                                    {showOnlyOpeningBalance ? (
                                      group.items.map((item, itemIndex) => {
                                        // OB-only format: OpeningBalance_Dr, OpeningBalance_Cr
                                        const drAmt = Number(item.OpeningBalance_Dr) || 0;
                                        const crAmt = Number(item.OpeningBalance_Cr) || 0;

                                        return (
                                          <tr
                                            key={itemIndex}
                                            onDoubleClick={() => navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
                                              state: { ledgerGroupName: item.LedgerGroup || item.LedgerGroupShort, fromDate, toDate }
                                            })}
                                            style={{ cursor: "pointer" }}
                                            title="Double-click to open Group Ledger Summary"
                                          >
                                            <td>{item.LedgerGroup || item.LedgerGroupShort || "-"}</td>
                                            <td className="text-end">{formatCurrencyBlankIfZero(drAmt)}</td>
                                            <td className="text-end">{formatCurrencyBlankIfZero(crAmt)}</td>
                                          </tr>
                                        );
                                      })
                                    ) : (
                                      group.items
                                        .filter((item) => item.Particular || item.Particulars)
                                        .map((item, itemIndex) => {
                                          // Normal format: DrAmount_Trans, CrAmount_Trans, ClosingBalance_Dr, ClosingBalance_Cr
                                          const drAmt = Number(item.DrAmount_Trans) || 0;
                                          const crAmt = Number(item.CrAmount_Trans) || 0;
                                          const closingDr = Number(item.ClosingBalance_Dr) || 0;
                                          const closingCr = Number(item.ClosingBalance_Cr) || 0;
                                          const balance = closingDr - closingCr;
                                          const balanceType = balance >= 0 ? "Dr" : "Cr";

                                          return (
                                            <tr
                                              key={itemIndex}
                                              onDoubleClick={() => navigate(`${process.env.PUBLIC_URL}/ledgerDetailsReport`, {
                                                state: {
                                                  ledgerId: item.Id != null ? String(item.Id) : "",
                                                  ledgerName: item.Particular || item.Particulars,
                                                  fromDate,
                                                  toDate,
                                                },
                                              })}
                                              style={{ cursor: "pointer" }}
                                              title={`Double-click to open Ledger Details for ${item.Particular || item.Particulars}`}
                                            >
                                              <td></td>
                                              <td>{item.Particular || item.Particulars || "-"}</td>
                                              <td className="text-end">{formatCurrencyBlankIfZero(drAmt)}</td>
                                              <td className="text-end">{formatCurrencyBlankIfZero(crAmt)}</td>
                                              <td className="text-end">{formatCurrency(Math.abs(balance))}</td>
                                              <td>{balanceType}</td>
                                            </tr>
                                          );
                                        })
                                    )}
                                    {/* Group Total Row - Only show in normal mode (not in opening balance mode) */}
                                    {!showOnlyOpeningBalance && group.items.find((item) => !item.Particular && !item.Particulars && (item.LedgerGroup || item.LedgerGroupShort)) && (
                                      <tr className="fw-bold">
                                        <td colSpan={2}>Group Total</td>
                                        <td className="text-end">
                                          {formatCurrencyBlankIfZero(
                                            group.items
                                              .filter((item) => !item.Particular && !item.Particulars)
                                              .reduce((sum, item) => sum + (Number(item.DrAmount_Trans) || 0), 0)
                                          )}
                                        </td>
                                        <td className="text-end">
                                          {formatCurrencyBlankIfZero(
                                            group.items
                                              .filter((item) => !item.Particular && !item.Particulars)
                                              .reduce((sum, item) => sum + (Number(item.CrAmount_Trans) || 0), 0)
                                          )}
                                        </td>
                                        <td colSpan={2}></td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                ))}
                                {/* Grand Total Row (Hide when IsShowOnlyOB = true) */}
                                {!showOnlyOpeningBalance && (
                                  <tr className="table-secondary fw-bold">
                                    <td colSpan={2}>Total</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(totals.totalDr)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(totals.totalCr)}</td>
                                    <td colSpan={2}></td>
                                  </tr>
                                )}
                              </>
                            ) : (
                              <tr>
                                <td colSpan={showOnlyOpeningBalance ? 3 : 6} className="text-center">
                                  No data available.
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
              <CardFooter className="text-end">
                <Btn color="primary" type="button" className="me-2" onClick={handleNext}>
                  Next
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
      <div className="tb-detail-print">
        <div className="text-center border-bottom pb-3 mb-3" style={{ borderColor: "#333" }}>
          <h2 style={{ fontWeight: "bold", marginBottom: "4px" }}>{printCompanyName || "—"}</h2>
          {printFirmAddress ? <p style={{ fontSize: "14px", margin: 0 }}>{printFirmAddress}</p> : null}
        </div>
        <h3 className="text-center text-uppercase mb-3" style={{ fontSize: "16px", fontWeight: "bold", textDecoration: "underline" }}>Trial Balance (Detail)</h3>
        <table style={{ width: "100%", marginBottom: "12px", fontSize: "13px" }}>
          <tbody>
            <tr>
              <td style={{ width: "33.33%" }}><strong>From Date:</strong> {formatDateForAPI(fromDate)}</td>
              <td style={{ width: "33.33%" }}><strong>To Date:</strong> {formatDateForAPI(toDate)}</td>
              <td style={{ width: "33.33%" }}><strong>Show Only Opening Balance:</strong> {showOnlyOpeningBalance ? "Yes" : "No"}</td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              {showOnlyOpeningBalance ? (
                <>
                  <th style={{ textAlign: "left" }}>LedgerGroup</th>
                  <th style={{ textAlign: "right" }}>OpeningBalance_Dr</th>
                  <th style={{ textAlign: "right" }}>OpeningBalance_Cr</th>
                </>
              ) : (
                <>
                  <th style={{ textAlign: "left" }}>Group Names</th>
                  <th style={{ textAlign: "left" }}>Particulars</th>
                  <th style={{ textAlign: "right" }}>Dr Amt</th>
                  <th style={{ textAlign: "right" }}>Cr Amt</th>
                  <th style={{ textAlign: "right" }}>Balance</th>
                  <th>Dr/Cr</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {groupedData.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {!showOnlyOpeningBalance && (
                  <tr style={{ background: "#e3f2fd" }}>
                    <td colSpan={6} style={{ fontWeight: "bold" }}>{group.groupName}</td>
                  </tr>
                )}
                {showOnlyOpeningBalance
                  ? group.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.LedgerGroup || item.LedgerGroupShort || "-"}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(Number(item.OpeningBalance_Dr) || 0)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(Number(item.OpeningBalance_Cr) || 0)}</td>
                      </tr>
                    ))
                  : group.items.filter((item) => item.Particular || item.Particulars).map((item, i) => {
                      const drAmt = Number(item.DrAmount_Trans) || 0;
                      const crAmt = Number(item.CrAmount_Trans) || 0;
                      const closingDr = Number(item.ClosingBalance_Dr) || 0;
                      const closingCr = Number(item.ClosingBalance_Cr) || 0;
                      const balance = closingDr - closingCr;
                      return (
                        <tr key={i}>
                          <td></td>
                          <td>{item.Particular || item.Particulars || "-"}</td>
                          <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(drAmt)}</td>
                          <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(crAmt)}</td>
                          <td style={{ textAlign: "right" }}>{formatCurrency(Math.abs(balance))}</td>
                          <td>{balance >= 0 ? "Dr" : "Cr"}</td>
                        </tr>
                      );
                    })}
              </React.Fragment>
            ))}
            {!showOnlyOpeningBalance && groupedData.length > 0 && (
              <tr style={{ fontWeight: "bold", background: "#e9ecef" }}>
                <td colSpan={2}>Total</td>
                <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.totalDr)}</td>
                <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.totalCr)}</td>
                <td colSpan={2}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrialBalanceDetail;

