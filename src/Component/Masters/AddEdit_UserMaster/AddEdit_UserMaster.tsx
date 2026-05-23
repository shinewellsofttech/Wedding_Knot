import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import type { FormikProps } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DisplayData, Fn_AddEditData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { getCurrentUserId } from "../../../utils/formUtils";

interface FormValues {
  Name: string;
  UserPass: string;
  Phone: string;
  F_UserType: string;
  Email: string;
  F_DepartmentMaster: string;
}

const API_URL = API_WEB_URLS.MASTER + "/0/token/UserTypeMaster";
const API_URL1 = API_WEB_URLS.MASTER + "/0/token/DepartmentMaster";
const API_URL_SAVE = "UserMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/UserMaster/Id";

const AddEdit_UserMasterContainer = () => {
  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    FillArray1: [],
    formData: {} as any,
    OtherDataScore: [],
    isProgress: true,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    Fn_FillListData(dispatch, setState, "FillArray", API_URL + "/Id/0");
    Fn_FillListData(dispatch, setState, "FillArray1", API_URL1 + "/Id/0");

    const Id = (location.state && (location.state as any).Id) || 0;

    if (Id > 0) {
      setState((prevState) => ({
        ...prevState,
        id: Id,
      }));
      Fn_DisplayData(dispatch, setState, Id, API_URL_EDIT);
    }
  }, [dispatch, location.state]);


  const validationSchema = Yup.object({
    Name: Yup.string().required("Name is required"),
    UserPass: Yup.string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
    Phone: Yup.string()
      .required("Phone Number is required")
      .matches(/^\d{10}$/, "Phone Number must be 10 digits"),
    F_UserType: Yup.string().required("User Type is required"),
    Email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    F_DepartmentMaster: Yup.string().required("Department is required"),
  });

  const handleSubmit = (values: FormValues) => {
    let vformData = new FormData();

    vformData.append("Name", values.Name);
    vformData.append("UserPass", values.UserPass);
    vformData.append("Phone", values.Phone);
    vformData.append("F_UserType", values.F_UserType);
    vformData.append("Email", values.Email);
    vformData.append("F_DepartmentMaster", values.F_DepartmentMaster);
    vformData.append("UserId", getCurrentUserId());
    vformData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData: vformData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/userMaster"
    );
  };

  const isEditMode = state.id > 0;
  const initialValues: FormValues = {
    Name: state.formData?.Name || "",
    UserPass: state.formData?.UserPass || "",
    Phone: state.formData?.Phone || "",
    F_UserType: state.formData?.F_UserType || "",
    Email: state.formData?.Email || "",
    F_DepartmentMaster: state.formData?.F_DepartmentMaster || "",
  };

  return (
    <>
      <style>{`
        select.btn-square,
        select.btn-square option {
          font-family: inherit !important;
          color: #000000 !important;
        }
        .theme-form input[type="text"],
        .theme-form input[type="email"],
        .theme-form input[type="password"],
        .theme-form input[type="tel"] {
          color: #000000 !important;
        }
        body.dark-only select.btn-square,
        body.dark-only select.btn-square option {
          color: #ffffff !important;
        }
        body.dark-only .theme-form input[type="text"],
        body.dark-only .theme-form input[type="email"],
        body.dark-only .theme-form input[type="password"],
        body.dark-only .theme-form input[type="tel"] {
          color: #ffffff !important;
        }
      `}</style>
      <Breadcrumbs mainTitle="User Master" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Formik<FormValues>
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, handleChange, handleBlur, errors, touched }: FormikProps<FormValues>) => (
                <Form className="theme-form">
                  <Card>
                    <CardHeaderCommon
                      title={`${isEditMode ? "Edit" : "Add"} User Master`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Row>
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
                              Email Address <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="email"
                              name="Email"
                              placeholder="Enter email address"
                              value={values.Email}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              invalid={touched.Email && !!errors.Email}
                            />
                            <ErrorMessage name="Email" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Password <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="password"
                              name="UserPass"
                              placeholder="Enter password"
                              value={values.UserPass}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              invalid={touched.UserPass && !!errors.UserPass}
                            />
                            <ErrorMessage name="UserPass" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Phone Number <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="tel"
                              name="Phone"
                              placeholder="Enter phone number (10 digits)"
                              value={values.Phone}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              invalid={touched.Phone && !!errors.Phone}
                            />
                            <ErrorMessage name="Phone" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              User Type <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="F_UserType"
                              value={values.F_UserType}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className="btn-square"
                              style={{ fontFamily: 'inherit' }}
                              invalid={touched.F_UserType && !!errors.F_UserType}
                            >
                              <option value="">Select User Type</option>
                              {state.FillArray.map((item: any) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.Name || item.UserTypeName}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_UserType" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Department <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="F_DepartmentMaster"
                              value={values.F_DepartmentMaster}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className="btn-square"
                              style={{ fontFamily: 'inherit' }}
                              invalid={touched.F_DepartmentMaster && !!errors.F_DepartmentMaster}
                            >
                              <option value="">Select Department</option>
                              {state.FillArray1.map((item: any) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.Name || item.DepartmentName}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_DepartmentMaster" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => navigate("/userMaster")}
                      >
                        Cancel
                      </Btn>
                      <Btn color="primary" type="submit">
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
    </>
  );
};

export default AddEdit_UserMasterContainer;
