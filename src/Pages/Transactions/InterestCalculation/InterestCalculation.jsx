import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_GetReport, Fn_AddEditData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";


const InterestCalculation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  
  // State for dropdowns
  const [ledgerGroupId, setLedgerGroupId] = useState("");
  const [ledgerGroupList, setLedgerGroupList] = useState([]);
  const [selectedLedgerIds, setSelectedLedgerIds] = useState([]);
  const [ledgerList, setLedgerList] = useState([]);

  // State for form fields
  const [rate, setRate] = useState("12");
  const [creditDays, setCreditDays] = useState("45");
  const [yearDaysScheme, setYearDaysScheme] = useState("365");
  const [calculationType, setCalculationType] = useState("Simple");
  const [fromDate, setFromDate] = useState("");
  const [upToDate, setUpToDate] = useState("");

  // State for results
  const [resultData, setResultData] = useState([]);
  const [ledgerSelection, setLedgerSelection] = useState("Selected"); // All or Selected

  const [isLoading, setIsLoading] = useState(false);

  // API URLs
  const LEDGER_GROUP_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/LedgerGroupMaster/Id/0`;

  // Set default dates (Financial Year)
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();
    const financialYearStart = currentMonth >= 4 ? currentYear : currentYear - 1;
    setFromDate(`${financialYearStart}-04-01`);
    setUpToDate(`${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`);
  }, []);

  // Load ledger groups on mount
  useEffect(() => {
    const loadLedgerGroups = async () => {
      try {
        const groupData = await Fn_FillListData(
          dispatch,
          (prevState) => ({ ...prevState, ledgerGroups: [] }),
          "ledgerGroups",
          LEDGER_GROUP_LIST_URL
        );
        setLedgerGroupList(groupData || []);
      } catch (error) {
        console.error("Error loading ledger groups:", error);
        setLedgerGroupList([]);
      }
    };
    loadLedgerGroups();
  }, [dispatch]);

  // Fetch ledgers by group ID
  const fetchLedgersByGroup = async (groupId) => {
    if (!groupId || groupId === "0" || groupId === "") {
      setLedgerList([]);
      setSelectedLedgerIds([]);
      setResultData([]);
      return;
    }
    try {
      setIsLoading(true);
      const apiURL = `${API_WEB_URLS.MASTER}/0/token/LedgerListByGroupId/Id/${groupId}`;
      const ledgerData = await Fn_FillListData(
        dispatch,
        (prevState) => ({ ...prevState, ledgers: [] }),
        "ledgers",
        apiURL
      );
      if (Array.isArray(ledgerData) && ledgerData.length > 0) {
        setLedgerList(ledgerData);
      } else {
        setLedgerList([]);
      }
    } catch (error) {
      console.error("Error fetching ledgers by group:", error);
      setLedgerList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ledger group selection
  const handleLedgerGroupChange = async (e) => {
    const selectedId = e.target.value;
    setLedgerGroupId(selectedId);
    setSelectedLedgerIds([]);
    setResultData([]);
    await fetchLedgersByGroup(selectedId);
  };

  // Handle multi-select ledger change
  const handleLedgerChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected && options[i].value) {
        selected.push(options[i].value);
      }
    }
    setSelectedLedgerIds(selected);
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0.00";
    return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format date for API (YYYY-MM-DD) - SQL Server ISO format
  const formatDateForAPI = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  // Build comma-separated LedgerIds string
  const getLedgerIdsString = () => {
    if (ledgerSelection === "All") {
      return ledgerList.map((l) => String(l.Id)).join(",");
    }
    return selectedLedgerIds.join(",");
  };

  // Handle Calculate button
  const handleCalculate = async () => {
    if (!ledgerGroupId || ledgerGroupId === "0" || ledgerGroupId === "") {
      alert("Please select a ledger group");
      return;
    }
    if (ledgerSelection === "Selected" && selectedLedgerIds.length === 0) {
      alert("Please select at least one ledger");
      return;
    }
    if (!fromDate || !upToDate) {
      alert("Please select both From Date and Up To Date");
      return;
    }
    try {
      setIsLoading(true);
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = String(authUser?.Id ?? authUser?.uid ?? "0");
      const userToken = "token";

      const apiURL = `GetLedgerInterestCalculation/${userId}/${userToken}`;

      const formData = new FormData();
      formData.append("LedgerIds", getLedgerIdsString());
      formData.append("Rate", String(Number(rate) || 0));
      formData.append("CreditDays", String(Number(creditDays) || 0));
      formData.append("YearDays", String(Number(yearDaysScheme) || 365));
      formData.append("CalcType", calculationType === "Simple" ? "1" : "2");
      formData.append("FromDate", formatDateForAPI(fromDate));
      formData.append("ToDate", formatDateForAPI(upToDate));
      // formData.append("UserId", String(Number(userId) || 0));
      formData.append("UserId", "0");
      // formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser") || "{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch (e) { return "0"; } })());
      formData.append("F_CompanyMaster", "0");

      const arguList = { formData };

      const responseData = await Fn_GetReport(
        dispatch,
        (prevState) => ({ ...prevState, interestData: null }),
        "interestData",
        apiURL,
        { arguList },
        true
      );

      if (responseData && responseData.length > 0) {
        setResultData(responseData);
      } else {
        setResultData([]);
      }
    } catch (error) {
      console.error("Error calculating interest:", error);
      alert("Failed to calculate interest. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle View Detail button
  const handleViewDetail = () => {
    if (!ledgerGroupId || ledgerGroupId === "0" || ledgerGroupId === "") {
      alert("Please select a ledger group");
      return;
    }
    alert("View Detail functionality to be implemented");
  };

  // Handle View Summary button
  const handleViewSummary = () => {
    if (!ledgerGroupId || ledgerGroupId === "0" || ledgerGroupId === "") {
      alert("Please select a ledger group");
      return;
    }
    alert("View Summary functionality to be implemented");
  };

  // Handle Account Posting button
  const handleAccountPosting = async () => {
    if (!ledgerGroupId || ledgerGroupId === "0" || ledgerGroupId === "") {
      alert("Please select a ledger group");
      return;
    }
    if (resultData.length === 0) {
      alert("Please calculate interest first");
      return;
    }
    try {
      setIsLoading(true);
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = String(authUser?.Id ?? authUser?.uid ?? "0");
      const userToken = "token";
      const apiURL = `LedgerInterestPosting/0/${userToken}`;

      const formData = new FormData();
      formData.append("LedgerIds", getLedgerIdsString());
      formData.append("Rate", String(Number(rate) || 0));
      formData.append("CreditDays", String(Number(creditDays) || 0));
      formData.append("YearDays", String(Number(yearDaysScheme) || 365));
      formData.append("CalcType", calculationType === "Simple" ? "1" : "2");
      formData.append("FromDate", formatDateForAPI(fromDate));
      formData.append("ToDate", formatDateForAPI(upToDate));
      formData.append("UserId", String(Number(userId) || 0));
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser") || "{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch (e) { return "0"; } })());
      formData.append("InterestType", calculationType);

      await Fn_AddEditData(
        dispatch,
        (prevState) => ({ ...prevState }),
        { arguList: { id: 0, formData } },
        apiURL,
        true
      );
      alert("Interest posted to account successfully");
    } catch (error) {
      console.error("Error posting interest to account:", error);
      alert("Failed to post interest to account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Cancel button
  const handleCancel = () => {
    setLedgerGroupId("");
    setSelectedLedgerIds([]);
    setResultData([]);
    setRate("12");
    setCreditDays("45");
    setYearDaysScheme("365");
    setCalculationType("Simple");
    setLedgerSelection("Selected");
  };

  // Handle Close button
  const handleClose = () => {
    navigate(-1);
  };

  /* ─────────────────────────── Styles ──────────────────────────── */
  const sectionStyle = {
    background: "#f8f9fa",
    border: "1px solid #dee2e6",
    borderRadius: "6px",
    padding: "16px",
    marginBottom: "16px",
  };

  const sectionHeadStyle = {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0d6efd",
    borderBottom: "2px solid #dee2e6",
    paddingBottom: "8px",
    marginBottom: "14px",
    marginTop: 0,
  };

  /* ─────────────────────────── JSX ─────────────────────────────── */
  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Interest Calculation" parent="Transactions" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Interest Calculation" tagClass="card-title mb-0" />
              <CardBody>

                {/* ── Section 1 : Ledger Selection ─────────────────────── */}
                <div style={sectionStyle}>
                  <p style={sectionHeadStyle}>Ledger Selection</p>
                  <Row className="g-3">

                    <Col md="5">
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1">
                          Ledger Group <span className="text-danger">*</span>
                        </Label>
                        <Input
                          type="select"
                          value={ledgerGroupId}
                          onChange={handleLedgerGroupChange}
                        >
                          <option value="">-- Select Ledger Group --</option>
                          {ledgerGroupList.map((group) => (
                            <option key={group.Id || group.ID} value={group.Id || group.ID}>
                              {group.Name}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>

                    <Col md="5">
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1">
                          Ledger
                          {selectedLedgerIds.length > 0 && (
                            <span className="badge bg-primary ms-2">{selectedLedgerIds.length} selected</span>
                          )}
                          <small className="text-muted ms-2 fw-normal">(Hold Ctrl for multiple)</small>
                        </Label>
                        <Input
                          type="select"
                          multiple
                          value={selectedLedgerIds}
                          onChange={handleLedgerChange}
                          disabled={!ledgerGroupId || ledgerGroupId === "0" || isLoading || ledgerSelection === "All"}
                          style={{ height: "110px" }}
                        >
                          {ledgerList.map((ledger) => (
                            <option key={ledger.Id} value={ledger.Id}>
                              {ledger.Name}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>

                    <Col md="2">
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1">Apply To</Label>
                        <div className="d-flex flex-column gap-2 mt-1">
                          <FormGroup check className="mb-0">
                            <Input
                              type="radio"
                              name="ledgerSelection"
                              value="All"
                              checked={ledgerSelection === "All"}
                              onChange={(e) => {
                                setLedgerSelection(e.target.value);
                                setSelectedLedgerIds([]);
                              }}
                            />
                            <Label check>All Ledgers</Label>
                          </FormGroup>
                          <FormGroup check className="mb-0">
                            <Input
                              type="radio"
                              name="ledgerSelection"
                              value="Selected"
                              checked={ledgerSelection === "Selected"}
                              onChange={(e) => setLedgerSelection(e.target.value)}
                            />
                            <Label check>Selected Only</Label>
                          </FormGroup>
                        </div>
                      </FormGroup>
                    </Col>

                  </Row>
                </div>

                {/* ── Section 2 : Calculation Parameters ───────────────── */}
                <div style={sectionStyle}>
                  <p style={sectionHeadStyle}>Calculation Parameters</p>
                  <Row className="g-3 align-items-end">

                    <Col md="2">
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1">Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={rate}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "" || /^\d*\.?\d*$/.test(v)) setRate(v);
                          }}
                          placeholder="e.g. 12"
                        />
                      </FormGroup>
                    </Col>

                    <Col md="2">
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1">Credit Days</Label>
                        <Input
                          type="number"
                          min={0}
                          value={creditDays}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "" || /^\d*\.?\d*$/.test(v)) setCreditDays(v);
                          }}
                          placeholder="e.g. 45"
                        />
                      </FormGroup>
                    </Col>

                    <Col md="2">
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1">From Date</Label>
                        <DateInput
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                        />
                      </FormGroup>
                    </Col>

                    <Col md="2">
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1">Up To Date</Label>
                        <DateInput
                          value={upToDate}
                          onChange={(e) => setUpToDate(e.target.value)}
                        />
                      </FormGroup>
                    </Col>

                    <Col md="2">
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1">Year Days</Label>
                        <Input
                          type="select"
                          value={yearDaysScheme}
                          onChange={(e) => setYearDaysScheme(e.target.value)}
                        >
                          <option value="360">360 Days</option>
                          <option value="365">365 Days</option>
                          <option value="366">366 Days</option>
                        </Input>
                      </FormGroup>
                    </Col>

                    <Col md="2">
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1">Calc. Type</Label>
                        <Input
                          type="select"
                          value={calculationType}
                          onChange={(e) => setCalculationType(e.target.value)}
                        >
                          <option value="Simple">Simple</option>
                          <option value="Compound">Compound</option>
                        </Input>
                      </FormGroup>
                    </Col>

                  </Row>
                </div>

                {/* ── Section 3 : Result Table ──────────────────────────── */}
                {resultData.length > 0 && (
                  <div style={sectionStyle}>
                    <div className="d-flex justify-content-between align-items-center mb-2" style={{ borderBottom: "2px solid #dee2e6", paddingBottom: "8px" }}>
                      <p style={{ ...sectionHeadStyle, borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
                        Interest Calculation Result
                      </p>
                      <span className="badge bg-secondary">
                        {resultData.length} Record{resultData.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-bordered table-striped table-sm mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: "60px" }}>Sr.No</th>
                            <th>Ledger Name</th>
                            <th className="text-end">Ledger Balance</th>
                            <th className="text-end">Interest Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultData.map((row, idx) => (
                            <tr key={row.LedgerId || idx}>
                              <td className="text-center">{idx + 1}</td>
                              <td>{row.LedgerName}</td>
                              <td className="text-end">
                                <span className={parseFloat(row.LedgerBalance) < 0 ? "text-danger" : ""}>
                                  {formatCurrency(row.LedgerBalance)}
                                </span>
                              </td>
                              <td className="text-end">
                                <span className={parseFloat(row.InterestAmount) < 0 ? "text-danger" : "text-success fw-medium"}>
                                  {formatCurrency(row.InterestAmount)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="fw-bold table-warning">
                            <td colSpan="2" className="text-end">Grand Total</td>
                            <td className="text-end">
                              {formatCurrency(resultData.reduce((sum, r) => sum + (parseFloat(r.LedgerBalance) || 0), 0))}
                            </td>
                            <td className="text-end text-success">
                              {formatCurrency(resultData.reduce((sum, r) => sum + (parseFloat(r.InterestAmount) || 0), 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

              </CardBody>

              <CardFooter>
                <div className="d-flex gap-2 justify-content-end flex-wrap">
                  <Btn color="primary" type="button" onClick={handleCalculate} disabled={isLoading}>
                    {isLoading
                      ? <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" /> Calculating...</>
                      : "Calculate"}
                  </Btn>
                  <Btn color="info" type="button" onClick={handleViewDetail} disabled={isLoading}>
                    View Detail
                  </Btn>
                  <Btn color="warning" type="button" onClick={handleViewSummary} disabled={isLoading}>
                    View Summary
                  </Btn>
                  <Btn color="success" type="button" onClick={handleAccountPosting} disabled={isLoading || resultData.length === 0}>
                    Account Posting
                  </Btn>
                  <Btn color="secondary" type="button" onClick={handleCancel}>
                    Cancel
                  </Btn>
                  <Btn color="dark" type="button" onClick={handleClose}>
                    Close
                  </Btn>
                </div>
              </CardFooter>

            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default InterestCalculation;
