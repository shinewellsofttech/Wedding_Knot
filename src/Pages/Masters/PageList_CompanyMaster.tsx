import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CompanyMaster}/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CompanyMaster}`;

interface CompanyListState {
  CompanyMasterList: any[];
  isProgress: boolean;
  filterText: string;
}

/**
 * Lists company masters with search and CRUD support.
 */
const PageList_CompanyMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<CompanyListState>({
    CompanyMasterList: [],
    isProgress: true,
    filterText: "",
  });

  /**
   * Loads company master list.
   */
  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, setState, "CompanyMasterList", LIST_API_URL)
      .then(() => {
        setState((prev) => ({ ...prev, isProgress: false }));
      })
      .catch((error) => {
        console.error("Failed to load company masters:", error);
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
    navigate("/addEditCompanyMaster", { state: { Id: 0 } });
  };

  /**
   * Navigate to edit screen.
   */
  const handleEdit = (id: number | string) => {
    if (!id) return;
    navigate("/addEditCompanyMaster", { state: { Id: id } });
  };

  /**
   * Delete selected company master.
   */
  const handleDelete = (id: number | string) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this company master?")) {
      Fn_DeleteData(dispatch, setState as any, Number(id), DELETE_API_URL, LIST_API_URL)
        .then(() => {
          loadData();
        })
        .catch((error) => {
          console.error("Failed to delete company master:", error);
          alert("Failed to delete company master. Please try again.");
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
    const rawList = Array.isArray(state.CompanyMasterList) ? state.CompanyMasterList : [];
    const searchText = state.filterText.trim().toLowerCase();
    if (!searchText) {
      return rawList;
    }
    return rawList.filter((item) => {
      const name = String(item.Name || item.CompanyName || "").toLowerCase();
      const shortName = String(item.ShortName || "").toLowerCase();
      const city = String(item.City || "").toLowerCase();
      const stateName = String(item.State || "").toLowerCase();
      return (
        name.includes(searchText) ||
        shortName.includes(searchText) ||
        city.includes(searchText) ||
        stateName.includes(searchText)
      );
    });
  }, [state.CompanyMasterList, state.filterText]);

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Company Master" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Company Master List" tagClass="card-title mb-0" />
              <CardBody>
                <Row className="mb-3">
                  <Col md="6">
                    <Label>Search</Label>
                    <Input
                      type="text"
                      placeholder="Search by company name, short name, city, or state..."
                      value={state.filterText}
                      onChange={handleSearchChange}
                    />
                  </Col>
                  <Col md="6" className="text-end">
                    <Btn color="primary" type="button" onClick={handleAdd} className="mt-4">
                      Add New Company
                    </Btn>
                  </Col>
                </Row>

                {state.isProgress ? (
                  <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading company masters...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table bordered striped hover className="mb-0">
                      <thead className="table-primary">
                        <tr>
                          <th>#</th>
                          <th>Company Name</th>
                          <th>Short Name</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredList.length > 0 ? (
                          filteredList.map((company, index) => (
                            <tr key={company.Id || company.ID || index}>
                              <td>{index + 1}</td>
                              <td>{company.Name || company.CompanyName || "-"}</td>
                              <td>{company.ShortName || "-"}</td>
                              <td>
                                <Btn
                                  color="primary"
                                  type="button"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleEdit(company.Id || company.ID || 0)}
                                >
                                  Edit
                                </Btn>
                                <Btn
                                  color="danger"
                                  type="button"
                                  size="sm"
                                  onClick={() => handleDelete(company.Id || company.ID || 0)}
                                >
                                  Delete
                                </Btn>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center">
                              {state.filterText ? "No companies found matching your search." : "No company masters found."}
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

export default PageList_CompanyMaster;

