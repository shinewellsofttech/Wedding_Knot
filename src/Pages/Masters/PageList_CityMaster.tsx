import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CityMaster}/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CityMaster}`;

interface CityListState {
  CityMasterList: any[];
  isProgress: boolean;
  filterText: string;
}

/**
 * Lists cities with state linkage and CRUD operations.
 */
const PageList_CityMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<CityListState>({
    CityMasterList: [],
    isProgress: true,
    filterText: "",
  });

  /**
   * Fetch cities from server.
   */
  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, setState, "CityMasterList", LIST_API_URL).catch((error) => {
      console.error("Failed to load cities:", error);
      setState((prev) => ({ ...prev, isProgress: false }));
    });
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Navigate to add city screen.
   */
  const handleAdd = () => {
    navigate("/addEditCityMaster", { state: { Id: 0 } });
  };

  /**
   * Navigate to edit city screen.
   */
  const handleEdit = (id: number | string) => {
    if (!id) return;
    navigate("/addEditCityMaster", { state: { Id: id } });
  };

  /**
   * Delete a city entry.
   */
  const handleDelete = (id: number | string) => {
    if (!id) return;
    const itemToDelete = state.CityMasterList.find((item: any) => item?.Id === id);
    const itemName = itemToDelete?.Name || itemToDelete?.ItemName || itemToDelete?.LedgerName || itemToDelete?.CompanyName || itemToDelete?.UserName || itemToDelete?.VoucherName || itemToDelete?.GroupName || itemToDelete?.AdminName || itemToDelete?.Title || itemToDelete?.RoleName || itemToDelete?.CityName || itemToDelete?.StateName || itemToDelete?.CountryName || itemToDelete?.MaterialName || "this item";
    if (window.confirm(`Are you sure you want to delete '${itemName}'?`)) {

      Fn_DeleteData(dispatch, () => {}, Number(id), DELETE_API_URL).catch(() => {
        // Rollback the optimistic UI update if delete fails
        setState((prev) => {
          if (!itemToDelete) return prev;
          const newList = [...prev.CityMasterList, itemToDelete].sort((a, b) => a.Id - b.Id);
          return { ...prev, CityMasterList: newList };
        });
      });
      
      setState((prev) => ({
        ...prev,
        CityMasterList: prev.CityMasterList.filter((item: any) => item?.Id !== id),
      }));
    }
  };

  /**
   * Update search text.
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((prev) => ({
      ...prev,
      filterText: value,
    }));
  };

  /**
   * Filter logic for cities.
   */
  const filteredList = useMemo(() => {
    const rawList = Array.isArray(state.CityMasterList) ? state.CityMasterList : [];
    const searchText = state.filterText.trim().toLowerCase();
    if (!searchText) {
      return rawList;
    }

    return rawList.filter((item) => {
      const fields = [item?.Name, item?.StateName];
      return fields.some((field) => String(field ?? "").toLowerCase().includes(searchText));
    });
  }, [state.CityMasterList, state.filterText]);

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="City Master" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Card>
                <CardHeaderCommon title="City Master List" tagClass="card-title mb-0" />
                <CardBody>
                  <Row className="mb-3">
                    <Col md="6" className="d-flex align-items-center">
                      <Label className="me-2 mb-0">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by city or state..."
                        value={state.filterText}
                        onChange={handleSearchChange}
                      />
                    </Col>
                    <Col md="6" className="text-end">
                      <Btn color="primary" onClick={handleAdd}>
                        <i className="fa fa-plus me-2" />
                        Add City
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
                            <th>City</th>
                            <th>State</th>
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
                                <td>{item?.StateName ?? "-"}</td>
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

export default PageList_CityMaster;

