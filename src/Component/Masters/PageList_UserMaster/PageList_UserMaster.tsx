import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DeleteData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

const API_URL = API_WEB_URLS.MASTER + "/0/token/UserMaster/Id/0";

const PageList_UserMasterContainer = () => {
  const [state, setState] = useState({
    UserMasterList: [] as any[],
    isProgress: true,
    filterText: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = () => {
    Fn_FillListData(dispatch, setState, "UserMasterList", API_URL);
  };

  const handleEdit = (id: number) => {
    navigate("/addEdit_UserMaster", { state: { Id: id } });
  };

  const handleDelete = (id: number) => {
    console.log("handleDelete called with id:", id);
    if (!id || id === 0) {
      alert("Invalid ID for deletion");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user?")) {
      const deleteUrl = API_WEB_URLS.MASTER + "/0/token/UserMaster";
      console.log("Calling Fn_DeleteData with:", { id, deleteUrl });
      Fn_DeleteData(dispatch, setState, id, deleteUrl, API_URL)
        .then(() => {
          console.log("Delete successful, reloading data");
          loadData();
        })
        .catch((error) => {
          console.error("Delete error:", error);
          alert("Failed to delete. Please check console for details.");
        });
    }
  };

  const handleAdd = () => {
    navigate("/addEdit_UserMaster", { state: { Id: 0 } });
  };

  const filteredData = (Array.isArray(state.UserMasterList) ? state.UserMasterList : []).filter((item) => {
    const searchText = state.filterText.toLowerCase();
    return (
      (item.Name && item.Name.toLowerCase().includes(searchText)) ||
      (item.Email && item.Email.toLowerCase().includes(searchText)) ||
      (item.Phone && item.Phone.toString().includes(searchText))
    );
  });

  return (
    <>
      <Breadcrumbs mainTitle="User Master List" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="User Master List"
                tagClass="card-title mb-0"
              />
              <CardBody>
                <Row className="mb-3">
                  <Col md="6">
                    <div className="dataTables_filter d-flex align-items-center">
                      <Label className="me-2">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by name, email, or phone..."
                        value={state.filterText}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            filterText: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </Col>
                  <Col md="6" className="text-end">
                    <Btn
                      color="primary"
                      onClick={handleAdd}
                    >
                      <i className="fa fa-plus me-2"></i>Add New User
                    </Btn>
                  </Col>
                </Row>
                {state.isProgress ? (
                  <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>User Type</th>
                          <th>Department</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center p-4">
                              No data found
                            </td>
                          </tr>
                        ) : (
                          filteredData.map((item: any, index: number) => (
                            <tr key={item.Id || index}>
                              <td>{index + 1}</td>
                              <td>{item.Name || "-"}</td>
                              <td>{item.Email || "-"}</td>
                              <td>{item.Phone || "-"}</td>
                              <td>{item.UserTypeName || item.F_UserType || "-"}</td>
                              <td>{item.DepartmentName || item.F_DepartmentMaster || "-"}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    item.Status === "active"
                                      ? "bg-success"
                                      : item.Status === "inactive"
                                      ? "bg-secondary"
                                      : "bg-warning"
                                  }`}
                                >
                                  {item.Status || "active"}
                                </span>
                              </td>
                              <td>
                                <Btn
                                  color="primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleEdit(item.Id)}
                                >
                                  <i className="fa fa-edit"></i>
                                </Btn>
                                <Btn
                                  color="danger"
                                  size="sm"
                                  onClick={() => handleDelete(item.Id)}
                                >
                                  <i className="fa fa-trash"></i>
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
    </>
  );
};

export default PageList_UserMasterContainer;

