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
import { Fn_AddEditData, Fn_DisplayData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { getCurrentUserId, handleEnterToNextField } from "../../utils/formUtils";

interface FormValues {
  Name: string;
  Code: string;
  Description: string;
  IsActive: boolean;
}

const initialValues: FormValues = {
  Name: "",
  Code: "",
  Description: "",
  IsActive: true,
};

interface  UserRoleMasterState {
  id: number;
  formData: Partial<FormValues>;
  isProgress?: boolean;
}

const API_URL_SAVE = `UserRole/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/UserRole/Id`;

/**
 * Add/Edit form for User Role master.
 */
const AddEdit_UserRoleMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState<UserRoleMasterState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const isEditMode = state.id > 0;

  /**
   * Validation schema for user role master form.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        Name: Yup.string().trim().required("Name is required"),
        Code: Yup.string().trim(),
      }),
    []
  );

  /**
   * Load existing record when editing.
   */
  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setState, recordId, API_URL_EDIT);
    } else {
      setState((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    Name: toStringOrEmpty(state.formData.Name),
    Code: toStringOrEmpty(state.formData.Code),
    Description: toStringOrEmpty(state.formData.Description),
    IsActive: state.formData.IsActive !== undefined ? state.formData.IsActive : true,
  };

  /**
   * Submit handler for user role master.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(state.id ?? 0));
      formData.append("Name", values.Name || "0");
      formData.append("Code", values.Code || "0");
      formData.append("Description", values.Description || "0");
      formData.append("IsActive", String(values.IsActive));
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: state.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/userRoleMaster"
      );
    } catch (error) {
      console.error("User Role master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };



  function handleKeyEvents(event: React.KeyboardEvent<HTMLInputElement>){
    if(event.key === "Enter"){
      event.preventDefault();
      const nextElement = event.currentTarget.closest("FormGroup")?.nextElementSibling as HTMLInputElement;
      if(nextElement){
        nextElement.focus();
      }
    }
  }

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="User Role Master" parent="Masters" />
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
                        title={`${isEditMode ? "Edit" : "Add"} User Role`}
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
                              <Label>Code</Label>
                              <Input
                                type="text"
                                name="Code"
                                placeholder="Enter code"
                                value={values.Code}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.Code && !!errors.Code}
                              />
                              <ErrorMessage name="Code" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>Description</Label>
                              <Input
                                type="text"
                                name="Description"
                                placeholder="Enter description"
                                value={values.Description}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="6" className="d-flex align-items-center">
                            <FormGroup className="mb-0" check>
                              <Input
                                type="checkbox"
                                name="IsActive"
                                id="IsActive"
                                checked={values.IsActive}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                              <Label check for="IsActive" className="mb-0">
                                Is Active
                              </Label>
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/userRoleMaster")}>
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

export default AddEdit_UserRoleMaster;
