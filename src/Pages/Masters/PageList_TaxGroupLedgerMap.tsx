import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const API_TAX_GROUP_LEDGER_MAP = "TaxGroupLedgerMap";
const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_TAX_GROUP_LEDGER_MAP}/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_TAX_GROUP_LEDGER_MAP}`;

interface TaxGroupLedgerMapListState {
  MapList: any[];
  isProgress: boolean;
  filterText: string;
}

const PageList_TaxGroupLedgerMap = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<TaxGroupLedgerMapListState>({
    MapList: [],
    isProgress: true,
    filterText: "",
  });

  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, setState as any, "MapList", LIST_API_URL).catch((error) => {
      console.error("Failed to load Tax Group Ledger Map:", error);
      setState((prev) => ({ ...prev, isProgress: false }));
    });
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = () => {
    navigate("/addEditTaxGroupLedgerMap", { state: { Id: 0 } });
  };

  const handleEdit = (id: number | string) => {
    if (!id) return;
    navigate("/addEditTaxGroupLedgerMap", { state: { Id: id } });
  };

  const handleDelete = (id: number | string) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this mapping?")) {
      Fn_DeleteData(dispatch, setState as any, Number(id), DELETE_API_URL, LIST_API_URL)
        .then(() => loadData())
        .catch((error) => {
          console.error("Failed to delete mapping:", error);
          alert("Failed to delete mapping. Please try again.");
        });
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, filterText: event.target.value }));
  };

  const filteredList = useMemo(() => {
    const rawList = Array.isArray(state.MapList) ? state.MapList : [];
    const searchText = state.filterText.trim().toLowerCase();
    if (!searchText) return rawList;
    return rawList.filter((item) => {
      const taxGroup = String(item?.TaxGroupName ?? item?.groupName ?? item?.F_TaxGroup ?? "").toLowerCase();
      const ledger = String(item?.LedgerName ?? item?.Name ?? item?.F_LedgerMaster ?? "").toLowerCase();
      return taxGroup.includes(searchText) || ledger.includes(searchText);
    });
  }, [state.MapList, state.filterText]);

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Tax Group Ledger Map" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Tax Group Ledger Map List" tagClass="card-title mb-0" />
              <CardBody>
                <Row className="mb-3">
                  <Col md="6" className="d-flex align-items-center">
                    <Label className="me-2 mb-0">Search:</Label>
                    <Input
                      type="search"
                      placeholder="Search by tax group or ledger..."
                      value={state.filterText}
                      onChange={handleSearchChange}
                    />
                  </Col>
                  <Col md="6" className="text-end">
                    <Btn color="primary" onClick={handleAdd}>
                      <i className="fa fa-plus me-2" />
                      Add Tax Group Ledger Map
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
                          <th>Tax Group</th>
                          <th>Ledger</th>
                          <th>Is Own State</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4">
                              No records found.
                            </td>
                          </tr>
                        ) : (
                          filteredList.map((item: any, index: number) => (
                            <tr key={item?.Id ?? index}>
                              <td>{index + 1}</td>
                              <td>{item?.TaxGroupName ?? item?.groupName ?? item?.F_TaxGroup ?? "-"}</td>
                              <td>{item?.LedgerName ?? item?.Name ?? item?.F_LedgerMaster ?? "-"}</td>
                              <td>
                                {item?.IsOwnState === true || item?.IsOwnState === "true" || item?.isOwnState === true
                                  ? "Yes"
                                  : "No"}
                              </td>
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
  );
};

export default PageList_TaxGroupLedgerMap;
