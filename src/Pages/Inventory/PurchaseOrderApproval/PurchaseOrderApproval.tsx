import React, { useState, useEffect, useRef } from "react";
import { Col, Row, Card, CardBody, CardHeader, CardFooter, Container, FormGroup, Input, Label } from "reactstrap";
import { Fn_AddEditData, Fn_FillListData, Fn_GetReport } from "../../../store/Functions";
import { useDispatch } from "react-redux";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { useNavigate } from "react-router-dom";
import GridSystemPOForApproval from "./GridSystemPOForApproval";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Btn } from "../../../AbstractElements";

interface FormData {
  PNo: string;
  F_StatusMaster: string;
  F_VendorMaster: string;
  F_PurchaseMaster: number;
}

interface PurchaseOrderStatus {
  Id: number;
  Name: string;
}

interface VendorMaster {
  Id: number;
  CompanyName?: string;
  Name?: string;
  CityName?: string;
}

interface CreatedPurchaseOrder {
  Id: number;
  PNo?: string;
  PONo?: string;
  Name?: string;
}

interface GridRow {
  F_PurchaseMasterL: string | number;
  PONo: string;
  PDate: string;
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
  PurchaseOrderStatus: PurchaseOrderStatus[];
  VendorMaster: VendorMaster[];
  CreatedPurchaseOrders: CreatedPurchaseOrder[];
  isEditMode: boolean;
}

function PurchaseOrderApproval() {
  const API_URL_SAVE = "POApprovedByAdmin/0/token";
  const [statusSelected, setStatusSelected] = useState<string>("");
  const [vendorSelected, setVendorSelected] = useState<string>("");
  const [state, setState] = useState<State>({
    id: 0,
    formData: {
      PNo: "",
      F_StatusMaster: "",
      F_VendorMaster: "",
      F_PurchaseMaster: 0,
    },
    PurchaseOrderStatus: [ 
      { Id: 1, Name: "Approved" },
      { Id: 2, Name: "Draft" },
      { Id: 3, Name: "Both" }
    ],
    VendorMaster: [],
    CreatedPurchaseOrders: [],
    isEditMode: false,
  });

  // Separate state for grid rows with individual item data
  const [gridRows, setGridRows] = useState<GridRow[]>([]);

  const API_L = `GetPurchaseOrderForApproval/0/token`;
  // Refs for form fields
  const purchaseNoRef = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const parsePurchaseOrderData = (data: any) => {
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
                  Lines: Array.isArray(linesObj) ? linesObj.filter((l: any) => String(l.F_PurchaseOrderH) === String(hdr.Id)) : linesObj
                });
              });
            } else {
              parsed.push({
                ...headerObj,
                Lines: Array.isArray(linesObj) ? linesObj.filter((l: any) => String(l.F_PurchaseOrderH) === String(headerObj.Id)) : linesObj
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

  // Load vendor data and PO list on component mount
  useEffect(() => {
    const API_URL_VENDOR = `${API_WEB_URLS.MASTER}/0/token/GetLedgerNamesForPoSoApproval/Id/0`;
    const API_URL_PO_LIST = `${API_WEB_URLS.MASTER}/0/token/PurchaseOrderData/Id/0`;
    
    Fn_FillListData(dispatch, setState, "VendorMaster", API_URL_VENDOR);
    
    const fetchPO = async () => {
       const poData = await Fn_FillListData(dispatch, () => ({}), "ignored", API_URL_PO_LIST);
       const parsed = parsePurchaseOrderData(poData);
       setState(prev => ({ ...prev, CreatedPurchaseOrders: parsed }));
    };
    fetchPO();

    // Default status to 3 (Both) and load data automatically
    setState(prev => ({ ...prev, formData: { ...prev.formData, F_StatusMaster: "3" } }));
    setStatusSelected("3");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadDataWithFiltersDirect(null, "3", null);
  }, [dispatch]);

  const approveRow = async (row: GridRow, index: number) => {
    // Optimistically remove the row immediately
    setGridRows(prevRows => prevRows.filter((_, i) => i !== index));
    
    const obj = JSON.parse(localStorage.getItem("user") || "{}");

    let formData = new FormData();
    formData.append("F_PurchaseOrderL", String(row.F_PurchaseMasterL || 0));
    formData.append("Status", "Approved");
    formData.append("ApprovedQty", String(row.Qty || 0));
    formData.append("UserId", String(obj?.uid || 0));

    const res: any = await Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: row.F_PurchaseMasterL || 0, formData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "#"
    );

    if (res?.id) {
      await loadDataWithFiltersDirect();
    } else {
      // If API fails, reload to restore the row
      await loadDataWithFiltersDirect();
    }
  };

  const rejectRow = async (row: GridRow, index: number) => {
    // Optimistically remove the row immediately
    setGridRows(prevRows => prevRows.filter((_, i) => i !== index));
    
    const obj = JSON.parse(localStorage.getItem("user") || "{}");

    let formData = new FormData();
    formData.append("F_PurchaseOrderL", String(row.F_PurchaseMasterL || 0));
    formData.append("Status", "Rejected");
    formData.append("ApprovedQty", String(row.Qty || 0));
    formData.append("UserId", String(obj?.uid || 0));

    const res: any = await Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: row.F_PurchaseMasterL || 0, formData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "#"
    );

    if (res?.id) {
      await loadDataWithFiltersDirect();
    } else {
      // If API fails, reload to restore the row
      await loadDataWithFiltersDirect();
    }
  };

  const fetchData = async (StatusId: string | number, PurchaseId: string | number, VendorId: string | number) => {
    const formData = new FormData();
    formData.append("F_StatusMaster", String(StatusId || 0));
    formData.append("F_PurchaseOrderH", String(PurchaseId || 0));
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

  // Load data using all 3 dropdown filters
  const loadDataWithFilters = async () => {
    const statusId = state.formData.F_StatusMaster || statusSelected || 0;
    const purchaseId = state.formData.F_PurchaseMaster || 0;
    const vendorId = state.formData.F_VendorMaster || vendorSelected || 0;

    const lData: any = await fetchData(statusId, purchaseId, vendorId);
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
          F_PurchaseMasterL: l.PurchaseOrderLId || l.F_PurchaseMasterL || "",
          PONo: l.PONo || "",
          PDate: l.PODate || l.PDate || "",
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

  const onUpdateRow = (index: number, field: string, value: any) => {
    const updatedRows = [...gridRows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value,
    };
    setGridRows(updatedRows);
  };
 
  // Handle specific PO selection from dropdown
  const handlePOSelectionChange = async (poId: string | number) => {
    setState(prev => ({ ...prev, formData: { ...prev.formData, F_PurchaseMaster: Number(poId) } }));
    // Use the passed poId directly instead of waiting for state update
    await loadDataWithFiltersDirect(poId);
  };

  // Load data with direct parameter values to avoid state update delays
  const loadDataWithFiltersDirect = async (purchaseId: string | number | null = null, statusId: string | number | null = null, vendorId: string | number | null = null) => {
    const currentStatusId = statusId !== null ? statusId : (state.formData.F_StatusMaster || statusSelected || 0);
    const currentPurchaseId = purchaseId !== null ? purchaseId : (state.formData.F_PurchaseMaster || 0);
    const currentVendorId = vendorId !== null ? vendorId : (state.formData.F_VendorMaster || vendorSelected || 0);

    const lData: any = await fetchData(currentStatusId, currentPurchaseId, currentVendorId);
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
          F_PurchaseMasterL: l.PurchaseOrderLId || l.F_PurchaseMasterL || "",
          PONo: l.PONo || "",
          PDate: l.PODate || l.PDate || "",
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

  const handleCreatedPOChange = async (statusId: string) => {
    setStatusSelected(statusId);
    setState(prev => ({ ...prev, formData: { ...prev.formData, F_StatusMaster: statusId } }));
    // Use the passed statusId directly instead of waiting for state update
    await loadDataWithFiltersDirect(null, statusId);
  };

  const handleVendorChange = async (vendorId: string) => {
    setVendorSelected(vendorId);
    setState(prev => ({ ...prev, formData: { ...prev.formData, F_VendorMaster: vendorId } }));
    // Use the passed vendorId directly instead of waiting for state update
    await loadDataWithFiltersDirect(null, null, vendorId);
    
    // Focus on first qty field after data loads
    setTimeout(() => {
      const firstQtyInput = document.querySelector('input[placeholder="Qty"]') as HTMLInputElement;
      if (firstQtyInput) {
        firstQtyInput.focus();
      }
    }, 500);
  };

  // Focus effect styles for form fields
  const formFocusStyles = ``;

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Purchase Order Approval" parent="Inventory" />
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
                            await handleCreatedPOChange(statusId);
                          }}
                        >
                          <option value="">Select Status</option>
                          {state.PurchaseOrderStatus.map((po) => (
                            <option key={po.Id} value={String(po.Id)}>
                              {po.Name}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="4">
                      <FormGroup>
                        <Label for="poSelect">Purchase Order</Label>
                        <Input
                          id="poSelect"
                          type="select"
                          name="F_PurchaseMaster"
                          value={state.formData.F_PurchaseMaster}
                          onChange={async (e) => {
                            const id = e.target.value;
                            await handlePOSelectionChange(id);
                          }}
                        >
                          <option value="">Select Purchase Order</option>
                          {state.CreatedPurchaseOrders && state.CreatedPurchaseOrders.map(po => (
                            <option key={po.Id} value={String(po.Id)}>
                              {po.PONo || po.PNo || po.Name || po.Id}
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
                  <GridSystemPOForApproval
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

export default PurchaseOrderApproval;
