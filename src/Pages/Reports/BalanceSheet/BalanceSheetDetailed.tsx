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

interface BSDetailedRow {
    RowNo?: number;
    LiabilityParticular?: string | null;
    LAmount?: number | null;
    LNetAmount?: number | null;
    AssetParticular?: string | null;
    AAmount?: number | null;
    ANetAmount?: number | null;
    [key: string]: any;
}

const PAGE_CSS = `
  /* ── Responsive ── */
  .bs-det-wrap .table-responsive { max-height: 520px; overflow-y: auto; overflow-x: auto; }
  @media (max-width: 1199.98px) {
    .bs-det-wrap table th,
    .bs-det-wrap table td { padding: 0.3rem 0.4rem; font-size: 0.82rem; }
  }
  @media (max-width: 991.98px) {
    .bs-det-wrap .card-body { padding: 0.75rem; }
    .bs-det-wrap table th,
    .bs-det-wrap table td { padding: 0.28rem 0.35rem; font-size: 0.78rem; }
    .bs-det-wrap .table-responsive { max-height: 420px; }
  }
  @media (max-width: 767.98px) {
    .bs-det-wrap .card-body { padding: 0.5rem; }
    .bs-det-wrap table th,
    .bs-det-wrap table td { padding: 0.22rem 0.28rem; font-size: 0.72rem; }
    .bs-det-wrap .table-responsive { max-height: 380px; }
  }
  @media (max-width: 575.98px) {
    .bs-det-wrap table th,
    .bs-det-wrap table td { padding: 0.18rem 0.22rem; font-size: 0.68rem; }
    .bs-det-wrap .table-responsive { max-height: 320px; }
  }
  /* ── Print ── */
  .bs-det-print { display: none; }
  @media print {
    body * { visibility: hidden; }
    .bs-det-print, .bs-det-print * { visibility: visible; }
    .bs-det-print {
      display: block !important;
      position: absolute; left: 0; top: 0;
      width: 100%; padding: 20px;
      background: white; color: black;
      font-family: Arial, sans-serif; font-size: 11px;
    }
    .bs-det-print table { width: 100%; border-collapse: collapse; }
    .bs-det-print th, .bs-det-print td { border: 1px solid #333; padding: 3px 6px; }
    .bs-det-print thead tr:first-child th { background: #ccc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .bs-det-print th { background: #f0f0f0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .bs-det-print .group-row { font-weight: bold; }
    .bs-det-print .total-row { background: #ddd; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

const BalanceSheetDetailed: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [toDate, setToDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });

    /** Group row: has LNetAmount or ANetAmount → open Group Ledger Summary */
    const drillToGroup = (particular: string | null | undefined) => {
        if (!particular || particular.trim() === "" || /^total\s*(liabilities|assets)?$/i.test(particular.trim())) return;
        navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
            state: { ledgerGroupName: particular.trim(), fromDate: toDate, toDate },
        });
    };

    /** Ledger row: individual ledger → open Ledger Details Report */
    const drillToLedger = (ledgerName: string | null | undefined) => {
        if (!ledgerName || ledgerName.trim() === "" || /^total\s*(liabilities|assets)?$/i.test(ledgerName.trim())) return;
        navigate(`${process.env.PUBLIC_URL}/ledgerDetailsReport`, {
            state: { ledgerName: ledgerName.trim(), fromDate: toDate, toDate },
        });
    };
    const [reportData, setReportData] = useState<BSDetailedRow[]>([]);
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
            formData.append("IsDetailed", "1");

            const response = await Fn_GetReport(
                dispatch,
                (prev: any) => ({ ...(prev || {}), isProgress: false }),
                "balanceSheetDetailedReport",
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
            console.error("Balance Sheet (Detailed) fetch error:", err);
            setReportData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (toDate) fetchReport(); }, [toDate]);

    const isLiabGroupRow = (r: BSDetailedRow) => r.LNetAmount != null;
    const isAssetGroupRow = (r: BSDetailedRow) => r.ANetAmount != null;
    const isTotalRow = (r: BSDetailedRow) =>
        r.LNetAmount != null && r.ANetAmount != null &&
        (r.LiabilityParticular || "").toLowerCase().includes("total");

    /** Liability side: group = has LNetAmount; else ledger = has LAmount (and particular) */
    const isLiabilityLedgerRow = (r: BSDetailedRow) =>
        (r.LiabilityParticular ?? "").trim() !== "" &&
        r.LAmount != null &&
        r.LNetAmount == null &&
        !/^total\s*(liabilities|assets)?$/i.test((r.LiabilityParticular ?? "").trim());
    /** Asset side: group = has ANetAmount; else ledger = has AAmount (and particular) */
    const isAssetLedgerRow = (r: BSDetailedRow) =>
        (r.AssetParticular ?? "").trim() !== "" &&
        r.AAmount != null &&
        r.ANetAmount == null &&
        !/^total\s*(liabilities|assets)?$/i.test((r.AssetParticular ?? "").trim());

    const renderRow = (row: BSDetailedRow, idx: number) => {
        const liabGroupRow = isLiabGroupRow(row);
        const assetGroupRow = isAssetGroupRow(row);
        const totalRow = isTotalRow(row);
        const liabLedgerRow = isLiabilityLedgerRow(row);
        const assetLedgerRow = isAssetLedgerRow(row);
        const rowClass = totalRow ? "table-secondary fw-bold"
            : (liabGroupRow || assetGroupRow) ? "fw-bold" : "";

        const handleRowDoubleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
            if (totalRow) return;
            const cell = (e.target as HTMLElement).closest("td");
            if (!cell) return;
            const colIndex = cell.cellIndex;
            const isLiabilitySide = colIndex <= 2;
            const isAssetSide = colIndex >= 3;
            if (isLiabilitySide && (liabGroupRow || liabLedgerRow)) {
                if (liabGroupRow) drillToGroup(row.LiabilityParticular);
                else drillToLedger(row.LiabilityParticular);
            } else if (isAssetSide && (assetGroupRow || assetLedgerRow)) {
                if (assetGroupRow) drillToGroup(row.AssetParticular);
                else drillToLedger(row.AssetParticular);
            }
        };

        const canDrillLiab = liabGroupRow || liabLedgerRow;
        const canDrillAsset = assetGroupRow || assetLedgerRow;
        const drillTitle =
            totalRow ? "" : canDrillLiab || canDrillAsset
                ? "Double-click: Group row → Group Ledger Summary; Ledger row → Ledger Details"
                : undefined;

        return (
            <tr
                key={row.RowNo ?? idx}
                className={rowClass}
                onDoubleClick={handleRowDoubleClick}
                style={{ cursor: !totalRow && (canDrillLiab || canDrillAsset) ? "pointer" : "default" }}
                title={drillTitle}
            >
                <td className={liabGroupRow && !totalRow ? "ps-2" : "ps-3"}>{row.LiabilityParticular ?? ""}</td>
                <td className="text-end">{row.LAmount != null ? formatCurrency(row.LAmount) : ""}</td>
                <td className="text-end border-end">{row.LNetAmount != null ? formatCurrency(row.LNetAmount) : ""}</td>
                <td className={assetGroupRow && !totalRow ? "ps-2" : "ps-3"}>{row.AssetParticular ?? ""}</td>
                <td className="text-end">{row.AAmount != null ? formatCurrency(row.AAmount) : ""}</td>
                <td className="text-end">{row.ANetAmount != null ? formatCurrency(row.ANetAmount) : ""}</td>
            </tr>
        );
    };

    return (
        <div className="page-body bs-det-wrap report-page">
            <style>{PAGE_CSS}</style>
            <Breadcrumbs mainTitle="Balance Sheet (Detailed)" parent="Reports" />
            <Container fluid>
                <Row>
                    <Col xs="12">
                        <Card>
                            <CardHeaderCommon title="Balance Sheet (Detailed)" tagClass="card-title mb-0" />
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
                                                            <th colSpan={3} className="text-start text-primary">Liabilities</th>
                                                            <th colSpan={3} className="text-start text-success">Assets</th>
                                                        </tr>
                                                        <tr>
                                                            <th style={{ minWidth: "200px" }}>Particulars</th>
                                                            <th className="text-end" style={{ width: "130px" }}>Amount</th>
                                                            <th className="text-end border-end" style={{ width: "140px" }}>Net Amount</th>
                                                            <th style={{ minWidth: "200px" }}>Particulars</th>
                                                            <th className="text-end" style={{ width: "130px" }}>Amount</th>
                                                            <th className="text-end" style={{ width: "140px" }}>Net Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {reportData.length > 0 ? (
                                                            reportData.map((row, idx) => renderRow(row, idx))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={6} className="text-center text-muted py-4">No data available.</td>
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
                                <Btn color="success" type="button" className="me-2" onClick={() => window.print()}>Print</Btn>
                                <Btn color="secondary" type="button" onClick={() => window.history.back()}>Close</Btn>
                            </CardFooter>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* ── Hidden Print Layout ── */}
            <div className="bs-det-print">
                <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "10px", marginBottom: "12px" }}>
                    {companyName && <h2 style={{ margin: "0 0 4px", fontWeight: "bold" }}>{companyName}</h2>}
                    {printFirmAddress && <p style={{ margin: "0 0 4px", fontSize: "14px" }}>{printFirmAddress}</p>}
                    <h3 style={{ margin: "0 0 4px" }}>Balance Sheet (Detailed)</h3>
                    <p style={{ margin: 0, fontSize: "13px" }}>As On: {formatDateForDisplay(toDate)}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th colSpan={3} style={{ textAlign: "center" }}>Liabilities</th>
                            <th colSpan={3} style={{ textAlign: "center" }}>Assets</th>
                        </tr>
                        <tr>
                            <th style={{ textAlign: "left" }}>Particulars</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                            <th style={{ textAlign: "right" }}>Net Amount</th>
                            <th style={{ textAlign: "left" }}>Particulars</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                            <th style={{ textAlign: "right" }}>Net Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((row, idx) => {
                            const liabGroup = isLiabGroupRow(row);
                            const assetGroup = isAssetGroupRow(row);
                            const total = isTotalRow(row);
                            return (
                                <tr key={idx} className={total ? "total-row" : (liabGroup || assetGroup) ? "group-row" : ""}>
                                    <td style={{ paddingLeft: liabGroup && !total ? "6px" : "12px" }}>
                                        {row.LiabilityParticular ?? ""}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        {row.LAmount != null ? formatCurrency(row.LAmount) : ""}
                                    </td>
                                    <td style={{ textAlign: "right", borderRight: "2px solid #333" }}>
                                        {row.LNetAmount != null ? formatCurrency(row.LNetAmount) : ""}
                                    </td>
                                    <td style={{ paddingLeft: assetGroup && !total ? "6px" : "12px" }}>
                                        {row.AssetParticular ?? ""}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        {row.AAmount != null ? formatCurrency(row.AAmount) : ""}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        {row.ANetAmount != null ? formatCurrency(row.ANetAmount) : ""}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BalanceSheetDetailed;
