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

const API_GODOWN_MASTER = "GodownMaster";
const API_URL_SAVE = `${API_GODOWN_MASTER}/0/token`;
const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/${API_GODOWN_MASTER}/Id`;

interface FormValues {
  GodownName: string;
  GodownAddress: string;
  IsActive: boolean;
}

const initialValues: FormValues = {
  GodownName: "",
  GodownAddress: "",
  IsActive: true,
};

interface WarehouseState {
  id: number;
  formData: Partial<FormValues> & { Name?: string; Address?: string };
  isProgress?: boolean;
}

/**
 * Add/Edit form for Warehouse (Godown) master.
 * API: POST GodownMaster/{UserId}/{UserToken} - multipart/form-data: GodownName, GodownAddress, IsActive, UserId
 */
const AddEdit_Warehouse = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [warehouseState, setWarehouseState] = useState<WarehouseState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const isEditMode = warehouseState.id > 0;

  const validationSchema = useMemo(
    () =>
      Yup.object({
        GodownName: Yup.string().trim().required("Godown name is required"),
        GodownAddress: Yup.string().trim(),
        IsActive: Yup.boolean(),
      }),
    []
  );

  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setWarehouseState((prev) => ({ ...prev, id: recordId }));
      Fn_DisplayData(dispatch, setWarehouseState as any, recordId, API_URL_EDIT);
    } else {
      setWarehouseState((prev) => ({ ...prev, id: 0, formData: { ...initialValues } }));
    }
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");
  const toBool = (value: unknown) => value === true || value === "true" || value === 1 || value === "1";

  const initialFormValues: FormValues = {
    GodownName: toStringOrEmpty(warehouseState.formData.GodownName ?? warehouseState.formData.Name ?? ""),
    GodownAddress: toStringOrEmpty(warehouseState.formData.GodownAddress ?? warehouseState.formData.Address ?? ""),
    IsActive:
      warehouseState.formData.IsActive !== undefined
        ? toBool(warehouseState.formData.IsActive)
        : true,
  };

  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const userId = getCurrentUserId();

      const formData = new FormData();
      formData.append("Id", String(warehouseState.id ?? 0));
      formData.append("GodownName", values.GodownName || "");
      formData.append("GodownAddress", values.GodownAddress || "");
      formData.append("IsActive", values.IsActive ? "true" : "false");
      formData.append("UserId", String(Number(userId) || 0));
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: warehouseState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/warehouse"
      );
    } catch (error) {
      console.error("Warehouse (Godown) submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Warehouse Master" parent="Masters" />
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
                      title={`${isEditMode ? "Edit" : "Add"} Warehouse`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Row className="gy-3">
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Godown Name <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="GodownName"
                              placeholder="Enter godown name"
                              value={values.GodownName}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              invalid={touched.GodownName && !!errors.GodownName}
                            />
                            <ErrorMessage name="GodownName" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup check>
                            <Input
                              type="checkbox"
                              name="IsActive"
                              id="IsActive"
                              checked={values.IsActive}
                              onChange={(e) => setFieldValue("IsActive", e.target.checked)}
                              onBlur={handleBlur}
                            />
                            <Label check for="IsActive">
                              Is Active
                            </Label>
                          </FormGroup>
                        </Col>
                        <Col md="12">
                          <FormGroup>
                            <Label>Godown Address</Label>
                            <Input
                              type="textarea"
                              name="GodownAddress"
                              placeholder="Enter address"
                              value={values.GodownAddress}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/warehouse")}>
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
  );
};

export default AddEdit_Warehouse;
