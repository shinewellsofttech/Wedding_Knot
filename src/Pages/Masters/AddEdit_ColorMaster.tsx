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
  IsDefault: boolean;
}

const initialValues: FormValues = {
  Name: "",
  IsDefault: false,
};

interface ColorMasterState {
  id: number;
  formData: Partial<FormValues> & {
    // Legacy field names for backward compatibility
    ColorName?: string;
    SetAsDefaultColor?: boolean;
  };
  isProgress?: boolean;
}

const API_URL_SAVE = `ColorMaster/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/ColorMaster/Id`;

/**
 * Add/Edit form for Color master.
 */
const AddEdit_ColorMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [colorMasterState, setColorMasterState] = useState<ColorMasterState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const isEditMode = colorMasterState.id > 0;

  /**
   * Validation schema for color master form.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        Name: Yup.string().trim().required("Name is required"),
        IsDefault: Yup.boolean(),
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
      setColorMasterState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setColorMasterState, recordId, API_URL_EDIT);
    } else {
      setColorMasterState((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    Name: toStringOrEmpty(colorMasterState.formData.Name || colorMasterState.formData.ColorName),
    IsDefault: Boolean(colorMasterState.formData.IsDefault || colorMasterState.formData.SetAsDefaultColor),
  };

  /**
   * Submit handler for color master.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(colorMasterState.id ?? 0));
      formData.append("Name", values.Name || "");
      formData.append("IsDefault", values.IsDefault.toString());
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: colorMasterState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/colorMaster"
      );
    } catch (error) {
      console.error("Color master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Color Master" parent="Masters" />
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
                        title={`${isEditMode ? "Edit" : "Add"} Color`}
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
                              <Label>Is Default</Label>
                              <div className="form-check form-switch">
                                <Input
                                  type="checkbox"
                                  role="switch"
                                  className="form-check-input"
                                  name="IsDefault"
                                  checked={values.IsDefault}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                />
                                <Label check className="form-check-label ms-2">
                                  Mark as default
                                </Label>
                              </div>
                              <ErrorMessage name="IsDefault" component="div" className="text-danger small mt-1" />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/colorMaster")}>
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

export default AddEdit_ColorMaster;

