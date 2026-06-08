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
  Path: string;
  IsActive: boolean;
}

const initialValues: FormValues = {
  Name: "",
  Path: "",
  IsActive: true,
};

interface ModuleMasterState {
  id: number;
  formData: Partial<FormValues>;
  isProgress?: boolean;
}

const API_URL_SAVE = `ModuleMaster/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/ModuleMaster/Id`;

/**
 * Add/Edit form for Module master.
 */
const AddEdit_ModuleMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState<ModuleMasterState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const isEditMode = state.id > 0;

  /**
   * Validation schema for module master form.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        Name: Yup.string().trim().required("Name is required"),
        Path: Yup.string().trim().required("Path is required"),
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
    Path: toStringOrEmpty(state.formData.Path),
    IsActive: state.formData.IsActive !== undefined ? state.formData.IsActive : true,
  };

  /**
   * Submit handler for module master.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(state.id ?? 0));
      formData.append("Name", values.Name || "");
      formData.append("Path", values.Path || "");
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
        "/moduleMaster"
      );
    } catch (error) {
      console.error("Module master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Loops through all routes and saves them as modules.
   */
  const handleSaveAllRoutes = async () => {
    alert("Starting to save routes...");
    try {
      setState(prev => ({ ...prev, isProgress: true }));
      
      // Use dynamic import to avoid circular dependency
      const RouteModule = await import("../../Routes/Route");
      const currentRoutes = RouteModule.routes || [];

      const F_CompanyMaster = (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })();

      for (const route of currentRoutes) {
        if (!route.path) continue;
        
        let rawPath = route.path;
        if (process.env.PUBLIC_URL && rawPath.startsWith(process.env.PUBLIC_URL)) {
          rawPath = rawPath.replace(process.env.PUBLIC_URL, '');
        }

        if (!rawPath || rawPath === '/') continue;

        const nameParts = rawPath.replace('/', '').replace(/([A-Z])/g, ' $1').trim();
        const name = nameParts.charAt(0).toUpperCase() + nameParts.slice(1);

        const formData = new FormData();
        formData.append("Id", "0");
        formData.append("Name", name);
        formData.append("Path", rawPath);
        formData.append("IsActive", "true");
        formData.append("UserId", getCurrentUserId());
        formData.append("F_CompanyMaster", F_CompanyMaster);

        try {
          await Fn_AddEditData(
            dispatch,
            () => undefined,
            { arguList: { id: 0, formData } },
            API_URL_SAVE,
            true,
            "memberid",
            () => {}, // dummy navigate
            ""
          );
        } catch (innerError) {
          console.warn(`Failed to save route ${name}:`, innerError);
          // Continue loop even if this specific route fails (e.g. duplicate error)
        }
      }
      alert("All routes saved successfully!");
    } catch (error) {
      console.error("Failed to save routes:", error);
      alert("Failed to save some routes.");
    } finally {
      setState(prev => ({ ...prev, isProgress: false }));
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Module Master" parent="Masters" />
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
                        title={`${isEditMode ? "Edit" : "Add"} Module`}
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
                              <Label>
                                Path <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="Path"
                                placeholder="Enter path (e.g., /some-path)"
                                value={values.Path}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.Path && !!errors.Path}
                              />
                              <ErrorMessage name="Path" component="div" className="text-danger small" />
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
                        <Btn color="info" type="button" className="float-start" onClick={handleSaveAllRoutes} disabled={state.isProgress}>
                          {state.isProgress ? "Saving Routes..." : "Save All Routes"}
                        </Btn>
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/moduleMaster")}>
                          Cancel
                        </Btn>
                        <Btn color="primary" type="submit" disabled={isSubmitting || state.isProgress}>
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

export default AddEdit_ModuleMaster;
