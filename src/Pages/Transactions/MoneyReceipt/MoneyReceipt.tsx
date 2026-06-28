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

const MoneyReceipt = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    SearchReceipt: "",
    Date: getCurrentDateYYYYMMDD(),
    LedgerName: "",
    SalesLedger: "",
    Narration: "",
    Mode: "Manual",
    Amount: 0,
    CurrBalance: 0,
    LineTotalAmt: 0,
    DiffAmt: 0,
  });

  const [gridRows, setGridRows] = useState<GridRow[]>([]);
  const [ledgerList, setLedgerList] = useState<any[]>([]);
  const [salesLedgerList, setSalesLedgerList] = useState<any[]>([]);
  const [receiptList, setReceiptList] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const url = `${API_WEB_URLS.MASTER}/0/token/SalesPartyLedgerMaster/Id/0`;
        const res = await Fn_FillListData(dispatch, () => {}, "ignored", url);
        
        let dataList: any[] = [];
        if (Array.isArray(res)) dataList = res;
        else if (res?.data?.dataList && Array.isArray(res.data.dataList)) dataList = res.data.dataList;
        else if (res?.dataList && Array.isArray(res.dataList)) dataList = res.dataList;
        else if (res?.data?.response && Array.isArray(res.data.response)) dataList = res.data.response;
        else if (res?.response && Array.isArray(res.response)) dataList = res.response;
        else if (res?.data && Array.isArray(res.data)) dataList = res.data;
        
        setLedgerList(dataList);

        const salesUrl = `${API_WEB_URLS.MASTER}/0/token/CashBankLedger/Id/0`;
        const salesRes = await Fn_FillListData(dispatch, () => {}, "ignored", salesUrl);
        let salesList: any[] = [];
        if (Array.isArray(salesRes)) salesList = salesRes;
        else if (salesRes?.data?.dataList && Array.isArray(salesRes.data.dataList)) salesList = salesRes.data.dataList;
        else if (salesRes?.dataList && Array.isArray(salesRes.dataList)) salesList = salesRes.dataList;
        else if (salesRes?.data?.response && Array.isArray(salesRes.data.response)) salesList = salesRes.data.response;
        else if (salesRes?.response && Array.isArray(salesRes.response)) salesList = salesRes.response;
        else if (salesRes?.data && Array.isArray(salesRes.data)) salesList = salesRes.data;
        
        setSalesLedgerList(salesList);

        const receiptUrl = `${API_WEB_URLS.MASTER}/0/token/MoneyReceiptData/Id/0`;
        const receiptRes = await Fn_FillListData(dispatch, () => {}, "ignored", receiptUrl);
        let receipts: any[] = [];
        if (Array.isArray(receiptRes)) receipts = receiptRes;
        else if (receiptRes?.data?.dataList && Array.isArray(receiptRes.data.dataList)) receipts = receiptRes.data.dataList;
        else if (receiptRes?.dataList && Array.isArray(receiptRes.dataList)) receipts = receiptRes.dataList;
        else if (receiptRes?.data?.response && Array.isArray(receiptRes.data.response)) receipts = receiptRes.data.response;
        else if (receiptRes?.response && Array.isArray(receiptRes.response)) receipts = receiptRes.response;
        else if (receiptRes?.data && Array.isArray(receiptRes.data)) receipts = receiptRes.data;
        
        setReceiptList(receipts);
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
    if (field === "SearchReceipt" && value) {
      const selectedReceipt = receiptList.find((r) => r.Id.toString() === value.toString());
      if (selectedReceipt) {
        setFormData((prev) => ({
          ...prev,
          SearchReceipt: value,
          Date: selectedReceipt.ReceiptDate ? selectedReceipt.ReceiptDate.split('T')[0] : prev.Date,
          LedgerName: selectedReceipt.F_LedgerMaster?.toString() || "",
          SalesLedger: selectedReceipt.F_SalesLedger?.toString() || "",
          Narration: selectedReceipt.Narration || "",
          Mode: selectedReceipt.ModeType ? "Auto" : "Manual",
          Amount: selectedReceipt.TotalAmount || 0,
          CurrBalance: selectedReceipt.CurrentBalance || 0,
          LineTotalAmt: selectedReceipt.LineTotal || 0,
          DiffAmt: selectedReceipt.DifferenceAmount || 0,
        }));

        let parsedDetails: any[] = [];
        try {
          if (selectedReceipt.MoneyReceiptDetails) {
            parsedDetails = typeof selectedReceipt.MoneyReceiptDetails === "string"
              ? JSON.parse(selectedReceipt.MoneyReceiptDetails)
              : selectedReceipt.MoneyReceiptDetails;
          }
        } catch (e) {
          console.error("Error parsing details", e);
        }

        const mappedRows: GridRow[] = parsedDetails.map((item: any, index: number) => ({
          SNo: index + 1,
          Id: item.F_SalesInvoiceH || 0,
          InvoiceNo: item.InvoiceNo || "",
          Date: item.InvoiceDate ? item.InvoiceDate.split('T')[0] : "",
          DueAmount: item.DueAmount || 0,
          PaidAmount: item.PaidAmount || 0,
        }));

        setGridRows(mappedRows);
        return;
      }
    } else if (field === "SearchReceipt" && !value) {
      setFormData((prev) => ({
        ...prev,
        SearchReceipt: "",
        LedgerName: "",
        SalesLedger: "",
        Narration: "  ",
        Amount: 0,
        LineTotalAmt: 0,
        DiffAmt: 0,
      }));
      setGridRows([]);
      return;
    }

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
        const url = `${API_WEB_URLS.MASTER}/0/token/GetSalesInvoices/Id/${value}`;
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
        console.error("Error fetching sales invoices", e);
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
    if (!formData.SalesLedger) {
      alert("Please select Sales Ledger");
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
    const apiSaveUrl = `${API_WEB_URLS.MASTER}/MoneyReceipt/${userId}/${userToken}`;

    const headerFormData = new FormData();
    headerFormData.append("ReceiptNo", formData.SearchReceipt || "");
    headerFormData.append("ReceiptDate", formData.Date);
    headerFormData.append("F_LedgerMaster", formData.LedgerName);
    headerFormData.append("F_SalesLedger", formData.SalesLedger);
    headerFormData.append("Narration", formData.Narration || "");
    headerFormData.append("ModeType", formData.Mode === "Auto" ? "true" : "false");
    headerFormData.append("TotalAmount", formData.Amount.toString());
    headerFormData.append("CurrentBalance", formData.CurrBalance.toString());
    headerFormData.append("LineTotal", formData.LineTotalAmt.toString());
    headerFormData.append("DifferenceAmount", formData.DiffAmt.toString());
    headerFormData.append("UserID", userId);

    const jsonDataArray = gridRows.filter(r => (parseFloat(r.PaidAmount as string) || 0) > 0).map((row) => ({
      F_SalesInvoiceH: row.Id,
      InvoiceNo: row.InvoiceNo,
      InvoiceDate: row.Date,
      DueAmount: row.DueAmount,
      PaidAmount: parseFloat(row.PaidAmount as string) || 0,
    }));

    headerFormData.append("JsonData", JSON.stringify(jsonDataArray));

    try {
      const API_URL_SAVE = "MoneyReceipt/0/token";
      await Fn_AddEditData(dispatch, () => {}, { arguList: { id: 0, formData: headerFormData } }, API_URL_SAVE, true, "memberid", navigate, "#");
      alert("Money Receipt saved successfully!");
      window.location.reload();
    } catch (e) {
      alert("Error saving data");
      console.error(e);
    }
  };

  const compactStyles = `
    @media (max-width: 991.98px) {
      .money-receipt-page .container-fluid { padding: 0.4rem !important; }
      .money-receipt-page .card-body { padding: 0.4rem !important; }
      .money-receipt-page .card-footer { padding: 0.35rem 0.4rem !important; }
      .money-receipt-page .form-label { font-size: 0.75rem; margin-bottom: 0.2rem; }
      .money-receipt-page .form-control { font-size: 0.8rem; height: 26px; padding: 0.2rem 0.35rem; }
      .money-receipt-page .btn { font-size: 0.8rem; padding: 0.22rem 0.4rem; }
    }
    @media (max-width: 767.98px) {
      .money-receipt-page .container-fluid { padding: 0.25rem !important; }
      .money-receipt-page .card-body { padding: 0.3rem !important; }
      .money-receipt-page .card-footer { padding: 0.25rem 0.3rem !important; }
      .money-receipt-page .form-label { font-size: 0.7rem; margin-bottom: 0.15rem; }
      .money-receipt-page .form-control { font-size: 0.75rem; height: 24px; padding: 0.15rem 0.28rem; }
      .money-receipt-page .btn { font-size: 0.75rem; padding: 0.18rem 0.35rem; }
    }
  `;

  return (
    <div className="page-body money-receipt-page" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <style>{compactStyles}</style>
      <Breadcrumbs mainTitle="Money Receipt" parent="Transactions" />
      <Container fluid className="px-2 px-sm-3">
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Money Receipt Details" tagClass="card-title mb-0" />
              <CardBody className="p-2 p-sm-3">
                <Row className="g-2 g-sm-3 mb-3">
                  <Col md="3">
                    <label className="form-label">Search Receipt</label>
                    <select
                      className="form-control"
                      value={formData.SearchReceipt}
                      onChange={(e) => handleInputChange("SearchReceipt", e.target.value)}
                    >
                      <option value="">Select Money Receipt</option>
                      {receiptList.map((receipt) => (
                        <option key={receipt.Id} value={receipt.Id}>
                          {receipt.ReceiptNo || `Receipt-${receipt.Id}`}
                        </option>
                      ))}
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
                    <label className="form-label">Sales Ledger</label>
                    <select
                      className="form-control"
                      value={formData.SalesLedger}
                      onChange={(e) => handleInputChange("SalesLedger", e.target.value)}
                    >
                      <option value="">Select Sales Ledger</option>
                      {salesLedgerList.map((ledger) => (
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
                        <h4 className="mb-0 text-primary">₹ {formData.CurrBalance.toFixed(2)} <span className="fs-6 text-muted">Dr.</span></h4>
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

export default MoneyReceipt;