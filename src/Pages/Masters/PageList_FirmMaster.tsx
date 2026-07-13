import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.FirmMaster}/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.FirmMaster}`;

interface FirmListState {
  FirmMasterList: any[];
  isProgress: boolean;
  filterText: string;
}

/**
 * Displays the firm master list with search, add, edit, and delete controls.
 */
const PageList_FirmMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<FirmListState>({
    FirmMasterList: [],
    isProgress: true,
    filterText: "",
  });

  /**
   * Fetches firm records and stores them in component state.
   */
  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, setState, "FirmMasterList", LIST_API_URL).catch((error) => {
      console.error("Failed to load firm list:", error);
      setState((prev) => ({ ...prev, isProgress: false }));
    });
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Navigates to the add firm form.
   */
  const handleAdd = () => {
    navigate("/addEditFirmMasster", { state: { Id: 0 } });
  };

  /**
   * Navigates to the edit form for the selected firm.
   */
  const handleEdit = (id: number | string) => {
    if (!id) return;
    navigate("/addEditFirmMasster", { state: { Id: id } });
  };

  /**
   * Removes a firm record after user confirmation.
   */
  const handleDelete = (id: number | string) => {
    if (!id) return;
    const itemToDelete = state.FirmMasterList?.find((item: any) => String(item?.Id) === String(id));
    const itemName = itemToDelete?.Name || itemToDelete?.ItemName || itemToDelete?.LedgerName || itemToDelete?.CompanyName || itemToDelete?.UserName || itemToDelete?.VoucherName || itemToDelete?.GroupName || itemToDelete?.AdminName || itemToDelete?.Title || itemToDelete?.RoleName || itemToDelete?.CityName || itemToDelete?.StateName || itemToDelete?.CountryName || itemToDelete?.MaterialName || "this item";
    if (window.confirm(`Are you sure you want to delete '${itemName}'?`)) {
      Fn_DeleteData(dispatch, setState as any, Number(id), DELETE_API_URL, LIST_API_URL)
        .then(() => {
          loadData();
        })
        .catch((error) => {
          console.error("Failed to delete firm:", error);
          alert("Failed to delete firm. Please try again.");
        });
    }
  };

  /**
   * Updates the search text used to filter firms.
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((prev) => ({
      ...prev,
      filterText: value,
    }));
  };

  /**
   * Applies the search filter across key firm fields.
   */
  const filteredList = useMemo(() => {
    const rawList = Array.isArray(state.FirmMasterList) ? state.FirmMasterList : [];
    const searchText = state.filterText.trim().toLowerCase();
    if (!searchText) {
      return rawList;
    }

    return rawList.filter((item) => {
      const fields = [
        item?.FirmName ?? item?.Name,
        item?.ContactPerson,
        item?.CompanyPhone ?? item?.CompanyPhoneNo,
        item?.CompanyMobile ?? item?.CompanyMobileNo,
        item?.CompanyEmail ?? item?.CompanyEMail,
        item?.ContactPersonMobile,
        item?.ContactPersonEmail ?? item?.ContactPersonEMail,
        item?.GSTIN,
        item?.MSMENumber ?? item?.MSMENo,
        item?.PANNumber ?? item?.PanNo,
        item?.StateName ?? item?.State,
        item?.CityName ?? item?.City,
      ];
      return fields.some((field) => String(field ?? "").toLowerCase().includes(searchText));
    });
  }, [state.FirmMasterList, state.filterText]);

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Firm Master" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Card>
                <CardHeaderCommon title="Firm Master List" tagClass="card-title mb-0" />
                <CardBody>
                  <Row className="mb-3">
                    <Col md="6" className="d-flex align-items-center">
                      <Label className="me-2 mb-0">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by name, email, or location..."
                        value={state.filterText}
                        onChange={handleSearchChange}
                      />
                    </Col>
                    <Col md="6" className="text-end">
                      <Btn color="primary" onClick={handleAdd}>
                        <i className="fa fa-plus me-2" />
                        Add Firm
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
                            <th>Firm Name</th>
                            <th>Contact Person</th>
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
                                <td>{item?.FirmName ?? item?.Name ?? "-"}</td>
                                <td>{item?.ContactPerson ?? "-"}</td>
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

export default PageList_FirmMaster;

