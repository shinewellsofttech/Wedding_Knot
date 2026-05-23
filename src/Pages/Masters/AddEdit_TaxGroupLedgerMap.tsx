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

const API_TAX_GROUP_LEDGER_MAP = "TaxGroupLedgerMap";
const API_URL_SAVE = `${API_TAX_GROUP_LEDGER_MAP}/0/token`;
const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/${API_TAX_GROUP_LEDGER_MAP}/Id`;
const TAX_GROUP_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/TaxGroup/Id/0`;
const LEDGER_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.LedgerMaster}/Id/0`;

interface FormValues {
  F_TaxGroup: string;
  F_LedgerMaster: string;
  IsOwnState: boolean;
}

const initialValues: FormValues = {
  F_TaxGroup: "",
  F_LedgerMaster: "",
  IsOwnState: false,
};

interface TaxGroupLedgerMapState {
  id: number;
  formData: Partial<FormValues> & { F_TaxGroup?: number; F_LedgerMaster?: number };
  isProgress?: boolean;
}

interface DropdownState {
  taxGroups: Array<{ Id?: number; Name?: string; groupName?: string }>;
  ledgers: Array<{ Id?: number; Name?: string }>;
}

const AddEdit_TaxGroupLedgerMap = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [mapState, setMapState] = useState<TaxGroupLedgerMapState>({
    id: 0,
    formData: {},
    isProgress: false,
  });

  const [dropdowns, setDropdowns] = useState<DropdownState>({
    taxGroups: [],
    ledgers: [],
  });

  const isEditMode = mapState.id > 0;

  const validationSchema = useMemo(
    () =>
      Yup.object({
        F_TaxGroup: Yup.string().trim().required("Tax Group is required"),
        F_LedgerMaster: Yup.string().trim().required("Ledger is required"),
        IsOwnState: Yup.boolean(),
      }),
    []
  );

  useEffect(() => {
    Fn_FillListData(dispatch, setDropdowns as any, "taxGroups", TAX_GROUP_LIST_URL).catch(() => {});
    Fn_FillListData(dispatch, setDropdowns as any, "ledgers", LEDGER_LIST_URL).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setMapState((prev) => ({ ...prev, id: recordId }));
      Fn_DisplayData(dispatch, setMapState as any, recordId, API_URL_EDIT);
    } else {
      setMapState((prev) => ({ ...prev, id: 0, formData: {} }));
    }
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");
  const toBool = (value: unknown) => value === true || value === "true" || value === 1 || value === "1";

  const initialFormValues: FormValues = {
    F_TaxGroup: toStringOrEmpty(mapState.formData.F_TaxGroup ?? ""),
    F_LedgerMaster: toStringOrEmpty(mapState.formData.F_LedgerMaster ?? ""),
    IsOwnState:
      mapState.formData.IsOwnState !== undefined ? toBool(mapState.formData.IsOwnState) : false,
  };

  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const userId = getCurrentUserId();

      const formData = new FormData();
      if (mapState.id > 0) {
        formData.append("Id", String(mapState.id));
      }
      formData.append("F_TaxGroup", values.F_TaxGroup || "0");
      formData.append("F_LedgerMaster", values.F_LedgerMaster || "0");
      formData.append("IsOwnState", values.IsOwnState ? "true" : "false");
      formData.append("UserId", String(Number(userId) || 0));
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: mapState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/taxGroupLedgerMap"
      );
    } catch (error) {
      console.error("Tax Group Ledger Map submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Tax Group Ledger Map" parent="Masters" />
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
                      title={`${isEditMode ? "Edit" : "Add"} Tax Group Ledger Map`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Row className="gy-3">
                        <Col md="6">
                          <FormGroup>
                            <Label>Tax Group <span className="text-danger">*</span></Label>
                            <Input
                              type="select"
                              name="F_TaxGroup"
                              value={values.F_TaxGroup}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              invalid={touched.F_TaxGroup && !!errors.F_TaxGroup}
                            >
                              <option value="">Select Tax Group</option>
                              {dropdowns.taxGroups.map((tg) => (
                                <option key={tg?.Id} value={tg?.Id ?? ""}>
                                  {tg?.groupName ?? tg?.Name ?? `Tax Group ${tg?.Id ?? ""}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_TaxGroup" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>Ledger <span className="text-danger">*</span></Label>
                            <Input
                              type="select"
                              name="F_LedgerMaster"
                              value={values.F_LedgerMaster}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              invalid={touched.F_LedgerMaster && !!errors.F_LedgerMaster}
                            >
                              <option value="">Select Ledger</option>
                              {dropdowns.ledgers.map((ledger) => (
                                <option key={ledger?.Id} value={ledger?.Id ?? ""}>
                                  {ledger?.Name ?? `Ledger ${ledger?.Id ?? ""}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_LedgerMaster" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup check>
                            <Input
                              type="checkbox"
                              name="IsOwnState"
                              id="IsOwnState"
                              checked={values.IsOwnState}
                              onChange={(e) => setFieldValue("IsOwnState", e.target.checked)}
                              onBlur={handleBlur}
                            />
                            <Label check for="IsOwnState">
                              Is Own State
                            </Label>
                          </FormGroup>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/taxGroupLedgerMap")}>
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

export default AddEdit_TaxGroupLedgerMap;
