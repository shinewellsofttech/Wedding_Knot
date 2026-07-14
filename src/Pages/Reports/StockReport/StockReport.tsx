import React, { useState, useEffect } from "react";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { useDispatch } from "react-redux";
import { Fn_FillListData, Fn_GetReport } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

interface DropdownMaster {
  Id: number;
  Name: string;
}

interface StockReportRow {
  Id: number;
  Barcode: string;
  SizeName: string;
  F_ItemMaster: number;
  ItemName: string;
  HSNCode: string;
  F_GSTGroupMaster: number;
  GSTGroupName: string;
  GSTPercent: number;
  F_CategoryMaster: number;
  CategoryName: string;
  DesignPhoto: string;
  DesignPhoto_Thumb: string;
  SalePrice: number;
  PurchaseRate: number;
  OpeningStock: number;
  PurchaseQty: number;
  SaleQty: number;
  PurchaseReturnQty: number;
  SalesReturnQty: number;
  CurrentStock: number;
}

const PAGE_CSS = `
  .stock-report-wrap .table-responsive { max-height: 520px; overflow-y: auto; }
  .stock-img-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
  .stock-variant-cell { display: flex; align-items: center; gap: 10px; }
  .stock-report-wrap table th { white-space: nowrap; }
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
    .sidebar-wrapper, .page-header, .breadcrumbs, .card-header, .card-footer, .row.gy-3.mb-3.align-items-end, .btn, .no-print, .pb-3.text-end {
      display: none !important;
    }
    body, html {
      background: #fff !important;
      color: #000 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .page-wrapper, .page-body-wrapper, .page-body, .container-fluid, .card, .card-body {
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      background: transparent !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    .stock-print {
      display: block !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 10px !important;
      background: white !important;
      color: black !important;
      font-family: Arial, sans-serif;
    }
    .stock-print table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .stock-print th, .stock-print td { border: 1px solid #000; padding: 6px 8px; font-size: 10px; }
    .stock-print thead th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4 landscape; margin: 10mm; }
  }
`;

const StockReport: React.FC = () => {
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
  const [categoryList, setCategoryList] = useState<DropdownMaster[]>([]);
  const [itemId, setItemId] = useState<string>("0");
  const [itemList, setItemList] = useState<DropdownMaster[]>([]);
  const [gstGroupId, setGstGroupId] = useState<string>("0");
  const [gstGroupList, setGstGroupList] = useState<DropdownMaster[]>([]);
  
  const [reportData, setReportData] = useState<StockReportRow[]>([]);
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
  
  const formatQty = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return "0";
    return Number(amount).toString();
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

  // Load Dropdowns
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const catData = await Fn_FillListData(dispatch, () => {}, "categoryList", `${API_WEB_URLS.MASTER}/0/token/CategoryMaster/Id/0`);
        setCategoryList(catData || []);
        
        const itemData = await Fn_FillListData(dispatch, () => {}, "itemList", `${API_WEB_URLS.MASTER}/0/token/ItemMaster/Id/0`);
        setItemList(itemData || []);
        
        const gstData = await Fn_FillListData(dispatch, () => {}, "gstGroupList", `${API_WEB_URLS.MASTER}/0/token/GSTGroupMaster/Id/0`);
        setGstGroupList(gstData || []);
      } catch (e) {}
    };
    loadDropdowns();
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

      const formData = new FormData();
      formData.append("FromDate", formatDateForAPI(fromDate));
      formData.append("ToDate", formatDateForAPI(toDate));
      
      if (categoryId !== "0") {
        formData.append("F_CategoryMaster", categoryId);
        formData.append("F_CategoryMaste", categoryId); // Just in case of typo from swagger
      }
      if (itemId !== "0") {
        formData.append("F_ItemMaster", itemId);
      }
      if (gstGroupId !== "0") {
        formData.append("F_GSTGroupMaster", gstGroupId);
      }

      const response = await Fn_GetReport(
        dispatch,
        () => {},
        "stockDetailReport",
        `GetStockDetail/${userId}/${userToken}`,
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
      console.error("Error fetching Stock Report:", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate && toDate) fetchReport();
  }, [fromDate, toDate, categoryId, itemId, gstGroupId]);

  const handlePrint = () => window.print();
  const handleClose = () => window.history.back();

  return (
    <div className="page-body stock-report-wrap report-page">
      <style>{PAGE_CSS}</style>
      <Breadcrumbs mainTitle="Stock Report" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Stock Report" tagClass="card-title mb-0" />
              <CardBody>
                <Row className="gy-3 mb-3 align-items-end">
                  <Col md="2">
                    <FormGroup>
                      <Label>Category</Label>
                      <Input type="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="0">All Categories</option>
                        {categoryList.map((cat) => (
                          <option key={cat.Id} value={cat.Id}>{cat.Name}</option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md="2">
                    <FormGroup>
                      <Label>Item</Label>
                      <Input type="select" value={itemId} onChange={(e) => setItemId(e.target.value)}>
                        <option value="0">All Items</option>
                        {itemList.map((item: any) => (
                          <option key={item.Id} value={item.Id}>{item.ItemName || item.Name}</option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md="2">
                    <FormGroup>
                      <Label>GST Group</Label>
                      <Input type="select" value={gstGroupId} onChange={(e) => setGstGroupId(e.target.value)}>
                        <option value="0">All GST Groups</option>
                        {gstGroupList.map((g: any) => (
                          <option key={g.Id} value={g.Id}>{g.GSTGroupName || g.Name}</option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md="2">
                    <FormGroup>
                      <Label>From Date</Label>
                      <DateInput value={fromDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md="2">
                    <FormGroup>
                      <Label>To Date</Label>
                      <DateInput value={toDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md="2" className="pb-3 text-end">
                    <Btn color="primary" onClick={fetchReport} disabled={isLoading}>
                      {isLoading ? "Loading..." : "Search"}
                    </Btn>
                  </Col>
                </Row>

                <h5 className="text-center fw-bold mb-1">Stock Report</h5>
                <p className="text-center text-muted mb-3">From {formatDateForDisplay(fromDate)} To {formatDateForDisplay(toDate)}</p>

                <div className="table-responsive">
                  <Table bordered hover className="mb-0">
                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        <th>Barcode</th>
                        <th>Item Details</th>
                        <th>Category</th>
                        <th>HSN / GST</th>
                        <th className="text-end">Pur. Rate</th>
                        <th className="text-end">Sale Price</th>
                        <th className="text-end">Op. Stock</th>
                        <th className="text-end">Pur. Qty</th>
                        <th className="text-end">Pur. Rtn</th>
                        <th className="text-end">Sale Qty</th>
                        <th className="text-end">Sale Rtn</th>
                        <th className="text-end">Cur. Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={12} className="text-center p-4">
                            <div className="spinner-border" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 mb-0">Loading Stock Data...</p>
                          </td>
                        </tr>
                      ) : (
                        <>
                          {reportData.map((row, idx) => {
                            const photoFull = cleanUrl(row.DesignPhoto || "");
                            const photoThumb = cleanUrl(row.DesignPhoto_Thumb || photoFull);
                            
                            return (
                              <tr key={idx}>
                                <td>{row.Barcode}</td>
                                <td>
                                  <div className="stock-variant-cell">
                                    {photoThumb ? (
                                      <a href={photoFull} target="_blank" rel="noopener noreferrer" title="View Full Image">
                                        <img src={photoThumb} alt="Variant" className="stock-img-thumb" />
                                      </a>
                                    ) : null}
                                    <div>
                                      <div className="fw-bold">{row.ItemName}</div>
                                      {row.SizeName && <small className="text-muted">{row.SizeName}</small>}
                                    </div>
                                  </div>
                                </td>
                                <td>{row.CategoryName}</td>
                                <td>
                                  <div>{row.HSNCode}</div>
                                  <small className="text-muted">{row.GSTGroupName}</small>
                                </td>
                                <td className="text-end">{formatCurrency(row.PurchaseRate)}</td>
                                <td className="text-end">{formatCurrency(row.SalePrice)}</td>
                                <td className="text-end text-primary">{formatQty(row.OpeningStock)}</td>
                                <td className="text-end text-success">{formatQty(row.PurchaseQty)}</td>
                                <td className="text-end text-danger">{formatQty(row.PurchaseReturnQty)}</td>
                                <td className="text-end text-info">{formatQty(row.SaleQty)}</td>
                                <td className="text-end text-warning">{formatQty(row.SalesReturnQty)}</td>
                                <td className="text-end fw-bold">{formatQty(row.CurrentStock)}</td>
                              </tr>
                            );
                          })}
                          {reportData.length > 0 && (
                            <tr className="table-info fw-bold">
                              <td colSpan={6} className="text-end">Totals:</td>
                              <td className="text-end text-primary">{formatQty(reportData.reduce((s, r) => s + (Number(r.OpeningStock) || 0), 0))}</td>
                              <td className="text-end text-success">{formatQty(reportData.reduce((s, r) => s + (Number(r.PurchaseQty) || 0), 0))}</td>
                              <td className="text-end text-danger">{formatQty(reportData.reduce((s, r) => s + (Number(r.PurchaseReturnQty) || 0), 0))}</td>
                              <td className="text-end text-info">{formatQty(reportData.reduce((s, r) => s + (Number(r.SaleQty) || 0), 0))}</td>
                              <td className="text-end text-warning">{formatQty(reportData.reduce((s, r) => s + (Number(r.SalesReturnQty) || 0), 0))}</td>
                              <td className="text-end fw-bold">{formatQty(reportData.reduce((s, r) => s + (Number(r.CurrentStock) || 0), 0))}</td>
                            </tr>
                          )}
                          {reportData.length === 0 && (
                            <tr>
                              <td colSpan={12} className="text-center text-muted py-4">
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
          <h3 style={{ margin: "0 0 4px" }}>Stock Report</h3>
          <p style={{ margin: 0, fontSize: "13px" }}>From {formatDateForDisplay(fromDate)} To {formatDateForDisplay(toDate)}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Barcode</th>
              <th style={{ textAlign: "left" }}>Item Details</th>
              <th style={{ textAlign: "left" }}>Category</th>
              <th style={{ textAlign: "left" }}>HSN/GST</th>
              <th style={{ textAlign: "right" }}>Pur. Rate</th>
              <th style={{ textAlign: "right" }}>Sale Price</th>
              <th style={{ textAlign: "right" }}>Op. Stock</th>
              <th style={{ textAlign: "right" }}>Pur. Qty</th>
              <th style={{ textAlign: "right" }}>Pur. Rtn</th>
              <th style={{ textAlign: "right" }}>Sale Qty</th>
              <th style={{ textAlign: "right" }}>Sale Rtn</th>
              <th style={{ textAlign: "right" }}>Cur. Stock</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, idx) => (
              <tr key={idx}>
                <td>{row.Barcode}</td>
                <td>{row.ItemName} {row.SizeName ? `(${row.SizeName})` : ''}</td>
                <td>{row.CategoryName}</td>
                <td>{row.HSNCode} / {row.GSTGroupName}</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(row.PurchaseRate)}</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(row.SalePrice)}</td>
                <td style={{ textAlign: "right" }}>{formatQty(row.OpeningStock)}</td>
                <td style={{ textAlign: "right" }}>{formatQty(row.PurchaseQty)}</td>
                <td style={{ textAlign: "right" }}>{formatQty(row.PurchaseReturnQty)}</td>
                <td style={{ textAlign: "right" }}>{formatQty(row.SaleQty)}</td>
                <td style={{ textAlign: "right" }}>{formatQty(row.SalesReturnQty)}</td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>{formatQty(row.CurrentStock)}</td>
              </tr>
            ))}
            {reportData.length > 0 && (
              <tr style={{ fontWeight: "bold", background: "#f0f0f0" }}>
                <td colSpan={6} style={{ textAlign: "right" }}>Totals:</td>
                <td style={{ textAlign: "right" }}>{formatQty(reportData.reduce((s, r) => s + (Number(r.OpeningStock) || 0), 0))}</td>
                <td style={{ textAlign: "right" }}>{formatQty(reportData.reduce((s, r) => s + (Number(r.PurchaseQty) || 0), 0))}</td>
                <td style={{ textAlign: "right" }}>{formatQty(reportData.reduce((s, r) => s + (Number(r.PurchaseReturnQty) || 0), 0))}</td>
                <td style={{ textAlign: "right" }}>{formatQty(reportData.reduce((s, r) => s + (Number(r.SaleQty) || 0), 0))}</td>
                <td style={{ textAlign: "right" }}>{formatQty(reportData.reduce((s, r) => s + (Number(r.SalesReturnQty) || 0), 0))}</td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>{formatQty(reportData.reduce((s, r) => s + (Number(r.CurrentStock) || 0), 0))}</td>
              </tr>
            )}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={12} style={{ textAlign: "center", padding: "10px" }}>
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

export default StockReport;
