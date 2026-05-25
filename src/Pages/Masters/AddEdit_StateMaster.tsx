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
  StateCode: string;
}

const initialValues: FormValues = {
  Name: "",
  StateCode: "",
};

interface StateMasterState {
  id: number;
  formData: Partial<FormValues> & {
    // Legacy field name for backward compatibility
    StateName?: string;
  };
  isProgress?: boolean;
}

interface DropdownState {
  countries: Array<{ Id?: number; Name?: string }>;
  isProgress?: boolean;
}

const API_URL_SAVE = `${API_WEB_URLS.StateMaster}/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/${API_WEB_URLS.StateMaster}/Id`;

/**
 * Add/Edit form for State master.
 */
const AddEdit_StateMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [stateMaster, setStateMaster] = useState<StateMasterState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const isEditMode = stateMaster.id > 0;

  /**
   * Validation rules for state master form.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        Name: Yup.string().trim().required("Name is required"),
        StateCode: Yup.string().trim(),
      }),
    []
  );

  /**
   * Detect edit mode and fetch record if necessary.
   */
  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setStateMaster((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setStateMaster, recordId, API_URL_EDIT);
    } else {
      setStateMaster((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    Name: toStringOrEmpty(stateMaster.formData.Name || stateMaster.formData.StateName),
    StateCode: toStringOrEmpty(stateMaster.formData.StateCode),
  };

  /**
   * Submit handler for form.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(stateMaster.id ?? 0));
      formData.append("Name", values.Name || "");
      formData.append("StateCode", values.StateCode || "");
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: stateMaster.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/stateMaster"
      );
    } catch (error) {
      console.error("State master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="State Master" parent="Masters" />
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
                        title={`${isEditMode ? "Edit" : "Add"} State`}
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
                                State Code
                              </Label>
                              <Input
                                type="text"
                                name="StateCode"
                                placeholder="Enter state code"
                                value={values.StateCode}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.StateCode && !!errors.StateCode}
                              />
                              <ErrorMessage name="StateCode" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/stateMaster")}>
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

export default AddEdit_StateMaster;

