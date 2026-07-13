import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.UserMaster}/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.UserMaster}`;

interface UserListState {
  UserMasterList: any[];
  isProgress: boolean;
  filterText: string;
}

/**
 * Lists user masters with search and CRUD support.
 */
const PageList_UserMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<UserListState>({
    UserMasterList: [],
    isProgress: true,
    filterText: "",
  });

  /**
   * Loads user master list.
   */
  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, () => {}, "UserMasterList", LIST_API_URL)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.dataList ?? res?.data?.dataList ?? [];
        setState((prev) => ({ ...prev, UserMasterList: list, isProgress: false }));
      })
      .catch((error) => {
        console.error("Failed to load user masters:", error);
        setState((prev) => ({ ...prev, UserMasterList: [], isProgress: false }));
      });
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Navigate to add screen.
   */
  const handleAdd = () => {
    navigate("/addEditUserMaster", { state: { Id: 0 } });
  };

  /**
   * Navigate to edit screen.
   */
  const handleEdit = (id: number | string) => {
    if (!id) return;
    navigate("/addEditUserMaster", { state: { Id: id } });
  };

  /**
   * Delete selected user master.
   */
  const handleDelete = (id: number | string) => {
    if (!id) return;
    const itemToDelete = state.UserMasterList.find((item: any) => item?.Id === id);
    const itemName = itemToDelete?.Name || itemToDelete?.ItemName || itemToDelete?.LedgerName || itemToDelete?.CompanyName || itemToDelete?.UserName || itemToDelete?.VoucherName || itemToDelete?.GroupName || itemToDelete?.AdminName || itemToDelete?.Title || itemToDelete?.RoleName || itemToDelete?.CityName || itemToDelete?.StateName || itemToDelete?.CountryName || itemToDelete?.MaterialName || "this item";
    if (window.confirm(`Are you sure you want to delete '${itemName}'?`)) {

      Fn_DeleteData(dispatch, () => {}, Number(id), DELETE_API_URL).catch(() => {
        // Rollback the optimistic UI update if delete fails
        setState((prev) => {
          if (!itemToDelete) return prev;
          const newList = [...prev.UserMasterList, itemToDelete].sort((a, b) => a.Id - b.Id);
          return { ...prev, UserMasterList: newList };
        });
      });
      
      setState((prev) => ({
        ...prev,
        UserMasterList: prev.UserMasterList.filter((item: any) => item?.Id !== id),
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
   * Filter list: only UserType 2, then by search text.
   */
  const filteredList = useMemo(() => {
    const rawList = Array.isArray(state.UserMasterList) ? state.UserMasterList : [];
    const searchText = state.filterText.trim().toLowerCase();
    if (!searchText) {
      return rawList;
    }
    return rawList.filter((item) => {
      const fields = [
        item?.Username,
        item?.Name,
        item?.ContactEmail,
        item?.ContactMobile,
        item?.FullName,
        item?.CityName,
        item?.StateName
      ];
      return fields.some((field) => String(field ?? "").toLowerCase().includes(searchText));
    });
  }, [state.UserMasterList, state.filterText]);

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="User Master" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Card>
                <CardHeaderCommon title="User Master List" tagClass="card-title mb-0" />
                <CardBody>
                  <Row className="mb-3">
                    <Col md="6" className="d-flex align-items-center">
                      <Label className="me-2 mb-0">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by username, email, full name, or user type..."
                        value={state.filterText}
                        onChange={handleSearchChange}
                      />
                    </Col>
                    <Col md="6" className="text-end">
                      <Btn color="primary" onClick={handleAdd}>
                        <i className="fa fa-plus me-2" />
                        Add User Master
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
                            <th>Name / Username</th>
                            <th>Full Name</th>
                            <th>Mobile</th>
                            <th>Email</th>
                            <th>City</th>
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
                                <td>
                                  <strong>{item?.Name ?? "-"}</strong>
                                  <br/>
                                  <span className="text-muted small">@{item?.Username ?? "-"}</span>
                                </td>
                                <td>{item?.FullName ?? "-"}</td>
                                <td>{item?.ContactMobile ?? "-"}</td>
                                <td>{item?.ContactEmail ?? "-"}</td>
                                <td>{item?.CityName ?? "-"}</td>
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

export default PageList_UserMaster;

