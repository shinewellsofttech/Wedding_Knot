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
  F_StateMaster: string;
}

const initialValues: FormValues = {
  Name: "",
  F_StateMaster: "",
};

interface CityMasterState {
  id: number;
  formData: Partial<FormValues> & {
    // Legacy field name for backward compatibility
    CityName?: string;
  };
  isProgress?: boolean;
}

interface DropdownState {
  states: Array<{ Id?: number; Name?: string }>;
  isProgress?: boolean;
}

const API_URL_SAVE = `${API_WEB_URLS.CityMaster}/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/${API_WEB_URLS.CityMaster}/Id`;
const STATE_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.StateMaster}/Id/0`;

/**
 * Add/Edit form for City master with state selection.
 */
const AddEdit_CityMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [cityMaster, setCityMaster] = useState<CityMasterState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const [dropdowns, setDropdowns] = useState<DropdownState>({
    states: [],
    isProgress: false,
  });

  const isEditMode = cityMaster.id > 0;

  /**
   * Validation rules for city master form.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        Name: Yup.string().trim().required("Name is required"),
        F_StateMaster: Yup.string().trim().required("State selection is required"),
      }),
    []
  );

  /**
   * Load state dropdown on mount.
   */
  useEffect(() => {
    Fn_FillListData(dispatch, setDropdowns, "states", STATE_LIST_URL).catch((error) => {
      console.error("Failed to fetch states:", error);
    });
  }, [dispatch]);

  /**
   * Determine edit/add mode and fetch data when editing.
   */
  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setCityMaster((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setCityMaster, recordId, API_URL_EDIT);
    } else {
      setCityMaster((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    Name: toStringOrEmpty(cityMaster.formData.Name || cityMaster.formData.CityName),
    F_StateMaster: toStringOrEmpty(cityMaster.formData.F_StateMaster),
  };

  /**
   * Submit handler for city master.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(cityMaster.id ?? 0));
      formData.append("Name", values.Name || "");
      formData.append("F_StateMaster", values.F_StateMaster || "");
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: cityMaster.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/cityMaster"
      );
    } catch (error) {
      console.error("City master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="City Master" parent="Masters" />
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
                        title={`${isEditMode ? "Edit" : "Add"} City`}
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
                                State <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="select"
                                name="F_StateMaster"
                                value={values.F_StateMaster}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_StateMaster && !!errors.F_StateMaster}
                              >
                                <option value="">Select state</option>
                                {dropdowns.states.map((stateOption) => (
                                  <option key={stateOption?.Id} value={stateOption?.Id ?? ""}>
                                    {stateOption?.Name || `State ${stateOption?.Id ?? ""}`}
                                  </option>
                                ))}
                              </Input>
                              <ErrorMessage name="F_StateMaster" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/cityMaster")}>
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

export default AddEdit_CityMaster;

