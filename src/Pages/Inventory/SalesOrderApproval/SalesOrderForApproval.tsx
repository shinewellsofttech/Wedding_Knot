import React, { useState, useEffect, useRef } from "react";
import { Col, Row, Card, CardBody, CardFooter, Container, FormGroup, Input, Label } from "reactstrap";
import { Fn_AddEditData, Fn_FillListData, Fn_GetReport } from "../../../store/Functions";
import { useDispatch } from "react-redux";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { useNavigate } from "react-router-dom";
import GridSystemSOForApproval from "./GridSystemSOForApproval";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { toast } from "react-toastify";

interface FormData {
  SONo: string;
  F_StatusMaster: string;
  F_VendorMaster: string;
  F_SalesMaster: number;
}

interface SalesOrderStatus {
  Id: number;
  Name: string;
}

interface VendorMaster {
  Id: number;
  CompanyName?: string;
  Name?: string;
  CityName?: string;
}

interface CreatedSalesOrder {
  Id: number;
  SONo?: string;
  SoNo?: string;
  Name?: string;
}

interface GridRow {
  F_SalesMasterL: string | number;
  SONo: string;
  SDate: string;
  VendorName: string;
  GroupName: string;
  ItemCode: string;
  ItemName: string;
  ColorName: string;
  Qty: string;
  OriginalQty: string;
  Status: string;
  ItemData: any;
}

interface State {
  id: number;
  formData: FormData;
  SalesOrderStatus: SalesOrderStatus[];
  VendorMaster: VendorMaster[];
  CreatedSalesOrders: CreatedSalesOrder[];
  isEditMode: boolean;
}

function SalesOrderForApproval() {
  const API_URL_SAVE = "SOApprovedByAdmin/0/token";
  const [statusSelected, setStatusSelected] = useState<string>("");
  const [vendorSelected, setVendorSelected] = useState<string>("");
  const [state, setState] = useState<State>({
    id: 0,
    formData: {
      SONo: "",
      F_StatusMaster: "",
      F_VendorMaster: "",
      F_SalesMaster: 0,
    },
    SalesOrderStatus: [ 
      { Id: 1, Name: "Approved" },
      { Id: 2, Name: "Draft" },
      { Id: 3, Name: "Both" }
    ],
    VendorMaster: [],
    CreatedSalesOrders: [],
    isEditMode: false,
  });

  const [gridRows, setGridRows] = useState<GridRow[]>([]);
  const API_L = `GetSalesOrderForApproval/0/token`;
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const parseSalesOrderData = (data: any) => {
    let parsed: any[] = [];
    if (data && Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.Header) {
          try {
            const headerObj = JSON.parse(item.Header);
            const linesObj = item.Lines ? JSON.parse(item.Lines) : [];
            
            if (Array.isArray(headerObj)) {
              headerObj.forEach((hdr: any) => {
                parsed.push({
                  ...hdr,
                  Lines: Array.isArray(linesObj) ? linesObj.filter((l: any) => String(l.F_SalesOrderH) === String(hdr.Id)) : linesObj
                });
              });
            } else {
              parsed.push({
                ...headerObj,
                Lines: Array.isArray(linesObj) ? linesObj.filter((l: any) => String(l.F_SalesOrderH) === String(headerObj.Id)) : linesObj
              });
            }
          } catch (e) {
            parsed.push(item);
          }
        } else {
          parsed.push(item);
        }
      });
    } else {
      parsed = data || [];
    }
    return parsed;
  };

  useEffect(() => {
    const API_URL_VENDOR = `${API_WEB_URLS.MASTER}/0/token/GetLedgerNamesForPoSoApproval/Id/0`;
    const API_URL_SO_LIST = `${API_WEB_URLS.MASTER}/0/token/salesorderdata/Id/0`;
    
    Fn_FillListData(dispatch, setState, "VendorMaster", API_URL_VENDOR);
    
    const fetchSO = async () => {
       const soData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_SO_LIST);
       const parsed = parseSalesOrderData(soData);
       setState(prev => ({ ...prev, CreatedSalesOrders: parsed }));
    };
    fetchSO();

    setState(prev => ({ ...prev, formData: { ...prev.formData, F_StatusMaster: "3" } }));
    setStatusSelected("3");
    loadDataWithFiltersDirect(null, "3", null);
  }, [dispatch]);

  const approveRow = async (row: GridRow, index: number) => {
    setGridRows(prevRows => prevRows.filter((_, i) => i !== index));
    const obj = JSON.parse(localStorage.getItem("user") || "{}");

    let formData = new FormData();
    formData.append("F_SalesOrderL", String(row.F_SalesMasterL || 0));
    formData.append("Status", "Approved");
    formData.append("ApprovedQty", String(row.Qty || 0));
    formData.append("UserId", String(obj?.uid || 0));

    const res: any = await Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: row.F_SalesMasterL || 0, formData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "#"
    );

    if (res?.id) {
      toast.success("SO Approved!");
      await loadDataWithFiltersDirect();
    } else {
      await loadDataWithFiltersDirect();
    }
  };

  const rejectRow = async (row: GridRow, index: number) => {
    setGridRows(prevRows => prevRows.filter((_, i) => i !== index));
    const obj = JSON.parse(localStorage.getItem("user") || "{}");

    let formData = new FormData();
    formData.append("F_SalesOrderL", String(row.F_SalesMasterL || 0));
    formData.append("Status", "Rejected");
    formData.append("ApprovedQty", String(row.Qty || 0));
    formData.append("UserId", String(obj?.uid || 0));

    const res: any = await Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: row.F_SalesMasterL || 0, formData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "#"
    );

    if (res?.id) {
      toast.error("SO Rejected!");
      await loadDataWithFiltersDirect();
    } else {
      await loadDataWithFiltersDirect();
    }
  };

  const fetchData = async (StatusId: string | number, SalesId: string | number, VendorId: string | number) => {
    const formData = new FormData();
    formData.append("F_StatusMaster", String(StatusId || 0));
    formData.append("F_SalesMasterH", String(SalesId || 0));
    formData.append("F_LedgerMaster", String(VendorId || 0));
    const res = await Fn_GetReport(
      dispatch,
      setState,
      "FillArray",
      `${API_L}`,
      { arguList: { id: 0, formData: formData } },
      true
    );
    return res;
  };

  const onUpdateRow = (index: number, field: string, value: any) => {
    const updatedRows = [...gridRows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value,
    };
    setGridRows(updatedRows);
  };

  const handleSOSelectionChange = async (soId: string | number) => {
    setState(prev => ({ ...prev, formData: { ...prev.formData, F_SalesMaster: Number(soId) } }));
    await loadDataWithFiltersDirect(soId);
  };

  const loadDataWithFiltersDirect = async (salesId: string | number | null = null, statusId: string | number | null = null, vendorId: string | number | null = null) => {
    const currentStatusId = statusId !== null ? statusId : (state.formData.F_StatusMaster || statusSelected || 0);
    const currentSalesId = salesId !== null ? salesId : (state.formData.F_SalesMaster || 0);
    const currentVendorId = vendorId !== null ? vendorId : (state.formData.F_VendorMaster || vendorSelected || 0);

    const lData: any = await fetchData(currentStatusId, currentSalesId, currentVendorId);
    let lines: any[] = [];
    if (Array.isArray(lData)) {
      lines = lData;
    } else if (lData?.data?.response && Array.isArray(lData.data.response)) {
      lines = lData.data.response;
    } else if (lData?.response && Array.isArray(lData.response)) {
      lines = lData.response;
    }

    if (lines.length > 0) {
      const mappedRows: GridRow[] = lines.map((l: any) => {
        let statusName = "New";
        if (l.F_StatusMaster === 1) statusName = "Approved";
        else if (l.F_StatusMaster === 2) statusName = "Draft";

        return {
          F_SalesMasterL: l.SalesOrderLId || l.F_SalesMasterL || l.Id || l.id || "",
          SONo: l.SONo || "",
          SDate: l.SODate || l.SDate || "",
          VendorName: l.LedgerName || l.VendorName || "",
          GroupName: l.GroupName || "",
          ItemCode: l.ItemCode || l.itemCode || l.ItemMaster?.ItemCode || l.F_ItemMaster?.ItemCode || "",
          ItemName: l.ItemName || "",
          ColorName: l.ColorName || "",
          Qty: (l.OrderedQty && l.OrderedQty !== 0 && l.OrderedQty !== "0") ? String(l.OrderedQty) : "",
          OriginalQty: (l.OrderedQty && l.OrderedQty !== 0 && l.OrderedQty !== "0") ? String(l.OrderedQty) : "",
          Status: statusName,
          ItemData: null,
        };
      });
      setGridRows(mappedRows);
    } else {
      setGridRows([]);
    }
  };

  const handleCreatedSOChange = async (statusId: string) => {
    setStatusSelected(statusId);
    setState(prev => ({ ...prev, formData: { ...prev.formData, F_StatusMaster: statusId } }));
    await loadDataWithFiltersDirect(null, statusId);
  };

  const handleVendorChange = async (vendorId: string) => {
    setVendorSelected(vendorId);
    setState(prev => ({ ...prev, formData: { ...prev.formData, F_VendorMaster: vendorId } }));
    await loadDataWithFiltersDirect(null, null, vendorId);
    
    setTimeout(() => {
      const firstQtyInput = document.querySelector('input[placeholder="Qty"]') as HTMLInputElement;
      if (firstQtyInput) {
        firstQtyInput.focus();
      }
    }, 500);
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Sales Order Approval" parent="Inventory" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Card className="mb-3">
                <CardHeaderCommon 
                  title="Filter Options"
                  tagClass="card-title mb-0"
                />
                <CardBody>
                  <Row className="gy-3">
                    <Col md="4">
                      <FormGroup>
                        <Label for="statusSelect">Status</Label>
                        <Input
                          id="statusSelect"
                          type="select"
                          name="F_StatusMaster"
                          value={state.formData.F_StatusMaster}
                          onChange={async (e) => {
                            const statusId = e.target.value;
                            await handleCreatedSOChange(statusId);
                          }}
                        >
                          <option value="">Select Status</option>
                          {state.SalesOrderStatus.map((po) => (
                            <option key={po.Id} value={String(po.Id)}>
                              {po.Name}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="4">
                      <FormGroup>
                        <Label for="soSelect">Sales Order</Label>
                        <Input
                          id="soSelect"
                          type="select"
                          name="F_SalesMaster"
                          value={state.formData.F_SalesMaster}
                          onChange={async (e) => {
                            const id = e.target.value;
                            await handleSOSelectionChange(id);
                          }}
                        >
                          <option value="">Select Sales Order</option>
                          {state.CreatedSalesOrders && state.CreatedSalesOrders.map(so => (
                            <option key={so.Id} value={String(so.Id)}>
                              {so.SONo || so.SoNo || so.Name || so.Id}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="4">
                      <FormGroup>
                        <Label for="vendorSelect">Party / Vendor</Label>
                        <Input
                          id="vendorSelect"
                          type="select"
                          name="F_VendorMaster"
                          value={state.formData.F_VendorMaster}
                          onChange={async (e) => {
                            const vendorId = e.target.value;
                            await handleVendorChange(vendorId);
                          }}
                        >
                          <option value="">Select Party</option>
                          {state.VendorMaster.map((vendor: any) => (
                            <option key={vendor.Id} value={String(vendor.Id)}>
                              {vendor.Name || vendor.LedgerName || vendor.CompanyName}{vendor.CityName ? ` - ${vendor.CityName}` : ""}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>
                </CardBody>
              </Card>

              <Card>
                <CardHeaderCommon 
                  title="Items for Approval"
                  tagClass="card-title mb-0"
                />
                <CardBody>
                  <GridSystemSOForApproval
                    gridRows={gridRows}
                    onApproveRow={approveRow}
                    onRejectRow={rejectRow}
                    onUpdateRow={onUpdateRow}
                    statusSelected={statusSelected}
                  />
                </CardBody>
                <CardFooter className="text-end">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Total Items: </strong>
                      <span className="badge bg-primary ms-2">{gridRows.length}</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
}

export default SalesOrderForApproval;
