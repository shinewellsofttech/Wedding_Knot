import React, { useState } from "react";
import { Container, Row, Col, Card, CardBody, CardFooter, Input, Table, ButtonGroup } from "reactstrap";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput/DateInput";
import { getCurrentDateYYYYMMDD } from "../../../helpers/dateUtils";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Btn } from "../../../AbstractElements";

interface GridRow {
  SNo: number;
  InvoiceNo: string;
  Date: string;
  DueAmount: number;
  PaidAmount: number;
}

const MoneyPayment = () => {
  const [formData, setFormData] = useState({
    SearchPayment: "",
    Date: getCurrentDateYYYYMMDD(),
    LedgerName: "",
    PurchaseLedger: "",
    Narration: "",
    Mode: "Manual",
    Amount: 0,
    CurrBalance: 0,
    LineTotalAmt: 14000,
    DiffAmt: 0,
  });

  const [gridRows, setGridRows] = useState<GridRow[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
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
                      <option value="Bhairaj Organics Pvt Limited">Bhairaj Organics Pvt Limited</option>
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
                          <th>SNo</th>
                          <th>Invoice No.</th>
                          <th>Date</th>
                          <th>Due Amount</th>
                          <th>Paid Amount</th>
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
                              <td>{row.PaidAmount.toFixed(2)}</td>
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
                        <h6 className="mb-1 text-muted fw-bold">Line Total Amt</h6>
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
                <Btn color="primary" type="button" className="m-0" outline>
                  <i className="fa fa-plus me-1"></i> Add
                </Btn>
                <Btn color="warning" type="button" className="m-0">
                  <i className="fa fa-edit me-1"></i> Edit
                </Btn>
                <Btn color="primary" type="button" className="m-0">
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
