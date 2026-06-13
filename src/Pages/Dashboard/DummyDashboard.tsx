import React from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Table, Badge } from "reactstrap";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import Chart from "react-apexcharts";
import { DollarSign, ShoppingBag, Truck, Package } from "react-feather";

const Dashboard = () => {
  // Dummy Data for KPI Cards
  const kpiData = [
    { title: "Total Sales", value: "₹ 12,45,000", icon: <DollarSign />, color: "primary", growth: "+15%" },
    { title: "Total Rent Income", value: "₹ 3,20,000", icon: <ShoppingBag />, color: "secondary", growth: "+8%" },
    { title: "Pending Receivables", value: "₹ 1,50,000", icon: <Truck />, color: "warning", growth: "-2%" },
    { title: "Available Stock", value: "4,500 Items", icon: <Package />, color: "success", growth: "+5%" },
  ];

  // Dummy Data for Bar Chart (Sales vs Purchase)
  const salesPurchaseOptions: any = {
    chart: { type: "bar", height: 350, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: "55%", borderRadius: 5 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: { categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
    yaxis: { title: { text: "Amount (₹)" } },
    fill: { opacity: 1 },
    colors: ["#2563eb", "#db2777"],
    tooltip: { y: { formatter: (val: number) => "₹ " + val + " thousands" } },
  };

  const salesPurchaseSeries = [
    { name: "Sales", data: [44, 55, 57, 56, 61, 58, 63, 60, 66] },
    { name: "Purchase", data: [76, 85, 101, 98, 87, 105, 91, 114, 94] },
  ];

  // Dummy Data for Low Stock Alert
  const lowStockItems = [
    { name: "Bridal Lehenga Red", variantImage: "https://via.placeholder.com/40?text=BLR", qty: 2, minQty: 5 },
    { name: "Mens Sherwani Blue", variantImage: "https://via.placeholder.com/40?text=MSB", qty: 1, minQty: 3 },
    { name: "Kundan Necklace", variantImage: "https://via.placeholder.com/40?text=KN", qty: 0, minQty: 2 },
    { name: "Designer Safa", variantImage: "https://via.placeholder.com/40?text=DS", qty: 3, minQty: 10 },
    { name: "Gold Plated Bangle", variantImage: "https://via.placeholder.com/40?text=GPB", qty: 1, minQty: 4 },
  ];


  // Dummy Data for Monthly Revenue Trend
  const revenueTrendOptions: any = {
    chart: { type: "area", height: 350, toolbar: { show: false } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    xaxis: { categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"] },
    colors: ["#6366f1", "#f59e0b"],
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.6, stops: [0, 90, 100] } },
    tooltip: { y: { formatter: (val: number) => "₹ " + val + "k" } }
  };


  const revenueTrendSeries = [
    { name: "Sales Revenue", data: [120, 10, 180, 130, 160, 210, 40,] },
    { name: "Rent Revenue", data: [40, 60, 55, 70, 80, 110, 120] }
  ];

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
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          transition: transform 0.3s ease;
        }
        
        .kpi-card:hover {
          transform: translateY(-5px);
        }

        .kpi-icon-box {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .bg-primary-light { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
        .bg-secondary-light { background: rgba(124, 58, 237, 0.1); color: #7c3aed; }
        .bg-warning-light { background: rgba(219, 39, 119, 0.1); color: #db2777; }
        .bg-success-light { background: rgba(16, 185, 129, 0.1); color: #10b981; }
      `}</style>

      <div className="page-body dashboard-wrapper">
        <Breadcrumbs mainTitle="Dashboard" parent="Home" />
        <Container fluid>

          {/* KPI Cards */}
          <Row>
            {kpiData.map((kpi, index) => (
              <Col xl="3" sm="6" key={index} className="mb-4">
                <Card className="kpi-card h-100">
                  <CardBody>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1 fw-bold">{kpi.title}</p>
                        <h3 className="mb-0 fw-bolder">{kpi.value}</h3>
                        <span className={kpi.growth.startsWith('+') ? "text-success small" : "text-danger small"}>
                          <i className={kpi.growth.startsWith('+') ? "fa fa-arrow-up" : "fa fa-arrow-down"}></i> {kpi.growth} Since last month
                        </span>
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

          {/* Charts Row 1 */}
          <Row>
            <Col xl="8" className="mb-4">
              <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                <CardHeader className="bg-white border-bottom-0 pb-0 pt-4 px-4">
                  <h5 className="fw-bold mb-0">Sales vs Purchase Overview</h5>
                </CardHeader>
                <CardBody>
                  <Chart options={salesPurchaseOptions} series={salesPurchaseSeries} type="bar" height={350} />
                </CardBody>
              </Card>
            </Col>
            <Col xl="4" className="mb-4">
              <Card className="h-100 border-0 shadow-sm overflow-hidden" style={{ borderRadius: '15px' }}>
                <CardHeader className="bg-white border-bottom-0 pb-0 pt-4 px-4">
                  <h5 className="fw-bold mb-0">Low Stock Alert</h5>
                </CardHeader>
                <CardBody className="p-0 pt-3">
                  <div className="table-responsive">
                    <Table className="table-borderless table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="px-4 text-muted small fw-bold text-uppercase">Item Name</th>
                          <th className="text-center text-muted small fw-bold text-uppercase">Variant</th>
                          <th className="text-center text-muted small fw-bold text-uppercase">Stock</th>
                          <th className="text-center px-4 text-muted small fw-bold text-uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 fw-medium text-dark">{item.name}</td>
                            <td className="text-center">
                              <img src={item.variantImage} alt={item.name} style={{ width: '35px', height: '35px', borderRadius: '5px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                            </td>
                            <td className="text-center">
                              <span className="fw-bold text-danger">{item.qty}</span>
                              <span className="text-muted small ms-1">/ {item.minQty}</span>
                            </td>
                            <td className="text-center px-4">
                              {item.qty === 0 ? (
                                <Badge color="danger" pill>Out of Stock</Badge>
                              ) : (
                                <Badge color="warning" pill className="text-dark">Low Stock</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Charts Row 2 */}
          <Row>
            <Col xl="12" className="mb-4">
              <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                <CardHeader className="bg-white border-bottom-0 pb-0 pt-4 px-4">
                  <h5 className="fw-bold mb-0">Monthly Revenue Trend</h5>
                </CardHeader>
                <CardBody>
                  <Chart options={revenueTrendOptions} series={revenueTrendSeries} type="area" height={350} />
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
