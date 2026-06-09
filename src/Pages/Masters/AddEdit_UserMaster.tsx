import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import type { FormikHelpers, FormikProps } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_AddEditData, Fn_DisplayData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { getCurrentUserId, handleEnterToNextField } from "../../utils/formUtils";

interface FormValues {
  Name: string;
  Username: string;
  Password: string;
  FullName: string;
  ContactPerson: string;
  ContactEmail: string;
  ContactMobile: string;
  Address1: string;
  Address2: string;
  F_StateMaster: string;
  F_CityMaster: string;
  FirmsAllowed: boolean;
  ConfirmPassword: string;
  F_UserRole: string;
}

const initialValues: FormValues = {
  Name: "",
  Username: "",
  Password: "",
  FullName: "",
  ContactPerson: "",
  ContactEmail: "",
  ContactMobile: "",
  Address1: "",
  Address2: "",
  F_StateMaster: "",
  F_CityMaster: "",
  FirmsAllowed: false,
  ConfirmPassword: "",
  F_UserRole: "",
};

interface UserMasterState {
  id: number;
  formData: Partial<FormValues>;
  isProgress?: boolean;
}

interface DropdownState {
  states: Array<{ Id?: number; Name?: string }>;
  cities: Array<{ Id?: number; Name?: string }>;
  roles: Array<{ Id?: number; Name?: string; RoleName?: string }>;
  isProgress?: boolean;
}

const API_URL_SAVE = `UserMaster/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/UserMaster/Id`;
const STATE_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.StateMaster}/Id/0`;
const CITY_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CityMaster}/Id/0`;
const ROLE_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/UserRole/Id/0`;

/**
 * Add/Edit form for User master.
 */
const AddEdit_UserMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [userMasterState, setUserMasterState] = useState<UserMasterState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const [dropdowns, setDropdowns] = useState<DropdownState>({
    states: [],
    cities: [],
    roles: [],
    isProgress: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEditMode = userMasterState.id > 0;

  /**
   * Validation schema for user master form.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        Name: Yup.string().trim().required("Name is required"),
        Username: Yup.string().trim(),
        Password: isEditMode
          ? Yup.string().trim().min(6, "Password must be at least 6 characters")
          : Yup.string()
              .trim()
              .min(6, "Password must be at least 6 characters")
              .required("Password is required"),
        FullName: Yup.string().trim().required("Full name is required"),
        ContactPerson: Yup.string().trim(),
        ContactEmail: Yup.string().trim().email("Invalid email format"),
        ContactMobile: Yup.string()
          .trim()
          .matches(/^(\d{10})?$/, "Contact mobile must be 10 digits"),
        Address1: Yup.string().trim(),
        Address2: Yup.string().trim(),
        F_StateMaster: Yup.string().trim(),
        F_CityMaster: Yup.string().trim(),
        FirmsAllowed: Yup.boolean(),
        ConfirmPassword: isEditMode
          ? Yup.string()
              .trim()
              .oneOf([Yup.ref("Password"), ""], "Passwords must match")
          : Yup.string()
              .trim()
              .oneOf([Yup.ref("Password")], "Passwords must match")
              .required("Confirm password is required"),
        F_UserRole: Yup.string().trim().required("User Role is required"),
      }),
    [isEditMode]
  );

  /**
   * Load state and city dropdowns on mount.
   */
  useEffect(() => {
    Fn_FillListData(dispatch, setDropdowns, "states", STATE_LIST_URL).catch((error) => {
      console.error("Failed to fetch states:", error);
    });
    Fn_FillListData(dispatch, setDropdowns, "cities", CITY_LIST_URL).catch((error) => {
      console.error("Failed to fetch cities:", error);
    });
    Fn_FillListData(dispatch, setDropdowns, "roles", ROLE_LIST_URL).catch((error) => {
      console.error("Failed to fetch user roles:", error);
    });
  }, [dispatch]);

  /**
   * Load existing record when editing.
   */
  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setUserMasterState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setUserMasterState, recordId, API_URL_EDIT);
    } else {
      setUserMasterState((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state]);

  /**
   * When the selected state changes, fetch the corresponding set of cities.
   */
  useEffect(() => {
    const selectedState = userMasterState.formData.F_StateMaster;
    if (selectedState) {
      Fn_FillListData(dispatch, setDropdowns, "cities", `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CityMasterByStateId}/Id/${selectedState}`).catch((err) => {
        console.error("Failed to fetch cities by state:", err);
      });
    } else {
      setDropdowns((prev) => ({ ...prev, cities: [] }));
    }
  }, [userMasterState.formData.F_StateMaster, dispatch]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    Name: toStringOrEmpty(userMasterState.formData.Name || (userMasterState.formData as any).Username),
    Username: toStringOrEmpty((userMasterState.formData as any).Username || userMasterState.formData.Name),
    Password: toStringOrEmpty(userMasterState.formData.Password),
    FullName: toStringOrEmpty(userMasterState.formData.FullName),
    ContactPerson: toStringOrEmpty(userMasterState.formData.ContactPerson),
    ContactEmail: toStringOrEmpty(userMasterState.formData.ContactEmail),
    ContactMobile: toStringOrEmpty(userMasterState.formData.ContactMobile),
    Address1: toStringOrEmpty(userMasterState.formData.Address1),
    Address2: toStringOrEmpty(userMasterState.formData.Address2),
    F_StateMaster: toStringOrEmpty(userMasterState.formData.F_StateMaster),
    F_CityMaster: toStringOrEmpty(userMasterState.formData.F_CityMaster),
    FirmsAllowed: Boolean(userMasterState.formData.FirmsAllowed),
    ConfirmPassword: toStringOrEmpty(userMasterState.formData.Password),
    F_UserRole: toStringOrEmpty((userMasterState.formData as any).F_UserRole || userMasterState.formData.F_UserRole || (userMasterState.formData as any).RoleId || (userMasterState.formData as any).RoleID).trim(),
  };

  // DEBUGGING INFO
  useEffect(() => {
    if (isEditMode) {
      console.log("== DEBUG USER MASTER DATA ==");
      console.log("Raw Form Data from API:", userMasterState.formData);
      console.log("Mapped F_UserRole:", initialFormValues.F_UserRole);
      console.log("Roles dropdown options:", dropdowns.roles);
    }
  }, [userMasterState.formData, dropdowns.roles, isEditMode]);

  /**
   * Updates form state and optionally reloads cities when the state selection changes.
   */
  const handleStateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    handleChange: FormikProps<FormValues>["handleChange"]
  ) => {
    handleChange(e);
    const selectedState = e.target.value;
    if (selectedState) {
      Fn_FillListData(dispatch, setDropdowns, "cities", `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CityMasterByStateId}/Id/${selectedState}`).catch((err) => {
        console.error("Failed to fetch cities by state:", err);
      });
    } else {
      setDropdowns((prev) => ({ ...prev, cities: [] }));
    }
    // Reset city when state changes
    handleChange({ target: { name: "F_CityMaster", value: "" } } as any);
  };

  /**
   * Submit handler for user master.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(userMasterState.id ?? 0));
      formData.append("Name", values.Name || "");
      formData.append("Username", values.Username || values.Name || "");
      formData.append("FullName", values.FullName || "");
      formData.append("ContactPerson", values.ContactPerson || "");
      formData.append("ContactEmail", values.ContactEmail || "");
      formData.append("ContactMobile", values.ContactMobile || "");
      formData.append("Address1", values.Address1 || "");
      formData.append("Address2", values.Address2 || "");
      formData.append("F_StateMaster", values.F_StateMaster || "");
      formData.append("F_CityMaster", values.F_CityMaster || "");
      formData.append("F_UserRole", values.F_UserRole || "");
      formData.append("FirmsAllowed", values.FirmsAllowed ? "true" : "false");
      formData.append("F_UserType", "2"); // UserMaster always sends 2
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      if (values.Password) {
        formData.append("Password", values.Password);
      }

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: userMasterState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/userMaster"
      );
    } catch (error) {
      console.error("User master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="User Master" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Formik<FormValues>
                initialValues={initialFormValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
              >
                {({ values, handleChange, handleBlur, errors, touched, isSubmitting }: FormikProps<FormValues>) => (
                  <Form className="theme-form" onKeyDown={handleEnterToNextField}>
                    <Card>
                      <CardHeaderCommon
                        title={`${isEditMode ? "Edit" : "Add"} User`}
                        tagClass="card-title mb-0"
                      />
                      <CardBody>
                        <Row className="gy-3">
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Name <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="Name"
                                placeholder="Enter name"
                                value={values.Name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.Name && !!errors.Name}
                              />
                              <ErrorMessage name="Name" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>Username</Label>
                              <Input
                                type="text"
                                name="Username"
                                placeholder="Enter username"
                                value={values.Username}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Full Name <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="FullName"
                                placeholder="Enter full name"
                                value={values.FullName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.FullName && !!errors.FullName}
                              />
                              <ErrorMessage name="FullName" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Contact Person
                              </Label>
                              <Input
                                type="text"
                                name="ContactPerson"
                                placeholder="Enter contact person"
                                value={values.ContactPerson}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.ContactPerson && !!errors.ContactPerson}
                              />
                              <ErrorMessage name="ContactPerson" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Contact Email
                              </Label>
                              <Input
                                type="email"
                                name="ContactEmail"
                                placeholder="Enter contact email"
                                value={values.ContactEmail}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.ContactEmail && !!errors.ContactEmail}
                              />
                              <ErrorMessage name="ContactEmail" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Contact Mobile
                              </Label>
                              <Input
                                type="tel"
                                name="ContactMobile"
                                placeholder="Enter 10-digit phone number"
                                value={values.ContactMobile}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.ContactMobile && !!errors.ContactMobile}
                              />
                              <ErrorMessage name="ContactMobile" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Address 1
                              </Label>
                              <Input
                                type="textarea"
                                name="Address1"
                                placeholder="Enter address line 1"
                                value={values.Address1}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.Address1 && !!errors.Address1}
                              />
                              <ErrorMessage name="Address1" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Address 2
                              </Label>
                              <Input
                                type="text"
                                name="Address2"
                                placeholder="Enter address line 2"
                                value={values.Address2}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.Address2 && !!errors.Address2}
                              />
                              <ErrorMessage name="Address2" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          {/* HIDDEN FOR NOW
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                State <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="select"
                                name="F_StateMaster"
                                value={values.F_StateMaster}
                                onChange={(e) => handleStateChange(e, handleChange)}
                                onBlur={handleBlur}
                                invalid={touched.F_StateMaster && !!errors.F_StateMaster}
                              >
                                <option value="">Select State</option>
                                {dropdowns.states.map((stateOption) => (
                                  <option key={stateOption?.Id} value={stateOption?.Id ?? ""}>
                                    {stateOption?.Name || `State ${stateOption?.Id ?? ""}`}
                                  </option>
                                ))}
                              </Input>
                              <ErrorMessage name="F_StateMaster" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                City <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="select"
                                name="F_CityMaster"
                                value={values.F_CityMaster}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_CityMaster && !!errors.F_CityMaster}
                                disabled={!values.F_StateMaster}
                              >
                                <option value="">Select City</option>
                                {dropdowns.cities.map((cityOption) => (
                                  <option key={cityOption?.Id} value={cityOption?.Id ?? ""}>
                                    {cityOption?.Name || `City ${cityOption?.Id ?? ""}`}
                                  </option>
                                ))}
                              </Input>
                              <ErrorMessage name="F_CityMaster" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          */}
                          <Col md="6">
                            <FormGroup>
                              <div className="form-check form-switch">
                                <Input
                                  type="checkbox"
                                  role="switch"
                                  className="form-check-input"
                                  name="FirmsAllowed"
                                  checked={values.FirmsAllowed}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                />
                                <Label check className="form-check-label ms-2">
                                  Firms Allowed
                                </Label>
                              </div>
                              <ErrorMessage name="FirmsAllowed" component="div" className="text-danger small mt-1" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                User Role <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="select"
                                name="F_UserRole"
                                value={values.F_UserRole}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_UserRole && !!errors.F_UserRole}
                              >
                                <option value="">Select User Role</option>
                                {dropdowns.roles.map((roleOption) => (
                                  <option key={roleOption?.Id} value={String(roleOption?.Id ?? "")}>
                                    {roleOption?.Name || (roleOption as any)?.RoleName || `Role ${roleOption?.Id ?? ""}`}
                                  </option>
                                ))}
                              </Input>
                              <ErrorMessage name="F_UserRole" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Password{isEditMode ? "" : " "}
                                <span className="text-danger">{isEditMode ? "" : "*"}</span>
                              </Label>
                              <div className="form-input position-relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  name="Password"
                                  placeholder="Enter password"
                                  value={values.Password}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  invalid={touched.Password && !!errors.Password}
                                />
                                <div className="show-hide" onClick={() => setShowPassword(!showPassword)}>
                                  <span className={showPassword ? "show" : ""}></span>
                                </div>
                              </div>
                              <ErrorMessage name="Password" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Confirm Password{isEditMode ? "" : " "}
                                <span className="text-danger">{isEditMode ? "" : "*"}</span>
                              </Label>
                              <div className="form-input position-relative">
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  name="ConfirmPassword"
                                  placeholder="Confirm password"
                                  value={values.ConfirmPassword}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  invalid={touched.ConfirmPassword && !!errors.ConfirmPassword}
                                />
                                <div className="show-hide" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                  <span className={showConfirmPassword ? "show" : ""}></span>
                                </div>
                              </div>
                              <ErrorMessage name="ConfirmPassword" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/userMaster")}>
                          Cancel
                        </Btn>
                        <Btn color="primary" type="submit" disabled={isSubmitting}>
                          {isEditMode ? "Update" : "Submit"}
                        </Btn>
                      </CardFooter>
                    </Card>
                  </Form>
                )}
              </Formik>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default AddEdit_UserMaster;

