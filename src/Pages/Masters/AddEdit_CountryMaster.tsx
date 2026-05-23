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
}

const initialValues: FormValues = {
  Name: "",
};

interface CountryState {
  id: number;
  formData: Partial<FormValues> & {
    // Legacy field name for backward compatibility
    CountryName?: string;
  };
  isProgress?: boolean;
}

const API_URL_SAVE = `${API_WEB_URLS.CountryMaster}/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/${API_WEB_URLS.CountryMaster}/Id`;

/**
 * Provides create/update form for country master.
 */
const AddEdit_CountryMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [countryState, setCountryState] = useState<CountryState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const isEditMode = countryState.id > 0;

  /**
   * Validation schema for country fields.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        Name: Yup.string().trim().required("Name is required"),
      }),
    []
  );

  /**
   * Determines whether we need to fetch existing data.
   */
  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setCountryState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setCountryState, recordId, API_URL_EDIT);
    } else {
      setCountryState((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    Name: toStringOrEmpty(countryState.formData.Name || countryState.formData.CountryName),
  };

  /**
   * Saves the country master record.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(countryState.id ?? 0));
      formData.append("Name", values.Name || "");
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: countryState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/countryMaster"
      );
    } catch (error) {
      console.error("Country master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Country Master" parent="Masters" />
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
                        title={`${isEditMode ? "Edit" : "Add"} Country`}
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
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/countryMaster")}>
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

export default AddEdit_CountryMaster;

