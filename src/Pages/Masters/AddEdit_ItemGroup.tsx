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
  groupName: string;
  f_TaxGroup: string;
  isActive: boolean;
}

const initialValues: FormValues = {
  groupName: "",
  f_TaxGroup: "",
  isActive: true,
};

interface ItemGroupState {
  id: number;
  formData: Partial<FormValues> & {
    GroupName?: string;
    groupName?: string;
    F_TaxGroup?: string;
    IsActive?: boolean;
  };
  isProgress?: boolean;
}

interface DropdownState {
  taxGroups: Array<{ Id?: number; GroupName?: string; Name?: string; groupName?: string; IsActive?: boolean }>;
  isProgress?: boolean;
}

const TAX_GROUP_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/TaxGroup/Id/0`;
const API_URL_SAVE = "ItemGroup/0/token";
const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/ItemGroup/Id`;

const AddEdit_ItemGroup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [itemGroupState, setItemGroupState] = useState<ItemGroupState>({
    id: 0,
    formData: {},
    isProgress: false,
  });

  const [dropdowns, setDropdowns] = useState<DropdownState>({
    taxGroups: [],
    isProgress: false,
  });

  const isEditMode = itemGroupState.id > 0;

  const validationSchema = useMemo(
    () =>
      Yup.object({
        groupName: Yup.string().trim().required("Group name is required"),
        f_TaxGroup: Yup.string().trim(),
        isActive: Yup.boolean(),
      }),
    []
  );

  useEffect(() => {
    Fn_FillListData(dispatch, setDropdowns as any, "taxGroups", TAX_GROUP_LIST_URL).catch((error) => {
      console.error("Failed to fetch tax groups:", error);
    });
  }, [dispatch]);

  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setItemGroupState((prev) => ({ ...prev, id: recordId }));
      Fn_DisplayData(dispatch, setItemGroupState as any, recordId, API_URL_EDIT);
    } else {
      setItemGroupState((prev) => ({ ...prev, id: 0, formData: {} }));
    }
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");
  const toBool = (value: unknown) => (value === true || value === "true" || value === 1 || value === "1");

  const initialFormValues: FormValues = {
    groupName: toStringOrEmpty(
      itemGroupState.formData.groupName ?? itemGroupState.formData.GroupName ?? ""
    ),
    f_TaxGroup: toStringOrEmpty(
      itemGroupState.formData.f_TaxGroup ?? itemGroupState.formData.F_TaxGroup ?? ""
    ),
    isActive: itemGroupState.formData.isActive !== undefined
      ? toBool(itemGroupState.formData.isActive)
      : itemGroupState.formData.IsActive !== undefined
        ? toBool(itemGroupState.formData.IsActive)
        : true,
  };

  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(itemGroupState.id ?? 0));
      formData.append("groupName", values.groupName || "");
      formData.append("f_TaxGroup", values.f_TaxGroup || "0");
      formData.append("isActive", values.isActive ? "true" : "false");
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: itemGroupState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/itemGroup"
      );
    } catch (error) {
      console.error("Item group submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Item Group" parent="Masters" />
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
                      title={`${isEditMode ? "Edit" : "Add"} Item Group`}
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
                          <FormGroup>
                            <Label>Tax Group</Label>
                            <Input
                              type="select"
                              name="f_TaxGroup"
                              value={values.f_TaxGroup}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              invalid={touched.f_TaxGroup && !!errors.f_TaxGroup}
                            >
                              <option value="">Select Tax Group</option>
                              {dropdowns.taxGroups.map((tg) => (
                                <option key={tg?.Id} value={tg?.Id ?? ""}>
                                  {tg?.GroupName ?? tg?.groupName ?? tg?.Name ?? `Tax Group ${tg?.Id ?? ""}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="f_TaxGroup" component="div" className="text-danger small" />
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
                      <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/itemGroup")}>
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

export default AddEdit_ItemGroup;
