import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import type { FormikProps, FormikHelpers } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DisplayData, Fn_AddEditData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { getCurrentUserId, handleEnterToNextField } from "../../utils/formUtils";

interface FormValues {
  FirmName: string;
  F_UserMaster: string;
  F_StateMaster: string;
  Address1: string;
  Address2: string;
  F_CityMaster: string;
  PinCode: string;
  ContactPerson: string;
  CompanyPhone: string;
  CompanyMobile: string;
  CompanyEmail: string;
  ContactPersonMobile: string;
  ContactPersonEmail: string;
  GSTIN: string;
  MSMENumber: string;
  PANNumber: string;
}

const initialValues: FormValues = {
  FirmName: "",
  F_UserMaster: "",
  F_StateMaster: "",
  Address1: "",
  Address2: "",
  F_CityMaster: "",
  PinCode: "",
  ContactPerson: "",
  CompanyPhone: "",
  CompanyMobile: "",
  CompanyEmail: "",
  ContactPersonMobile: "",
  ContactPersonEmail: "",
  GSTIN: "",
  MSMENumber: "",
  PANNumber: "",
};

interface FirmState {
  id: number;
  formData: Partial<FormValues> & {
    // Legacy field names for backward compatibility
    Name?: string;
    F_AdminMaster?: string;
    Address?: string;
    CompanyPhoneNo?: string;
    CompanyMobileNo?: string;
    CompanyEMail?: string;
    ContactPersonEMail?: string;
    MSMENo?: string;
    PanNo?: string;
  };
  isProgress?: boolean;
}

interface DropdownState {
  users: Array<{ Id?: number; Name?: string; Username?: string; FullName?: string }>;
  states: Array<{ Id?: number; Name?: string }>;
  cities: Array<{ Id?: number; Name?: string }>;
  isProgress?: boolean;
}

const USER_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.UserMaster}/Id/0`;
const STATE_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.StateMaster}/Id/0`;
const API_URL_SAVE = `${API_WEB_URLS.FirmMaster}/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/${API_WEB_URLS.FirmMaster}/Id`;

/**
 * Renders the add/edit firm master form for managing firm information.
 */
const AddEdit_FirmMasster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [firmState, setFirmState] = useState<FirmState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const [dropdowns, setDropdowns] = useState<DropdownState>({
    users: [],
    states: [],
    cities: [],
    isProgress: false,
  });

  const isEditMode = firmState.id > 0;

  /**
   * Builds validation rules for the firm master form.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        FirmName: Yup.string().trim().required("Firm name is required"),
        F_UserMaster: Yup.string().trim().required("User selection is required"),
        F_StateMaster: Yup.string().trim().required("State selection is required"),
        Address1: Yup.string().trim().required("Address 1 is required"),
        Address2: Yup.string().trim(),
        F_CityMaster: Yup.string().trim().required("City selection is required"),
        PinCode: Yup.string()
          .trim()
          .matches(/^\d{6}$/, "Pin Code must be 6 digits")
          .required("Pin code is required"),
        ContactPerson: Yup.string().trim().required("Contact person is required"),
        CompanyPhone: Yup.string().trim().required("Company phone number is required"),
        CompanyMobile: Yup.string()
          .trim()
          .matches(/^\d{10}$/, "Company mobile must be 10 digits")
          .required("Company mobile number is required"),
        CompanyEmail: Yup.string().trim().email("Invalid company email").required("Company email is required"),
        ContactPersonMobile: Yup.string()
          .trim()
          .matches(/^\d{10}$/, "Contact person mobile must be 10 digits")
          .required("Contact person mobile number is required"),
        ContactPersonEmail: Yup.string().trim().email("Invalid contact person email").required("Contact person email is required"),
        GSTIN: Yup.string().trim().required("GSTIN is required"),
        MSMENumber: Yup.string().trim().required("MSME number is required"),
        PANNumber: Yup.string().trim().required("PAN number is required"),
      }),
    []
  );

  /**
   * Loads users and states for dropdown fields on mount. Cities are loaded when a state is selected.
   */
  useEffect(() => {
    Fn_FillListData(dispatch, setDropdowns, "users", USER_LIST_URL).catch((error) => {
      console.error("Failed to fetch users:", error);
    });
    Fn_FillListData(dispatch, setDropdowns, "states", STATE_LIST_URL).catch((error) => {
      console.error("Failed to fetch states:", error);
    });
  }, [dispatch]);

  /**
   * When the selected state changes (e.g. edit data loaded or user selects state), fetch cities for that state.
   */
  useEffect(() => {
    const selectedState = firmState.formData.F_StateMaster;
    if (selectedState) {
      Fn_FillListData(dispatch, setDropdowns, "cities", `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CityMasterByStateId}/Id/${selectedState}`).catch((err) => {
        console.error("Failed to fetch cities by state:", err);
      });
    } else {
      setDropdowns((prev) => ({ ...prev, cities: [] }));
    }
  }, [firmState.formData.F_StateMaster, dispatch]);

  /**
   * Determines whether the page should load existing data for editing.
   */
  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setFirmState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setFirmState, recordId, API_URL_EDIT);
    } else {
      setFirmState((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state]);

  /**
   * Normalizes nullable values to empty strings for safe form consumption.
   */
  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    FirmName: toStringOrEmpty(firmState.formData.FirmName || firmState.formData.Name),
    F_UserMaster: toStringOrEmpty(firmState.formData.F_UserMaster || firmState.formData.F_AdminMaster),
    Address1: toStringOrEmpty(firmState.formData.Address1 || firmState.formData.Address),
    Address2: toStringOrEmpty(firmState.formData.Address2 || firmState.formData.Address1),
    F_StateMaster: toStringOrEmpty(firmState.formData.F_StateMaster),
    F_CityMaster: toStringOrEmpty(firmState.formData.F_CityMaster),
    PinCode: toStringOrEmpty(firmState.formData.PinCode),
    ContactPerson: toStringOrEmpty(firmState.formData.ContactPerson),
    CompanyPhone: toStringOrEmpty(firmState.formData.CompanyPhone || firmState.formData.CompanyPhoneNo),
    CompanyMobile: toStringOrEmpty(firmState.formData.CompanyMobile || firmState.formData.CompanyMobileNo),
    CompanyEmail: toStringOrEmpty(firmState.formData.CompanyEmail || firmState.formData.CompanyEMail),
    ContactPersonMobile: toStringOrEmpty(firmState.formData.ContactPersonMobile),
    ContactPersonEmail: toStringOrEmpty(firmState.formData.ContactPersonEmail || firmState.formData.ContactPersonEMail),
    GSTIN: toStringOrEmpty(firmState.formData.GSTIN),
    MSMENumber: toStringOrEmpty(firmState.formData.MSMENumber || firmState.formData.MSMENo),
    PANNumber: toStringOrEmpty(firmState.formData.PANNumber || firmState.formData.PanNo),
  };

  /**
   * Handles state changes: update form, reset city, and fetch cities for the selected state.
   */
  const handleStateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    handleChange: FormikProps<FormValues>["handleChange"],
    setFieldValue: FormikProps<FormValues>["setFieldValue"]
  ) => {
    const selectedState = e.target.value;
    handleChange(e);
    setFieldValue("F_CityMaster", "");
    if (selectedState) {
      Fn_FillListData(dispatch, setDropdowns, "cities", `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CityMasterByStateId}/Id/${selectedState}`).catch((err) => {
        console.error("Failed to fetch cities by state:", err);
      });
    } else {
      setDropdowns((prev) => ({ ...prev, cities: [] }));
    }
  };

  /**
   * Persists firm master data using the shared add/edit helper.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(firmState.id ?? 0));
      formData.append("FirmName", values.FirmName || "");
      formData.append("F_UserMaster", values.F_UserMaster || "");
      formData.append("Address1", values.Address1 || "");
      formData.append("Address2", values.Address2 || "");
      formData.append("F_StateMaster", values.F_StateMaster || "");
      formData.append("F_CityMaster", values.F_CityMaster || "");
      formData.append("PinCode", values.PinCode || "");
      formData.append("ContactPerson", values.ContactPerson || "");
      formData.append("CompanyPhone", values.CompanyPhone || "");
      formData.append("CompanyMobile", values.CompanyMobile || "");
      formData.append("CompanyEmail", values.CompanyEmail || "");
      formData.append("ContactPersonMobile", values.ContactPersonMobile || "");
      formData.append("ContactPersonEmail", values.ContactPersonEmail || "");
      formData.append("GSTIN", values.GSTIN || "");
      formData.append("MSMENumber", values.MSMENumber || "");
      formData.append("PANNumber", values.PANNumber || "");
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: firmState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/firmMaster"
      );
    } catch (error) {
      console.error("Firm master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Firm Master" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Formik<FormValues>
                initialValues={initialFormValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
              >
                {({ values, handleChange, handleBlur, errors, touched, isSubmitting, setFieldValue }: FormikProps<FormValues>) => (
                  <Form className="theme-form" onKeyDown={handleEnterToNextField}>
                    <Card>
                      <CardHeaderCommon title={`${isEditMode ? "Edit" : "Add"} Firm`} tagClass="card-title mb-0" />
                      <CardBody>
                        <Row className="gy-3">
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Firm Name <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="FirmName"
                                placeholder="Enter firm name"
                                value={values.FirmName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.FirmName && !!errors.FirmName}
                              />
                              <ErrorMessage name="FirmName" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                User <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="select"
                                name="F_UserMaster"
                                value={values.F_UserMaster}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_UserMaster && !!errors.F_UserMaster}
                              >
                                <option value="">Select user</option>
                                {dropdowns.users.map((userOption) => (
                                  <option key={userOption.Id} value={userOption?.Id ?? ""}>
                                    {userOption?.Name || userOption?.Username || userOption?.FullName || `User ${userOption?.Id ?? ""}`}
                                  </option>
                                ))}
                              </Input>
                              <ErrorMessage name="F_UserMaster" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Address 1 <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="textarea"
                                name="Address1"
                                placeholder="Enter address 1"
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
                              <Label>Address 2</Label>
                              <Input
                                type="textarea"
                                name="Address2"
                                placeholder="Enter address 2"
                                value={values.Address2}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
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
                                onChange={(e) => handleStateChange(e, handleChange, setFieldValue)}
                                onBlur={handleBlur}
                                invalid={touched.F_StateMaster && !!errors.F_StateMaster}
                              >
                                <option value="">Select state</option>
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
                                <option value="">Select city</option>
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
                                Pin Code <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="PinCode"
                                placeholder="Enter 6-digit pin code"
                                value={values.PinCode}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.PinCode && !!errors.PinCode}
                              />
                              <ErrorMessage name="PinCode" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Company Phone <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="CompanyPhone"
                                placeholder="Enter company phone number"
                                value={values.CompanyPhone}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.CompanyPhone && !!errors.CompanyPhone}
                              />
                              <ErrorMessage name="CompanyPhone" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Company Mobile <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="CompanyMobile"
                                placeholder="Enter company mobile number"
                                value={values.CompanyMobile}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.CompanyMobile && !!errors.CompanyMobile}
                              />
                              <ErrorMessage name="CompanyMobile" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Company Email <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="email"
                                name="CompanyEmail"
                                placeholder="Enter company email"
                                value={values.CompanyEmail}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.CompanyEmail && !!errors.CompanyEmail}
                              />
                              <ErrorMessage name="CompanyEmail" component="div" className="text-danger small" />
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
                                placeholder="Enter contact person name"
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
                                Contact Person Mobile <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="ContactPersonMobile"
                                placeholder="Enter contact person mobile number"
                                value={values.ContactPersonMobile}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.ContactPersonMobile && !!errors.ContactPersonMobile}
                              />
                              <ErrorMessage name="ContactPersonMobile" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Contact Person Email <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="email"
                                name="ContactPersonEmail"
                                placeholder="Enter contact person email"
                                value={values.ContactPersonEmail}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.ContactPersonEmail && !!errors.ContactPersonEmail}
                              />
                              <ErrorMessage name="ContactPersonEmail" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                GSTIN <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="GSTIN"
                                placeholder="Enter GSTIN"
                                value={values.GSTIN}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.GSTIN && !!errors.GSTIN}
                              />
                              <ErrorMessage name="GSTIN" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                MSME Number <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="MSMENumber"
                                placeholder="Enter MSME number"
                                value={values.MSMENumber}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.MSMENumber && !!errors.MSMENumber}
                              />
                              <ErrorMessage name="MSMENumber" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                PAN Number <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="PANNumber"
                                placeholder="Enter PAN number"
                                value={values.PANNumber}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.PANNumber && !!errors.PANNumber}
                              />
                              <ErrorMessage name="PANNumber" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/firmMaster")}>
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

export default AddEdit_FirmMasster;

