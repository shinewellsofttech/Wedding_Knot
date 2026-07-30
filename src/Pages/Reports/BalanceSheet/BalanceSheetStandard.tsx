import React, { useState, useEffect } from "react";
import {
    Card, CardBody, CardFooter, Col, Container,
    FormGroup, Label, Row, Table
} from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { Fn_GetReport } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { exportDataToExcel } from "../../../utils/excelExportHelper";

interface BSStandardRow {
    RowNo?: number;
    Particular?: string | null;
    Amount?: number | null;
    NetAmount?: number | null;
    [key: string]: any;
}

const isSectionHeader = (row: BSStandardRow): boolean => {
    const p = (row.Particular ?? "").trim();
    return p !== "" && row.Amount == null && row.NetAmount == null;
};
const isTotalRow = (row: BSStandardRow): boolean => row.NetAmount != null;
const isBlankRow = (row: BSStandardRow): boolean =>
    (row.Particular ?? "").trim() === "" && row.Amount == null && row.NetAmount == null;

const PAGE_CSS = `
  /* ── Responsive ── */
  .bs-std-wrap .table-responsive { max-height: 520px; overflow-y: auto; }
  @media (max-width: 991.98px) {
    .bs-std-wrap .card-body { padding: 0.75rem; }
    .bs-std-wrap table th,
    .bs-std-wrap table td { padding: 0.35rem 0.5rem; font-size: 0.85rem; }
  }
  @media (max-width: 767.98px) {
    .bs-std-wrap .card-body { padding: 0.5rem; }
    .bs-std-wrap table th,
    .bs-std-wrap table td { padding: 0.28rem 0.4rem; font-size: 0.78rem; }
    .bs-std-wrap .table-responsive { max-height: 420px; }
  }
  @media (max-width: 575.98px) {
    .bs-std-wrap table th,
    .bs-std-wrap table td { padding: 0.22rem 0.3rem; font-size: 0.72rem; }
    .bs-std-wrap .table-responsive { max-height: 360px; }
  }
  /* ── Print ── */
  .bs-std-print { display: none; }
  @media print {
    body * { visibility: hidden; }
    .bs-std-print, .bs-std-print * { visibility: visible; }
    .bs-std-print {
      display: block !important;
      position: absolute; left: 0; top: 0;
      width: 100%; padding: 20px;
      background: white; color: black;
      font-family: Arial, sans-serif; font-size: 12px;
    }
    .bs-std-print table { width: 100%; border-collapse: collapse; }
    .bs-std-print th, .bs-std-print td { border: 1px solid #333; padding: 4px 8px; }
    .bs-std-print th { background: #f0f0f0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .bs-std-print .section-hdr { background: #e8e8e8; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .bs-std-print .total-row   { background: #ddd; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

const BalanceSheetStandard: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const drillDown = (particular: string | null | undefined) => {
        if (!particular || particular.trim() === "" || particular.toUpperCase() === "TOTAL") return;
        navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
            state: { ledgerGroupName: particular.trim(), fromDate: toDate, toDate: toDate },
        });
    };

    const [toDate, setToDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
    const [reportData, setReportData] = useState<BSStandardRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [companyName, setCompanyName] = useState("");
    const [printFirmAddress, setPrintFirmAddress] = useState("");

    const formatCurrency = (amount: number | undefined | null): string => {
        if (amount === undefined || amount === null || isNaN(Number(amount))) return "";
        return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    const formatDateForAPI = (dateString: string): string => {
        const date = new Date(dateString);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
    };
    const formatDateForDisplay = (dateString: string): string => {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    };

    useEffect(() => {
        const a = JSON.parse(localStorage.getItem("authUser") || "{}");
        const name = a?.FirmName ?? a?.CompanyName ?? a?.Company ?? "";
        setCompanyName(name);
        fetch(`${API_WEB_URLS.BASE}${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.FirmMaster}/Id/0`)
            .then((r) => r.json())
            .then((json) => {
                const list = json?.data?.dataList ?? json?.data?.data?.dataList ?? (Array.isArray(json?.data) ? json.data : []);
                const firms = Array.isArray(list) ? list : [];
                if (firms.length > 0) {
                    const a = JSON.parse(localStorage.getItem("authUser") || "{}");
                    const fCompanyId = a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company;
                    const firm = (fCompanyId != null && fCompanyId !== "")
                        ? firms.find((f: any) => String(f.Id) === String(fCompanyId) || String(f.F_CompanyMaster) === String(fCompanyId)) || firms[0]
                        : firms.find((f: any) => (f.FirmName || f.Name || "") === name) || firms[0];
                    const apiName = firm?.FirmName || firm?.Name || "";
                    if (apiName) setCompanyName(apiName);
                    const addr = [firm?.Address1, firm?.Address2, firm?.CityName || firm?.City, firm?.StateName || firm?.State, firm?.PinCode].filter(Boolean).join(", ");
                    setPrintFirmAddress(addr || "");
                }
            })
            .catch(() => {});
    }, []);

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
            formData.append("IsDetailed", "3");

            const response = await Fn_GetReport(
                dispatch,
                (prev: any) => ({ ...(prev || {}), isProgress: false }),
                "balanceSheetStdReport",
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
            setReportData(extractList(response));
        } catch (err) {
            console.error("Balance Sheet (Standard) fetch error:", err);
            setReportData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (toDate) fetchReport(); }, [toDate]);

    /* ── Screen render row ── */
    const renderRow = (row: BSStandardRow, idx: number) => {
        if (isBlankRow(row)) return null;
        const particular = (row.Particular ?? "").trim();
        if (isSectionHeader(row)) {
            return (
                <tr key={row.RowNo ?? idx} className="table-light">
                    <td className="fw-bold ps-3" colSpan={3}>{particular}</td>
                </tr>
            );
        }
        if (isTotalRow(row)) {
            return (
                <tr key={row.RowNo ?? idx} className="table-secondary fw-bold">
                    <td className="ps-3">{particular}</td>
                    <td className="text-end">{row.Amount != null ? formatCurrency(row.Amount) : ""}</td>
                    <td className="text-end">{row.NetAmount != null ? formatCurrency(row.NetAmount) : ""}</td>
                </tr>
            );
        }
        return (
            <tr key={row.RowNo ?? idx} onDoubleClick={() => drillDown(particular)} style={{ cursor: "pointer" }} title="Double-click for Group Ledger detail">
                <td className="ps-4">{particular}</td>
                <td className="text-end">{row.Amount != null ? formatCurrency(row.Amount) : ""}</td>
                <td className="text-end">{row.NetAmount != null ? formatCurrency(row.NetAmount) : ""}</td>
            </tr>
        );
    };

    /* ── Print render row ── */
    const printRow = (row: BSStandardRow, idx: number) => {
        if (isBlankRow(row)) return null;
        const particular = (row.Particular ?? "").trim();
        if (isSectionHeader(row)) {
            return (
                <tr key={idx} className="section-hdr">
                    <td colSpan={3}>{particular}</td>
                </tr>
            );
        }
        if (isTotalRow(row)) {
            return (
                <tr key={idx} className="total-row">
                    <td style={{ paddingLeft: "8px" }}>{particular}</td>
                    <td style={{ textAlign: "right" }}>{row.Amount != null ? formatCurrency(row.Amount) : ""}</td>
                    <td style={{ textAlign: "right" }}>{row.NetAmount != null ? formatCurrency(row.NetAmount) : ""}</td>
                </tr>
            );
        }
        return (
            <tr key={idx}>
                <td style={{ paddingLeft: "16px" }}>{particular}</td>
                <td style={{ textAlign: "right" }}>{row.Amount != null ? formatCurrency(row.Amount) : ""}</td>
                <td style={{ textAlign: "right" }}>{row.NetAmount != null ? formatCurrency(row.NetAmount) : ""}</td>
            </tr>
        );
    };

    const handleExportExcel = () => {
        if (!reportData || reportData.length === 0) return;
        const exportData = reportData.map((row) => ({
            Particular: row.Particular || "",
            Amount: row.Amount ?? "",
            "Net Amount": row.NetAmount ?? "",
        }));
        exportDataToExcel(exportData, `Balance_Sheet_${toDate}`);
    };

    return (
        <div className="page-body bs-std-wrap report-page">
            <style>{PAGE_CSS}</style>
            <Breadcrumbs mainTitle="Balance Sheet (Standard)" parent="Reports" />
            <Container fluid>
                <Row>
                    <Col xs="12">
                        <Card>
                            <CardHeaderCommon title="Balance Sheet (Standard)" tagClass="card-title mb-0" />
                            <CardBody>
                                <Row className="gy-3 mb-3">
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>As On</Label>
                                            <DateInput value={toDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)} />
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <h5 className="text-center fw-bold mb-1">Balance Sheet</h5>
                                <p className="text-center text-muted mb-3">As On {formatDateForDisplay(toDate)}</p>

                                {isLoading ? (
                                    <div className="text-center p-4">
                                        <div className="spinner-border" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2">Loading Balance Sheet...</p>
                                    </div>
                                ) : (
                                    <Row>
                                        <Col md="12">
                                            <div className="table-responsive">
                                                <Table bordered hover className="mb-0">
                                                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                                                        <tr>
                                                            <th>Particular</th>
                                                            <th className="text-end" style={{ width: "160px" }}>Amount</th>
                                                            <th className="text-end" style={{ width: "160px" }}>Net Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {reportData.filter((r) => !isBlankRow(r)).length > 0 ? (
                                                            reportData.map((row, idx) => renderRow(row, idx))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={3} className="text-center text-muted py-4">No data available.</td>
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
                                <Btn color="primary" type="button" className="me-2" onClick={handleExportExcel} disabled={reportData.length === 0}>
                                    <i className="fa fa-file-excel-o me-1" /> Export Excel
                                </Btn>
                                <Btn color="success" type="button" className="me-2" onClick={() => window.print()}>Print</Btn>
                                <Btn color="secondary" type="button" onClick={() => window.history.back()}>Close</Btn>
                            </CardFooter>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* ── Hidden Print Layout ── */}
            <div className="bs-std-print">
                <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "10px", marginBottom: "12px" }}>
                    {companyName && <h2 style={{ margin: "0 0 4px", fontWeight: "bold" }}>{companyName}</h2>}
                    {printFirmAddress && <p style={{ margin: "0 0 4px", fontSize: "14px" }}>{printFirmAddress}</p>}
                    <h3 style={{ margin: "0 0 4px" }}>Balance Sheet</h3>
                    <p style={{ margin: 0, fontSize: "13px" }}>As On: {formatDateForDisplay(toDate)}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left" }}>Particular</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                            <th style={{ textAlign: "right" }}>Net Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((row, idx) => printRow(row, idx))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BalanceSheetStandard;
