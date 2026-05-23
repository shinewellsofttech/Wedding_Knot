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
import { getAllAppPages } from "../../Data/appPages";

interface FormValues {
  Name: string;
  PageType: string;
}

const initialValues: FormValues = {
  Name: "",
  PageType: "",
};

interface PageMasterState {
  id: number;
  formData: Partial<FormValues> & {
    // Legacy field name for backward compatibility
    PageName?: string;
  };
  isProgress?: boolean;
}

const API_URL_SAVE = `PageMaster/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/PageMaster/Id`;
const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/PageMaster/Id/0`;

/**
 * Add/Edit form for Page master.
 */
const AddEdit_PageMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [pageMasterState, setPageMasterState] = useState<PageMasterState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });
  const [addAllInProgress, setAddAllInProgress] = useState(false);

  const isEditMode = pageMasterState.id > 0;

  /**
   * Validation schema for page master form.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        Name: Yup.string().trim().required("Page name is required"),
        PageType: Yup.string().trim().required("Page type is required"),
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
      setPageMasterState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setPageMasterState, recordId, API_URL_EDIT);
    } else {
      setPageMasterState((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    Name: toStringOrEmpty(pageMasterState.formData.Name || pageMasterState.formData.PageName),
    PageType: toStringOrEmpty(pageMasterState.formData.PageType),
  };

  /**
   * Submit handler for page master.
   */
  /**
   * Add all app pages to PageMaster, skipping duplicates (by PageType).
   */
  const handleAddAllPages = async () => {
    try {
      setAddAllInProgress(true);
      const userId = getCurrentUserId();
      const baseUrl = API_WEB_URLS.BASE || "";

      const listRes = await fetch(baseUrl + LIST_API_URL);
      const listJson = await listRes.json();
      const existingList = listJson?.dataList ?? listJson?.data?.dataList ?? listJson?.PageMasterList ?? (Array.isArray(listJson) ? listJson : []);
      const existingTypes = new Set(
        (existingList as { PageType?: string }[]).map((r) => String(r?.PageType ?? "").trim().toLowerCase()).filter(Boolean)
      );

      const allPages = getAllAppPages();
      const toAdd = allPages.filter((p) => !existingTypes.has(p.pageType.trim().toLowerCase()));

      if (toAdd.length === 0) {
        const { toast } = await import("react-toastify");
        toast.info("All pages already exist in Page Master. No duplicates added.", { autoClose: 3000 });
        return;
      }

      const saveUrl = baseUrl + API_URL_SAVE;
      let added = 0;
      for (const page of toAdd) {
        const formData = new FormData();
        formData.append("Id", "0");
        formData.append("Name", page.name);
        formData.append("PageType", page.pageType);
        formData.append("UserId", userId);
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

        const res = await fetch(saveUrl, { method: "POST", body: formData });
        const json = (await res.json?.()) ?? {};
        const ok = res.ok || json?.status === 200 || json?.response?.[0]?.Id > 0;
        if (ok) added++;
      }

      const { toast } = await import("react-toastify");
      toast.success(`Added ${added} page(s) to Page Master. ${toAdd.length - added} failed.`, { autoClose: 3000 });
      navigate("/pageMaster");
    } catch (error) {
      console.error("Add all pages failed:", error);
      const { toast } = await import("react-toastify");
      toast.error("Failed to add pages. Please try again.");
    } finally {
      setAddAllInProgress(false);
    }
  };

  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(pageMasterState.id ?? 0));
      formData.append("Name", values.Name || "");
      formData.append("PageType", values.PageType || "");
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: pageMasterState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/pageMaster"
      );
    } catch (error) {
      console.error("Page master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
    
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Page Master" parent="Masters" />
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
                        title={`${isEditMode ? "Edit" : "Add"} Page`}
                        tagClass="card-title mb-0"
                      />
                      <CardBody>
                        <Row className="gy-3">
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Page Name <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="Name"
                                placeholder="Page name is required"
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
                                Page Type <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="PageType"
                                placeholder="ENTER PAGE TYPE"
                                value={values.PageType}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.PageType && !!errors.PageType}
                              />
                              <ErrorMessage name="PageType" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="d-flex justify-content-between align-items-center">
                        <Btn
                          color="info"
                          type="button"
                          disabled={addAllInProgress}
                          onClick={handleAddAllPages}
                        >
                          {addAllInProgress ? "Adding..." : "Add All Pages"}
                        </Btn>
                        <div>
                          <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/pageMaster")}>
                            Cancel
                          </Btn>
                          <Btn color="primary" type="submit" disabled={isSubmitting}>
                            {isEditMode ? "Update" : "Submit"}
                          </Btn>
                        </div>
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

export default AddEdit_PageMaster;
