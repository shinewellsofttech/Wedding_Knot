import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/ModuleMaster/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/ModuleMaster`;

interface ModuleListState {
  ModuleMasterList: any[];
  isProgress: boolean;
  filterText: string;
}

/**
 * Lists module masters with search and CRUD support.
 */
const PageList_ModuleMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<ModuleListState>({
    ModuleMasterList: [],
    isProgress: true,
    filterText: "",
  });

  /**
   * Loads module master list.
   */
  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, setState, "ModuleMasterList", LIST_API_URL).catch((error) => {
      console.error("Failed to load module masters:", error);
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
    navigate("/addEditModuleMaster", { state: { Id: 0 } });
  };

  /**
   * Navigate to edit screen.
   */
  const handleEdit = (id: number | string) => {
    if (!id) return;
    navigate("/addEditModuleMaster", { state: { Id: id } });
  };

  /**
   * Delete selected module master.
   */
  const handleDelete = (id: number | string) => {
    if (!id) return;
    const itemToDelete = state.ModuleMasterList?.find((item: any) => String(item?.Id) === String(id));
    const itemName = itemToDelete?.Name || itemToDelete?.ItemName || itemToDelete?.LedgerName || itemToDelete?.CompanyName || itemToDelete?.UserName || itemToDelete?.VoucherName || itemToDelete?.GroupName || itemToDelete?.AdminName || itemToDelete?.Title || itemToDelete?.RoleName || itemToDelete?.CityName || itemToDelete?.StateName || itemToDelete?.CountryName || itemToDelete?.MaterialName || "this item";
    if (window.confirm(`Are you sure you want to delete '${itemName}'?`)) {
      Fn_DeleteData(dispatch, setState as any, Number(id), DELETE_API_URL, LIST_API_URL)
        .then(() => {
          loadData();
        })
        .catch((error) => {
          console.error("Failed to delete module master:", error);
          alert("Failed to delete module master. Please try again.");
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
   * Filter list based on search text.
   */
  const filteredList = useMemo(() => {
    const rawList = Array.isArray(state.ModuleMasterList) ? state.ModuleMasterList : [];
    const searchText = state.filterText.trim().toLowerCase();
    if (!searchText) {
      return rawList;
    }

    return rawList.filter((item) => {
      const fields = [item?.Name, item?.Path];
      return fields.some((field) => String(field ?? "").toLowerCase().includes(searchText));
    });
  }, [state.ModuleMasterList, state.filterText]);

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Module Master" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Card>
                <CardHeaderCommon title="Module Master List" tagClass="card-title mb-0" />
                <CardBody>
                  <Row className="mb-3">
                    <Col md="6" className="d-flex align-items-center">
                      <Label className="me-2 mb-0">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by name or path..."
                        value={state.filterText}
                        onChange={handleSearchChange}
                      />
                    </Col>
                    <Col md="6" className="text-end">
                      <Btn color="primary" onClick={handleAdd}>
                        <i className="fa fa-plus me-2" />
                        Add Module
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
                            <th>Module Name</th>
                            <th>Path</th>
                            <th>Status</th>
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
                                <td>{item?.Name ?? "-"}</td>
                                <td>{item?.Path ?? "-"}</td>
                                <td>
                                  <span className={`badge ${item?.IsActive ? "bg-success" : "bg-danger"}`}>
                                    {item?.IsActive ? "Active" : "Inactive"}
                                  </span>
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
    </>
  );
};

export default PageList_ModuleMaster;
