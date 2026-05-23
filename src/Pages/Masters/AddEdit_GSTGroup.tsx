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

const API_TAX_GROUP = "TaxGroup";
const API_URL_SAVE = `${API_TAX_GROUP}/0/token`;
const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/${API_TAX_GROUP}/Id`;

interface FormValues {
  groupName: string;
  isActive: boolean;
}

const initialValues: FormValues = {
  groupName: "",
  isActive: true,
};

interface TaxGroupState {
  id: number;
  formData: Partial<FormValues> & { Name?: string; GroupName?: string; groupName?: string; IsActive?: boolean };
  isProgress?: boolean;
}

/**
 * Add/Edit form for Tax Group master (formerly GST Group).
 */
const AddEdit_GSTGroup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [taxGroupState, setTaxGroupState] = useState<TaxGroupState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const isEditMode = taxGroupState.id > 0;

  const validationSchema = useMemo(
    () =>
      Yup.object({
        groupName: Yup.string().trim().required("Group name is required"),
        isActive: Yup.boolean(),
      }),
    []
  );

  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setTaxGroupState((prev) => ({ ...prev, id: recordId }));
      Fn_DisplayData(dispatch, setTaxGroupState as any, recordId, API_URL_EDIT);
    } else {
      setTaxGroupState((prev) => ({ ...prev, id: 0, formData: { ...initialValues } }));
    }
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");
  const toBool = (value: unknown) => value === true || value === "true" || value === 1 || value === "1";

  const initialFormValues: FormValues = {
    groupName: toStringOrEmpty(
      taxGroupState.formData.GroupName ?? taxGroupState.formData.groupName ?? taxGroupState.formData.Name ?? ""
    ),
    isActive:
      taxGroupState.formData.IsActive !== undefined
        ? toBool(taxGroupState.formData.IsActive)
        : taxGroupState.formData.isActive !== undefined
          ? toBool(taxGroupState.formData.isActive)
          : true,
  };

  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(taxGroupState.id ?? 0));
      formData.append("GroupName", (values.groupName || "").trim());
      formData.append("IsActive", values.isActive ? "true" : "false");
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: taxGroupState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/taxGroupMaster"
      );
    } catch (error) {
      console.error("Tax Group submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Tax Group" parent="Masters" />
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
                      title={`${isEditMode ? "Edit" : "Add"} Tax Group`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Row className="gy-3">
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Group Name <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="groupName"
                              placeholder="Enter group name"
                              value={values.groupName}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              invalid={touched.groupName && !!errors.groupName}
                            />
                            <ErrorMessage name="groupName" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup check>
                            <Input
                              type="checkbox"
                              name="isActive"
                              id="isActive"
                              checked={values.isActive}
                              onChange={(e) => setFieldValue("isActive", e.target.checked)}
                              onBlur={handleBlur}
                            />
                            <Label check for="isActive">
                              Is Active
                            </Label>
                          </FormGroup>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/taxGroupMaster")}>
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

export default AddEdit_GSTGroup;
