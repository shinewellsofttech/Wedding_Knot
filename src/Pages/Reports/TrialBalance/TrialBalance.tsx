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
  DrAmount_Trans?: number;
  CrAmount_Trans?: number;
  ClosingBalance_Dr?: number;
  ClosingBalance_Cr?: number;
  // Summarized response may come pre-calculated
  Balance?: number;
  DrCr?: string;
  [key: string]: any;
}

interface GroupedTrialBalanceItem {
  LedgerGroup: string;
  DrAmount_Trans?: number;
  CrAmount_Trans?: number;
  ClosingBalance_Dr?: number;
  ClosingBalance_Cr?: number;
  Balance?: number;
  DrCrType?: string;
  // For Opening Balance only
  OpeningBalance?: number;
  DrAmount_OB?: number;
  CrAmount_OB?: number;
}

const TrialBalance: React.FC = () => {
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
      formData.append("FromDate", formatDateForAPI(fromDate));
      formData.append("ToDate", formatDateForAPI(toDate));
      formData.append("IsSummarized", "1"); // boolean: true = Summarized
      formData.append("IsBrief", "true");
      formData.append("IsShowOnlyOB", showOnlyOpeningBalance ? "true" : "false"); // boolean: Show Only Opening Balance

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

  // Group data by LedgerGroup and calculate totals
  const groupedData = React.useMemo(() => {
    if (!reportData || reportData.length === 0) return [];

    // If Show Only Opening Balance is true, response format is different
    if (showOnlyOpeningBalance) {
      // New backend format (as per your sample): LedgerGroup, DrAmount_Trans, CrAmount_Trans, Balance, DrCr
      const looksSummarizedOB =
        reportData.length > 0 &&
        reportData.every((x) => x && x.LedgerGroup && x.Balance !== undefined && x.DrCr !== undefined);

      if (looksSummarizedOB) {
        return reportData.map((item): GroupedTrialBalanceItem => ({
          LedgerGroup: item.LedgerGroup || item.LedgerGroupShort || "Others",
          DrAmount_Trans: Number(item.DrAmount_Trans) || 0,
          CrAmount_Trans: Number(item.CrAmount_Trans) || 0,
          Balance: Math.abs(Number(item.Balance) || 0),
          DrCrType: (item.DrCr || "Dr").toString()
        }));
      }

      // Legacy OB-only format: LedgerGroup, OpeningBalance, DrAmount_OB, CrAmount_OB
      return reportData.map((item): GroupedTrialBalanceItem => {
        const openingBal = Number(item.OpeningBalance) || 0;
        const drOB = Number(item.DrAmount_OB) || 0;
        const crOB = Number(item.CrAmount_OB) || 0;
        const balance = drOB - crOB;

        return {
          LedgerGroup: item.LedgerGroup || item.LedgerGroupShort || "Others",
          OpeningBalance: openingBal,
          DrAmount_OB: drOB,
          CrAmount_OB: crOB,
          Balance: Math.abs(balance),
          DrCrType: balance >= 0 ? "Dr" : "Cr"
        };
      });
    }

    // If response is already summarized (like SSMS output): LedgerGroup, DrAmount_Trans, CrAmount_Trans, Balance, DrCr
    const looksSummarized =
      reportData.length > 0 &&
      reportData.every((x) => x && x.LedgerGroup && x.Balance !== undefined && x.DrCr !== undefined);

    if (looksSummarized) {
      return reportData.map((item): GroupedTrialBalanceItem => ({
        LedgerGroup: item.LedgerGroup || item.LedgerGroupShort || "Others",
        DrAmount_Trans: Number(item.DrAmount_Trans) || 0,
        CrAmount_Trans: Number(item.CrAmount_Trans) || 0,
        Balance: Math.abs(Number(item.Balance) || 0),
        DrCrType: (item.DrCr || "Dr").toString()
      }));
    }

    // Normal format - group by LedgerGroup
    const groups: { [key: string]: GroupedTrialBalanceItem } = {};

    reportData.forEach((item) => {
      const groupName = item.LedgerGroup || item.LedgerGroupShort || "Others";
      if (!groups[groupName]) {
        groups[groupName] = {
          LedgerGroup: groupName,
          DrAmount_Trans: 0,
          CrAmount_Trans: 0,
          ClosingBalance_Dr: 0,
          ClosingBalance_Cr: 0,
          Balance: 0,
          DrCrType: "Dr"
        };
      }

      groups[groupName].DrAmount_Trans = (groups[groupName].DrAmount_Trans || 0) + (Number(item.DrAmount_Trans) || 0);
      groups[groupName].CrAmount_Trans = (groups[groupName].CrAmount_Trans || 0) + (Number(item.CrAmount_Trans) || 0);
      groups[groupName].ClosingBalance_Dr = (groups[groupName].ClosingBalance_Dr || 0) + (Number(item.ClosingBalance_Dr) || 0);
      groups[groupName].ClosingBalance_Cr = (groups[groupName].ClosingBalance_Cr || 0) + (Number(item.ClosingBalance_Cr) || 0);
    });

    // Calculate balance and type for each group
    Object.keys(groups).forEach((key) => {
      const group = groups[key];
      const balance = (group.ClosingBalance_Dr || 0) - (group.ClosingBalance_Cr || 0);
      group.Balance = Math.abs(balance);
      group.DrCrType = balance >= 0 ? "Dr" : "Cr";
    });

    return Object.values(groups);
  }, [reportData, showOnlyOpeningBalance]);

  // Calculate totals
  const totals = React.useMemo(() => {
    let totalDr = 0;
    let totalCr = 0;

    if (showOnlyOpeningBalance) {
      // When IsShowOnlyOB=true, backend can return either summarized trans-style rows or OB-only rows
      const hasTransAmounts = groupedData.some(
        (g) => (g.DrAmount_Trans || 0) > 0 || (g.CrAmount_Trans || 0) > 0
      );

      groupedData.forEach((group) => {
        if (hasTransAmounts) {
          totalDr += group.DrAmount_Trans || 0;
          totalCr += group.CrAmount_Trans || 0;
        } else {
          totalDr += group.DrAmount_OB || 0;
          totalCr += group.CrAmount_OB || 0;
        }
      });
    } else {
      groupedData.forEach((group) => {
        totalDr += group.DrAmount_Trans || 0;
        totalCr += group.CrAmount_Trans || 0;
      });
    }

    return { totalDr, totalCr };
  }, [groupedData, showOnlyOpeningBalance]);

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
      `}</style>
      <Breadcrumbs mainTitle="Trial Balance" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Trial Balance" tagClass="card-title mb-0" />
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
                        id="tb-show-ob"
                        checked={showOnlyOpeningBalance}
                        onChange={(e) => setShowOnlyOpeningBalance(e.target.checked)}
                      />
                      <Label check htmlFor="tb-show-ob">Show Only Opening Balance</Label>
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
                        <p className="mt-2">Loading trial balance data...</p>
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ maxHeight: "600px", overflowY: "auto" }}>
                        <Table bordered hover className="mb-0">
                          <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                            <tr>
                              <th>Group Name</th>
                              <th className="text-end">Dr Amt</th>
                              <th className="text-end">Cr Amt</th>
                              <th className="text-end">Balance</th>
                              <th>Dr/Cr</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedData.length > 0 ? (
                              <>
                                {groupedData.map((group, index) => {
                                  const drAmt = showOnlyOpeningBalance
                                    ? (group.DrAmount_OB || 0)
                                    : (group.DrAmount_Trans || 0);
                                  const crAmt = showOnlyOpeningBalance
                                    ? (group.CrAmount_OB || 0)
                                    : (group.CrAmount_Trans || 0);

                                  return (
                                    <tr
                                      key={index}
                                      onDoubleClick={() => navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
                                        state: { ledgerGroupName: group.LedgerGroup, fromDate, toDate }
                                      })}
                                      style={{ cursor: "pointer" }}
                                      title={`Double-click to open Group Ledger Summary for ${group.LedgerGroup || "this group"}`}
                                    >
                                      <td className="fw-bold">{group.LedgerGroup || "-"}</td>
                                      <td className="text-end">{formatCurrencyBlankIfZero(drAmt)}</td>
                                      <td className="text-end">{formatCurrencyBlankIfZero(crAmt)}</td>
                                      <td className="text-end">{formatCurrency(group.Balance || 0)}</td>
                                      <td>{group.DrCrType || "Dr"}</td>
                                    </tr>
                                  );
                                })}


                                {/* Grand Total Row (Hide when IsShowOnlyOB = true) */}
                                {!showOnlyOpeningBalance && (
                                  <tr className="table-secondary fw-bold">
                                    <td>Total</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(totals.totalDr)}</td>
                                    <td className="text-end">{formatCurrencyBlankIfZero(totals.totalCr)}</td>
                                    <td colSpan={2}></td>
                                  </tr>
                                )}
                              </>
                            ) : (
                              <tr>
                                <td colSpan={5} className="text-center">
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
              <td style={{ width: "33.33%" }}><strong>Show Only Opening Balance:</strong> {showOnlyOpeningBalance ? "Yes" : "No"}</td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ textAlign: "left" }}>Group Name</th>
              <th style={{ textAlign: "right" }}>Dr Amt</th>
              <th style={{ textAlign: "right" }}>Cr Amt</th>
              <th style={{ textAlign: "right" }}>Balance</th>
              <th>Dr/Cr</th>
            </tr>
          </thead>
          <tbody>
            {groupedData.map((group, index) => {
              const drAmt = showOnlyOpeningBalance ? (group.DrAmount_OB || 0) : (group.DrAmount_Trans || 0);
              const crAmt = showOnlyOpeningBalance ? (group.CrAmount_OB || 0) : (group.CrAmount_Trans || 0);
              return (
                <tr key={index}>
                  <td style={{ fontWeight: "bold" }}>{group.LedgerGroup || "-"}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(drAmt)}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrencyBlankIfZero(crAmt)}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(group.Balance || 0)}</td>
                  <td>{group.DrCrType || "Dr"}</td>
                </tr>
              );
            })}
            {!showOnlyOpeningBalance && groupedData.length > 0 && (
              <tr style={{ fontWeight: "bold", background: "#e9ecef" }}>
                <td>Total</td>
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

export default TrialBalance;
