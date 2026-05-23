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
  BatchNo: string;
  ExpiryDate: string;
  Quantity: string;
  Rate: string;
}

const initialValues: FormValues = {
  BatchNo: "",
  ExpiryDate: "",
  Quantity: "",
  Rate: "",
};

interface BatchMasterState {
  id: number;
  formData: Partial<FormValues>;
  isProgress?: boolean;
}

const API_URL_SAVE = `BatchMaster/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/BatchMaster/Id`;

/**
 * Add/Edit form for Batch master.
 */
const AddEdit_BatchMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [batchMasterState, setBatchMasterState] = useState<BatchMasterState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const isEditMode = batchMasterState.id > 0;

  /**
   * Validation schema for batch master form.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        BatchNo: Yup.string().trim().required("Batch No is required"),
        ExpiryDate: Yup.string().required("Expiry Date is required"),
        Quantity: Yup.number()
          .typeError("Quantity must be a number")
          .required("Quantity is required")
          .positive("Quantity must be greater than 0"),
        Rate: Yup.number()
          .typeError("Rate must be a number")
          .required("Rate is required")
          .positive("Rate must be greater than 0"),
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
      setBatchMasterState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setBatchMasterState, recordId, API_URL_EDIT);
    } else {
      setBatchMasterState((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    BatchNo: toStringOrEmpty(batchMasterState.formData.BatchNo),
    ExpiryDate: toStringOrEmpty(batchMasterState.formData.ExpiryDate),
    Quantity: toStringOrEmpty(batchMasterState.formData.Quantity),
    Rate: toStringOrEmpty(batchMasterState.formData.Rate),
  };

  /**
   * Submit handler for batch master.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(batchMasterState.id ?? 0));
      formData.append("BatchNo", values.BatchNo || "");
      formData.append("ExpiryDate", values.ExpiryDate || "");
      formData.append("Quantity", values.Quantity || "0");
      formData.append("Rate", values.Rate || "0");
      formData.append("UserId", getCurrentUserId());
      formData.append(
        "F_CompanyMaster",
        (() => {
          try {
            const a = JSON.parse(localStorage.getItem("authUser") || "{}");
            return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0");
          } catch (e) {
            return "0";
          }
        })()
      );

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: batchMasterState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/batchMaster"
      );
    } catch (error) {
      console.error("Batch master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Batch Master" parent="Masters" />
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
                        title={`${isEditMode ? "Edit" : "Add"} Batch`}
                        tagClass="card-title mb-0"
                      />
                      <CardBody>
                        <Row className="gy-3">
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Batch No <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="BatchNo"
                                placeholder="Enter batch number"
                                value={values.BatchNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.BatchNo && !!errors.BatchNo}
                              />
                              <ErrorMessage name="BatchNo" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Expiry Date <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="date"
                                name="ExpiryDate"
                                value={values.ExpiryDate}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.ExpiryDate && !!errors.ExpiryDate}
                              />
                              <ErrorMessage name="ExpiryDate" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Quantity <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="number"
                                name="Quantity"
                                placeholder="Enter quantity"
                                value={values.Quantity}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.Quantity && !!errors.Quantity}
                                step="0.01"
                                min="0"
                              />
                              <ErrorMessage name="Quantity" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Rate <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="number"
                                name="Rate"
                                placeholder="Enter rate"
                                value={values.Rate}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.Rate && !!errors.Rate}
                                step="0.01"
                                min="0"
                              />
                              <ErrorMessage name="Rate" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/batchMaster")}>
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

export default AddEdit_BatchMaster;
