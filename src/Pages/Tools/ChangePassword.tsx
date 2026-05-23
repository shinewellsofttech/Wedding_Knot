import React, { useCallback, useEffect, useState } from "react";
import { Card, CardBody, CardFooter, Col, Container, Form, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { toast } from "react-toastify";
import { API_WEB_URLS } from "../../constants/constAPI";

const USER_MASTER_LIST_URL = `${API_WEB_URLS.BASE}${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.UserMaster}/Id/0`;
const GET_COMPANIES_BY_USER_URL = (userId: string | number) =>
  `${API_WEB_URLS.BASE}${API_WEB_URLS.MASTER}/0/token/GetCompaniesByUserId/Id/${userId}`;

const getDataList = (response: any) =>
  response?.data?.dataList ?? response?.data?.data?.dataList ?? (Array.isArray(response?.data) ? response.data : []);

const ChangePassword = () => {
  const [userList, setUserList] = useState<any[]>([]);
  const [companyList, setCompanyList] = useState<any[]>([]);
  const [f_UserMaster, setF_UserMaster] = useState("");
  const [f_CompanyMaster, setF_CompanyMaster] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingUsers(true);
    fetch(USER_MASTER_LIST_URL)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          const list = getDataList(data);
          setUserList(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {
        if (!cancelled) setUserList([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchCompaniesByUser = useCallback((userId: string) => {
    if (!userId || userId === "0") {
      setCompanyList([]);
      setF_CompanyMaster("");
      return;
    }
    setLoadingCompanies(true);
    setF_CompanyMaster("");
    fetch(GET_COMPANIES_BY_USER_URL(userId))
      .then((res) => res.json())
      .then((data) => {
        const list = getDataList(data);
        setCompanyList(Array.isArray(list) ? list : []);
      })
      .catch(() => setCompanyList([]))
      .finally(() => setLoadingCompanies(false));
  }, []);

  useEffect(() => {
    fetchCompaniesByUser(f_UserMaster);
  }, [f_UserMaster, fetchCompaniesByUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f_UserMaster || f_UserMaster === "0") {
      toast.error("Please select User.");
      return;
    }
    if (!f_CompanyMaster || f_CompanyMaster === "0") {
      toast.error("Please select Company.");
      return;
    }
    if (!oldPassword.trim()) {
      toast.error("Old password is required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    const userId = String(f_UserMaster);
    const userToken = authUser?.Token ?? authUser?.token ?? "token";

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("F_UserMaster", userId);
      formData.append("OldPassword", oldPassword);
      formData.append("NewPassword", newPassword);
      formData.append("F_CompanyMaster", String(f_CompanyMaster));

      const url = `${API_WEB_URLS.BASE}ChangePassword/${userId}/${userToken}`;
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok && (data?.success !== false)) {
        toast.success(data?.message || "Password changed successfully.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data?.message || "Failed to change password.");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Change Password" parent="Tools" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Form className="theme-form" onSubmit={handleSubmit}>
              <Card>
                <CardHeaderCommon title="Change Password" tagClass="card-title mb-0" />
                <CardBody>
                  <Row className="gy-3">
                    <Col md="6">
                      <FormGroup>
                        <Label>User Master <span className="text-danger">*</span></Label>
                        <Input
                          type="select"
                          required
                          value={f_UserMaster}
                          onChange={(e) => setF_UserMaster(e.target.value)}
                          disabled={loadingUsers}
                        >
                          <option value="">Select User</option>
                          {userList.map((u: any) => (
                            <option key={u?.Id} value={u?.Id}>
                              {u?.UserName ?? u?.Name ?? u?.Email ?? `User ${u?.Id}`}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label>Company <span className="text-danger">*</span></Label>
                        <Input
                          type="select"
                          required
                          value={f_CompanyMaster}
                          onChange={(e) => setF_CompanyMaster(e.target.value)}
                          disabled={!f_UserMaster || loadingCompanies}
                        >
                          <option value="">Select Company</option>
                          {companyList
                            .filter((c: any) => c?.F_CompanyMaster != null && c?.F_CompanyMaster !== "")
                            .map((c: any, idx: number) => (
                              <option key={c?.Id ?? idx} value={String(c.F_CompanyMaster)}>
                                {c?.CompanyName ?? c?.Name ?? `Company ${c.F_CompanyMaster}`}
                              </option>
                            ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label>Old Password <span className="text-danger">*</span></Label>
                        <div className="input-group">
                          <Input
                            type={showOld ? "text" : "password"}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="Enter old password"
                            required
                          />
                          <div
                            className="input-group-text"
                            onClick={() => setShowOld(!showOld)}
                            style={{ cursor: "pointer" }}
                          >
                            {showOld ? "Hide" : "Show"}
                          </div>
                        </div>
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label>New Password <span className="text-danger">*</span></Label>
                        <div className="input-group">
                          <Input
                            type={showNew ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            minLength={6}
                            required
                          />
                          <div
                            className="input-group-text"
                            
                            onClick={() => setShowNew(!showNew)}
                            style={{ cursor: "pointer" }}
                          >
                            {showNew ? "Hide" : "Show"}
                          </div>
                        </div>
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label>Confirm New Password <span className="text-danger">*</span></Label>
                        <div className="input-group">
                          <Input
                            type={showConfirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            minLength={6}
                            required
                          />
                          <div
                            className="input-group-text"
                            onClick={() => setShowConfirm(!showConfirm)}
                            style={{ cursor: "pointer" }}
                          >
                            {showConfirm ? "Hide" : "Show"}
                          </div>
                        </div>
                      </FormGroup>
                    </Col>
                  </Row>
                </CardBody>
                <CardFooter className="text-end">
                  <Btn color="primary" type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                  </Btn>
                </CardFooter>
              </Card>
            </Form>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ChangePassword;
