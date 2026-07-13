import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/FinancialYearMaster/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/FinancialYearMaster`;

interface CompanyYearListState {
  CompanyYearsList: any[];
  isProgress: boolean;
  filterText: string;
}

/**
 * Displays company financial years with CRUD controls.
 */
const PageList_CompanyYears = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<CompanyYearListState>({
    CompanyYearsList: [],
    isProgress: true,
    filterText: "",
  });

  /**
   * Loads company years into component state.
   */
  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, setState, "CompanyYearsList", LIST_API_URL).catch((error) => {
      console.error("Failed to load company years:", error);
      setState((prev) => ({ ...prev, isProgress: false }));
    });
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Navigates to add form.
   */
  const handleAdd = () => {
    navigate("/addEditCompanyYears", { state: { Id: 0 } });
  };

  /**
   * Navigates to edit form for selected record.
   */
  const handleEdit = (id: number | string) => {
    if (!id) return;
    navigate("/addEditCompanyYears", { state: { Id: id } });
  };

  /**
   * Deletes a company year after confirmation.
   */
  const handleDelete = (id: number | string) => {
    if (!id) return;
    const itemToDelete = state.CompanyYearsList.find((item: any) => item?.Id === id);
    const itemName = itemToDelete?.Name || itemToDelete?.ItemName || itemToDelete?.LedgerName || itemToDelete?.CompanyName || itemToDelete?.UserName || itemToDelete?.VoucherName || itemToDelete?.GroupName || itemToDelete?.AdminName || itemToDelete?.Title || itemToDelete?.RoleName || itemToDelete?.CityName || itemToDelete?.StateName || itemToDelete?.CountryName || itemToDelete?.MaterialName || "this item";
    if (window.confirm(`Are you sure you want to delete '${itemName}'?`)) {

      Fn_DeleteData(dispatch, () => {}, Number(id), DELETE_API_URL).catch(() => {
        // Rollback the optimistic UI update if delete fails
        setState((prev) => {
          if (!itemToDelete) return prev;
          const newList = [...prev.CompanyYearsList, itemToDelete].sort((a, b) => a.Id - b.Id);
          return { ...prev, CompanyYearsList: newList };
        });
      });
      
      setState((prev) => ({
        ...prev,
        CompanyYearsList: prev.CompanyYearsList.filter((item: any) => item?.Id !== id),
      }));
    }
  };

  /**
   * Updates search text state.
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((prev) => ({
      ...prev,
      filterText: value,
    }));
  };

  /**
   * Applies search filter across year and company fields.
   */
  const filteredList = useMemo(() => {
    const rawList = Array.isArray(state.CompanyYearsList) ? state.CompanyYearsList : [];
    const searchText = state.filterText.trim().toLowerCase();
    if (!searchText) {
      return rawList;
    }

    return rawList.filter((item) => {
      const fields = [
        item?.FinancialYearFrom,
        item?.FinancialYearTo,
        item?.FirmName,
        item?.IsCurrentFinancialYear,
      ];
      return fields.some((field) => String(field ?? "").toLowerCase().includes(searchText));
    });
  }, [state.CompanyYearsList, state.filterText]);

  const formatDate = (value: string | Date | undefined) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Company Years" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Card>
                <CardHeaderCommon title="Company Years List" tagClass="card-title mb-0" />
                <CardBody>
                  <Row className="mb-3">
                    <Col md="6" className="d-flex align-items-center">
                      <Label className="me-2 mb-0">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by year or company..."
                        value={state.filterText}
                        onChange={handleSearchChange}
                      />
                    </Col>
                    <Col md="6" className="text-end">
                      <Btn color="primary" onClick={handleAdd}>
                        <i className="fa fa-plus me-2" />
                        Add Company Year
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
                            <th>Financial Year</th>
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
                                <td>{formatDate(item?.FinancialYearFrom)} - {formatDate(item?.FinancialYearTo)}</td>
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

export default PageList_CompanyYears;
 
