import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/ItemGroup/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/ItemGroup`;

interface ItemGroupListState {
  ItemGroupMasterList: any[];
  isProgress: boolean;
  filterText: string;
}

/**
 * Lists item groups with search and CRUD options.
 */
const PageList_ItemGroup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<ItemGroupListState>({
    ItemGroupMasterList: [],
    isProgress: true,
    filterText: "",
  });

  /**
   * Fetches item group list.
   */
  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, setState, "ItemGroupMasterList", LIST_API_URL).catch((error) => {
      console.error("Failed to load item groups:", error);
      setState((prev) => ({ ...prev, isProgress: false }));
    });
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Navigate to add form.
   */
  const handleAdd = () => {
    navigate("/addEditItemGroup", { state: { Id: 0 } });
  };

  /**
   * Navigate to edit form with id.
   */
  const handleEdit = (id: number | string) => {
    if (!id) return;
    navigate("/addEditItemGroup", { state: { Id: id } });
  };

  /**
   * Delete selected item group.
   */
  const handleDelete = (id: number | string) => {
    if (!id) return;
    const itemToDelete = state.ItemGroupMasterList?.find((item: any) => String(item?.Id) === String(id));
    const itemName = itemToDelete?.Name || itemToDelete?.ItemName || itemToDelete?.LedgerName || itemToDelete?.CompanyName || itemToDelete?.UserName || itemToDelete?.VoucherName || itemToDelete?.GroupName || itemToDelete?.AdminName || itemToDelete?.Title || itemToDelete?.RoleName || itemToDelete?.CityName || itemToDelete?.StateName || itemToDelete?.CountryName || itemToDelete?.MaterialName || "this item";
    if (window.confirm(`Are you sure you want to delete '${itemName}'?`)) {
      Fn_DeleteData(dispatch, setState as any, Number(id), DELETE_API_URL, LIST_API_URL)
        .then(() => {
          loadData();
        })
        .catch((error) => {
          console.error("Failed to delete item group:", error);
          alert("Failed to delete item group. Please try again.");
        });
    }
  };

  /**
   * Update search filter text.
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((prev) => ({
      ...prev,
      filterText: value,
    }));
  };

  /**
   * Filter item group list based on search text.
   */
  const filteredList = useMemo(() => {
    const rawList = Array.isArray(state.ItemGroupMasterList) ? state.ItemGroupMasterList : [];
    const searchText = state.filterText.trim().toLowerCase();
    if (!searchText) {
      return rawList;
    }

    return rawList.filter((item) => {
      const groupName = String(item?.GroupName ?? item?.Name ?? "").toLowerCase();
      return groupName.includes(searchText);
    });
  }, [state.ItemGroupMasterList, state.filterText]);

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Item Group" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Card>
                <CardHeaderCommon title="Item Group List" tagClass="card-title mb-0" />
                <CardBody>
                  <Row className="mb-3">
                    <Col md="6" className="d-flex align-items-center">
                      <Label className="me-2 mb-0">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by group name..."
                        value={state.filterText}
                        onChange={handleSearchChange}
                      />
                    </Col>
                    <Col md="6" className="text-end">
                      <Btn color="primary" onClick={handleAdd}>
                        <i className="fa fa-plus me-2" />
                        Add Item Group
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
                            <th>Group Name</th>
                            <th>Tax Group Id</th>
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
                                <td>{item?.GroupName ?? item?.Name ?? "-"}</td>
                                <td>{item?.F_TaxGroup ?? "-"}</td>
                                <td>{item?.IsActive === true ? "Active" : "Inactive"}</td>
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

export default PageList_ItemGroup;

