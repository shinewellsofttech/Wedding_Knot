import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/BatchMaster/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/BatchMaster`;

interface BatchListState {
  BatchMasterList: any[];
  isProgress: boolean;
  filterText: string;
}

/**
 * Lists batch masters with search and CRUD support.
 */
const PageList_BatchMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<BatchListState>({
    BatchMasterList: [],
    isProgress: true,
    filterText: "",
  });

  /**
   * Loads batch master list.
   */
  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, setState, "BatchMasterList", LIST_API_URL).catch((error) => {
      console.error("Failed to load batch masters:", error);
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
    navigate("/addEditBatchMaster", { state: { Id: 0 } });
  };

  /**
   * Navigate to edit screen.
   */
  const handleEdit = (id: number | string) => {
    if (!id) return;
    navigate("/addEditBatchMaster", { state: { Id: id } });
  };

  /**
   * Delete selected batch master.
   */
  const handleDelete = (id: number | string) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this batch master?")) {
      Fn_DeleteData(dispatch, setState as any, Number(id), DELETE_API_URL, LIST_API_URL)
        .then(() => {
          loadData();
        })
        .catch((error) => {
          console.error("Failed to delete batch master:", error);
          alert("Failed to delete batch master. Please try again.");
        });
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
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  /**
   * Filter list based on search text.
   */
  const filteredList = useMemo(() => {
    const rawList = Array.isArray(state.BatchMasterList) ? state.BatchMasterList : [];
    const searchText = state.filterText.trim().toLowerCase();
    if (!searchText) {
      return rawList;
    }

    return rawList.filter((item) => {
      const fields = [item?.BatchNo, item?.ExpiryDate, String(item?.Quantity), String(item?.Rate)];
      return fields.some((field) => String(field ?? "").toLowerCase().includes(searchText));
    });
  }, [state.BatchMasterList, state.filterText]);

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Batch Master" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Card>
                <CardHeaderCommon title="Batch Master List" tagClass="card-title mb-0" />
                <CardBody>
                  <Row className="mb-3">
                    <Col md="6" className="d-flex align-items-center">
                      <Label className="me-2 mb-0">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by batch no, quantity, or rate..."
                        value={state.filterText}
                        onChange={handleSearchChange}
                      />
                    </Col>
                    <Col md="6" className="text-end">
                      <Btn color="primary" onClick={handleAdd}>
                        <i className="fa fa-plus me-2" />
                        Add Batch Master
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
                            <th>Batch No</th>
                            <th>Expiry Date</th>
                            <th>Quantity</th>
                            <th>Rate</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredList.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-4">
                                No records found.
                              </td>
                            </tr>
                          ) : (
                            filteredList.map((item: any, index: number) => (
                              <tr key={item?.Id ?? index}>
                                <td>{index + 1}</td>
                                <td>{item?.BatchNo ?? "-"}</td>
                                <td>{formatDate(item?.ExpiryDate)}</td>
                                <td className="text-end">{item?.Quantity ?? "-"}</td>
                                <td className="text-end">{item?.Rate ?? "-"}</td>
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

export default PageList_BatchMaster;
