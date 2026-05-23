/**
 * Add/Edit Company Years form
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import DateInput from "../../CommonElements/DateInput";

interface FormValues {
  FinancialYearFrom: string;
  FinancialYearTo: string;
  F_FirmMaster: string;
  IsCurrentFinancialYear: boolean;
}

const initialValues: FormValues = {
  FinancialYearFrom: "",
  FinancialYearTo: "",
  F_FirmMaster: "",
  IsCurrentFinancialYear: false,
};

interface CompanyYearsState {
  id: number;
  formData: Partial<FormValues> & {
    // Legacy field names for backward compatibility
    F_CompanyMaster?: string;
    IsCurrent?: boolean;
  };
  isProgress?: boolean;
}

interface DropdownState {
  firms: Array<{ Id?: number; Name?: string; FirmName?: string }>;
  isProgress?: boolean;
}

const API_URL_SAVE = `CompanyYearMaster/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/CompanyYearMaster/Id`;
const FIRM_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.FirmMaster}/Id/0`;

/**
 * Renders the add/edit company years form and handles save logic.
 */
const AddEdit_CompanyYears = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const yearFromRef = useRef<HTMLInputElement | null>(null);

  const [companyYearsState, setCompanyYearsState] = useState<CompanyYearsState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const [dropdowns, setDropdowns] = useState<DropdownState>({
    firms: [],
    isProgress: false,
  });

  const isEditMode = companyYearsState.id > 0;

  /**
   * Builds validation schema for company year fields.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        FinancialYearFrom: Yup.date()
          .typeError("Financial year from must be a valid date")
          .required("Financial year from is required"),
        FinancialYearTo: Yup.date()
          .typeError("Financial year to must be a valid date")
          .required("Financial year to is required"),
        F_FirmMaster: Yup.string().trim().required("Firm selection is required"),
        IsCurrentFinancialYear: Yup.boolean(),
      }),
    []
  );

  /**
   * Focus the "from" field on mount for quick entry.
   */
  useEffect(() => {
    yearFromRef.current?.focus();
  }, []);

  /**
   * Load firms for the dropdown menu.
   */
  useEffect(() => {
    Fn_FillListData(dispatch, setDropdowns, "firms", FIRM_LIST_URL).catch((error) => {
      console.error("Failed to fetch firms:", error);
    });
  }, [dispatch]);

  /**
   * Determine current mode (add/edit) and fetch record if editing.
   */
  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setCompanyYearsState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setCompanyYearsState, recordId, API_URL_EDIT);
    } else {
      setCompanyYearsState((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state]);

  /**
   * Normalizes nullable values into safe defaults.
   */
  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const formatDateForInput = (value: unknown) => {
    if (!value) return "";
    const date = new Date(value as string);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString().slice(0, 10);
  };

  const initialFormValues: FormValues = {
    ...initialValues,
    FinancialYearFrom: formatDateForInput(companyYearsState.formData.FinancialYearFrom),
    FinancialYearTo: formatDateForInput(companyYearsState.formData.FinancialYearTo),
    F_FirmMaster: toStringOrEmpty(companyYearsState.formData.F_FirmMaster || companyYearsState.formData.F_CompanyMaster),
    IsCurrentFinancialYear: Boolean(companyYearsState.formData.IsCurrentFinancialYear ?? companyYearsState.formData.IsCurrent),
  };

  /**
   * Submits company year details to the API.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(companyYearsState.id ?? 0));
      formData.append("FinancialYearFrom", values.FinancialYearFrom || "");
      formData.append("FinancialYearTo", values.FinancialYearTo || "");
      formData.append("F_FirmMaster", values.F_FirmMaster || "");
      formData.append("IsCurrentFinancialYear", values.IsCurrentFinancialYear ? "true" : "false");
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: companyYearsState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/companyYears"
      );
    } catch (error) {
      console.error("Company years submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Company Years" parent="Masters" />
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
                      <CardHeaderCommon title={`${isEditMode ? "Edit" : "Add"} Company Year`} tagClass="card-title mb-0" />
                      <CardBody>
                        <Row className="gy-3">
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Financial Year From <span className="text-danger">*</span>
                              </Label>
                              <DateInput
                                name="FinancialYearFrom"
                                value={values.FinancialYearFrom}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.FinancialYearFrom && !!errors.FinancialYearFrom}
                                innerRef={yearFromRef}
                              />
                              <ErrorMessage name="FinancialYearFrom" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Financial Year To <span className="text-danger">*</span>
                              </Label>
                              <DateInput
                                name="FinancialYearTo"
                                value={values.FinancialYearTo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.FinancialYearTo && !!errors.FinancialYearTo}
                              />
                              <ErrorMessage name="FinancialYearTo" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Firm <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="select"
                                name="F_FirmMaster"
                                value={values.F_FirmMaster}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_FirmMaster && !!errors.F_FirmMaster}
                              >
                                <option value="">Select firm</option>
                                {dropdowns.firms.map((firm) => (
                                  <option key={firm?.Id} value={firm?.Id ?? ""}>
                                    {firm?.Name || firm?.FirmName || `Firm ${firm?.Id ?? ""}`}
                                  </option>
                                ))}
                              </Input>
                              <ErrorMessage name="F_FirmMaster" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <div className="form-check form-switch">
                                <Input
                                  type="checkbox"
                                  role="switch"
                                  className="form-check-input"
                                  name="IsCurrentFinancialYear"
                                  checked={values.IsCurrentFinancialYear}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                />
                                <Label check className="form-check-label ms-2">Is Current Financial Year</Label>
                              </div>
                              <ErrorMessage name="IsCurrentFinancialYear" component="div" className="text-danger small mt-1" />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/companyYears")}>
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

export default AddEdit_CompanyYears;
