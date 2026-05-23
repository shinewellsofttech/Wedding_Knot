import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_AddEditData, Fn_DisplayData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { getCurrentUserId, handleEnterToNextField } from "../../utils/formUtils";

interface CompanyRow {
  F_CompanyMaster: string;
  UserName: string;
  UserPassword: string;
}

interface CompanyUserMasterState {
  id: number;
  formData: { F_UserMaster?: string; StrCompanyL?: string };
  userMasterList: any[];
  companyMasterList: any[];
  isProgress?: boolean;
}

const API_URL_SAVE = "CompanyUserMaster/0/token";
const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/CompanyUserMaster/Id`;
const USER_MASTER_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.UserMaster}/Id/0`;
const COMPANY_MASTER_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CompanyMaster}/Id/0`;

/** Parse StrCompanyL string into rows: "F_CompanyMaster~UserName~UserPassword#..." */
function parseStrCompanyL(str: string): CompanyRow[] {
  if (!str || typeof str !== "string") return [{ F_CompanyMaster: "", UserName: "", UserPassword: "" }];
  const parts = str.split("#").filter((s) => s.trim());
  if (parts.length === 0) return [{ F_CompanyMaster: "", UserName: "", UserPassword: "" }];
  return parts.map((part) => {
    const [F_CompanyMaster = "", UserName = "", UserPassword = ""] = part.split("~");
    return { F_CompanyMaster: String(F_CompanyMaster).trim(), UserName: String(UserName).trim(), UserPassword: String(UserPassword).trim() };
  });
}

/** Build StrCompanyL from rows: F_CompanyMaster~UserName~UserPassword# */
function buildStrCompanyL(rows: CompanyRow[]): string {
  const valid = rows.filter((r) => r.F_CompanyMaster || r.UserName || r.UserPassword);
  if (valid.length === 0) return "";
  return valid.map((r) => `${r.F_CompanyMaster}~${r.UserName || ""}~${r.UserPassword || ""}`).join("#") + "#";
}

const defaultRow: CompanyRow = { F_CompanyMaster: "", UserName: "", UserPassword: "" };

/** Normalize company id from API (Id, ID, id, CompanyId, etc.) */
function getCompanyId(c: any): string {
  if (c == null) return "";
  const id = c.Id ?? c.ID ?? c.id ?? c.CompanyId ?? c.companyId ?? c.F_CompanyMaster ?? "";
  return String(id).trim();
}

/** Normalize company display name */
function getCompanyLabel(c: any): string {
  if (c == null) return "";
  return String(c.CompanyName ?? c.Name ?? c.ShortName ?? getCompanyId(c) ?? "").trim() || "—";
}

const AddEdit_CompanyUserMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState<CompanyUserMasterState>({
    id: 0,
    formData: {},
    userMasterList: [],
    companyMasterList: [],
    isProgress: false,
  });

  const [rows, setRows] = useState<CompanyRow[]>([{ ...defaultRow }]);

  const isEditMode = state.id > 0;

  useEffect(() => {
    Fn_FillListData(dispatch, setState as any, "userMasterList", USER_MASTER_LIST_URL).catch(() => {});
    Fn_FillListData(dispatch, setState as any, "companyMasterList", COMPANY_MASTER_LIST_URL).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setState((prev) => ({ ...prev, id: recordId }));
      Fn_DisplayData(dispatch, setState as any, recordId, API_URL_EDIT);
    } else {
      setState((prev) => ({ ...prev, id: 0, formData: {} }));
      setRows([{ ...defaultRow }]);
    }
  }, [dispatch, location.state]);

  useEffect(() => {
    const fd = state.formData || {};
    const strCompanyL = fd.StrCompanyL ?? (fd as any).strCompanyL ?? "";
    if (state.id > 0 && strCompanyL) {
      setRows(parseStrCompanyL(strCompanyL));
    }
  }, [state.id, state.formData]);

  const addRow = () => setRows((prev) => [...prev, { ...defaultRow }]);
  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };
  const updateRow = (index: number, field: keyof CompanyRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const F_UserMaster = (state.formData as any).F_UserMaster ?? "";
    if (!F_UserMaster || F_UserMaster === "0") {
      alert("Please select User Master.");
      return;
    }
    const strCompanyL = buildStrCompanyL(rows);
    if (!strCompanyL) {
      alert("Please add at least one company with User Name.");
      return;
    }

    const userId = getCurrentUserId();

    const formData = new FormData();
    formData.append("Id", String(state.id ?? 0));
    formData.append("F_UserMaster", F_UserMaster);
    formData.append("UserId", userId);
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());
    formData.append("StrCompanyL", strCompanyL);

    try {
      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: state.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        `${process.env.PUBLIC_URL || ""}/addEditCompanyUserMaster`
      );
    } catch (error) {
      console.error("Company User Master submit failed:", error);
    }
  };

  const F_UserMaster = state.formData?.F_UserMaster ?? "";
  const userMasterList = state.userMasterList || [];
  const companyMasterList = state.companyMasterList || [];

  return (
    <div className="page-body">
      <style>{`
        .company-user-table th,
        .company-user-table td {
          padding: 0.25rem 0.5rem;
          vertical-align: middle;
        }
        .company-user-table .action-cell {
          white-space: nowrap;
        }
        .company-user-table .action-cell .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      <Breadcrumbs mainTitle="Company User Master" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <form onSubmit={handleSubmit} onKeyDown={handleEnterToNextField}>
              <Card>
                <CardHeaderCommon
                  title={`${isEditMode ? "Edit" : "Add"} Company User Master`}
                  tagClass="card-title mb-0"
                />
                <CardBody>
                  <Row>
                    <Col md="6">
                      <FormGroup>
                        <Label for="F_UserMaster">User Master <span className="text-danger">*</span></Label>
                        <Input
                          type="select"
                          id="F_UserMaster"
                          value={F_UserMaster}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              formData: { ...prev.formData, F_UserMaster: e.target.value },
                            }))
                          }
                          disabled={isEditMode}
                        >
                          <option value="">Select User Master...</option>
                          {userMasterList.map((u, i) => (
                            <option key={u.Id ?? u.id ?? i} value={String(u.Id ?? u.id ?? "")}>
                              {u.Name ?? u.Username ?? u.FullName ?? u.Id ?? u.id}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>

                  <Label className="mt-3 mb-2">Company-wise User Name & Password</Label>
                  <div className="table-responsive">
                    <Table bordered size="sm" className="company-user-table">
                      <thead>
                        <tr>
                          <th style={{ width: "50px" }}>#</th>
                          <th>Company</th>
                          <th>User Name</th>
                          <th>User Password</th>
                          <th style={{ width: "100px" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => (
                          <tr key={index}>
                            <td className="align-middle">{index + 1}</td>
                            <td>
                              <Input
                                type="select"
                                value={row.F_CompanyMaster}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateRow(index, "F_CompanyMaster", val);
                                }}
                              >
                                <option value="">Select Company...</option>
                                {companyMasterList.map((c, i) => {
                                  const id = getCompanyId(c);
                                  const label = getCompanyLabel(c);
                                  return (
                                    <option key={id || `company-${i}`} value={id}>
                                      {label}
                                    </option>
                                  );
                                })}
                              </Input>
                            </td>
                            <td>
                              <Input
                                type="text"
                                value={row.UserName}
                                onChange={(e) => updateRow(index, "UserName", e.target.value)}
                                placeholder="User Name"
                              />
                            </td>
                            <td>
                              <Input
                                type="password"
                                value={row.UserPassword}
                                onChange={(e) => updateRow(index, "UserPassword", e.target.value)}
                                placeholder="User Password"
                              />
                            </td>
                            <td className="align-middle action-cell">
                              <div className="d-flex justify-content-center gap-1">
                                <Btn
                                  type="button"
                                  color="success"
                                  size="sm"
                                  onClick={addRow}
                                  title="Add row"
                                >
                                  <i className="fa fa-plus" />
                                </Btn>
                                <Btn
                                  type="button"
                                  color="danger"
                                  size="sm"
                                  onClick={() => removeRow(index)}
                                  disabled={rows.length <= 1}
                                  title="Remove row"
                                >
                                  <i className="fa fa-minus" />
                                </Btn>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
                <CardFooter className="text-end">
                  <Btn color="secondary" type="button" className="me-2" onClick={() => navigate(`${process.env.PUBLIC_URL || ""}/addEditCompanyUserMaster`, { state: { Id: 0 } })}>
                    Cancel
                  </Btn>
                  <Btn color="primary" type="submit">
                    {isEditMode ? "Update" : "Save"}
                  </Btn>
                </CardFooter>
              </Card>
            </form>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AddEdit_CompanyUserMaster;
