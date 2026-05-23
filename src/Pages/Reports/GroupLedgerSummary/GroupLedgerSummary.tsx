import React, { useState, useEffect } from "react";
import {
    Card, CardBody, CardFooter, Col, Container,
    FormGroup, Input, Label, Row, Table
} from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { useNavigate, useLocation } from "react-router-dom";

interface LedgerGroupItem {
    Id: number;
    Name: string;
    [key: string]: any;
}

interface LedgerSummaryRow {
    Id?: number;
    Name?: string;
    LedgerGroupName?: string;
    OpeningBalance?: number | null;
    TotalDebit?: number | null;
    TotalCredit?: number | null;
    ClosingBalance?: number | null;
    [key: string]: any;
}

const BASE = API_WEB_URLS.BASE; // "https://apiaccountingmain.shinewellinnovation.com/api/V1/"

const PAGE_CSS = `
  /* ── Responsive ── */
  .grp-led-wrap .table-responsive { max-height: 520px; overflow-y: auto; }
  @media (max-width: 991.98px) {
    .grp-led-wrap .card-body { padding: 0.75rem; }
    .grp-led-wrap table th,
    .grp-led-wrap table td { padding: 0.35rem 0.5rem; font-size: 0.85rem; }
    .grp-led-wrap .table-responsive { max-height: 420px; }
  }
  @media (max-width: 767.98px) {
    .grp-led-wrap .card-body { padding: 0.5rem; }
    .grp-led-wrap table th,
    .grp-led-wrap table td { padding: 0.28rem 0.4rem; font-size: 0.78rem; }
    .grp-led-wrap .table-responsive { max-height: 380px; }
  }
  @media (max-width: 575.98px) {
    .grp-led-wrap table th,
    .grp-led-wrap table td { padding: 0.22rem 0.3rem; font-size: 0.72rem; }
    .grp-led-wrap .table-responsive { max-height: 320px; }
  }
  /* ── Print ── */
  .grp-led-print { display: none; }
  @media print {
    body * { visibility: hidden; }
    .grp-led-print, .grp-led-print * { visibility: visible; }
    .grp-led-print {
      display: block !important;
      position: absolute; left: 0; top: 0;
      width: 100%; padding: 20px;
      background: white; color: black;
      font-family: Arial, sans-serif; font-size: 12px;
    }
    .grp-led-print table { width: 100%; border-collapse: collapse; }
    .grp-led-print th, .grp-led-print td { border: 1px solid #333; padding: 4px 8px; }
    .grp-led-print th { background: #f0f0f0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .grp-led-print .total-row { background: #ddd; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

const GroupLedgerSummary: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    /* ── FY defaults ───────────────────────────────────────────── */
    const [fromDate, setFromDate] = useState<string>(() => {
        const d = new Date(); const y = d.getFullYear(), m = d.getMonth() + 1;
        const fyStart = m >= 4 ? y : y - 1;
        return `${fyStart}-04-01`;
    });
    const [toDate, setToDate] = useState<string>(() => {
        const d = new Date(); const y = d.getFullYear(), m = d.getMonth() + 1;
        const fyStart = m >= 4 ? y : y - 1;
        return `${fyStart + 1}-03-31`;
    });

    const [ledgerGroupId, setLedgerGroupId] = useState<string>("");
    const [ledgerGroupName, setLedgerGroupName] = useState<string>("");
    const [ledgerGroupList, setLedgerGroupList] = useState<LedgerGroupItem[]>([]);
    const [reportData, setReportData] = useState<LedgerSummaryRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [companyName, setCompanyName] = useState("");
    const [printFirmAddress, setPrintFirmAddress] = useState("");

    /* ── helpers ───────────────────────────────────────────────── */
    const fc = (v: number | null | undefined): string => {
        if (v === undefined || v === null || isNaN(Number(v))) return "-";
        return Number(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    const fmtAPI = (ds: string): string => {
        const d = new Date(ds);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()}`;
    };
    const fmtDisplay = (ds: string): string => {
        const d = new Date(ds);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    };

    const getAuthUser = () => {
        const a = JSON.parse(localStorage.getItem("authUser") || "{}");
        return {
            userId: String(a?.uid ?? a?.Id ?? "0"),
            userToken: String(a?.Token ?? a?.token ?? "token"),
            fCompany: String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"),
        };
    };

    /* ── Load company name and firm address for print ─────────── */
    useEffect(() => {
        const a = JSON.parse(localStorage.getItem("authUser") || "{}");
        const name = a?.FirmName ?? a?.CompanyName ?? a?.Company ?? "";
        setCompanyName(name);
        const firmUrl = `${BASE}Masters/0/token/${API_WEB_URLS.FirmMaster}/Id/0`;
        fetch(firmUrl).then((r) => r.json()).then((json) => {
            const list = json?.data?.dataList ?? json?.data?.data?.dataList ?? (Array.isArray(json?.data) ? json.data : []);
            const firms = Array.isArray(list) ? list : [];
            if (firms.length > 0) {
                const fCompanyId = a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company;
                const firm = (fCompanyId != null && fCompanyId !== "")
                    ? firms.find((f: any) => String(f.Id) === String(fCompanyId) || String(f.F_CompanyMaster) === String(fCompanyId)) || firms[0]
                    : firms.find((f: any) => (f.FirmName || f.Name || "") === name) || firms[0];
                const apiName = firm?.FirmName || firm?.Name || "";
                if (apiName) setCompanyName(apiName);
                const addr = [firm?.Address1, firm?.Address2, firm?.CityName || firm?.City, firm?.StateName || firm?.State, firm?.PinCode].filter(Boolean).join(", ");
                setPrintFirmAddress(addr || "");
            }
        }).catch(() => {});
    }, []);

    /* ── Load LedgerGroups dropdown via direct fetch ──────────── */
    useEffect(() => {
        const url = `${BASE}Masters/0/token/LedgerGroupMaster/Id/0`;
        fetch(url)
            .then((r) => r.json())
            .then((json) => {
                const list: LedgerGroupItem[] =
                    json?.data?.dataList ??
                    json?.data?.data?.dataList ??
                    (Array.isArray(json?.data) ? json.data : []);
                setLedgerGroupList(Array.isArray(list) ? list : []);
            })
            .catch((err) => console.error("LedgerGroup load error:", err));
    }, []);

    /* ── Pre-select ledger group if navigated from another report ── */
    useEffect(() => {
        const state = location.state as any;
        if (!state) return;
        
        if (state.ledgerGroupId && state.ledgerGroupId !== "0" && state.ledgerGroupId !== "") {
            setLedgerGroupId(String(state.ledgerGroupId));
            if (state.ledgerGroupName) setLedgerGroupName(state.ledgerGroupName);
            if (state.fromDate) setFromDate(state.fromDate);
            if (state.toDate) setToDate(state.toDate);
        } else if (state.ledgerGroupName && ledgerGroupList.length > 0) {
            const found = ledgerGroupList.find(g => g.Name === state.ledgerGroupName);
            if (found) {
                setLedgerGroupId(String(found.Id));
                setLedgerGroupName(found.Name);
                if (state.fromDate) setFromDate(state.fromDate);
                if (state.toDate) setToDate(state.toDate);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state, ledgerGroupList]);

    /* ── Fetch report via direct fetch ────────────────────────── */
    const fetchReport = async () => {
        if (!ledgerGroupId || ledgerGroupId === "0" || ledgerGroupId === "") {
            alert("Please select a Ledger Group.");
            return;
        }
        try {
            setIsLoading(true);
            setReportData([]);

            const { userId, userToken, fCompany } = getAuthUser();

            const formData = new FormData();
            formData.append("FromDate", fmtAPI(fromDate));
            formData.append("ToDate", fmtAPI(toDate));
            formData.append("F_LedgerGroupMaster", String(Number(ledgerGroupId)));
            formData.append("UserId", userId);
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());
            formData.append("F_CompanyMaster", fCompany);

            const url = `${BASE}GetLedgerDetailsByGroupId/${userId}/${userToken}`;
            console.log("GroupLedgerSummary → POST", url, { FromDate: fmtAPI(fromDate), ToDate: fmtAPI(toDate), F_LedgerGroupMaster: ledgerGroupId });

            const response = await fetch(url, { method: "POST", body: formData });
            const json = await response.json();
            console.log("GroupLedgerSummary response:", json);

            const rows: LedgerSummaryRow[] =
                json?.data?.response ??
                json?.data?.data?.response ??
                (Array.isArray(json?.data) ? json.data : []) ??
                [];

            setReportData(Array.isArray(rows) ? rows : []);
        } catch (err) {
            console.error("GroupLedgerSummary fetch error:", err);
            setReportData([]);
        } finally {
            setIsLoading(false);
        }
    };


    /* ── Pre-select LedgerGroup if navigated from another report ── */
    useEffect(() => {
        const state = (location.state as any);
        if (!state || !state.ledgerGroupName || ledgerGroupList.length === 0) return;
        
        const targetName = state.ledgerGroupName.trim().toLowerCase();
        const match = ledgerGroupList.find((g) => g.Name.trim().toLowerCase() === targetName);
        
        if (match) {
            setLedgerGroupId(String(match.Id));
            setLedgerGroupName(match.Name);
        }
        if (state.fromDate) setFromDate(state.fromDate);
        if (state.toDate) setToDate(state.toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ledgerGroupList, location.state]);

    /* ── Auto-fetch when group or dates change ───────────────── */
    useEffect(() => {
        if (!ledgerGroupId || ledgerGroupId === "0" || ledgerGroupId === "") {
            setReportData([]);
            return;
        }
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ledgerGroupId, fromDate, toDate]);
    // Pre-select LedgerGroup if navigated from another report
    useEffect(() => {
        const state = (location.state as any);
        if (!state?.ledgerGroupName || !ledgerGroupList.length) return;
        const match = ledgerGroupList.find(
            (g) => g.Name.trim().toLowerCase() === state.ledgerGroupName.trim().toLowerCase()
        );
        if (match) {
            setLedgerGroupId(String(match.Id));
            setLedgerGroupName(match.Name);
        }
        if (state.fromDate) setFromDate(state.fromDate);
        if (state.toDate)   setToDate(state.toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ledgerGroupList]);

    /* ── Totals ────────────────────────────────────────────────── */
    const totals = reportData.reduce(
        (acc, row) => ({
            openingBalance: acc.openingBalance + (Number(row.OpeningBalance) || 0),
            totalDebit: acc.totalDebit + (Number(row.TotalDebit) || 0),
            totalCredit: acc.totalCredit + (Number(row.TotalCredit) || 0),
            closingBalance: acc.closingBalance + (Number(row.ClosingBalance) || 0),
        }),
        { openingBalance: 0, totalDebit: 0, totalCredit: 0, closingBalance: 0 }
    );

    /* ── JSX ───────────────────────────────────────────────────── */
    return (
        <div className="page-body grp-led-wrap report-page">
            <style>{PAGE_CSS}</style>
            <Breadcrumbs mainTitle="Group Ledger Summary" parent="Reports" />
            <Container fluid>
                <Row>
                    <Col xs="12">
                        <Card>
                            <CardHeaderCommon title="Group Ledger Summary" tagClass="card-title mb-0" />
                            <CardBody>

                                {/* ── Filters ── */}
                                <Row className="gy-3 mb-3 align-items-end">
                                    <Col xs="12" sm="6" md="4">
                                        <FormGroup className="mb-0">
                                            <Label>Ledger Group <span className="text-danger">*</span></Label>
                                            <Input
                                                type="select"
                                                value={ledgerGroupId}
                                                onChange={(e) => {
                                                    setLedgerGroupId(e.target.value);
                                                    const found = ledgerGroupList.find((g) => String(g.Id) === e.target.value);
                                                    setLedgerGroupName(found?.Name || "");
                                                }}
                                            >
                                                <option value="">-- Select Ledger Group --</option>
                                                {ledgerGroupList.map((g) => (
                                                    <option key={g.Id} value={String(g.Id)}>{g.Name}</option>
                                                ))}
                                            </Input>
                                        </FormGroup>
                                    </Col>
                                    <Col xs="12" sm="6" md="3">
                                        <FormGroup className="mb-0">
                                            <Label>From Date</Label>
                                            <DateInput value={fromDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)} />
                                        </FormGroup>
                                    </Col>
                                    <Col xs="12" sm="6" md="3">
                                        <FormGroup className="mb-0">
                                            <Label>To Date</Label>
                                            <DateInput value={toDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)} />
                                        </FormGroup>
                                    </Col>
                                </Row>

                                {/* ── Report Heading ── */}
                                {/* {reportData.length > 0 && (
                                    <>
                                        <h5 className="text-center fw-bold mb-1">Group Ledger Summary</h5>
                                        <p className="text-center text-muted mb-3">
                                            {ledgerGroupName && <><strong>{ledgerGroupName}</strong> &nbsp;|&nbsp;</>}
                                            {fmtDisplay(fromDate)} to {fmtDisplay(toDate)}
                                        </p>
                                    </>
                                )} */}

                                {/* ── Table ── */}
                                {isLoading ? (
                                    <div className="text-center p-4">
                                        <div className="spinner-border" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2">Loading report...</p>
                                    </div>
                                ) : (
                                    <Row>
                                        <Col md="12">
                                            <div className="table-responsive">
                                                <Table bordered hover className="mb-0">
                                                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                                                        <tr>
                                                            <th style={{ minWidth: "150px" }}>Name</th>
                                                            <th className="text-end" style={{ width: "150px" }}>Op. Balance</th>
                                                            <th className="text-end" style={{ width: "130px" }}>Total Debit</th>
                                                            <th className="text-end" style={{ width: "130px" }}>Total Credit</th>
                                                            <th className="text-end" style={{ width: "150px" }}>Closing Balance</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {reportData.length > 0 ? (
                                                            <>
                                                                {reportData.map((row, idx) => (
                                                                    <tr
                                                                        key={row.Id ?? idx}
                                                                        onDoubleClick={() => navigate(`${process.env.PUBLIC_URL}/ledgerDetailsReport`, { state: { ledgerId: String(row.Id ?? ""), ledgerName: row.Name ?? "", fromDate, toDate } })}
                                                                        style={{ cursor: "pointer" }}
                                                                        title="Double-click to open Ledger Details"
                                                                    >
                                                                        <td>{row.Name ?? "-"}</td>
                                                                        <td className="text-end">{fc(row.OpeningBalance)}</td>
                                                                        <td className="text-end">{fc(row.TotalDebit)}</td>
                                                                        <td className="text-end">{fc(row.TotalCredit)}</td>
                                                                        <td className="text-end">{fc(row.ClosingBalance)}</td>
                                                                    </tr>
                                                                ))}
                                                                <tr className="table-secondary fw-bold">
                                                                    <td>Total</td>
                                                                    <td className="text-end">{fc(totals.openingBalance)}</td>
                                                                    <td className="text-end">{fc(totals.totalDebit)}</td>
                                                                    <td className="text-end">{fc(totals.totalCredit)}</td>
                                                                    <td className="text-end">{fc(totals.closingBalance)}</td>
                                                                </tr>
                                                            </>
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={5} className="text-center text-muted py-4">
                                                                    {ledgerGroupId
                                                                        ? "No data found for the selected criteria."
                                                                        : "Select a Ledger Group to load data."}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </Col>
                                    </Row>
                                )}
                            </CardBody>

                            <CardFooter className="text-end">
                                <Btn color="success" type="button" className="me-2" onClick={() => window.print()}>
                                    Print
                                </Btn>
                                <Btn color="secondary" type="button" onClick={() => window.history.back()}>
                                    Close
                                </Btn>
                            </CardFooter>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* ── Hidden Print Layout ── */}
            <div className="grp-led-print">
                <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "10px", marginBottom: "12px" }}>
                    {companyName && <h2 style={{ margin: "0 0 4px", fontWeight: "bold" }}>{companyName}</h2>}
                    {printFirmAddress && <p style={{ margin: "0 0 4px", fontSize: "14px" }}>{printFirmAddress}</p>}
                    <h3 style={{ margin: "0 0 4px" }}>Group Ledger Summary</h3>
                    {ledgerGroupName && (
                        <p style={{ margin: "0 0 2px", fontSize: "13px" }}>
                            <strong>Group:</strong> {ledgerGroupName}
                        </p>
                    )}
                    <p style={{ margin: 0, fontSize: "13px" }}>
                        Period: {fmtDisplay(fromDate)} to {fmtDisplay(toDate)}
                    </p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left" }}>Name</th>
                            <th style={{ textAlign: "right" }}>Opening Balance</th>
                            <th style={{ textAlign: "right" }}>Total Debit</th>
                            <th style={{ textAlign: "right" }}>Total Credit</th>
                            <th style={{ textAlign: "right" }}>Closing Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((row, idx) => (
                            <tr key={idx}>
                                <td>{row.Name ?? "-"}</td>
                                <td style={{ textAlign: "right" }}>{fc(row.OpeningBalance)}</td>
                                <td style={{ textAlign: "right" }}>{fc(row.TotalDebit)}</td>
                                <td style={{ textAlign: "right" }}>{fc(row.TotalCredit)}</td>
                                <td style={{ textAlign: "right" }}>{fc(row.ClosingBalance)}</td>
                            </tr>
                        ))}
                        {reportData.length > 0 && (
                            <tr className="total-row">
                                <td><strong>Total</strong></td>
                                <td style={{ textAlign: "right" }}>{fc(totals.openingBalance)}</td>
                                <td style={{ textAlign: "right" }}>{fc(totals.totalDebit)}</td>
                                <td style={{ textAlign: "right" }}>{fc(totals.totalCredit)}</td>
                                <td style={{ textAlign: "right" }}>{fc(totals.closingBalance)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GroupLedgerSummary;
