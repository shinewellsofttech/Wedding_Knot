import React, { useState, useEffect } from "react";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { useDispatch } from "react-redux";
import { Fn_FillListData, Fn_GetReport } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

interface CategoryMaster {
  Id: number;
  Name: string;
}

interface StockPositionRow {
  Barcode?: string;
  Category?: string;
  CategoryName?: string;
  Item?: string;
  ItemName?: string;
  Variant?: string;
  DesignPhoto?: string;
  DesignPhoto_Thumb?: string;
  OpeningBalance?: number;
  OpBal?: number;
  InAmount?: number;
  Inward?: number;
  In?: number;
  OutAmount?: number;
  Outward?: number;
  Out?: number;
  ClosingBalance?: number;
  ClBal?: number;
  [key: string]: any;
}

const PAGE_CSS = `
  .stock-report-wrap .table-responsive { max-height: 520px; overflow-y: auto; }
  .stock-img-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
  .stock-variant-cell { display: flex; align-items: center; gap: 10px; }
  @media (max-width: 991.98px) {
    .stock-report-wrap .card-body { padding: 0.75rem; }
    .stock-report-wrap table th,
    .stock-report-wrap table td { padding: 0.35rem 0.5rem; font-size: 0.85rem; }
    .stock-report-wrap .table-responsive { max-height: 420px; }
  }
  @media (max-width: 767.98px) {
    .stock-report-wrap .card-body { padding: 0.5rem; }
    .stock-report-wrap table th,
    .stock-report-wrap table td { padding: 0.28rem 0.4rem; font-size: 0.78rem; }
    .stock-report-wrap .table-responsive { max-height: 360px; }
  }
  @media (max-width: 575.98px) {
    .stock-report-wrap table th,
    .stock-report-wrap table td { padding: 0.22rem 0.3rem; font-size: 0.72rem; }
    .stock-report-wrap .table-responsive { max-height: 320px; }
  }
  .stock-print { display: none; }
  @media print {
    body * { visibility: hidden; }
    .stock-print, .stock-print * { visibility: visible; }
    .stock-print {
      display: block !important;
      position: absolute; left: 0; top: 0;
      width: 100%; padding: 20px;
      background: white; color: black;
      font-family: Arial, sans-serif; font-size: 12px;
    }
    .stock-print table { width: 100%; border-collapse: collapse; }
    .stock-print th, .stock-print td { border: 1px solid #333; padding: 4px 8px; }
    .stock-print thead th { background: #f0f0f0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-wrapper, .page-body-wrapper { margin: 0 !important; padding: 0 !important; }
  }
`;

const StockPositionReport: React.FC = () => {
  const dispatch = useDispatch();

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
  const [categoryId, setCategoryId] = useState<string>("0");
  const [categoryList, setCategoryList] = useState<CategoryMaster[]>([]);
  const [reportData, setReportData] = useState<StockPositionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [printCompanyName, setPrintCompanyName] = useState("");
  const [printFirmAddress, setPrintFirmAddress] = useState("");

  const cleanUrl = (url: string) => {
    let cleaned = url || "";
    if (cleaned.includes("https://") && cleaned.lastIndexOf("https://") > 0) {
      const firstPart = cleaned.substring(0, cleaned.lastIndexOf("https://"));
      const secondPart = cleaned.substring(cleaned.lastIndexOf("https://"));
      if (firstPart.includes("Thumbnail")) {
        const filename = secondPart.substring(secondPart.lastIndexOf("/") + 1);
        return firstPart + filename;
      }
      return secondPart;
    } else if (cleaned.includes("http://") && cleaned.lastIndexOf("http://") > 0) {
      const firstPart = cleaned.substring(0, cleaned.lastIndexOf("http://"));
      const secondPart = cleaned.substring(cleaned.lastIndexOf("http://"));
      if (firstPart.includes("Thumbnail")) {
        const filename = secondPart.substring(secondPart.lastIndexOf("/") + 1);
        return firstPart + filename;
      }
      return secondPart;
    }
    return cleaned;
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return "0";
    return Number(amount).toFixed(2);
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

  // Load Dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await Fn_FillListData(
          dispatch,
          () => {},
          "categoryList",
          `${API_WEB_URLS.MASTER}/0/token/CategoryMaster/Id/0`
        );
        setCategoryList(data || []);
      } catch (e) {}
    };
    loadCategories();
  }, [dispatch]);

  // Load Firm details for print
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

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser?.uid ?? authUser?.Id ?? "0";
      const userToken = authUser?.Token ?? authUser?.token ?? "token";
      const fCompany = authUser?.F_CompanyMaster ?? authUser?.CompanyId ?? authUser?.F_Company ?? "0";

      const formData = new FormData();
      formData.append("FromDate", formatDateForAPI(fromDate));
      formData.append("ToDate", formatDateForAPI(toDate));
      formData.append("UserId", String(userId));
      formData.append("F_CompanyMaster", String(fCompany));
      if (categoryId !== "0") {
        formData.append("F_CategoryMaster", categoryId);
      }



      const response = await Fn_GetReport(
        dispatch,
        () => {},
        "stockPositionReport",
        `GetStockPositionReport/${userId}/${userToken}`,
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
    } catch (error) {
      console.error("Error fetching Stock Position Report:", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (fromDate && toDate) fetchReport();
  }, [fromDate, toDate, categoryId]);

  const handlePrint = () => window.print();
  const handleClose = () => window.history.back();

  return (
    <div className="page-body stock-report-wrap report-page">
      <style>{PAGE_CSS}</style>
      <Breadcrumbs mainTitle="Stock Position Report" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Stock Position Report" tagClass="card-title mb-0" />
              <CardBody>
                <Row className="gy-3 mb-3 align-items-end">
                  <Col md="3">
                    <FormGroup>
                      <Label>Category</Label>
                      <Input type="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="0">All Categories</option>
                        {categoryList.map((cat) => (
                          <option key={cat.Id} value={cat.Id}>
                            {cat.Name}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
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

                <h5 className="text-center fw-bold mb-1">Stock Position Report</h5>
                <p className="text-center text-muted mb-3">From {formatDateForDisplay(fromDate)} To {formatDateForDisplay(toDate)}</p>

                <div className="table-responsive">
                  <Table bordered hover className="mb-0">
                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        <th>Barcode</th>
                        <th>Category</th>
                        <th>Item</th>
                        <th>Variant</th>
                        <th className="text-end">Op. Bal</th>
                        <th className="text-end">In</th>
                        <th className="text-end">Out</th>
                        <th className="text-end">Cl. Bal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={8} className="text-center p-4">
                            <div className="spinner-border" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 mb-0">Loading Stock Position...</p>
                          </td>
                        </tr>
                      ) : (
                        <>
                          {reportData.map((row, idx) => {
                            const barcode = row.Barcode || "";
                            const category = row.CategoryName || row.Category || "";
                            const item = row.ItemName || row.Item || "";
                            const variant = row.Variant || "";
                            const photoFull = cleanUrl(row.DesignPhoto || "");
                            const photoThumb = cleanUrl(row.DesignPhoto_Thumb || photoFull);
                            
                            const opBal = Number(row.OpeningBalance ?? row.OpBal ?? 0);
                            const inAmt = Number(row.InAmount ?? row.Inward ?? row.In ?? 0);
                            const outAmt = Number(row.OutAmount ?? row.Outward ?? row.Out ?? 0);
                            const clBal = Number(row.ClosingBalance ?? row.ClBal ?? 0);

                            return (
                              <tr key={idx}>
                                <td>{barcode}</td>
                                <td>{category}</td>
                                <td>{item}</td>
                                <td>
                                  <div className="stock-variant-cell">
                                    {photoThumb ? (
                                      <a href={photoFull} target="_blank" rel="noopener noreferrer" title="View Full Image">
                                        <img src={photoThumb} alt="Variant" className="stock-img-thumb" />
                                      </a>
                                    ) : null}
                                    <span>{variant}</span>
                                  </div>
                                </td>
                                <td className="text-end">{formatCurrency(opBal)}</td>
                                <td className="text-end">{formatCurrency(inAmt)}</td>
                                <td className="text-end">{formatCurrency(outAmt)}</td>
                                <td className="text-end fw-bold">{formatCurrency(clBal)}</td>
                              </tr>
                            );
                          })}
                          {reportData.length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-center text-muted py-4">
                                No data available.
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

      {/* Print View */}
      <div className="stock-print">
        <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "10px", marginBottom: "12px" }}>
          {printCompanyName && <h2 style={{ margin: "0 0 4px", fontWeight: "bold" }}>{printCompanyName}</h2>}
          {printFirmAddress && <p style={{ margin: "0 0 4px", fontSize: "14px" }}>{printFirmAddress}</p>}
          <h3 style={{ margin: "0 0 4px" }}>Stock Position Report</h3>
          <p style={{ margin: 0, fontSize: "13px" }}>From {formatDateForDisplay(fromDate)} To {formatDateForDisplay(toDate)}</p>
          {categoryId !== "0" && (
            <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
              Category: {categoryList.find(c => String(c.Id) === categoryId)?.Name || ""}
            </p>
          )}
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Barcode</th>
              <th style={{ textAlign: "left" }}>Category</th>
              <th style={{ textAlign: "left" }}>Item</th>
              <th style={{ textAlign: "left" }}>Variant</th>
              <th style={{ textAlign: "right" }}>Op. Bal</th>
              <th style={{ textAlign: "right" }}>In</th>
              <th style={{ textAlign: "right" }}>Out</th>
              <th style={{ textAlign: "right" }}>Cl. Bal</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, idx) => {
              const barcode = row.Barcode || "";
              const category = row.CategoryName || row.Category || "";
              const item = row.ItemName || row.Item || "";
              const variant = row.Variant || "";
              
              const opBal = Number(row.OpeningBalance ?? row.OpBal ?? 0);
              const inAmt = Number(row.InAmount ?? row.Inward ?? row.In ?? 0);
              const outAmt = Number(row.OutAmount ?? row.Outward ?? row.Out ?? 0);
              const clBal = Number(row.ClosingBalance ?? row.ClBal ?? 0);

              return (
                <tr key={idx}>
                  <td>{barcode}</td>
                  <td>{category}</td>
                  <td>{item}</td>
                  <td>{variant}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(opBal)}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(inAmt)}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(outAmt)}</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>{formatCurrency(clBal)}</td>
                </tr>
              );
            })}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "10px" }}>
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockPositionReport;
