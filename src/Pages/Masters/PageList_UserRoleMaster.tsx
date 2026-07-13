import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/UserRole/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/UserRole`;

interface UserRoleListState {
  UserRoleMasterList: any[];
  isProgress: boolean;
  filterText: string;
}

/**
 * Lists user role masters with search and CRUD support.
 */
const PageList_UserRoleMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<UserRoleListState>({
    UserRoleMasterList: [],
    isProgress: true,
    filterText: "",
  });

  /**
   * Loads user role master list.
   */
  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, setState, "UserRoleMasterList", LIST_API_URL).catch((error) => {
      console.error("Failed to load user role masters:", error);
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
    navigate("/addEditUserRoleMaster", { state: { Id: 0 } });
  };

  /**
   * Navigate to edit screen.
   */
  const handleEdit = (id: number | string) => {
    if (!id) return;
    navigate("/addEditUserRoleMaster", { state: { Id: id } });
  };

  /**
   * Delete selected user role master.
   */
  const handleDelete = (id: number | string) => {
    if (!id) return;
    const itemToDelete = state.UserRoleMasterList.find((item: any) => item?.Id === id);
    const itemName = itemToDelete?.Name || itemToDelete?.ItemName || itemToDelete?.LedgerName || itemToDelete?.CompanyName || itemToDelete?.UserName || itemToDelete?.VoucherName || itemToDelete?.GroupName || itemToDelete?.AdminName || itemToDelete?.Title || itemToDelete?.RoleName || itemToDelete?.CityName || itemToDelete?.StateName || itemToDelete?.CountryName || itemToDelete?.MaterialName || "this item";
    if (window.confirm(`Are you sure you want to delete '${itemName}'?`)) {

      Fn_DeleteData(dispatch, () => {}, Number(id), DELETE_API_URL).catch(() => {
        // Rollback the optimistic UI update if delete fails
        setState((prev) => {
          if (!itemToDelete) return prev;
          const newList = [...prev.UserRoleMasterList, itemToDelete].sort((a, b) => a.Id - b.Id);
          return { ...prev, UserRoleMasterList: newList };
        });
      });
      
      setState((prev) => ({
        ...prev,
        UserRoleMasterList: prev.UserRoleMasterList.filter((item: any) => item?.Id !== id),
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
    const rawList = Array.isArray(state.UserRoleMasterList) ? state.UserRoleMasterList : [];
    const searchText = state.filterText.trim().toLowerCase();
    if (!searchText) {
      return rawList;
    }

    return rawList.filter((item) => {
      const fields = [item?.Name, item?.Code, item?.Description];
      return fields.some((field) => String(field ?? "").toLowerCase().includes(searchText));
    });
  }, [state.UserRoleMasterList, state.filterText]);

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="User Role Master" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Card>
                <CardHeaderCommon title="User Role Master List" tagClass="card-title mb-0" />
                <CardBody>
                  <Row className="mb-3">
                    <Col md="6" className="d-flex align-items-center">
                      <Label className="me-2 mb-0">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by name or code..."
                        value={state.filterText}
                        onChange={handleSearchChange}
                      />
                    </Col>
                    <Col md="6" className="text-end">
                      <Btn color="primary" onClick={handleAdd}>
                        <i className="fa fa-plus me-2" />
                        Add User Role
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
                            <th>Role Name</th>
                            <th>Role Code</th>
                            <th>Description</th>
                            <th>Status</th>
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
                                <td>{item?.Name ?? "-"}</td>
                                <td>{item?.Code ?? "-"}</td>
                                <td>{item?.Description ?? "-"}</td>
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

export default PageList_UserRoleMaster;
