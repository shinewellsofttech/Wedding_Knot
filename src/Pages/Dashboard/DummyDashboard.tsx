import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Table, Badge, FormGroup, Label, Input } from "reactstrap";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../CommonElements/DateInput";
import Chart from "react-apexcharts";
import { DollarSign, ShoppingBag, Truck, Package, Activity, Loader } from "react-feather";
import { useDispatch } from "react-redux";
import { Fn_GetReport } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

interface KPIValues {
  totalSales: number;
  totalPurchase: number;
  totalRentIncome: number;
  pendingReceivables: number;
  availableStock: number;
}

interface ChartData {
  categories: string[];
  series: {
    name: string;
    data: number[];
  }[];
}

interface LowStockItem {
  Id: number;
  ItemName: string;
  SizeName?: string;
  DesignPhoto?: string;
  CurrentStock: number;
}

interface TopSellingItem {
  F_ItemMaster: number;
  ItemName: string;
  TotalQty: number;
  TotalAmount: number;
  DesignPhoto?: string;
}

const Dashboard = () => {
  const dispatch = useDispatch();

  const [fromDate, setFromDate] = useState<string>(() => {
    const today = new Date();
    const fyStart = today.getMonth() + 1 >= 4 ? today.getFullYear() : today.getFullYear() - 1;
    return `${fyStart}-04-01`;
  });
  
  const [toDate, setToDate] = useState<string>(() => {
    const today = new Date();
    const fyStart = today.getMonth() + 1 >= 4 ? today.getFullYear() : today.getFullYear() - 1;
    return `${fyStart + 1}-03-31`;
  });

  const [kpiValues, setKpiValues] = useState<KPIValues>({
    totalSales: 0,
    totalPurchase: 0,
    totalRentIncome: 0,
    pendingReceivables: 0,
    availableStock: 0,
  });

  const [salesPurchaseChartData, setSalesPurchaseChartData] = useState<ChartData>({
    categories: [],
    series: [
      { name: "Sales", data: [] },
      { name: "Purchase", data: [] },
    ],
  });

  const [revenueTrendChartData, setRevenueTrendChartData] = useState<ChartData>({
    categories: [],
    series: [
      { name: "Sales Revenue", data: [] },
      { name: "Rent Revenue", data: [] },
    ],
  });

  const [lowStockList, setLowStockList] = useState<LowStockItem[]>([]);
  const [topSellingList, setTopSellingList] = useState<TopSellingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = String(authUser?.uid ?? authUser?.Id ?? "0");
      const userToken = authUser?.Token ?? authUser?.token ?? "token";

      const apiURL = `GetDashboardData/${userId}/${userToken}`;

      const formData = new FormData();
      formData.append("FromDate", fromDate);
      formData.append("ToDate", toDate);

      const arguList = { formData };

      const responseData = await Fn_GetReport(
        dispatch,
        () => {},
        "dashboardData",
        apiURL,
        { arguList },
        true
      );

      if (responseData && Array.isArray(responseData)) {
        // SQL Server split JSON fragment handler
        const jsonKey = "JSON_F52E2B61-18A1-11d1-B105-00805F49916B";
        const fullJsonString = responseData.map((row: any) => row[jsonKey] || "").join("");
        
        if (fullJsonString) {
          const parsed = JSON.parse(fullJsonString);
          const dataObj = parsed.data;

          if (dataObj) {
            // Parse double-stringified KPI Data
            let kpisObj = {
              totalSales: 0,
              totalPurchase: 0,
              totalRentIncome: 0,
              pendingReceivables: 0,
              availableStock: 0,
            };
            if (dataObj.kpiData) {
              try {
                kpisObj = JSON.parse(dataObj.kpiData);
              } catch (e) {
                console.error("Error parsing KPI data string:", e);
              }
            }
            setKpiValues(kpisObj);

            // Parse Sales vs Purchase Overview
            const spOverview = dataObj.salesPurchaseOverview || {};
            const spCategories = (spOverview.categories || []).map((c: any) => (c.MonthName || "").substring(0, 3));
            const spSales = (spOverview.sales || []).map((s: any) => Number(s.Sales) || 0);
            const spPurchase = (spOverview.purchase || []).map((p: any) => Number(p.Purchase) || 0);
            
            setSalesPurchaseChartData({
              categories: spCategories,
              series: [
                { name: "Sales", data: spSales },
                { name: "Purchase", data: spPurchase },
              ],
            });

            // Parse Monthly Revenue Trend
            const revTrend = dataObj.revenueTrend || {};
            const revCategories = (revTrend.categories || []).map((c: any) => (c.MonthName || "").substring(0, 3));
            const revSales = (revTrend.salesRevenue || []).map((s: any) => Number(s.SalesRevenue) || 0);
            const revRent = (revTrend.rentRevenue || []).map((r: any) => Number(r.RentRevenue) || 0);

            setRevenueTrendChartData({
              categories: revCategories,
              series: [
                { name: "Sales Revenue", data: revSales },
                { name: "Rent Revenue", data: revRent },
              ],
            });

            // Parse Low Stock Items
            setLowStockList(dataObj.lowStockItems || []);

            // Parse Top Selling Items
            setTopSellingList(dataObj.topSellingItems || []);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getPhotoUrl = (photoPath?: string) => {
    if (!photoPath) return "";
    const cleaned = photoPath.trim();
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      return cleaned;
    }
    let host = "https://accountingwkr.shinewellsofttech.co.in";
    try {
      const urlObj = new URL(API_WEB_URLS.BASE);
      host = urlObj.origin;
    } catch (e) {}
    return `${host}/ItemImages/${cleaned}`;
  };

  // KPI configurations for UI mapping
  const kpiData = [
    { title: "Total Sales", value: `₹ ${formatCurrency(kpiValues.totalSales)}`, icon: <DollarSign />, color: "primary" },
    { title: "Total Rent Income", value: `₹ ${formatCurrency(kpiValues.totalRentIncome)}`, icon: <Activity />, color: "secondary" },
    { title: "Total Purchase", value: `₹ ${formatCurrency(kpiValues.totalPurchase)}`, icon: <ShoppingBag />, color: "danger" },
    { title: "Pending Receivables", value: `₹ ${formatCurrency(kpiValues.pendingReceivables)}`, icon: <Truck />, color: "warning" },
    { title: "Available Stock", value: `${kpiValues.availableStock.toLocaleString()} Items`, icon: <Package />, color: "success" },
  ];

  // Options for Sales vs Purchase Bar Chart
  const salesPurchaseOptions: any = {
    chart: { type: "bar", height: 350, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: "45%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: { categories: salesPurchaseChartData.categories },
    yaxis: { title: { text: "Amount (₹)" } },
    fill: { opacity: 1 },
    colors: ["#2563eb", "#db2777"],
    tooltip: { y: { formatter: (val: number) => "₹ " + val.toLocaleString() } },
  };

  // Options for Revenue Trend Area Chart
  const revenueTrendOptions: any = {
    chart: { type: "area", height: 350, toolbar: { show: false } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    xaxis: { categories: revenueTrendChartData.categories },
    colors: ["#6366f1", "#f59e0b"],
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 90, 100] } },
    tooltip: { y: { formatter: (val: number) => "₹ " + val.toLocaleString() } }
  };

  return (
    <>
      <style>{`
        .dashboard-wrapper {
          padding-top: 20px;
          background-color: #f8f9fa;
          min-height: calc(100vh - 80px);
        }

        .kpi-card {
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        
        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        }

        .kpi-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .bg-primary-light { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
        .bg-secondary-light { background: rgba(124, 58, 237, 0.1); color: #7c3aed; }
        .bg-danger-light { background: rgba(220, 38, 38, 0.1); color: #dc2626; }
        .bg-warning-light { background: rgba(217, 119, 6, 0.1); color: #d97706; }
        .bg-success-light { background: rgba(16, 185, 129, 0.1); color: #10b981; }

        .dashboard-table-card {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }

        .dashboard-table-wrapper {
          max-height: 310px;
          overflow-y: auto;
        }
      `}</style>

      <div className="page-body dashboard-wrapper">
        <Breadcrumbs mainTitle="Dashboard" parent="Home" />
        
        <Container fluid>
          {/* Date Filter Row */}
          <Row className="mb-4 align-items-end">
            <Col xs="12" md="4" lg="3" className="mb-2 mb-md-0">
              <FormGroup className="mb-0">
                <Label className="fw-bold text-muted small">From Date</Label>
                <DateInput
                  value={fromDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col xs="12" md="4" lg="3" className="mb-2 mb-md-0">
              <FormGroup className="mb-0">
                <Label className="fw-bold text-muted small">To Date</Label>
                <DateInput
                  value={toDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
                />
              </FormGroup>
            </Col>
            {isLoading && (
              <Col xs="auto" className="d-flex align-items-center mb-2 ms-2">
                <Loader className="spinner-border spinner-border-sm text-primary border-0 me-2" style={{ animation: "spin 1s linear infinite" }} />
                <span className="text-muted small">Updating dashboard...</span>
              </Col>
            )}
          </Row>

          {/* KPI Cards Row */}
          <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5 g-3 mb-4">
            {kpiData.map((kpi, index) => (
              <Col key={index}>
                <Card className="kpi-card h-100 border-0">
                  <CardBody className="p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1 small fw-bold text-uppercase">{kpi.title}</p>
                        <h4 className="mb-0 fw-bolder text-dark">{kpi.value}</h4>
                      </div>
                      <div className={`kpi-icon-box bg-${kpi.color}-light`}>
                        {kpi.icon}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Charts & Table Row 1 */}
          <Row>
            {/* Sales vs Purchase Overview */}
            <Col xl="8" lg="12" className="mb-4">
              <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <CardHeader className="bg-white border-bottom-0 pb-0 pt-4 px-4">
                  <h5 className="fw-bold mb-0">Sales vs Purchase Overview</h5>
                </CardHeader>
                <CardBody>
                  {salesPurchaseChartData.categories.length > 0 ? (
                    <Chart options={salesPurchaseOptions} series={salesPurchaseChartData.series} type="bar" height={350} />
                  ) : (
                    <div className="text-center py-5 text-muted">No overview data available for selected period.</div>
                  )}
                </CardBody>
              </Card>
            </Col>

            {/* Low Stock Alert */}
            <Col xl="4" lg="12" className="mb-4">
              <Card className="h-100 border-0 dashboard-table-card">
                <CardHeader className="bg-white border-bottom-0 pb-0 pt-4 px-4">
                  <h5 className="fw-bold mb-0">Low Stock Alert</h5>
                </CardHeader>
                <CardBody className="p-0 pt-3">
                  <div className="table-responsive dashboard-table-wrapper">
                    <Table className="table-hover align-middle mb-0" borderless>
                      <thead className="table-light">
                        <tr>
                          <th className="px-4 text-muted small fw-bold text-uppercase">Item Name</th>
                          <th className="text-center text-muted small fw-bold text-uppercase">Photo</th>
                          <th className="text-center text-muted small fw-bold text-uppercase">Stock</th>
                          <th className="text-center px-4 text-muted small fw-bold text-uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockList.length > 0 ? (
                          lowStockList.map((item, index) => {
                            const photoUrl = getPhotoUrl(item.DesignPhoto);
                            return (
                              <tr key={index}>
                                <td className="px-4 fw-semibold text-dark text-truncate" style={{ maxWidth: '150px' }}>
                                  {item.ItemName}
                                  {item.SizeName && <span className="text-muted small ms-1">({item.SizeName})</span>}
                                </td>
                                <td className="text-center">
                                  {photoUrl ? (
                                    <img src={photoUrl} alt={item.ItemName} style={{ width: '35px', height: '35px', borderRadius: '5px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                                  ) : (
                                    <span className="text-muted small text-muted">—</span>
                                  )}
                                </td>
                                <td className="text-center">
                                  <span className={`fw-bold ${item.CurrentStock <= 0 ? "text-danger" : "text-warning"}`}>{item.CurrentStock}</span>
                                </td>
                                <td className="text-center px-4">
                                  {item.CurrentStock <= 0 ? (
                                    <Badge color="danger" pill>Out of Stock</Badge>
                                  ) : (
                                    <Badge color="warning" pill className="text-dark">Low Stock</Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-muted small">No low stock items.</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Charts & Table Row 2 */}
          <Row>
            {/* Monthly Revenue Trend */}
            <Col xl="8" lg="12" className="mb-4">
              <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <CardHeader className="bg-white border-bottom-0 pb-0 pt-4 px-4">
                  <h5 className="fw-bold mb-0">Monthly Revenue Trend</h5>
                </CardHeader>
                <CardBody>
                  {revenueTrendChartData.categories.length > 0 ? (
                    <Chart options={revenueTrendOptions} series={revenueTrendChartData.series} type="area" height={350} />
                  ) : (
                    <div className="text-center py-5 text-muted">No trend data available for selected period.</div>
                  )}
                </CardBody>
              </Card>
            </Col>

            {/* Top Selling Items */}
            <Col xl="4" lg="12" className="mb-4">
              <Card className="h-100 border-0 dashboard-table-card">
                <CardHeader className="bg-white border-bottom-0 pb-0 pt-4 px-4">
                  <h5 className="fw-bold mb-0">Top Selling Items</h5>
                </CardHeader>
                <CardBody className="p-0 pt-3">
                  <div className="table-responsive dashboard-table-wrapper">
                    <Table className="table-hover align-middle mb-0" borderless>
                      <thead className="table-light">
                        <tr>
                          <th className="px-4 text-muted small fw-bold text-uppercase">Item Name</th>
                          <th className="text-center text-muted small fw-bold text-uppercase">Photo</th>
                          <th className="text-center text-muted small fw-bold text-uppercase">Qty</th>
                          <th className="text-end px-4 text-muted small fw-bold text-uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topSellingList.length > 0 ? (
                          topSellingList.map((item, index) => {
                            const photoUrl = getPhotoUrl(item.DesignPhoto);
                            return (
                              <tr key={index}>
                                <td className="px-4 fw-semibold text-dark text-truncate" style={{ maxWidth: '140px' }}>
                                  {item.ItemName}
                                </td>
                                <td className="text-center">
                                  {photoUrl ? (
                                    <img src={photoUrl} alt={item.ItemName} style={{ width: '35px', height: '35px', borderRadius: '5px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                                  ) : (
                                    <span className="text-muted small text-muted">—</span>
                                  )}
                                </td>
                                <td className="text-center fw-bold text-dark">{item.TotalQty}</td>
                                <td className="text-end px-4 fw-bold text-success">₹ {formatCurrency(item.TotalAmount)}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-muted small">No data available.</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

        </Container>
      </div>
    </>
  );
};

export default Dashboard;
