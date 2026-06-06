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
import { useNavigate } from "react-router-dom";
import { Fn_GetReport } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

/** API response row: data.response[] */
interface BalanceSheetRow {
  RowNo?: number;
  LiabilityParticular?: string | null;
  LAmount?: number | null;
  AssetParticular?: string | null;
  AAmount?: number | null;
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
    .bs-trad-print thead th { background: #f9d0b0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .bs-trad-print tbody tr:nth-child(even) { background: #fdf5e6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

const BalanceSheetTraditional: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const drillDown = (particular: string | null | undefined) => {
    if (!particular || particular.trim() === "" || /^total\s*(liabilities|assets)?$/i.test(particular.trim())) return;
    navigate(`${process.env.PUBLIC_URL}/groupLedgerSummary`, {
      state: { ledgerGroupName: particular.trim(), fromDate: toDate, toDate },
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
      formData.append("IsDetailed", "2");

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
  }, [toDate]);

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

  const reportRows = reportData.map((row) => {
    const liabAmt = row.LAmount ?? row.LiabilitiesAmount ?? row.Liabilities_Amount ?? row.Amount;
    const assetAmt = row.AAmount ?? row.AssetsAmount ?? row.Assets_Amount ?? row.Amount;
    const liabPart = row.LiabilityParticular ?? row.LiabilitiesParticular ?? row.Liabilities ?? row.Liabilities_Particular ?? "";
    const assetPart = row.AssetParticular ?? row.AssetsParticular ?? row.Assets ?? row.Assets_Particular ?? "";
    return {
      liabilitiesParticular: liabPart ?? "",
      liabilitiesAmount: typeof liabAmt === "number" || (liabAmt != null && !isNaN(Number(liabAmt))) ? formatCurrency(Number(liabAmt)) : (liabAmt ?? ""),
      assetsParticular: assetPart ?? "",
      assetsAmount: typeof assetAmt === "number" || (assetAmt != null && !isNaN(Number(assetAmt))) ? formatCurrency(Number(assetAmt)) : (assetAmt ?? ""),
    };
  });

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

                  <div className="table-responsive">
                    <Table bordered hover className="mb-0">
                      <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th>Liabilities</th>
                          <th className="text-end" style={{ width: "140px" }}>Amount</th>
                          <th>Assets</th>
                          <th className="text-end" style={{ width: "140px" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan={4} className="text-center p-4">
                              <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <p className="mt-2 mb-0">Loading Balance Sheet...</p>
                            </td>
                          </tr>
                        ) : (
                          <>
                            {reportRows.map((row, idx) => {
                              const canDrillLiab = (row.liabilitiesParticular || "").trim() && !/^total\s*(liabilities|assets)?$/i.test((row.liabilitiesParticular || "").trim());
                              const canDrillAsset = (row.assetsParticular || "").trim() && !/^total\s*(liabilities|assets)?$/i.test((row.assetsParticular || "").trim());
                              return (
                                <tr
                                  key={idx}
                                  onDoubleClick={(e) => {
                                    const cell = (e.target as HTMLElement).closest("td");
                                    if (!cell) return;
                                    const colIdx = cell.cellIndex;
                                    if (colIdx === 0 && canDrillLiab) drillDown(row.liabilitiesParticular);
                                    else if (colIdx === 2 && canDrillAsset) drillDown(row.assetsParticular);
                                  }}
                                  style={{ cursor: canDrillLiab || canDrillAsset ? "pointer" : "default" }}
                                  title={canDrillLiab || canDrillAsset ? "Double-click for Group Ledger Summary" : undefined}
                                >
                                  <td>{row.liabilitiesParticular || ""}</td>
                                  <td className="text-end">{row.liabilitiesAmount || ""}</td>
                                  <td>{row.assetsParticular || ""}</td>
                                  <td className="text-end">{row.assetsAmount || ""}</td>
                                </tr>
                              );
                            })}
                            {reportRows.length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center text-muted py-4">
                                  No data
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

      <div className="bs-trad-print">
        <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "10px", marginBottom: "12px" }}>
          {printCompanyName && <h2 style={{ margin: "0 0 4px", fontWeight: "bold" }}>{printCompanyName}</h2>}
          {printFirmAddress && <p style={{ margin: "0 0 4px", fontSize: "14px" }}>{printFirmAddress}</p>}
          <h3 style={{ margin: "0 0 4px" }}>Balance Sheet</h3>
          <p style={{ margin: 0, fontSize: "13px" }}>As On: {formatDateForDisplay(toDate)}</p>
        </div>
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
            {reportRows.map((row, idx) => (
              <tr key={idx}>
                <td>{row.liabilitiesParticular || ""}</td>
                <td style={{ textAlign: "right" }}>{row.liabilitiesAmount || ""}</td>
                <td>{row.assetsParticular || ""}</td>
                <td style={{ textAlign: "right" }}>{row.assetsAmount || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BalanceSheetTraditional;
