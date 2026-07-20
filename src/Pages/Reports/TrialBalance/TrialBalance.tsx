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
  // Summarized response fields
  Balance?: number;
  DrCr?: string;
  [key: string]: any;
}

const TrialBalance: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Set default dates (Financial Year: 01/04/2026 to 31/03/2027)
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

  // Dynamic filter states matching API parameters
  const [isSummrized, setIsSummrized] = useState(false);
  const [isShowOnlyOB, setIsShowOnlyOB] = useState(false);
  const [isBrief, setIsBrief] = useState(false);

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
      formData.append("F_CompanyMaster", String(authUser?.F_CompanyMaster ?? authUser?.CompanyId ?? authUser?.F_Company ?? "0"));
      formData.append("FromDate", formatDateForAPI(fromDate));
      formData.append("ToDate", formatDateForAPI(toDate));
      formData.append("IsSummrized", isSummrized ? "true" : "false");
      formData.append("IsSummarized", isSummrized ? "true" : "false"); // Backwards compatibility helper
      formData.append("IsShowOnlyOB", isShowOnlyOB ? "true" : "false");
      formData.append("IsBrief", isBrief ? "true" : "false");

      const arguList = {
        formData: formData,
      };

      const responseData = await Fn_GetReport(
        dispatch,
        (prevState: any) => ({ ...prevState, trialBalanceData: [] }),
        "trialBalanceData",
        apiURL,
        { arguList },
        true
      );

      // API may return array directly OR wrapped in { data: { response: [] } }
      const normalizedResponse: TrialBalanceItem[] =
        Array.isArray(responseData)
          ? (responseData as TrialBalanceItem[])
          : Array.isArray((responseData as any)?.data?.response)
            ? ((responseData as any).data.response as TrialBalanceItem[])
            : Array.isArray((responseData as any)?.data)
              ? ((responseData as any).data as TrialBalanceItem[])
              : [];

      setReportData(normalizedResponse);
    } catch (error) {
      console.error("Error fetching trial balance:", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch data when dates or options change
  useEffect(() => {
    if (fromDate && toDate) {
      fetchTrialBalance();
    }
  }, [fromDate, toDate, isSummrized, isShowOnlyOB, isBrief]);

  useEffect(() => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const name = authUser?.CompanyName || authUser?.FirmName || authUser?.Company || "";
      setPrintCompanyName(typeof name === "string" ? name.trim() : "");
      Fn_FillListData(
        dispatch,
        () => {},
        "FirmListPrint",
        `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.FirmMaster}/Id/0`
      ).then((firms: any) => {
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

  // Determine active view mode for dynamic columns
  const getViewMode = () => {
    if (isShowOnlyOB && isBrief) {
      return "brief_ob"; // Scenario 4
    }
    if (isShowOnlyOB && !isBrief) {
      return "only_ob"; // Scenario 3
    }
    if (isSummrized && !isShowOnlyOB && !isBrief) {
      return "summarized"; // Scenario 2
    }
    return "details"; // Scenario 1 (Default: !isSummrized, !isShowOnlyOB, !isBrief)
  };

  // Calculate totals dynamically based on the report data
  const totals = React.useMemo(() => {
    let openingDr = 0;
    let openingCr = 0;
    let transDr = 0;
    let transCr = 0;
    let closingDr = 0;
    let closingCr = 0;

    reportData.forEach((item) => {
      openingDr += Number(item.OpeningBalance_Dr) || 0;
      openingCr += Number(item.OpeningBalance_Cr) || 0;
      transDr += Number(item.DrAmount_Trans) || 0;
      transCr += Number(item.CrAmount_Trans) || 0;
      closingDr += Number(item.ClosingBalance_Dr) || 0;
      closingCr += Number(item.ClosingBalance_Cr) || 0;
    });

    return {
      openingDr,
      openingCr,
      transDr,
      transCr,
      closingDr,
      closingCr,
    };
  }, [reportData]);

  const activeMode = getViewMode();

  return (
    <div className="page-body report-page">
      <style>{`
        .tb-print { display: none; }
        @media print {
          body * { visibility: hidden; }
          .tb-print, .tb-print * { visibility: visible; }
          .tb-print { display: block !important; position: absolute; left: 0; top: 0; width: 100%; padding: 20px; background: white; color: black; font-family: Arial, sans-serif; }
          .tb-print table { width: 100%; border-collapse: collapse; }
          .tb-print th, .tb-print td { border: 1px solid #333; padding: 4px 8px; font-size: 12px; }
          .tb-print th { background: #f0f0f0; -webkit-print-color-adjust: exact; }
        }
        .cursor-pointer { cursor: pointer; }
      `}</style>
      <Breadcrumbs mainTitle="Trial Balance" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Trial Balance" tagClass="card-title mb-0" />
              <CardBody>
                {/* Modern styled control panel */}
                <Row className="gy-3 mb-4 align-items-center">
                  <Col md="3">
                    <FormGroup className="mb-0">
                      <Label className="fw-bold">From Date</Label>
                      <DateInput
                        value={fromDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup className="mb-0">
                      <Label className="fw-bold">To Date</Label>
                      <DateInput
                        value={toDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6" className="d-flex align-items-center gap-4 pt-4">
                    <FormGroup check className="mb-0">
                      <Input
                        type="checkbox"
                        id="tb-summarized"
                        checked={isSummrized}
                        onChange={(e) => setIsSummrized(e.target.checked)}
                      />
                      <Label check htmlFor="tb-summarized" className="fw-bold cursor-pointer">
                        Summarized
                      </Label>
                    </FormGroup>
                    <FormGroup check className="mb-0">
                      <Input
                        type="checkbox"
                        id="tb-show-ob"
                        checked={isShowOnlyOB}
                        onChange={(e) => setIsShowOnlyOB(e.target.checked)}
                      />
                      <Label check htmlFor="tb-show-ob" className="fw-bold cursor-pointer">
                        Show Only OB
                      </Label>
                    </FormGroup>
                    <FormGroup check className="mb-0">
                      <Input
                        type="checkbox"
                        id="tb-brief"
                        checked={isBrief}
                        onChange={(e) => setIsBrief(e.target.checked)}
                      />
                      <Label check htmlFor="tb-brief" className="fw-bold cursor-pointer">
                        Brief Report
                      </Label>
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md="12">
                    <div className="table-responsive" style={{ maxHeight: "600px", overflowY: "auto" }}>
                      {isLoading ? (
                        <div className="text-center p-4">
                          <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-2 mb-0">Loading trial balance data...</p>
                        </div>
                      ) : reportData.length > 0 ? (
                        <Table bordered hover className="mb-0">
                          {/* Dynamic table headers depending on the filter parameters */}
                          {activeMode === "details" && (
                            <>
                              <thead className="table-light sticky-top">
                                <tr>
                                  <th>Particular</th>
                                  <th>Ledger Group</th>
                                  <th className="text-end">Opening Dr</th>
                                  <th className="text-end">Opening Cr</th>
                                  <th className="text-end">Dr Trans</th>
                                  <th className="text-end">Cr Trans</th>
                                  <th className="text-end">Closing Dr</th>
                                  <th className="text-end">Closing Cr</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.map((item, index) => (
                                  <tr
                                    key={index}
                                    onDoubleClick={() => navigate(`${process.env.PUBLIC_URL}/ledgerDetailsReport`, {
                                      state: {
                                        ledgerId: item.Id != null ? String(item.Id) : "",
                                        ledgerName: item.Particular,
                                        fromDate,
                                        toDate,
                                      },
                                    })}
                                    className="cursor-pointer"
                                    title={`Double-click to open Ledger Details for ${item.Particular}`}
                                  >
                                    <td className="fw-bold text-primary">{item.Particular || "-"}</td>
                                    <td>{item.LedgerGroup || "-"}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.OpeningBalance_Dr)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.OpeningBalance_Cr)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.DrAmount_Trans)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.CrAmount_Trans)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.ClosingBalance_Dr)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.ClosingBalance_Cr)}</td>
                                  </tr>
                                ))}
                                <tr className="table-secondary fw-bold">
                                  <td>Total</td>
                                  <td></td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.openingDr)}</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.openingCr)}</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.transDr)}</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.transCr)}</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.closingDr)}</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.closingCr)}</td>
                                </tr>
                              </tbody>
                            </>
                          )}

                          {activeMode === "summarized" && (
                            <>
                              <thead className="table-light sticky-top">
                                <tr>
                                  <th>Ledger Group</th>
                                  <th className="text-end">Opening Dr</th>
                                  <th className="text-end">Opening Cr</th>
                                  <th className="text-end">Dr Trans</th>
                                  <th className="text-end">Cr Trans</th>
                                  <th className="text-end">Closing Dr</th>
                                  <th className="text-end">Closing Cr</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.map((item, index) => (
                                  <tr
                                    key={index}
                                    onDoubleClick={() => navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
                                      state: { ledgerGroupName: item.LedgerGroup, fromDate, toDate }
                                    })}
                                    className="cursor-pointer"
                                    title={`Double-click to open Group Ledger Summary for ${item.LedgerGroup}`}
                                  >
                                    <td className="fw-bold">{item.LedgerGroup || "-"}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.OpeningBalance_Dr)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.OpeningBalance_Cr)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.DrAmount_Trans)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.CrAmount_Trans)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.ClosingBalance_Dr)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.ClosingBalance_Cr)}</td>
                                  </tr>
                                ))}
                                <tr className="table-secondary fw-bold">
                                  <td>Total</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.openingDr)}</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.openingCr)}</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.transDr)}</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.transCr)}</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.closingDr)}</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.closingCr)}</td>
                                </tr>
                              </tbody>
                            </>
                          )}

                          {activeMode === "only_ob" && (
                            <>
                              <thead className="table-light sticky-top">
                                <tr>
                                  <th>Ledger Group</th>
                                  <th className="text-end">Opening Dr</th>
                                  <th className="text-end">Opening Cr</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.map((item, index) => (
                                  <tr
                                    key={index}
                                    onDoubleClick={() => navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
                                      state: { ledgerGroupName: item.LedgerGroup, fromDate, toDate }
                                    })}
                                    className="cursor-pointer"
                                    title={`Double-click to open Group Ledger Summary for ${item.LedgerGroup}`}
                                  >
                                    <td className="fw-bold">{item.LedgerGroup || "-"}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.OpeningBalance_Dr)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.OpeningBalance_Cr)}</td>
                                  </tr>
                                ))}
                                <tr className="table-secondary fw-bold">
                                  <td>Total</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.openingDr)}</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.openingCr)}</td>
                                </tr>
                              </tbody>
                            </>
                          )}

                          {activeMode === "brief_ob" && (
                            <>
                              <thead className="table-light sticky-top">
                                <tr>
                                  <th>Ledger Group</th>
                                  <th className="text-end">Dr Trans</th>
                                  <th className="text-end">Cr Trans</th>
                                  <th className="text-end">Balance</th>
                                  <th>Dr/Cr</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.map((item, index) => (
                                  <tr
                                    key={index}
                                    onDoubleClick={() => navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
                                      state: { ledgerGroupName: item.LedgerGroup, fromDate, toDate }
                                    })}
                                    className="cursor-pointer"
                                    title={`Double-click to open Group Ledger Summary for ${item.LedgerGroup}`}
                                  >
                                    <td className="fw-bold">{item.LedgerGroup || "-"}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.DrAmount_Trans)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(item.CrAmount_Trans)}</td>
                                    <td className="text-end">{formatCurrency(item.Balance)}</td>
                                    <td>{item.DrCr || "Dr"}</td>
                                  </tr>
                                ))}
                                <tr className="table-secondary fw-bold">
                                  <td>Total</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.transDr)}</td>
                                  <td className="text-end">{formatCurrencyBlankIfZero(totals.transCr)}</td>
                                  <td colSpan={2}></td>
                                </tr>
                              </tbody>
                            </>
                          )}
                        </Table>
                      ) : (
                        <div className="text-center p-4">
                          No trial balance data available for the selected filters.
                        </div>
                      )}
                    </div>
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

      {/* Dynamic Print Layout */}
      <div className="tb-print">
        <div className="text-center border-bottom pb-3 mb-3" style={{ borderColor: "#333" }}>
          <h2 style={{ fontWeight: "bold", marginBottom: "4px" }}>{printCompanyName || "—"}</h2>
          {printFirmAddress ? <p style={{ fontSize: "14px", margin: 0 }}>{printFirmAddress}</p> : null}
        </div>
        <h3 className="text-center text-uppercase mb-3" style={{ fontSize: "16px", fontWeight: "bold", textDecoration: "underline" }}>Trial Balance</h3>
        <table style={{ width: "100%", marginBottom: "12px", fontSize: "13px" }}>
          <tbody>
            <tr>
              <td style={{ width: "33.33%" }}><strong>From Date:</strong> {formatDateForAPI(fromDate)}</td>
              <td style={{ width: "33.33%" }}><strong>To Date:</strong> {formatDateForAPI(toDate)}</td>
              <td style={{ width: "33.33%" }}>
                <strong>Filters:</strong> {isSummrized ? "Summarized" : "Detail"}
                {isShowOnlyOB ? ", Only OB" : ""}
                {isBrief ? ", Brief" : ""}
              </td>
            </tr>
          </tbody>
        </table>

        {reportData.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            {activeMode === "details" && (
              <>
                <thead>
                  <tr style={{ background: "#f0f0f0" }}>
                    <th style={{ textAlign: "left" }}>Particular</th>
                    <th style={{ textAlign: "left" }}>Ledger Group</th>
                    <th style={{ textAlign: "right" }}>Opening Dr</th>
                    <th style={{ textAlign: "right" }}>Opening Cr</th>
                    <th style={{ textAlign: "right" }}>Dr Trans</th>
                    <th style={{ textAlign: "right" }}>Cr Trans</th>
                    <th style={{ textAlign: "right" }}>Closing Dr</th>
                    <th style={{ textAlign: "right" }}>Closing Cr</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: "bold" }}>{item.Particular || "-"}</td>
                      <td>{item.LedgerGroup || "-"}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.OpeningBalance_Dr)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.OpeningBalance_Cr)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.DrAmount_Trans)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.CrAmount_Trans)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.ClosingBalance_Dr)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.ClosingBalance_Cr)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: "bold", background: "#e9ecef" }}>
                    <td>Total</td>
                    <td></td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.openingDr)}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.openingCr)}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.transDr)}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.transCr)}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.closingDr)}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.closingCr)}</td>
                  </tr>
                </tbody>
              </>
            )}

            {activeMode === "summarized" && (
              <>
                <thead>
                  <tr style={{ background: "#f0f0f0" }}>
                    <th style={{ textAlign: "left" }}>Ledger Group</th>
                    <th style={{ textAlign: "right" }}>Opening Dr</th>
                    <th style={{ textAlign: "right" }}>Opening Cr</th>
                    <th style={{ textAlign: "right" }}>Dr Trans</th>
                    <th style={{ textAlign: "right" }}>Cr Trans</th>
                    <th style={{ textAlign: "right" }}>Closing Dr</th>
                    <th style={{ textAlign: "right" }}>Closing Cr</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: "bold" }}>{item.LedgerGroup || "-"}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.OpeningBalance_Dr)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.OpeningBalance_Cr)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.DrAmount_Trans)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.CrAmount_Trans)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.ClosingBalance_Dr)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.ClosingBalance_Cr)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: "bold", background: "#e9ecef" }}>
                    <td>Total</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.openingDr)}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.openingCr)}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.transDr)}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.transCr)}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.closingDr)}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.closingCr)}</td>
                  </tr>
                </tbody>
              </>
            )}

            {activeMode === "only_ob" && (
              <>
                <thead>
                  <tr style={{ background: "#f0f0f0" }}>
                    <th style={{ textAlign: "left" }}>Ledger Group</th>
                    <th style={{ textAlign: "right" }}>Opening Dr</th>
                    <th style={{ textAlign: "right" }}>Opening Cr</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: "bold" }}>{item.LedgerGroup || "-"}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.OpeningBalance_Dr)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.OpeningBalance_Cr)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: "bold", background: "#e9ecef" }}>
                    <td>Total</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.openingDr)}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.openingCr)}</td>
                  </tr>
                </tbody>
              </>
            )}

            {activeMode === "brief_ob" && (
              <>
                <thead>
                  <tr style={{ background: "#f0f0f0" }}>
                    <th style={{ textAlign: "left" }}>Ledger Group</th>
                    <th style={{ textAlign: "right" }}>Dr Trans</th>
                    <th style={{ textAlign: "right" }}>Cr Trans</th>
                    <th style={{ textAlign: "right" }}>Balance</th>
                    <th style={{ textAlign: "left" }}>Dr/Cr</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: "bold" }}>{item.LedgerGroup || "-"}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.DrAmount_Trans)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(item.CrAmount_Trans)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrency(item.Balance)}</td>
                      <td>{item.DrCr || "Dr"}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: "bold", background: "#e9ecef" }}>
                    <td>Total</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.transDr)}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(totals.transCr)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tbody>
              </>
            )}
          </table>
        )}
      </div>
    </div>
  );
};

export default TrialBalance;
