import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Table, Badge, Modal, ModalHeader, ModalBody, Button, FormGroup, Label, Input } from "reactstrap";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import { API_WEB_URLS } from "../../constants/constAPI";
import { Eye } from "react-feather";

interface Status {
  Id: number;
  Name: string;
}

interface OrderItem {
  Id: number;
  F_ItemDesignMaster: number;
  F_CategoryMaster: number;
  F_ItemMaster: number;
  Barcode: string;
  ItemName: string;
  DesignPhoto: string;
  DesignPhoto2?: string;
  DesignPhoto3?: string;
  DesignPhoto4?: string;
  DesignPhoto5?: string;
  DesignPhoto_Thumb?: string;
  DesignPhoto2_Thumb?: string;
  DesignPhoto3_Thumb?: string;
  DesignPhoto4_Thumb?: string;
  DesignPhoto5_Thumb?: string;
  Qty: number;
  Rate: number;
  Amount: number;
  CGST: number;
  SGST: number;
  IGST: number;
  F_StatusMaster: number;
  SizeName: string;
  VideoLink?: string;
  Length?: string;
  Width?: string;
  Height?: string;
  Weight?: string;
  EcomPrice?: number;
  ShortDescription?: string;
  FullDescription?: string;
}

interface Order {
  Id: number;
  EntryNo: string;
  EntryDate: string;
  F_UserMaster: number;
  TotalTax: number;
  Remarks: string;
  DispatchDocNo: string | null;
  DispatchedThrough: string | null;
  F_StatusMaster: number;
  OrderStatus: string;
  OrderStatusRemarks: string | null;
  OrderStatusUpdatedOn: string | null;
  OrderStatusUpdatedBy: number | null;
  CustomerName: string;
  ContactMobile: string;
  ContactEmail: string;
  Items: OrderItem[];
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [updateStatusId, setUpdateStatusId] = useState<number>(0);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    fetchOrders();
    fetchStatuses();

    const handleNewOrder = () => {
      fetchOrders();
    };

    window.addEventListener("eccom_new_order_received", handleNewOrder);
    return () => {
      window.removeEventListener("eccom_new_order_received", handleNewOrder);
    };
  }, []);

  const fetchStatuses = async () => {
    try {
      const response = await fetch(`${API_WEB_URLS.BASE}${API_WEB_URLS.MASTER}/0/token/StatusMaster/Id/0`);
      const data = await response.json();
      if (data.success && data.data && data.data.dataList) {
        setStatuses(data.data.dataList);
      }
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userToken = authUser?.Token ?? authUser?.token ?? "token";

      const payload = new FormData();
      payload.append("UserId", "0");

      const response = await fetch(`${API_WEB_URLS.BASE}EccomOrder/AdminGetOrders/0/${userToken}`, {
        method: "POST",
        body: payload
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        if (Array.isArray(data.data.orders)) {
          setOrders(data.data.orders);
        } else if (Array.isArray(data.data.Orders)) {
          setOrders(data.data.Orders);
        } else if (Array.isArray(data.data)) {
          setOrders(data.data);
        } else {
          setOrders([]);
        }
      } else {
        console.error("Failed to fetch orders or no orders found.");
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const toggleModal = () => setModalOpen(!modalOpen);

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    
    // Attempt to pre-fill the status dropdown with the current order status
    const currentStatus = statuses.find(s => s.Id === order.F_StatusMaster);
    setUpdateStatusId(currentStatus ? currentStatus.Id : 0);
    
    setModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    if (updateStatusId === 0) {
      alert("Please select a status");
      return;
    }
    
    const statusObj = statuses.find(s => s.Id === Number(updateStatusId));
    if (!statusObj) return;

    setUpdating(true);
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser?.uid ?? authUser?.Id ?? "0";
      const userToken = authUser?.Token ?? authUser?.token ?? "token";

      const payload = new FormData();
      payload.append("OrderId", String(selectedOrder.Id));
      payload.append("Status", statusObj.Name);
      payload.append("F_StatusMaster", String(updateStatusId));
      payload.append("Remarks", "");

      const response = await fetch(`${API_WEB_URLS.BASE}EccomOrder/UpdateStatus/${userId}/${userToken}`, {
        method: "POST",
        body: payload
      });
      
      const data = await response.json();
      if (data.success || response.ok) {
        fetchOrders();
        setModalOpen(false);
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  const cleanUrl = (url: string) => {
    let cleaned = url || "";
    if (cleaned.includes("https://") && cleaned.lastIndexOf("https://") > 0) {
      return cleaned.substring(cleaned.lastIndexOf("https://"));
    } else if (cleaned.includes("http://") && cleaned.lastIndexOf("http://") > 0) {
      return cleaned.substring(cleaned.lastIndexOf("http://"));
    }
    
    if (cleaned && !cleaned.startsWith("http")) {
      const baseUrl = API_WEB_URLS.BASE.replace("api/V1/", "");
      return `${baseUrl}ItemImages/${cleaned}`;
    }
    return cleaned;
  };

  const getActualStatusName = (fStatusId: number, fallback: string) => {
    const s = statuses.find(x => x.Id === fStatusId);
    return s ? s.Name : (fallback || "Pending");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "warning";
      case "Approved": return "info";
      case "Rejected": return "danger";
      case "Packed": return "secondary";
      case "Shipped": return "primary";
      case "Out for Delivery": return "info";
      case "Delivered": return "success";
      default: return "dark";
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Orders" parent="Ecommerce" />
        <Container fluid>
          <Row>
            <Col sm="12">
              <Card>
                <CardHeader className="pb-0">
                  <h5>Order List</h5>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="d-flex justify-content-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Order No</th>
                            <th>Date</th>
                            <th>Customer Details</th>
                            <th>Status</th>
                            <th>Remarks</th>
                            <th className="text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.length > 0 ? (
                            orders.map((order) => (
                              <tr key={order.Id}>
                                <td>
                                  <span className="fw-bold text-primary">{order.EntryNo}</span>
                                </td>
                                <td>{formatDate(order.EntryDate)}</td>
                                <td>
                                  <div className="d-flex flex-column">
                                    <span className="fw-bold">{order.CustomerName}</span>
                                    <span className="text-muted small">{order.ContactEmail}</span>
                                    <span className="text-muted small">{order.ContactMobile}</span>
                                  </div>
                                </td>
                                <td>
                                  <Badge color={getStatusColor(getActualStatusName(order.F_StatusMaster, order.OrderStatus))}>
                                    {getActualStatusName(order.F_StatusMaster, order.OrderStatus)}
                                  </Badge>
                                </td>
                                <td style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.85rem" }}>
                                  {order.Remarks}
                                </td>
                                <td className="text-center">
                                  <Button color="primary" size="sm" onClick={() => viewOrderDetails(order)} title="View Items">
                                    <Eye size={16} />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center text-muted py-4">
                                No orders found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Order Details Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} size="xl">
        <ModalHeader toggle={toggleModal}>Order Details - {selectedOrder?.EntryNo}</ModalHeader>
        <ModalBody>
          {selectedOrder && (
            <div>
              <Row className="mb-4">
                <Col md="6">
                  <h6 className="fw-bold">Customer Info</h6>
                  <p className="mb-1">Name: {selectedOrder.CustomerName}</p>
                  <p className="mb-1">Mobile: {selectedOrder.ContactMobile}</p>
                  <p className="mb-1">Email: {selectedOrder.ContactEmail}</p>
                </Col>
                <Col md="6">
                  <h6 className="fw-bold">Order Summary</h6>
                  <p className="mb-1">Date: {formatDate(selectedOrder.EntryDate)}</p>
                  <p className="mb-1">Status: <Badge color={getStatusColor(getActualStatusName(selectedOrder.F_StatusMaster, selectedOrder.OrderStatus))}>{getActualStatusName(selectedOrder.F_StatusMaster, selectedOrder.OrderStatus)}</Badge></p>
                </Col>
                <Col md="12" className="mt-3">
                  <h6 className="fw-bold">Remarks & Addresses</h6>
                  <pre style={{ whiteSpace: "pre-wrap", background: "#f8f9fa", padding: "10px", borderRadius: "5px", fontSize: "0.85rem" }}>
                    {selectedOrder.Remarks}
                  </pre>
                </Col>
                <Col md="12" className="mt-4 border-top pt-3">
                  <h6 className="fw-bold text-primary mb-3">Update Order Status</h6>
                  <Row>
                    <Col md="6">
                      <FormGroup>
                        <Label className="small fw-bold">Select Status</Label>
                        <Input 
                          type="select" 
                          value={updateStatusId} 
                          onChange={(e) => setUpdateStatusId(Number(e.target.value))}
                        >
                          <option value={0}>-- Select Status --</option>
                          {statuses.map(s => (
                            <option key={s.Id} value={s.Id}>{s.Name}</option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="3" className="d-flex align-items-center mb-3">
                      <Button color="primary" className="w-100" onClick={handleUpdateStatus} disabled={updating}>
                        {updating ? "Updating..." : "Update"}
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
              
              <h6 className="fw-bold mb-3">Order Items</h6>
              <div className="table-responsive">
                <Table bordered hover>
                  <thead className="table-light">
                    <tr>
                      <th className="text-center">Image</th>
                      <th>Item Name</th>
                      <th>Barcode</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Rate (₹)</th>
                      <th className="text-end">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.Items && selectedOrder.Items.length > 0 ? (
                      selectedOrder.Items.map((item) => (
                        <tr key={item.Id}>
                          <td className="text-center">
                            {(item.DesignPhoto_Thumb || item.DesignPhoto) ? (
                              <img 
                                src={cleanUrl(item.DesignPhoto_Thumb || item.DesignPhoto)} 
                                alt={item.ItemName} 
                                style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "5px" }} 
                              />
                            ) : (
                              <span className="text-muted small">No Image</span>
                            )}
                          </td>
                          <td>
                            <span className="fw-bold">{item.ItemName}</span>
                            {item.Weight && <div className="text-muted small">Weight: {item.Weight}</div>}
                          </td>
                          <td>{item.Barcode}</td>
                          <td className="text-center fw-bold">{item.Qty}</td>
                          <td className="text-end">{item.Rate.toFixed(2)}</td>
                          <td className="text-end fw-bold">{item.Amount.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center text-muted">No items found for this order.</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default Orders;
