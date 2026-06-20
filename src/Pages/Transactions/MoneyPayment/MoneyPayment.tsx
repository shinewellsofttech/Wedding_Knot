import React, { useState } from "react";
import { Container, Row, Col, Card, CardBody, CardFooter, Input, Table, ButtonGroup } from "reactstrap";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput/DateInput";
import { getCurrentDateYYYYMMDD } from "../../../helpers/dateUtils";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Btn } from "../../../AbstractElements";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Fn_FillListData, Fn_AddEditData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

interface GridRow {
  SNo: number;
  Id: number;
  InvoiceNo: string;
  Date: string;
  DueAmount: number;
  PaidAmount: number | string;
}

const MoneyPayment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    SearchPayment: "",
    Date: getCurrentDateYYYYMMDD(),
    LedgerName: "",
    PurchaseLedger: "",
    Narration: "",
    Mode: "Manual",
    Amount: 0,
    CurrBalance: 0,
    LineTotalAmt: 0,
    DiffAmt: 0,
  });

  const [gridRows, setGridRows] = useState<GridRow[]>([]);
  const [ledgerList, setLedgerList] = useState<any[]>([]);
  const [purchaseLedgerList, setPurchaseLedgerList] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const url = `${API_WEB_URLS.MASTER}/0/token/PurchasePartyLedgerMaster/Id/0`;
        const res = await Fn_FillListData(dispatch, () => {}, "ignored", url);
        
        let dataList: any[] = [];
        if (Array.isArray(res)) dataList = res;
        else if (res?.data?.dataList && Array.isArray(res.data.dataList)) dataList = res.data.dataList;
        else if (res?.dataList && Array.isArray(res.dataList)) dataList = res.dataList;
        else if (res?.data?.response && Array.isArray(res.data.response)) dataList = res.data.response;
        else if (res?.response && Array.isArray(res.response)) dataList = res.response;
        else if (res?.data && Array.isArray(res.data)) dataList = res.data;
        
        setLedgerList(dataList);

        const purchaseUrl = `${API_WEB_URLS.MASTER}/0/token/CashBankLedger/Id/0`;
        const purchaseRes = await Fn_FillListData(dispatch, () => {}, "ignored", purchaseUrl);
        let purchaseList: any[] = [];
        if (Array.isArray(purchaseRes)) purchaseList = purchaseRes;
        else if (purchaseRes?.data?.dataList && Array.isArray(purchaseRes.data.dataList)) purchaseList = purchaseRes.data.dataList;
        else if (purchaseRes?.dataList && Array.isArray(purchaseRes.dataList)) purchaseList = purchaseRes.dataList;
        else if (purchaseRes?.data?.response && Array.isArray(purchaseRes.data.response)) purchaseList = purchaseRes.data.response;
        else if (purchaseRes?.response && Array.isArray(purchaseRes.response)) purchaseList = purchaseRes.response;
        else if (purchaseRes?.data && Array.isArray(purchaseRes.data)) purchaseList = purchaseRes.data;
        
        setPurchaseLedgerList(purchaseList);
      } catch (error) {
        console.error("Error fetching ledgers:", error);
      }
    };
    fetchLedgers();
  }, [dispatch]);

  const distributeAmount = (totalAmount: number, rows: GridRow[]) => {
    let remainingAmount = totalAmount;
    return rows.map((row) => {
      let paid = 0;
      if (remainingAmount > 0) {
        if (remainingAmount >= row.DueAmount) {
          paid = row.DueAmount;
          remainingAmount -= row.DueAmount;
        } else {
          paid = remainingAmount;
          remainingAmount = 0;
        }
      }
      return { ...row, PaidAmount: paid };
    });
  };

  const handleGridInputChange = (index: number, value: any) => {
    if (formData.Mode !== "Manual") return;
    const newRows = [...gridRows];
    newRows[index].PaidAmount = value === "" ? "" : (parseFloat(value) || 0);
    setGridRows(newRows);
  };

  const handleInputChange = async (field: string, value: any) => {
    setFormData((prev) => {
      const newAmount = field === "Amount" ? (parseFloat(value) || 0) : prev.Amount;
      return {
        ...prev,
        [field]: value,
        DiffAmt: prev.LineTotalAmt - newAmount
      };
    });
    const currentMode = field === "Mode" ? value : formData.Mode;

    if (field === "Amount" && currentMode === "Auto") {
      const numValue = parseFloat(value) || 0;
      setGridRows((prev) => distributeAmount(numValue, prev));
    }
    
    if (field === "Mode" && value === "Auto") {
      setGridRows((prev) => distributeAmount(formData.Amount, prev));
    }

    if (field === "LedgerName" && value) {
      try {
        const url = `${API_WEB_URLS.MASTER}/0/token/GetPurchaseEntry/Id/${value}`;
        const res = await Fn_FillListData(dispatch, () => {}, "ignored", url);
        
        let dataList: any[] = [];
        if (Array.isArray(res)) dataList = res;
        else if (res?.data?.dataList && Array.isArray(res.data.dataList)) dataList = res.data.dataList;
        else if (res?.dataList && Array.isArray(res.dataList)) dataList = res.dataList;
        else if (res?.data?.response && Array.isArray(res.data.response)) dataList = res.data.response;
        else if (res?.response && Array.isArray(res.response)) dataList = res.response;
        else if (res?.data && Array.isArray(res.data)) dataList = res.data;
        
        const mappedRows: GridRow[] = dataList.map((item: any, index: number) => ({
          SNo: index + 1,
          Id: item.Id || 0,
          InvoiceNo: item.EntryNo || "",
          Date: item.EntryDate ? item.EntryDate.split('T')[0] : "",
          DueAmount: item.TotalAmount || 0,
          PaidAmount: 0,
        }));
        
        const totalDue = mappedRows.reduce((sum, r) => sum + r.DueAmount, 0);
        setFormData((prev) => ({ ...prev, LineTotalAmt: totalDue, DiffAmt: totalDue - prev.Amount }));

        if (currentMode === "Auto") {
          setGridRows(distributeAmount(parseFloat(String(formData.Amount)) || 0, mappedRows));
        } else {
          setGridRows(mappedRows);
        }
      } catch (e) {
        console.error("Error fetching purchase invoices", e);
      }
    } else if (field === "LedgerName" && !value) {
      setGridRows([]);
      setFormData((prev) => ({ ...prev, LineTotalAmt: 0, DiffAmt: 0 - prev.Amount }));
    }
  };

  const handleSave = async () => {
    if (!formData.LedgerName) {
      alert("Please select Ledger Name");
      return;
    }
    if (!formData.PurchaseLedger) {
      alert("Please select Purchase Ledger");
      return;
    }
    if (!formData.Amount || formData.Amount <= 0) {
      alert("Please enter a valid Amount");
      return;
    }

    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    const userId = authUser?.uid ?? authUser?.Id ?? "0";
    const userToken = authUser?.Token ?? authUser?.token ?? "token";

    let baseUrl = API_WEB_URLS.MASTER;
    if (baseUrl.endsWith("/Masters")) {
        baseUrl = baseUrl.replace("/Masters", "");
    }

    const headerFormData = new FormData();
    headerFormData.append("PaymentNo", formData.SearchPayment || "");
    headerFormData.append("PaymentDate", formData.Date);
    headerFormData.append("F_LedgerMaster", formData.LedgerName);
    headerFormData.append("F_PurchaseLedger", formData.PurchaseLedger);
    headerFormData.append("Narration", formData.Narration || "");
    headerFormData.append("ModeType", formData.Mode === "Auto" ? "true" : "false");
    headerFormData.append("TotalAmount", formData.Amount.toString());
    headerFormData.append("CurrentBalance", formData.CurrBalance.toString());
    headerFormData.append("LineTotal", formData.LineTotalAmt.toString());
    headerFormData.append("DifferenceAmount", formData.DiffAmt.toString());
    headerFormData.append("UserID", userId);

    const jsonDataArray = gridRows.filter(r => (parseFloat(r.PaidAmount as string) || 0) > 0).map((row) => ({
      F_PurchaseInvoiceH: row.Id,
      InvoiceNo: row.InvoiceNo,
      InvoiceDate: row.Date,
      DueAmount: row.DueAmount,
      PaidAmount: parseFloat(row.PaidAmount as string) || 0,
    }));

    headerFormData.append("JsonData", JSON.stringify(jsonDataArray));

    try {
      const API_URL_SAVE = "MoneyPayment/0/token";
      await Fn_AddEditData(dispatch, () => {}, { arguList: { id: 0, formData: headerFormData } }, API_URL_SAVE, true, "memberid", navigate, "#");
      alert("Money Payment saved successfully!");
      window.location.reload();
    } catch (e) {
      alert("Error saving data");
      console.error(e);
    }
  };

  const compactStyles = `
    @media (max-width: 991.98px) {
      .money-payment-page .container-fluid { padding: 0.4rem !important; }
      .money-payment-page .card-body { padding: 0.4rem !important; }
      .money-payment-page .card-footer { padding: 0.35rem 0.4rem !important; }
      .money-payment-page .form-label { font-size: 0.75rem; margin-bottom: 0.2rem; }
      .money-payment-page .form-control { font-size: 0.8rem; height: 26px; padding: 0.2rem 0.35rem; }
      .money-payment-page .btn { font-size: 0.8rem; padding: 0.22rem 0.4rem; }
    }
    @media (max-width: 767.98px) {
      .money-payment-page .container-fluid { padding: 0.25rem !important; }
      .money-payment-page .card-body { padding: 0.3rem !important; }
      .money-payment-page .card-footer { padding: 0.25rem 0.3rem !important; }
      .money-payment-page .form-label { font-size: 0.7rem; margin-bottom: 0.15rem; }
      .money-payment-page .form-control { font-size: 0.75rem; height: 24px; padding: 0.15rem 0.28rem; }
      .money-payment-page .btn { font-size: 0.75rem; padding: 0.18rem 0.35rem; }
    }
  `;

  return (
    <div className="page-body money-payment-page" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <style>{compactStyles}</style>
      <Breadcrumbs mainTitle="Money Payment" parent="Transactions" />
      <Container fluid className="px-2 px-sm-3">
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Money Payment Details" tagClass="card-title mb-0" />
              <CardBody className="p-2 p-sm-3">
                <Row className="g-2 g-sm-3 mb-3">
                  <Col md="3">
                    <label className="form-label">Search Payment</label>
                    <select
                      className="form-control"
                      value={formData.SearchPayment}
                      onChange={(e) => handleInputChange("SearchPayment", e.target.value)}
                    >
                      <option value="">Select Money Payment</option>
                    </select>
                  </Col>
                  
                  <Col md="2">
                    <label className="form-label">Date</label>
                    <DateInput
                      name="Date"
                      value={formData.Date}
                      onChange={(e: any) => handleInputChange("Date", e.target.value)}
                    />
                  </Col>

                  <Col md="4">
                    <label className="form-label">Ledger Name</label>
                    <select
                      className="form-control"
                      value={formData.LedgerName}
                      onChange={(e) => handleInputChange("LedgerName", e.target.value)}
                    >
                      <option value="">Select Ledger</option>
                      {ledgerList.map((ledger) => (
                        <option key={ledger.Id} value={ledger.Id}>
                          {ledger.Name || ledger.LedgerName || ledger.CompanyName}
                        </option>
                      ))}
                    </select>
                  </Col>

                  <Col md="3">
                    <label className="form-label">Purchase Ledger</label>
                    <select
                      className="form-control"
                      value={formData.PurchaseLedger}
                      onChange={(e) => handleInputChange("PurchaseLedger", e.target.value)}
                    >
                      <option value="">Select Purchase Ledger</option>
                      {purchaseLedgerList.map((ledger) => (
                        <option key={ledger.Id} value={ledger.Id}>
                          {ledger.Name || ledger.LedgerName || ledger.CompanyName}
                        </option>
                      ))}
                    </select>
                  </Col>

                  <Col md="6">
                    <label className="form-label">Narration</label>
                    <Input
                      type="text"
                      className="form-control"
                      placeholder="Enter Narration"
                      value={formData.Narration}
                      onChange={(e) => handleInputChange("Narration", e.target.value)}
                    />
                  </Col>

                  <Col md="3">
                    <label className="form-label">Mode</label>
                    <div className="d-flex align-items-center h-100 pb-2">
                      <div className="form-check form-check-inline">
                        <Input
                          className="form-check-input"
                          type="radio"
                          name="modeRadio"
                          id="modeManual"
                          value="Manual"
                          checked={formData.Mode === "Manual"}
                          onChange={(e) => handleInputChange("Mode", e.target.value)}
                        />
                        <label className="form-check-label mb-0" htmlFor="modeManual">Manual</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <Input
                          className="form-check-input"
                          type="radio"
                          name="modeRadio"
                          id="modeAuto"
                          value="Auto"
                          checked={formData.Mode === "Auto"}
                          onChange={(e) => handleInputChange("Mode", e.target.value)}
                        />
                        <label className="form-check-label mb-0" htmlFor="modeAuto">Auto</label>
                      </div>
                    </div>
                  </Col>

                  <Col md="3">
                    <label className="form-label">Amount</label>
                    <Input
                      type="number"
                      className="form-control"
                      value={formData.Amount}
                      onChange={(e) => handleInputChange("Amount", e.target.value)}
                    />
                  </Col>
                </Row>


                <Row className="mt-3">
                  <Col xs="12" className="overflow-auto">
                    <Table className="table table-bordered table-sm mb-0 align-middle shadow-sm">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "5%" }}>SNo</th>
                          <th style={{ width: "25%" }}>Invoice No.</th>
                          <th style={{ width: "20%" }}>Date</th>
                          <th style={{ width: "25%" }}>Due Amount</th>
                          <th style={{ width: "25%" }}>Paid Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gridRows.length > 0 ? (
                          gridRows.map((row, index) => (
                            <tr key={index}>
                              <td>{row.SNo}</td>
                              <td>{row.InvoiceNo}</td>
                              <td>{row.Date}</td>
                              <td>{row.DueAmount.toFixed(2)}</td>
                              <td>
                                {formData.Mode === "Manual" ? (
                                  <Input 
                                    type="number" 
                                    className="form-control form-control-sm"
                                    value={row.PaidAmount} 
                                    onChange={(e) => handleGridInputChange(index, e.target.value)} 
                                  />
                                ) : (
                                  (parseFloat(row.PaidAmount as string) || 0).toFixed(2)
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-3 text-muted">
                              No data found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Col>
                </Row>

                <Row className="mt-4">
                  <Col md="12">
                    <div className="d-flex flex-wrap gap-3">
                      <div className="p-3 bg-light border rounded flex-grow-1" style={{ minWidth: "200px" }}>
                        <h6 className="mb-1 text-muted fw-bold">Curr. Balance</h6>
                        <h4 className="mb-0 text-primary">₹ {formData.CurrBalance.toFixed(2)} <span className="fs-6 text-muted">Cr.</span></h4>
                      </div>
                      
                      <div className="p-3 bg-light border rounded flex-grow-1" style={{ minWidth: "200px" }}>
                        <h6 className="mb-1 text-muted fw-bold">Total Due Amount</h6>
                        <h4 className="mb-0 text-info">₹ {formData.LineTotalAmt.toFixed(2)}</h4>
                      </div>

                      <div className="p-3 bg-light border rounded flex-grow-1" style={{ minWidth: "200px" }}>
                        <h6 className="mb-1 text-muted fw-bold">Diff. Amt</h6>
                        <h4 className="mb-0 text-danger">₹ {formData.DiffAmt.toFixed(2)}</h4>
                      </div>
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter className="d-flex flex-row flex-nowrap gap-2 justify-content-end p-2 p-sm-3">
                <Btn color="warning" type="button" className="m-0">
                  <i className="fa fa-edit me-1"></i> Edit
                </Btn>
                <Btn color="primary" type="button" className="m-0" onClick={handleSave}>
                  <i className="bx bx-save me-2"></i> Save
                </Btn>
                <Btn color="dark" type="button" className="m-0">
                  <i className="bx bx-exit me-2"></i> Cancel
                </Btn>
                <Btn color="danger" type="button" className="m-0">
                  <i className="fa fa-print me-1"></i> Print
                </Btn>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default MoneyPayment;
