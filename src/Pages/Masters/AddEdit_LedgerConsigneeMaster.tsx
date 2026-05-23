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
  Address1: string;
  Address2: string;
  Address3: string;
  F_LedgerMaster: string;
}

const initialValues: FormValues = {
  Name: "",
  Address1: "",
  Address2: "",
  Address3: "",
  F_LedgerMaster: "",
};

interface LedgerConsigneeMasterState {
  id: number;
  formData: Partial<FormValues>;
  isProgress?: boolean;
}

interface DropdownState {
  ledgers: Array<{ Id?: number; Name?: string; LedgerName?: string }>;
  isProgress?: boolean;
}

const LEDGER_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.LedgerMaster}/Id/0`;
const API_URL_SAVE = `LedgerConsigneeMaster/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/LedgerConsigneeMaster/Id`;

/**
 * Add/Edit form for Ledger Consignee Master.
 */
const AddEdit_LedgerConsigneeMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [consigneeState, setConsigneeState] = useState<LedgerConsigneeMasterState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const [dropdowns, setDropdowns] = useState<DropdownState>({
    ledgers: [],
    isProgress: false,
  });

  const isEditMode = consigneeState.id > 0;

  /**
   * Validation schema for ledger consignee master form.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        Name: Yup.string().trim().required("Name is required"),
        F_LedgerMaster: Yup.string().trim().required("Ledger Master is required"),
        Address1: Yup.string().trim(),
        Address2: Yup.string().trim(),
        Address3: Yup.string().trim(),
      }),
    []
  );

  /**
   * Load ledger options on mount.
   */
  useEffect(() => {
    Fn_FillListData(dispatch, setDropdowns, "ledgers", LEDGER_LIST_URL).catch((error) => {
      console.error("Failed to fetch ledgers:", error);
    });
  }, [dispatch]);

  /**
   * Load existing record when editing.
   */
  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setConsigneeState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setConsigneeState, recordId, API_URL_EDIT);
    } else {
      setConsigneeState((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    Name: toStringOrEmpty(consigneeState.formData.Name),
    Address1: toStringOrEmpty(consigneeState.formData.Address1),
    Address2: toStringOrEmpty(consigneeState.formData.Address2),
    Address3: toStringOrEmpty(consigneeState.formData.Address3),
    F_LedgerMaster: toStringOrEmpty(consigneeState.formData.F_LedgerMaster),
  };

  /**
   * Submit handler for ledger consignee master.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(consigneeState.id ?? 0));
      formData.append("Name", values.Name || "");
      formData.append("Address1", values.Address1 || "");
      formData.append("Address2", values.Address2 || "");
      formData.append("Address3", values.Address3 || "");
      formData.append("F_LedgerMaster", values.F_LedgerMaster || "");
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: consigneeState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/ledgerConsigneeMaster"
      );
    } catch (error) {
      console.error("Ledger consignee master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Ledger Consignee Master" parent="Masters" />
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
                        title={`${isEditMode ? "Edit" : "Add"} Ledger Consignee`}
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
                                Ledger Master <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="select"
                                name="F_LedgerMaster"
                                value={values.F_LedgerMaster}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_LedgerMaster && !!errors.F_LedgerMaster}
                              >
                                <option value="">Select ledger</option>
                                {dropdowns.ledgers.map((ledger) => (
                                  <option key={ledger?.Id} value={ledger?.Id ?? ""}>
                                    {ledger?.Name || ledger?.LedgerName || `Ledger ${ledger?.Id ?? ""}`}
                                  </option>
                                ))}
                              </Input>
                              <ErrorMessage name="F_LedgerMaster" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="12">
                            <FormGroup>
                              <Label>Address 1</Label>
                              <Input
                                type="textarea"
                                name="Address1"
                                placeholder="Enter address line 1"
                                value={values.Address1}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="12">
                            <FormGroup>
                              <Label>Address 2</Label>
                              <Input
                                type="textarea"
                                name="Address2"
                                placeholder="Enter address line 2"
                                value={values.Address2}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="12">
                            <FormGroup>
                              <Label>Address 3</Label>
                              <Input
                                type="textarea"
                                name="Address3"
                                placeholder="Enter address line 3"
                                value={values.Address3}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn
                          color="secondary"
                          type="button"
                          className="me-2"
                          onClick={() => navigate("/ledgerConsigneeMaster")}
                        >
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

export default AddEdit_LedgerConsigneeMaster;





