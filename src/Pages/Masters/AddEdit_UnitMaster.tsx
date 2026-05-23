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
  UnitName: string;
  ShortName: string;
  IsActive: boolean;
}

const initialValues: FormValues = {
  UnitName: "",
  ShortName: "",
  IsActive: true,
};

interface UnitMasterState {
  id: number;
  formData: Partial<FormValues> & { Name?: string };
  isProgress?: boolean;
}

const API_URL_SAVE = `UnitMaster/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/UnitMaster/Id`;

/**
 * Add/Edit form for Unit master.
 */
const AddEdit_UnitMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [unitMasterState, setUnitMasterState] = useState<UnitMasterState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const isEditMode = unitMasterState.id > 0;

  /**
   * Validation schema for unit master form.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        UnitName: Yup.string().trim().required("Unit Name is required"),
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
      setUnitMasterState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setUnitMasterState, recordId, API_URL_EDIT);
    } else {
      setUnitMasterState((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    UnitName: toStringOrEmpty(unitMasterState.formData.UnitName ?? unitMasterState.formData.Name),
    ShortName: toStringOrEmpty(unitMasterState.formData.ShortName),
    IsActive: unitMasterState.formData.IsActive ?? true,
  };

  /**
   * Submit handler for unit master.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const userId = getCurrentUserId();

      const formData = new FormData();
      formData.append("UnitName", values.UnitName.trim());
      formData.append("ShortName", values.ShortName?.trim() ?? "");
      formData.append("IsActive", String(values.IsActive));
      formData.append("UserId", String(Number(userId) || 0));
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());
      if (unitMasterState.id > 0) {
        formData.append("Id", String(unitMasterState.id));
      }

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: unitMasterState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/unitMaster"
      );
    } catch (error) {
      console.error("Unit master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Unit Master" parent="Masters" />
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
                      <CardHeaderCommon
                        title={`${isEditMode ? "Edit" : "Add"} Unit`}
                        tagClass="card-title mb-0"
                      />
                      <CardBody>
                        <Row className="gy-3">
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Unit Name <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="UnitName"
                                placeholder="Enter unit name"
                                value={values.UnitName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.UnitName && !!errors.UnitName}
                              />
                              <ErrorMessage name="UnitName" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>Short Name</Label>
                              <Input
                                type="text"
                                name="ShortName"
                                placeholder="Enter short name"
                                value={values.ShortName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup className="d-flex align-items-center gap-2">
                              <Input
                                type="checkbox"
                                name="IsActive"
                                id="unitIsActive"
                                checked={values.IsActive}
                                onChange={(e) => setFieldValue("IsActive", e.target.checked)}
                              />
                              <Label for="unitIsActive" className="mb-0">Is Active</Label>
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/unitMaster")}>
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

export default AddEdit_UnitMaster;

