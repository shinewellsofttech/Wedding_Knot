import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import type { FormikProps, FormikHelpers } from "formik";
import { useDispatch } from "react-redux";
import { Fn_FillListData, Fn_AddEditData, Fn_DisplayData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { getCurrentUserId, handleEnterToNextField } from "../../utils/formUtils";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Btn } from "../../AbstractElements";

interface FormValues {
  Name: string;
  Username: string;
  ContactPerson: string;
  FullName: string;
  ContactEmail: string;
  Password: string;
  ConfirmPassword: string;
  ContactMobile: string;
  Address1: string;
  Address2: string;
  F_StateMaster: string;
  F_CityMaster: string;
  FirmsAllowed: boolean;
  IsSuperAdmin: boolean;
}

const initialValues: FormValues = {
  Name: "",
  Username: "",
  ContactPerson: "",
  FullName: "",
  ContactEmail: "",
  Password: "",
  ConfirmPassword: "",
  ContactMobile: "",
  Address1: "",
  Address2: "",
  F_StateMaster: "",
  F_CityMaster: "",
  FirmsAllowed: false,
  IsSuperAdmin: false,
};

interface DropdownState {
  states: Array<{ Id?: number; Name?: string }>;
  cities: Array<{ Id?: number; Name?: string }>;
}

interface AdminState {
  id: number;
  formData: Partial<FormValues> & {
    // Legacy field names for backward compatibility
    State?: string;
    City?: string;
  };
  isProgress?: boolean;
}

/**
 * Renders the add/edit admin master form and orchestrates data fetching plus submission.
 */
const AddEdit_AdminMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const userNameRef = useRef<HTMLInputElement | null>(null);

  const [adminState, setAdminState] = useState<AdminState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const [dropdowns, setDropdowns] = useState<DropdownState>({
    states: [],
    cities: [],
  });

  const STATE_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.StateMaster}/Id/0`;
  const CITY_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CityMaster}/Id/0`;
  const API_URL_SAVE = `UserMaster/0/token`;
  const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/UserMaster/Id`;

  const isEditMode = adminState.id > 0;

  /**
   * Provides dynamic validation rules, relaxing password requirements while editing.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        Name: Yup.string().trim().required("Name is required"),
        Username: Yup.string().trim(),
        ContactPerson: Yup.string().trim().required("Contact Person is required"),
        FullName: Yup.string().trim().required("Full Name is required"),
        ContactEmail: Yup.string().trim().email("Invalid email format").required("Email is required"),
        Password: isEditMode
          ? Yup.string().trim().min(6, "Password must be at least 6 characters")
          : Yup.string()
              .trim()
              .min(6, "Password must be at least 6 characters")
              .required("Password is required"),
        ConfirmPassword: isEditMode
          ? Yup.string()
              .trim()
              .oneOf([Yup.ref("Password"), ""], "Passwords must match")
          : Yup.string()
              .trim()
              .oneOf([Yup.ref("Password")], "Passwords must match")
              .required("Confirm Password is required"),
        ContactMobile: Yup.string()
          .trim()
          .matches(/^\d{10}$/, "Contact mobile must be 10 digits")
          .required("Contact mobile is required"),
        Address1: Yup.string().trim().required("Address 1 is required"),
        Address2: Yup.string().trim(),
        F_CityMaster: Yup.string().trim().required("City is required"),
        F_StateMaster: Yup.string().trim().required("State is required"),
        FirmsAllowed: Yup.boolean(),
        IsSuperAdmin: Yup.boolean(),
      }),
    [isEditMode]
  );


  /**
   * Focus the username input on initial render for quicker data entry.
   */
  useEffect(() => {
    userNameRef.current?.focus();
  }, []);

  /**
   * Populate state and city dropdown lists on mount.
   */
  useEffect(() => {
    Fn_FillListData(dispatch, setDropdowns, "states", STATE_API_URL)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.error("Failed to fetch states:", err);
      });
    Fn_FillListData(dispatch, setDropdowns, "cities", CITY_API_URL)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.error("Failed to fetch cities:", err);
      });
  }, [dispatch]);

  /**
   * Decide whether the page is in add or edit mode by inspecting navigation state.
   */
  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setAdminState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setAdminState, recordId, API_URL_EDIT);
    } else {
      setAdminState((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state, API_URL_EDIT]);

  /**
   * When the selected state changes, fetch the corresponding set of cities.
   */
  useEffect(() => {
    const selectedState = adminState.formData.F_StateMaster;
    if (selectedState) {
      Fn_FillListData(dispatch, setDropdowns, "cities", `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CityMasterByStateId}/Id/${selectedState}`).catch((err) => {
        console.error("Failed to fetch cities by state:", err);
      });
    } else {
      setDropdowns((prev) => ({ ...prev, cities: [] }));
    }
  }, [adminState.formData.F_StateMaster, dispatch]);

  /**
   * Normalizes nullable values to empty strings so Formik receives safe defaults.
   */
  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    Name: toStringOrEmpty(adminState.formData.Name),
    Username: toStringOrEmpty(adminState.formData.Username || adminState.formData.Name),
    ContactPerson: toStringOrEmpty(adminState.formData.ContactPerson),
    FullName: toStringOrEmpty(adminState.formData.FullName),
    ContactEmail: toStringOrEmpty(adminState.formData.ContactEmail),
    Password: "",
    ConfirmPassword: "",
    ContactMobile: toStringOrEmpty(adminState.formData.ContactMobile),
    Address1: toStringOrEmpty(adminState.formData.Address1),
    Address2: toStringOrEmpty(adminState.formData.Address2),
    F_StateMaster: toStringOrEmpty(adminState.formData.F_StateMaster || (adminState.formData as any).State),
    F_CityMaster: toStringOrEmpty(adminState.formData.F_CityMaster || (adminState.formData as any).City),
    FirmsAllowed: Boolean(adminState.formData.FirmsAllowed),
    IsSuperAdmin: Boolean((adminState.formData as any).IsSuperAdmin),
  };

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
   * Persists admin master data using the shared add/edit helper.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(adminState.id ?? 0));
      formData.append("Name", values.Name || "");
      formData.append("Username", values.Username || values.Name || "");
      formData.append("ContactPerson", values.ContactPerson || "");
      formData.append("FullName", values.FullName || "");
      formData.append("ContactEmail", values.ContactEmail || "");
      formData.append("ContactMobile", values.ContactMobile || "");
      formData.append("Address1", values.Address1 || "");
      formData.append("Address2", values.Address2 || "");
      formData.append("F_StateMaster", values.F_StateMaster || "");
      formData.append("F_CityMaster", values.F_CityMaster || "");
      formData.append("FirmsAllowed", values.FirmsAllowed.toString());
      formData.append("IsSuperAdmin", values.IsSuperAdmin.toString());
      formData.append("F_UserType", "1"); // AdminMaster always sends 1
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      if (values.Password) {
        formData.append("Password", values.Password);
      }

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: adminState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/adminMaster"
      );
    } catch (error) {
      console.error("Admin master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Admin Master" parent="Masters" />
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
                      <CardHeaderCommon title={`${isEditMode ? "Edit" : "Add"} Admin`} tagClass="card-title mb-0" />
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
                                innerRef={userNameRef}
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
                                Contact Person <span className="text-danger">*</span>
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
                                Contact's Email <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="email"
                                name="ContactEmail"
                                placeholder="Enter contact's email"
                                value={values.ContactEmail}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.ContactEmail && !!errors.ContactEmail}
                              />
                              <ErrorMessage name="Email" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Contact's Mobile <span className="text-danger">*</span>
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
                                Address 1 <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
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
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Password{isEditMode ? "" : " "}{" "}
                                <span className="text-danger">{isEditMode ? "" : "*"}</span>
                              </Label>
                              <Input
                                type="password"
                                name="Password"
                                placeholder="Enter password"
                                value={values.Password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.Password && !!errors.Password}
                              />
                              <ErrorMessage name="Password" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Confirm Password{isEditMode ? "" : " "}{" "}
                                <span className="text-danger">{isEditMode ? "" : "*"}</span>
                              </Label>
                              <Input
                                type="password"
                                name="ConfirmPassword"
                                placeholder="Confirm password"
                                value={values.ConfirmPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.ConfirmPassword && !!errors.ConfirmPassword}
                              />
                              <ErrorMessage name="ConfirmPassword" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
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
                              <div className="form-check form-switch">
                                <Input
                                  type="checkbox"
                                  role="switch"
                                  className="form-check-input"
                                  name="IsSuperAdmin"
                                  checked={values.IsSuperAdmin}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                />
                                <Label check className="form-check-label ms-2">
                                  Is Supar Admin
                                </Label>
                              </div>
                              <ErrorMessage name="IsSuperAdmin" component="div" className="text-danger small mt-1" />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/adminMaster")}>
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

export default AddEdit_AdminMaster;
