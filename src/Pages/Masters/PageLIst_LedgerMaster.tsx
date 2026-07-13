import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.LedgerMaster}/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.LedgerMaster}`;

interface LedgerListState {
  LedgerMasterList: any[];
  isProgress: boolean;
  filterText: string;
}

/**
 * Lists ledger masters with search and CRUD support.
 */
const PageList_LedgerMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<LedgerListState>({
    LedgerMasterList: [],
    isProgress: true,
    filterText: "",
  });

  /**
   * Loads ledger master list.
   */
  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, setState, "LedgerMasterList", LIST_API_URL).catch((error) => {
      console.error("Failed to load ledger masters:", error);
      setState((prev) => ({ ...prev, isProgress: false }));
    });
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Navigate to add screen.
   */
  const handleAdd = () => {
    navigate("/addEditLedgerMaster", { state: { Id: 0 } });
  };

  /**
   * Navigate to edit screen.
   */
  const handleEdit = (id: number | string) => {
    if (!id) return;
    navigate("/addEditLedgerMaster", { state: { Id: id } });
  };

  /**
   * Delete selected ledger master.
   */
  const handleDelete = (id: number | string) => {
    if (!id) return;
    const itemToDelete = state.LedgerMasterList.find((item: any) => item?.Id === id);
    const itemName = itemToDelete?.Name || itemToDelete?.ItemName || itemToDelete?.LedgerName || itemToDelete?.CompanyName || itemToDelete?.UserName || itemToDelete?.VoucherName || itemToDelete?.GroupName || itemToDelete?.AdminName || itemToDelete?.Title || itemToDelete?.RoleName || itemToDelete?.CityName || itemToDelete?.StateName || itemToDelete?.CountryName || itemToDelete?.MaterialName || "this item";
    if (window.confirm(`Are you sure you want to delete '${itemName}'?`)) {

      Fn_DeleteData(dispatch, () => {}, Number(id), DELETE_API_URL).catch(() => {
        // Rollback the optimistic UI update if delete fails
        setState((prev) => {
          if (!itemToDelete) return prev;
          const newList = [...prev.LedgerMasterList, itemToDelete].sort((a, b) => a.Id - b.Id);
          return { ...prev, LedgerMasterList: newList };
        });
      });
      
      setState((prev) => ({
        ...prev,
        LedgerMasterList: prev.LedgerMasterList.filter((item: any) => item?.Id !== id),
      }));
    }
  };

  /**
   * Update search string.
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((prev) => ({
      ...prev,
      filterText: value,
    }));
  };

  /**
   * Filter list based on search text.
   */
  const filteredList = useMemo(() => {
    const rawList = Array.isArray(state.LedgerMasterList) ? state.LedgerMasterList : [];
    const searchText = state.filterText.trim().toLowerCase();
    if (!searchText) {
      return rawList;
    }

    return rawList.filter((item) => {
      const fields = [
        item?.Name,
        item?.LedgerGroupName || item?.F_LedgerGroupMaster,
        item?.Address,
        item?.Address1,
        item?.PhoneNo,
        item?.MobileNo,
        item?.Email,
        item?.GSTIN,
        item?.PANNo,
        item?.BankName,
        item?.BankAccountNo,
        item?.BankIFSCCode,
        item?.F_Type,
        item?.F_GSTType,
        item?.F_TaxPayerType,
        item?.F_CalculationType,
        item?.F_AddLess,
        item?.F_IntCalcMethod,
        item?.F_TCSonSales,
        item?.UserId,
      ];
      return fields.some((field) => String(field ?? "").toLowerCase().includes(searchText));
    });
  }, [state.LedgerMasterList, state.filterText]);

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Ledger Master" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Card>
                <CardHeaderCommon title="Ledger Master List" tagClass="card-title mb-0" />
                <CardBody>
                  <Row className="mb-3">
                    <Col md="6" className="d-flex align-items-center">
                      <Label className="me-2 mb-0">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by name, phone, email, GSTIN, PAN, etc..."
                        value={state.filterText}
                        onChange={handleSearchChange}
                      />
                    </Col>
                    <Col md="6" className="text-end">
                      <Btn color="primary" onClick={handleAdd}>
                        <i className="fa fa-plus me-2" />
                        Add Ledger Master
                      </Btn>
                    </Col>
                  </Row>

                  {state.isProgress ? (
                    <div className="text-center py-5">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table bordered hover striped>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Ledger Group</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredList.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-4">
                                No records found.
                              </td>
                            </tr>
                          ) : (
                            filteredList.map((item: any, index: number) => (
                              <tr key={item?.Id ?? index}>
                                <td>{index + 1}</td>
                                <td>{item?.Name ?? "-"}</td>
                                <td>{(item?.LedgerGroupName || item?.F_LedgerGroupMaster) ?? "-"}</td>
                                <td>
                                  <Btn color="primary" size="sm" className="me-2" onClick={() => handleEdit(item?.Id)}>
                                    <i className="fa fa-edit" />
                                  </Btn>
                                  <Btn color="danger" size="sm" onClick={() => handleDelete(item?.Id)}>
                                    <i className="fa fa-trash" />
                                  </Btn>
                                </td>
                              </tr>
                            ))
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
    </>
  );
};

export default PageList_LedgerMaster;
