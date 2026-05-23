import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  FormGroup,
  Input,
  Label,
  Row,
  Table,
} from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import DateInput from "../../../CommonElements/DateInput";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { useDispatch } from "react-redux";
import { Fn_GetReport, Fn_FillListData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { useNavigate } from "react-router-dom";

interface VoucherSearchResult {
  Id: number;
  VoucherNo: string;
  VoucherDate: string;
  VoucherType: string;
  DrLedger: string;
  CrLedger: string;
  Amount: number;
  ChequeNo: string | null;
  ChequeDate: string | null;
  Narration: string;
}

type SearchOnOption =
  | "VoucherNo"
  | "VoucherDate"
  | "ChequeNo"
  | "ChequeDate"
  | "Account"
  | "Narration"
  | "Amount";

const VouterSearch: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchOn, setSearchOn] = useState<SearchOnOption>("VoucherNo");
  const [searchValue, setSearchValue] = useState<string>("");
  const [voucherFromDate, setVoucherFromDate] = useState<string>("");
  const [voucherToDate, setVoucherToDate] = useState<string>("");
  const [chequeFromDate, setChequeFromDate] = useState<string>("");
  const [chequeToDate, setChequeToDate] = useState<string>("");
  const [searchResults, setSearchResults] = useState<VoucherSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdvanceSearchOpen, setIsAdvanceSearchOpen] = useState(false);
  const [ledgerList, setLedgerList] = useState<any[]>([]);

  // Advance Search Fields
  const [voucherNo, setVoucherNo] = useState<string>("");
  const [advanceVoucherFromDate, setAdvanceVoucherFromDate] = useState<string>("");
  const [advanceVoucherToDate, setAdvanceVoucherToDate] = useState<string>("");
  const [chequeNo, setChequeNo] = useState<string>("");
  const [advanceChequeFromDate, setAdvanceChequeFromDate] = useState<string>("");
  const [advanceChequeToDate, setAdvanceChequeToDate] = useState<string>("");
  const [selectedLedger, setSelectedLedger] = useState<string>("");
  const [narration, setNarration] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  // Load Ledger Master list for Account dropdown
  useEffect(() => {
    const loadLedgers = async () => {
      try {
        const ledgerData = await Fn_FillListData(
          dispatch,
          (prevState: any) => ({ ...prevState, ledgers: [] }),
          "ledgers",
          `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.LedgerMaster}/Id/0`
        );
        setLedgerList(ledgerData || []);
      } catch (error) {
        console.error("Error loading ledgers:", error);
      }
    };
    loadLedgers();
  }, [dispatch]);

  // Format date for API (DD-MM-YYYY)
  const formatDateForAPI = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string | null): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Handle Basic Search
  const handleSearch = async () => {
    // Validate based on search type
    if (searchOn === "VoucherDate") {
      if (!voucherFromDate || !voucherToDate) {
        alert("Please select both From Date and To Date");
        return;
      }
    } else if (searchOn === "ChequeDate") {
      if (!chequeFromDate || !chequeToDate) {
        alert("Please select both From Date and To Date");
        return;
      }
    } else {
      if (!searchValue.trim()) {
        alert("Please enter a search value");
        return;
      }
    }

    try {
      setIsLoading(true);
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser.uid || "0";
      const userToken = "token";

      const apiURL = `GetVoucherSearch/${userId}/${userToken}`;

      const formData = new FormData();
      formData.append("UserId", String(Number(userId) || 0));
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      // Set search parameters based on selected "Search On" option
      switch (searchOn) {
        case "VoucherNo":
          formData.append("VoucherNo", searchValue);
          break;
        case "VoucherDate":
          formData.append("VoucherFromDate", formatDateForAPI(voucherFromDate));
          formData.append("VoucherToDate", formatDateForAPI(voucherToDate));
          break;
        case "ChequeNo":
          formData.append("ChequeNo", searchValue);
          break;
        case "ChequeDate":
          formData.append("ChequeFromDate", formatDateForAPI(chequeFromDate));
          formData.append("ChequeToDate", formatDateForAPI(chequeToDate));
          break;
        case "Account":
          formData.append("F_LedgerMaster", searchValue);
          break;
        case "Narration":
          formData.append("Narration", searchValue);
          break;
        case "Amount":
          formData.append("Amount", searchValue);
          break;
      }

      const arguList = {
        formData: formData,
      };

      const responseData = await Fn_GetReport(
        dispatch,
        (prevState: any) => ({ ...prevState, searchResults: [] }),
        "searchResults",
        apiURL,
        { arguList },
        true
      );

      if (responseData && Array.isArray(responseData)) {
        setSearchResults(responseData);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching vouchers:", error);
      alert("Failed to search vouchers. Please try again.");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Advance Search
  const handleAdvanceSearch = async () => {
    try {
      setIsLoading(true);
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser.uid || "0";
      const userToken = "token";

      const apiURL = `GetVoucherSearch/${userId}/${userToken}`;

      const formData = new FormData();
      formData.append("VoucherNo", voucherNo || "");
      formData.append("VoucherFromDate", advanceVoucherFromDate ? formatDateForAPI(advanceVoucherFromDate) : "");
      formData.append("VoucherToDate", advanceVoucherToDate ? formatDateForAPI(advanceVoucherToDate) : "");
      formData.append("ChequeNo", chequeNo || "");
      formData.append("ChequeFromDate", advanceChequeFromDate ? formatDateForAPI(advanceChequeFromDate) : "");
      formData.append("ChequeToDate", advanceChequeToDate ? formatDateForAPI(advanceChequeToDate) : "");
      formData.append("F_LedgerMaster", selectedLedger || "");
      formData.append("Narration", narration || "");
      formData.append("Amount", amount || "");
      formData.append("UserId", String(Number(userId) || 0));
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      const arguList = {
        formData: formData,
      };

      const responseData = await Fn_GetReport(
        dispatch,
        (prevState: any) => ({ ...prevState, searchResults: [] }),
        "searchResults",
        apiURL,
        { arguList },
        true
      );

      if (responseData && Array.isArray(responseData)) {
        setSearchResults(responseData);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error in advance search:", error);
      alert("Failed to search vouchers. Please try again.");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Close
  const handleClose = () => {
    window.history.back();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle row click to open VoucherEntry
  const handleRowClick = (voucherId: number) => {
    if (voucherId && voucherId > 0) {
      navigate(`${process.env.PUBLIC_URL}/voucherEntry`, { state: { Id: voucherId } });
    }
  };

  return (
    <div className="page-body voucher-search-page">
      <style>{`
        .voucher-search-page .card-body {
          padding: 1rem 1rem;
        }
        .voucher-search-page .search-panel {
          border: 2px solid #dee2e6;
          background-color: #f8f9fa;
          padding: 0.75rem 0.75rem;
          border-radius: 0.25rem;
        }
        .voucher-search-page .search-panel .form-label,
        .voucher-search-page .search-panel label {
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
        }
        .voucher-search-page .search-panel .form-control,
        .voucher-search-page .search-panel input,
        .voucher-search-page .search-panel select {
          font-size: 0.9rem;
          padding: 0.35rem 0.5rem;
        }
        .voucher-search-page .search-actions {
          justify-content: flex-end;
          gap: 0.5rem;
        }
        .voucher-search-page .results-table-wrapper {
          max-height: 500px;
          overflow-y: auto;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .voucher-search-page .results-table-wrapper table {
          min-width: 650px;
          margin-bottom: 0;
        }
        .voucher-search-page .results-table-wrapper th,
        .voucher-search-page .results-table-wrapper td {
          vertical-align: middle;
        }
        @media (max-width: 991.98px) {
          .voucher-search-page .card-body {
            padding: 0.75rem;
          }
          .voucher-search-page .search-panel {
            padding: 0.6rem 0.6rem;
          }
          .voucher-search-page .results-table-wrapper {
            max-height: 420px;
          }
          .voucher-search-page .results-table-wrapper th,
          .voucher-search-page .results-table-wrapper td {
            padding: 0.4rem 0.45rem;
            font-size: 0.85rem;
          }
        }
        @media (max-width: 767.98px) {
          .voucher-search-page .card-body {
            padding: 0.5rem;
          }
          .voucher-search-page .search-panel .row.align-items-end > [class*="col-"] {
            margin-bottom: 0.5rem;
          }
          .voucher-search-page .search-actions {
            justify-content: flex-start;
            flex-wrap: wrap;
          }
          .voucher-search-page .search-actions .btn {
            padding: 0.3rem 0.6rem;
            font-size: 0.85rem;
          }
          .voucher-search-page .results-table-wrapper {
            max-height: 360px;
            margin-left: -0.5rem;
            margin-right: -0.5rem;
            padding-left: 0.25rem;
            padding-right: 0.25rem;
          }
          .voucher-search-page .results-table-wrapper table {
            min-width: 600px;
          }
          .voucher-search-page .results-table-wrapper th,
          .voucher-search-page .results-table-wrapper td {
            padding: 0.32rem 0.38rem;
            font-size: 0.8rem;
          }
        }
        @media (max-width: 575.98px) {
          .voucher-search-page .card-body {
            padding: 0.4rem;
          }
          .voucher-search-page .search-panel {
            padding: 0.45rem 0.5rem;
          }
          .voucher-search-page .results-table-wrapper {
            max-height: 320px;
          }
          .voucher-search-page .results-table-wrapper th,
          .voucher-search-page .results-table-wrapper td {
            padding: 0.28rem 0.32rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
      <Breadcrumbs mainTitle="Voucher Searching Utility" parent="Transactions" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Voucher Searching Utility"
                tagClass="card-title mb-0"
              />
              <CardBody>
                {/* Search Option Section */}
                <div className="mb-3 search-panel">
                  {!isAdvanceSearchOpen ? (
                    <>
                      <Label className="fw-bold mb-2">[Search Option]</Label>
                      <Row className="align-items-end">
                        <Col md="3">
                          <FormGroup>
                            <Label>Search On</Label>
                            <Input
                              type="select"
                              value={searchOn}
                              onChange={(e) => setSearchOn(e.target.value as SearchOnOption)}
                            >
                              <option value="VoucherNo">Voucher No</option>
                              <option value="VoucherDate">Voucher Date</option>
                              <option value="ChequeNo">Cheque No</option>
                              <option value="ChequeDate">Cheque Date</option>
                              <option value="Account">Account</option>
                              <option value="Narration">Narration</option>
                              <option value="Amount">Amount</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        {searchOn === "VoucherDate" ? (
                          <>
                            <Col md="2">
                              <FormGroup>
                                <Label>From Date</Label>
                                <DateInput
                                  value={voucherFromDate}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVoucherFromDate(e.target.value)}
                                />
                              </FormGroup>
                            </Col>
                            <Col md="2">
                              <FormGroup>
                                <Label>To Date</Label>
                                <DateInput
                                  value={voucherToDate}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVoucherToDate(e.target.value)}
                                />
                              </FormGroup>
                            </Col>
                          </>
                        ) : searchOn === "ChequeDate" ? (
                          <>
                            <Col md="2">
                              <FormGroup>
                                <Label>From Date</Label>
                                <DateInput
                                  value={chequeFromDate}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChequeFromDate(e.target.value)}
                                />
                              </FormGroup>
                            </Col>
                            <Col md="2">
                              <FormGroup>
                                <Label>To Date</Label>
                                <DateInput
                                  value={chequeToDate}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChequeToDate(e.target.value)}
                                />
                              </FormGroup>
                            </Col>
                          </>
                        ) : (
                          <Col md="4">
                            <FormGroup>
                              <Label>
                                {searchOn === "Account" ? "Select Account" : "Search Value"}
                              </Label>
                              {searchOn === "Account" ? (
                                <Input
                                  type="select"
                                  value={searchValue}
                                  onChange={(e) => setSearchValue(e.target.value)}
                                >
                                  <option value="">Select Account</option>
                                  {ledgerList.map((ledger) => (
                                    <option key={ledger.Id} value={ledger.Id}>
                                      {ledger.Name}
                                    </option>
                                  ))}
                                </Input>
                              ) : (
                                <Input
                                  type="text"
                                  value={searchValue}
                                  onChange={(e) => setSearchValue(e.target.value)}
                                  placeholder={`Enter ${searchOn}`}
                                />
                              )}
                            </FormGroup>
                          </Col>
                        )}
                        <Col xs="12" md="5" className="d-flex search-actions">
                          <Btn color="primary" type="button" onClick={handleSearch} disabled={isLoading}>
                            Search
                          </Btn>
                          <Btn
                            color="info"
                            type="button"
                            onClick={() => setIsAdvanceSearchOpen(true)}
                          >
                            Advance Search
                          </Btn>
                          <Btn color="secondary" type="button" onClick={handleClose}>
                            Close
                          </Btn>
                        </Col>
                      </Row>
                    </>
                  ) : (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Label className="fw-bold mb-0">[Advance Search Option]</Label>
                        <Btn
                          color="secondary"
                          type="button"
                          size="sm"
                          onClick={() => setIsAdvanceSearchOpen(false)}
                        >
                          Close
                        </Btn>
                      </div>
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <Label>Voucher No</Label>
                            <Input
                              type="text"
                              value={voucherNo}
                              onChange={(e) => setVoucherNo(e.target.value)}
                              placeholder="Enter Voucher No"
                            />
                            <small className="text-muted d-block mt-1">
                              Leave Blank Voucher No If Don't Want To Add In Search Criteria
                            </small>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>Voucher Date From</Label>
                            <DateInput
                              value={advanceVoucherFromDate}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdvanceVoucherFromDate(e.target.value)}
                              placeholder="DD/MM/YYYY"
                            />
                            <small className="text-muted d-block mt-1">
                              Leave Blank Voucher Date If Don't Want To Add In Search Criteria
                            </small>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>Voucher Date To</Label>
                            <DateInput
                              value={advanceVoucherToDate}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdvanceVoucherToDate(e.target.value)}
                              placeholder="DD/MM/YYYY"
                            />
                            <small className="text-muted d-block mt-1">
                              Leave Blank Voucher Date If Don't Want To Add In Search Criteria
                            </small>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>Account</Label>
                            <Input
                              type="select"
                              value={selectedLedger}
                              onChange={(e) => setSelectedLedger(e.target.value)}
                            >
                              <option value="">Select Account</option>
                              {ledgerList.map((ledger) => (
                                <option key={ledger.Id} value={ledger.Id}>
                                  {ledger.Name}
                                </option>
                              ))}
                            </Input>
                            <small className="text-muted d-block mt-1">
                              Leave Blank Account If Don't Want To Add In Search Criteria
                            </small>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>Cheque No</Label>
                            <Input
                              type="text"
                              value={chequeNo}
                              onChange={(e) => setChequeNo(e.target.value)}
                              placeholder="Enter Cheque No"
                            />
                            <small className="text-muted d-block mt-1">
                              Leave Blank Cheque No If Don't Want To Add In Search Criteria (Pattern Matching)
                            </small>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>Cheque Date From</Label>
                            <DateInput
                              value={advanceChequeFromDate}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdvanceChequeFromDate(e.target.value)}
                              placeholder="DD/MM/YYYY"
                            />
                            <small className="text-muted d-block mt-1">
                              Leave Blank Cheque Date If Don't Want To Add In Search Criteria
                            </small>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>Cheque Date To</Label>
                            <DateInput
                              value={advanceChequeToDate}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdvanceChequeToDate(e.target.value)}
                              placeholder="DD/MM/YYYY"
                            />
                            <small className="text-muted d-block mt-1">
                              Leave Blank Cheque Date If Don't Want To Add In Search Criteria
                            </small>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              value={amount}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "" || /^\d*\.?\d*$/.test(v)) setAmount(v);
                              }}
                              placeholder="Enter Amount"
                            />
                            <small className="text-muted d-block mt-1">
                              Leave Blank Amount If Don't Want To Add In Search Criteria Press F10 To Search Between Given Amount
                            </small>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>Narration</Label>
                            <Input
                              type="text"
                              value={narration}
                              onChange={(e) => setNarration(e.target.value)}
                              placeholder="Enter Narration"
                            />
                            <small className="text-muted d-block mt-1">
                              Leave Blank Narration If Don't Want To Add In Search Criteria (Pattern Matching)
                            </small>
                          </FormGroup>
                        </Col>
                      </Row>
                      <div className="text-center mt-3">
                        <Btn color="primary" type="button" onClick={handleAdvanceSearch} disabled={isLoading}>
                          Search
                        </Btn>
                      </div>
                    </>
                  )}
                </div>

                {/* Voucher Criteria Separator */}
                <div className="text-center mb-3">
                  <div
                    style={{
                      borderTop: "2px solid #dee2e6",
                      paddingTop: "8px",
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#fff",
                        padding: "0 15px",
                        position: "absolute",
                        top: "-12px",
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                    >
                      {"<<"} Voucher Criteria {">>>"}
                    </span>
                  </div>
                </div>

                {/* Results Table */}
                {isLoading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Searching vouchers...</p>
                  </div>
                ) : (
                  <div className="table-responsive results-table-wrapper">
                    <Table bordered striped hover className="mb-0">
                      <thead className="table-primary" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ width: "8%" }}>Vn</th>
                          <th style={{ width: "10%" }}>Voucher Date</th>
                          <th style={{ width: "22%" }}>Account</th>
                          <th className="text-end" style={{ width: "15%" }}>Amount</th>
                          <th style={{ width: "10%" }}>Cheque</th>
                          <th style={{ width: "10%" }}>Chq Dt</th>
                          <th style={{ width: "25%" }}>Narration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.length > 0 ? (
                          searchResults.map((voucher) => (
                            <tr
                              key={voucher.Id}
                              onClick={() => handleRowClick(voucher.Id)}
                              style={{ cursor: "pointer" }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#f0f0f0";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "";
                              }}
                            >
                              <td className="text-center">{voucher.VoucherNo}</td>
                              <td>{formatDateForDisplay(voucher.VoucherDate)}</td>
                              <td>
                                {voucher.DrLedger && voucher.CrLedger
                                  ? `${voucher.DrLedger} / ${voucher.CrLedger}`
                                  : voucher.DrLedger || voucher.CrLedger || "-"}
                              </td>
                              <td className="text-end">{formatCurrency(voucher.Amount)}</td>
                              <td className="text-center">{voucher.ChequeNo || "-"}</td>
                              <td>{formatDateForDisplay(voucher.ChequeDate)}</td>
                              <td>{voucher.Narration || "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center">
                              No vouchers found. Please search using the options above.
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
  );
};

export default VouterSearch;

