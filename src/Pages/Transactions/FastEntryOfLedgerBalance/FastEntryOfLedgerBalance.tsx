import React, { useState, useEffect } from "react";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { useDispatch } from "react-redux";
import { Fn_FillListData, Fn_AddEditData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

interface LedgerGroup {
  Id: number;
  Name: string;
}

interface LedgerBalance {
  Id: number;
  Name: string;
  Address?: string;
  OpeningBalance: number;
  CrDrType: "Dr" | "Cr";
  F_LedgerGroupMaster?: number;
}

const FastEntryOfLedgerBalance: React.FC = () => {
  const dispatch = useDispatch();

  const [ledgerGroupId, setLedgerGroupId] = useState<string>("");
  const [ledgerGroupName, setLedgerGroupName] = useState<string>("");
  const [ledgerGroupList, setLedgerGroupList] = useState<LedgerGroup[]>([]);
  const [ledgerList, setLedgerList] = useState<LedgerBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // API URLs
  const LEDGER_GROUP_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/LedgerGroupMaster/Id/0`;

  // Load ledger groups on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Load ledger groups
        const groupData = await Fn_FillListData(
          dispatch,
          (prevState: any) => ({ ...prevState, ledgerGroups: [] }),
          "ledgerGroups",
          LEDGER_GROUP_LIST_URL
        );
        setLedgerGroupList(groupData || []);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [dispatch]);

  // Fetch ledgers by group ID from API using LedgerListByGroupId
  const fetchLedgersByGroup = async (groupId: string) => {
    if (!groupId || groupId === "0" || groupId === "") {
      setLedgerList([]);
      setHasChanges(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // API URL format: Masters/0/token/LedgerListByGroupId/Id/{groupId}
      const apiURL = `${API_WEB_URLS.MASTER}/0/token/LedgerListByGroupId/Id/${groupId}`;
      
      // Use Fn_FillListData for GET request
      const ledgerData = await Fn_FillListData(
        dispatch,
        (prevState: any) => ({ ...prevState, ledgers: [] }),
        "ledgers",
        apiURL
      );

      if (Array.isArray(ledgerData) && ledgerData.length > 0) {
        // Map the data to include opening balance fields
        const mappedLedgers: LedgerBalance[] = ledgerData.map((ledger: any) => ({
          Id: ledger.Id || 0,
          Name: ledger.Name || "",
          Address: ledger.Address || ledger.Address1 || "",
          OpeningBalance: Number(ledger.OpeningBalance) || 0,
          CrDrType: (ledger.CrDrType as "Dr" | "Cr") || (ledger.OpeningBalance >= 0 ? "Dr" : "Cr"),
          F_LedgerGroupMaster: Number(ledger.F_LedgerGroupMaster) || Number(groupId),
        }));
        setLedgerList(mappedLedgers);
      } else {
        setLedgerList([]);
      }
    } catch (error) {
      console.error("Error fetching ledgers by group:", error);
      setLedgerList([]);
    } finally {
      setIsLoading(false);
      setHasChanges(false);
    }
  };

  // Handle ledger group selection
  const handleLedgerGroupChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedId = e.target.value;
    setLedgerGroupId(selectedId);
    
    // Find and set ledger group name
    const selectedGroup = ledgerGroupList.find((g) => g.Id === Number(selectedId));
    setLedgerGroupName(selectedGroup?.Name || "");
    
    // Fetch ledgers for selected group from API
    await fetchLedgersByGroup(selectedId);
  };

  // Handle opening balance change
  const handleBalanceChange = (index: number, field: "OpeningBalance" | "CrDrType", value: string | number) => {
    setLedgerList((prev) => {
      const updated = [...prev];
      if (field === "OpeningBalance") {
        updated[index].OpeningBalance = Number(value) || 0;
      } else if (field === "CrDrType") {
        updated[index].CrDrType = value as "Dr" | "Cr";
      }
      setHasChanges(true);
      return updated;
    });
  };

  // Calculate total balance
  const calculateTotal = () => {
    let totalDr = 0;
    let totalCr = 0;

    ledgerList.forEach((ledger) => {
      if (ledger.CrDrType === "Dr") {
        totalDr += ledger.OpeningBalance;
      } else {
        totalCr += ledger.OpeningBalance;
      }
    });

    const netBalance = totalDr - totalCr;
    return {
      total: Math.abs(netBalance),
      type: netBalance >= 0 ? "Dr" : "Cr",
    };
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle Edit
  const handleEdit = () => {
    setIsEditMode(true);
  };

  // Handle Save
  const handleSave = async () => {
    if (!ledgerGroupId || ledgerGroupId === "0") {
      alert("Please select a ledger group");
      return;
    }

    try {
      setIsLoading(true);
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser.uid || "0";
      const userToken =  "token";

      // Prepare StrLedgerOpeningBalance in format: Id~OpeningBalance~CrDrType#
      // Example: "1~100~Cr#2~200~Dr#"
      const strLedgerOpeningBalance = ledgerList
        .map((ledger) => `${ledger.Id}~${ledger.OpeningBalance}~${ledger.CrDrType}`)
        .join("#") + "#";

      // Prepare data for saving according to API: UpdateLedgerOpeningBalance
      const formData = new FormData();
      formData.append("F_LedgerGroupMaster", String(Number(ledgerGroupId)));
      formData.append("StrLedgerOpeningBalance", strLedgerOpeningBalance);
      formData.append("UserId", String(Number(userId) || 0));
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      const arguList = {
        id: 0, // 0 for add, >0 for edit
        formData: formData,
      };

      // API: POST /api/V1/UpdateLedgerOpeningBalance/{UserId}/{UserToken}
      const apiURL = `UpdateLedgerOpeningBalance/${userId}/token`;
      
      await Fn_AddEditData(
        dispatch,
        (prevState: any) => ({ ...prevState, isProgress: false }),
        { arguList },
        apiURL,
        true
      );

      alert("Ledger balances saved successfully!");
      setIsEditMode(false);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving ledger balances:", error);
      alert("Failed to save ledger balances. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Cancel
  const handleCancel = async () => {
    if (hasChanges && window.confirm("You have unsaved changes. Are you sure you want to cancel?")) {
      // Reload data by fetching from API again
      if (ledgerGroupId) {
        await fetchLedgersByGroup(ledgerGroupId);
      }
      setIsEditMode(false);
      setHasChanges(false);
    } else if (!hasChanges) {
      setIsEditMode(false);
    }
  };

  // Handle Close
  const handleClose = () => {
    if (hasChanges && window.confirm("You have unsaved changes. Are you sure you want to close?")) {
      window.history.back();
    } else if (!hasChanges) {
      window.history.back();
    }
  };

  // Handle Refresh
  const handleRefresh = async () => {
    // Re-fetch ledgers from API if a group is selected
    if (ledgerGroupId) {
      await fetchLedgersByGroup(ledgerGroupId);
    } else {
      setLedgerList([]);
    }
  };

  const totalBalance = calculateTotal();

  return (
    <div className="page-body fast-entry-ledger-balance">
      <style>{`
        .fast-entry-ledger-balance { max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
        .fast-entry-ledger-balance .card-body { padding: 1rem; }
        .fast-entry-ledger-balance .table-responsive {
          overflow-x: auto;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          max-height: 500px;
          display: block;
        }
        .fast-entry-ledger-balance .table-responsive table { min-width: 300px; margin-bottom: 0; }
        .fast-entry-ledger-balance .table th,
        .fast-entry-ledger-balance .table td { vertical-align: middle; box-sizing: border-box; }
        .fast-entry-ledger-balance .table .op-bal-input,
        .fast-entry-ledger-balance .table .drcr-select {
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }
        .fast-entry-ledger-balance .card-footer {
          flex-wrap: nowrap;
          gap: 0.35rem;
          padding: 0.75rem 1rem;
        }
        .fast-entry-ledger-balance .card-footer .btn { margin: 0; flex-shrink: 0; }
        @media (max-width: 991.98px) {
          .fast-entry-ledger-balance .card-body { padding: 0.75rem; }
          .fast-entry-ledger-balance .table-responsive { max-height: 400px; }
          .fast-entry-ledger-balance .table th,
          .fast-entry-ledger-balance .table td { padding: 0.4rem 0.5rem; font-size: 0.875rem; }
          .fast-entry-ledger-balance .table .op-bal-input,
          .fast-entry-ledger-balance .table .drcr-select { font-size: 0.875rem; padding: 0.25rem 0.4rem; }
          .fast-entry-ledger-balance .card-footer { padding: 0.6rem 0.75rem; }
          .fast-entry-ledger-balance .card-footer .btn { font-size: 0.875rem; padding: 0.35rem 0.6rem; min-height: 38px; }
        }
        @media (max-width: 767.98px) {
          .fast-entry-ledger-balance .card-body { padding: 0.5rem; }
          .fast-entry-ledger-balance .filter-row > [class*="col-"] { margin-bottom: 0.5rem; }
          .fast-entry-ledger-balance .filter-row .d-flex.align-items-end { justify-content: flex-start; }
          .fast-entry-ledger-balance .table-responsive {
            max-height: 320px;
            margin-left: -0.5rem;
            margin-right: -0.5rem;
            padding-left: 0.25rem;
            padding-right: 0.25rem;
          }
          .fast-entry-ledger-balance .table th,
          .fast-entry-ledger-balance .table td { padding: 0.35rem 0.4rem; font-size: 0.8rem; }
          .fast-entry-ledger-balance .table th:first-child { width: 36px; min-width: 36px; }
          .fast-entry-ledger-balance .table .op-bal-input,
          .fast-entry-ledger-balance .table .drcr-select {
            font-size: 0.8rem;
            padding: 0.35rem 0.4rem;
            min-height: 36px;
          }
          .fast-entry-ledger-balance .card-footer {
            padding: 0.5rem;
            gap: 0.25rem;
          }
          .fast-entry-ledger-balance .card-footer .btn {
            padding: 0.3rem 0.5rem;
            font-size: 0.8rem;
          }
        }
        @media (max-width: 575.98px) {
          .fast-entry-ledger-balance .card-header .card-title { font-size: 0.9rem !important; line-height: 1.3; }
          .fast-entry-ledger-balance .card-body { padding: 0.4rem; }
          .fast-entry-ledger-balance .table-responsive { max-height: 280px; }
          .fast-entry-ledger-balance .table th,
          .fast-entry-ledger-balance .table td { padding: 0.28rem 0.35rem; font-size: 0.75rem; }
          .fast-entry-ledger-balance .table .op-bal-input,
          .fast-entry-ledger-balance .table .drcr-select { font-size: 0.75rem; padding: 0.3rem 0.35rem; min-height: 34px; }
          .fast-entry-ledger-balance .card-footer { padding: 0.4rem; gap: 0.2rem; }
          .fast-entry-ledger-balance .card-footer .btn { padding: 0.25rem 0.4rem; font-size: 0.75rem; }
        }
      `}</style>
      <Breadcrumbs mainTitle="Fast Entry Of Ledger Balance" parent="Transactions" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Fast Entry Of Ledger Balance" tagClass="card-title mb-0" />
              <CardBody>
                {/* Filter Section */}
                <Row className="mb-3 filter-row">
                  <Col xs="12" md="6">
                    <FormGroup>
                      <Label>Ledger Group</Label>
                      <Input
                        type="select"
                        value={ledgerGroupId}
                        onChange={handleLedgerGroupChange}
                        disabled={isEditMode}
                      >
                        <option value="">Select Ledger Group</option>
                        {ledgerGroupList.map((group) => (
                          <option key={group.Id} value={group.Id}>
                            {group.Name}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col xs="12" md="6" className="d-flex align-items-end pb-2 pb-md-0">
                    <Btn color="info" type="button" onClick={handleRefresh} className="ms-md-auto">
                      Refresh
                    </Btn>
                  </Col>
                </Row>

                {/* Ledger Balance Table */}
                {isLoading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 mb-0">Loading ledger data...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table bordered striped hover className="mb-0">
                      <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ width: "60px" }}>S. No.</th>
                          <th style={{ minWidth: "180px" }}>Ledger</th>
                          <th className="text-end" style={{ minWidth: "100px" }}>Op. Bal.</th>
                          <th style={{ width: "100px" }}>Dr/Cr</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerList.length > 0 ? (
                          ledgerList.map((ledger, index) => (
                            <tr key={ledger.Id || index}>
                              <td className="text-center">{index + 1}</td>
                              <td>{ledger.Name || "-"}</td>
                              <td className="text-end">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={ledger.OpeningBalance === 0 ? "" : ledger.OpeningBalance}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === "" || /^\d*\.?\d*$/.test(v)) handleBalanceChange(index, "OpeningBalance", v);
                                  }}
                                  className="text-end op-bal-input"
                                  disabled={!isEditMode}
                                />
                              </td>
                              <td className="text-center">
                                <Input
                                  type="select"
                                  value={ledger.CrDrType}
                                  onChange={(e) => handleBalanceChange(index, "CrDrType", e.target.value)}
                                  className="drcr-select"
                                  disabled={!isEditMode}
                                >
                                  <option value="Dr">Dr</option>
                                  <option value="Cr">Cr</option>
                                </Input>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center">
                              {ledgerGroupId
                                ? "No ledgers found for selected group. Please select a ledger group and click Refresh."
                                : "Please select a ledger group to view ledgers."}
                            </td>
                          </tr>
                        )}
                        {/* Total Row */}
                        {ledgerList.length > 0 && (
                          <tr className="table-info fw-bold">
                            <td colSpan={2} className="text-end">
                              Total
                            </td>
                            <td className="text-end">
                              {formatCurrency(totalBalance.total)} {totalBalance.type}
                            </td>
                            <td></td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
              <CardFooter className="text-end d-flex flex-nowrap gap-2 justify-content-end">
                <Btn
                  color="primary"
                  type="button"
                  onClick={handleEdit}
                  disabled={isEditMode || ledgerList.length === 0}
                >
                  Edit
                </Btn>
                <Btn
                  color="success"
                  type="button"
                  onClick={handleSave}
                  disabled={!isEditMode || !hasChanges || isLoading}
                >
                  Save
                </Btn>
                <Btn
                  color="warning"
                  type="button"
                  onClick={handleCancel}
                  disabled={!isEditMode}
                >
                  Cancel
                </Btn>
                <Btn color="secondary" type="button" onClick={handleClose}>
                  Close
                </Btn>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default FastEntryOfLedgerBalance;

