import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Table,
} from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import { Fn_FillListData, Fn_AddEditData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { Edit, Eye, Save, Shield, Users } from "react-feather";

const API_URL_USERS = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.UserMaster}`;
const API_URL_PAGE_MASTER = `${API_WEB_URLS.MASTER}/0/token/PageMaster`;

const UserRights = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showRightsModal, setShowRightsModal] = useState(false);
  const [userRights, setUserRights] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: "", message: "" });
  const [isViewMode, setIsViewMode] = useState(false);
  const [tempUserRightsData, setTempUserRightsData] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<{ id: string; name: string; description: string; pageType?: string }[]>([]);
  const [filterText, setFilterText] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [permissionCategory, setPermissionCategory] = useState<string>("");
  const [state, setState] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userList = await Fn_FillListData(dispatch, () => {}, "gridData", API_URL_USERS + "/Id/0");
        setUsers(Array.isArray(userList) ? userList : []);
        setOriginalData(Array.isArray(userList) ? userList : []);

        const pageList = await Fn_FillListData(dispatch, () => {}, "gridData", API_URL_PAGE_MASTER + "/Id/0");
        const list = Array.isArray(pageList) ? pageList : [];
        const transformed = list.map((page: any) => ({
          id: String(page.Id),
          name: page.Name,
          description: `${page.PageType || ""} - ${page.Name}`,
          pageType: page.PageType,
        }));
        setPermissions(transformed);
      } catch (e) {
        setUsers([]);
        setOriginalData([]);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const filteredUsers = useMemo(() => {
    if (!filterText.trim()) return users;
    const q = filterText.trim().toLowerCase();
    return users.filter(
      (u) =>
        (u.Name || "").toLowerCase().includes(q) ||
        (u.FullName || "").toLowerCase().includes(q) ||
        (u.Email || "").toLowerCase().includes(q)
    );
  }, [users, filterText]);

  const getRoleClass = (role: string) => {
    if (role === "Admin") return "bg-danger";
    if (role === "User") return "bg-success";
    return "bg-light text-dark";
  };

  const getRoleDisplay = (user: any) => {
    if (user?.F_UserType === 1 || user?.UserType === 1) return "Admin";
    return user?.Role || "User";
  };

  const fetchUserRights = async (userId: number) => {
    const url = `${API_WEB_URLS.MASTER}/0/token/UserRightsById/Id/${userId}`;
    setTempUserRightsData([]);
    try {
      const data = await Fn_FillListData(dispatch, () => {}, "userRightsData", url);
      setTempUserRightsData(Array.isArray(data) ? data : []);
    } catch {
      setTempUserRightsData([]);
    }
  };

  useEffect(() => {
    if (permissions.length === 0) return;
    const rights: Record<string, boolean> = {};
    permissions.forEach((p) => {
      rights[p.id] = false;
    });
    if (tempUserRightsData && tempUserRightsData.length > 0) {
      tempUserRightsData.forEach((item: any) => {
        const perm = permissions.find(
          (p) =>
            (item.PageID && p.id === String(item.PageID)) ||
            (item.F_PageMaster && p.id === String(item.F_PageMaster)) ||
            (item.Name && p.name.toLowerCase() === (item.Name || "").toLowerCase())
        );
        if (perm) {
          rights[perm.id] = item.IsHavingRights === true || item.IsHavingRights === 1;
        }
      });
    }
    setUserRights(rights);
  }, [tempUserRightsData, permissions]);

  const handleEditRights = async (user: any) => {
    setSelectedUser(user);
    setIsViewMode(false);
    setShowRightsModal(true);
    await fetchUserRights(user.Id);
  };

  const handleViewRights = async (user: any) => {
    setSelectedUser(user);
    setIsViewMode(true);
    setShowRightsModal(true);
    await fetchUserRights(user.Id);
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setUserRights((prev) => ({ ...prev, [permissionId]: checked }));
  };

  const handleSelectAll = () => {
    setUserRights((prev) => {
      const next = { ...prev };
      filteredPermissions.forEach((p) => { next[p.id] = true; });
      return next;
    });
  };

  const handleDeselectAll = () => {
    setUserRights((prev) => {
      const next = { ...prev };
      filteredPermissions.forEach((p) => { next[p.id] = false; });
      return next;
    });
  };

  const handleSaveRights = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const pageListString = Object.keys(userRights)
        .map((id) => `${id}~${userRights[id] ? 1 : 0}`)
        .join("#");
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser?.Id ?? authUser?.uid ?? 0;
      const userToken = authUser?.Token ?? authUser?.token ?? "token";
      const apiUrl = `UserRights/${userId}/${userToken}`;

      const formData = new FormData();
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());
      formData.append("F_UserMaster", String(selectedUser.Id));
      formData.append("StrPageList", pageListString);

      await Fn_AddEditData(
        dispatch,
        setState,
        { arguList: { id: 0, formData } },
        apiUrl,
        true,
        "userRights",
        navigate,
        "#"
      );

      setAlertMessage({ show: true, type: "success", message: `Rights updated for ${selectedUser.FullName}` });
      setShowRightsModal(false);
      setTimeout(() => setAlertMessage({ show: false, type: "", message: "" }), 3000);
    } catch {
      setAlertMessage({ show: true, type: "danger", message: "Error saving rights." });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowRightsModal(false);
    setSelectedUser(null);
    setUserRights({});
    setIsViewMode(false);
    setTempUserRightsData([]);
    setPermissionSearch("");
    setPermissionCategory("");
  };

  const isRestrictedPageForUserType2 = (name: string) => {
    const n = (name || "").toLowerCase().replace(/\s+/g, "");
    return (
      n.includes("userrights") ||
      n.includes("adminmaster") ||
      n.includes("usermaster")
    );
  };

  const filteredPermissions = useMemo(() => {
    let list = permissions;
    const ut = selectedUser?.F_UserType ?? selectedUser?.UserType ?? selectedUser?.UserTypeId;
    const isSelectedUserType2 = Number(ut) === 2 || ut === "2";
    if (isSelectedUserType2) {
      list = list.filter((p) => !isRestrictedPageForUserType2(p.name || ""));
    }
    if (permissionSearch.trim()) {
      const q = permissionSearch.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }
    if (permissionCategory) {
      list = list.filter(
        (p) => (p.pageType || "").toLowerCase() === permissionCategory.toLowerCase()
      );
    }
    return list;
  }, [permissions, permissionSearch, permissionCategory, selectedUser]);

  const categoryOptions = useMemo(() => {
    const types = new Set(permissions.map((p) => (p.pageType || "").trim()).filter(Boolean));
    return Array.from(types).sort();
  }, [permissions]);

  const handleResetFilter = () => {
    setUsers(originalData);
    setFilterText("");
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="User Rights Management" parent="Tools" />
        <Container fluid>
          {alertMessage.show && (
            <div className={`alert alert-${alertMessage.type} mb-3`} role="alert">
              {alertMessage.message}
            </div>
          )}
          <Row>
            <Col lg="12">
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <Users className="me-2" size={20} />
                    <h4 className="card-title mb-0">User Rights Management</h4>
                  </div>
                  <div className="d-flex gap-2">
                    <Btn color="primary" onClick={handleResetFilter}>
                      <Shield size={16} className="me-1" />
                      Reset Filter
                    </Btn>
                  </div>
                </CardHeader>
                <CardBody>
                  <Row className="mb-3">
                    <Col md="4">
                      <label className="form-label">Search Users</label>
                      <Input
                        type="text"
                        placeholder="Search users..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                      />
                    </Col>
                  </Row>

                  {loading ? (
                    <div className="text-center py-4">Loading users...</div>
                  ) : (
                    <div className="table-responsive">
                      <Table bordered striped className="table">
                        <thead style={{ backgroundColor: "#6D68CB", color: "#fff" }}>
                          <tr>
                            <th style={{ width: 60 }}>S.No</th>
                            <th>Username</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>User Type</th>
                            <th style={{ width: 160 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user, idx) => (
                            <tr key={user.Id || idx}>
                              <td>{idx + 1}</td>
                              <td>{user.Name}</td>
                              <td>{user.FullName}</td>
                              <td>{user.Email}</td>
                              <td>
                                <span className={`badge ${getRoleClass(getRoleDisplay(user))}`}>
                                  {getRoleDisplay(user)}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button color="primary" size="sm" outline onClick={() => handleEditRights(user)} title="Edit Rights">
                                    <Edit size={14} />
                                  </Button>
                                  <Button color="info" size="sm" outline onClick={() => handleViewRights(user)} title="View Rights">
                                    <Eye size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
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

      <Modal isOpen={showRightsModal} toggle={handleCloseModal} size="lg" centered>
        <ModalHeader toggle={handleCloseModal}>
          {isViewMode ? (
            <>
              <Eye className="me-2" size={20} />
              View User Rights - {selectedUser?.FullName}
            </>
          ) : (
            <>
              <Shield className="me-2" size={20} />
              Edit User Rights - {selectedUser?.FullName}
            </>
          )}
        </ModalHeader>
        <ModalBody>
          <div className="mb-3">
            <Row>
              <Col md="6">
                <strong>Username:</strong> {selectedUser?.Name}
              </Col>
              <Col md="6">
                <strong>User Type:</strong>{" "}
                <span className={`badge ${getRoleClass(getRoleDisplay(selectedUser))} ms-2`}>
                  {getRoleDisplay(selectedUser)}
                </span>
              </Col>
            </Row>
          </div>
          <div className="permission-group">
            <h6 className="mb-3">System Permissions</h6>
            {isViewMode && (
              <div className="alert alert-info py-2 px-3 mb-3">
                <small>View only. Use Edit to modify rights.</small>
              </div>
            )}
            <Row className="mb-3 g-2">
              <Col md="6">
                <label className="form-label small">Search Page</label>
                <Input
                  type="text"
                  placeholder="Search page name..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className="form-control-sm"
                />
              </Col>
              <Col md="6">
                <label className="form-label small">Category</label>
                <Input
                  type="select"
                  value={permissionCategory}
                  onChange={(e) => setPermissionCategory(e.target.value)}
                  className="form-control-sm"
                >
                  <option value="">All Categories</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Input>
              </Col>
            </Row>
            {!isViewMode && filteredPermissions.length > 0 && (
              <div className="d-flex gap-2 mb-3">
                <Btn color="primary" size="sm" outline onClick={handleSelectAll}>
                  Select All
                </Btn>
                <Btn color="secondary" size="sm" outline onClick={handleDeselectAll}>
                  Deselect All
                </Btn>
              </div>
            )}
            {filteredPermissions.length === 0 ? (
              <p className="text-muted small mb-0">No pages match the filter.</p>
            ) : (
            filteredPermissions.map((permission) => (
              <div
                key={permission.id}
                className="d-flex justify-content-between align-items-center py-2 border-bottom"
              >
                <div>
                  <div className="fw-bold">{permission.name}</div>
                  <small className="text-muted">{permission.description}</small>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  style={{
                    width: 20,
                    height: 20,
                    border: "2px solid #ccc",
                    borderRadius: 3,
                    cursor: isViewMode ? "not-allowed" : "pointer",
                    backgroundColor: userRights[permission.id] ? "#007bff" : "white",
                    opacity: isViewMode ? 0.6 : 1,
                  }}
                  onClick={() => {
                    if (!isViewMode) {
                      handlePermissionChange(permission.id, !userRights[permission.id]);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (!isViewMode && (e.key === "Enter" || e.key === " ")) {
                      handlePermissionChange(permission.id, !userRights[permission.id]);
                    }
                  }}
                >
                  {userRights[permission.id] && (
                    <span style={{ color: "white", fontSize: 12, marginLeft: 4 }}>✓</span>
                  )}
                </div>
              </div>
            ))
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Btn color="secondary" onClick={handleCloseModal}>
            {isViewMode ? "Close" : "Cancel"}
          </Btn>
          {!isViewMode && (
            <Btn color="primary" onClick={handleSaveRights} disabled={saving}>
              {saving ? "Saving..." : <><Save size={16} className="me-1" /> Save Rights</>}
            </Btn>
          )}
        </ModalFooter>
      </Modal>
    </>
  );
};

export default UserRights;
