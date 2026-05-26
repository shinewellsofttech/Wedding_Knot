import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import type { FormikHelpers, FormikProps } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_AddEditData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { getCurrentUserId, handleEnterToNextField } from "../../utils/formUtils";


interface FormValues {
  FirmName: string;
  F_FinancialYearMaster: string;
  F_WarehouseMasterDefault: string;
  F_ColorMasterDefault: string;
  F_CompanyMaster: string;
  MobileNo: string;
  PANNo: string;
  EmailId: string;
  F_LedgerMaster_InterestPaid: string;
  F_LedgerMaster_InterestReceived: string;
  IsBatchAllowed: boolean;
  F_StateMaster: string;
  F_CityMaster: string;
  FirmAddress: string;
  GSTNo: string;
}

const initialValues: FormValues = {
  FirmName: "",
  F_FinancialYearMaster: "",
  F_WarehouseMasterDefault: "",
  F_ColorMasterDefault: "",
  F_CompanyMaster: "",
  MobileNo: "",
  PANNo: "",
  EmailId: "",
  F_LedgerMaster_InterestPaid: "",
  F_LedgerMaster_InterestReceived: "",
  IsBatchAllowed: false,
  F_StateMaster: "",
  F_CityMaster: "",
  FirmAddress: "",
  GSTNo: "",
};

interface DropdownState {
  financialYearList: any[];
  warehouseList: any[];
  colorList: any[];
  companyList: any[];
  ledgerList: any[];
  stateList: any[];
  cityList: any[];
}

interface GlobalOptionsState {
  formData: FormValues;
  isProgress: boolean;
}

const validationSchema = Yup.object().shape({
  FirmName: Yup.string().required("Firm Name is required"),
  F_FinancialYearMaster: Yup.string().required("Financial Year is required"),
  F_StateMaster: Yup.string().required("State is required"),
  F_CityMaster: Yup.string().required("City is required"),
});

const API_URL_FETCH = `${API_WEB_URLS.MASTER}/0/token/GlobalOptions/Id/0`;

const GlobalOptions: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [globalOptionsState, setGlobalOptionsState] = useState<GlobalOptionsState>({
    formData: { ...initialValues },
    isProgress: false,
  });

  const [dropdowns, setDropdowns] = useState<DropdownState>({
    financialYearList: [],
    warehouseList: [],
    colorList: [],
    companyList: [],
    ledgerList: [],
    stateList: [],
    cityList: [],
  });

  // Helper function to convert values to string or empty
  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    FirmName: toStringOrEmpty(globalOptionsState.formData.FirmName),
    F_FinancialYearMaster: toStringOrEmpty(globalOptionsState.formData.F_FinancialYearMaster),
    F_WarehouseMasterDefault: toStringOrEmpty(globalOptionsState.formData.F_WarehouseMasterDefault),
    F_ColorMasterDefault: toStringOrEmpty(globalOptionsState.formData.F_ColorMasterDefault),
    F_CompanyMaster: toStringOrEmpty(globalOptionsState.formData.F_CompanyMaster),
    MobileNo: toStringOrEmpty(globalOptionsState.formData.MobileNo),
    PANNo: toStringOrEmpty(globalOptionsState.formData.PANNo),
    EmailId: toStringOrEmpty(globalOptionsState.formData.EmailId),
    F_LedgerMaster_InterestPaid: toStringOrEmpty(globalOptionsState.formData.F_LedgerMaster_InterestPaid),
    F_LedgerMaster_InterestReceived: toStringOrEmpty(globalOptionsState.formData.F_LedgerMaster_InterestReceived),
    IsBatchAllowed: Boolean(globalOptionsState.formData.IsBatchAllowed),
    F_StateMaster: toStringOrEmpty(globalOptionsState.formData.F_StateMaster),
    F_CityMaster: toStringOrEmpty(globalOptionsState.formData.F_CityMaster),
    FirmAddress: toStringOrEmpty(globalOptionsState.formData.FirmAddress),
    GSTNo: toStringOrEmpty(globalOptionsState.formData.GSTNo),
  };

  // Load dropdown data on component mount
  useEffect(() => {
    // Load Financial Years
    Fn_FillListData(
      dispatch,
      setDropdowns,
      "financialYearList",
      `${API_WEB_URLS.MASTER}/0/token/CompanyYearMaster/Id/0`,
      () => {},
      () => {}
    ).catch((error) => {
      console.error("Failed to fetch financial years:", error);
    });

    Fn_FillListData(
      dispatch,
      setDropdowns,
      "stateList",
      `${API_WEB_URLS.MASTER}/0/token/StateMaster/Id/0`,
      () => {},
      () => {}
    ).catch((error) => console.error("Failed to fetch states:", error));

    Fn_FillListData(
      dispatch,
      setDropdowns,
      "cityList",
      `${API_WEB_URLS.MASTER}/0/token/CityMaster/Id/0`,
      () => {},
      () => {}
    ).catch((error) => console.error("Failed to fetch cities:", error));

    // Load Warehouses (Godowns)
    Fn_FillListData(
      dispatch,
      setDropdowns,
      "warehouseList",
      `${API_WEB_URLS.MASTER}/0/token/GodownMaster/Id/0`,
      () => {},
      () => {}
    ).catch((error) => {
      console.error("Failed to fetch warehouses:", error);
    });

    // Load Colors
    Fn_FillListData(
      dispatch,
      setDropdowns,
      "colorList",
      `${API_WEB_URLS.MASTER}/0/token/ColorMaster/Id/0`,
      () => {},
      () => {}
    ).catch((error) => {
      console.error("Failed to fetch colors:", error);
    });

    // Load Companies
    Fn_FillListData(
      dispatch,
      setDropdowns,
      "companyList",
      `${API_WEB_URLS.MASTER}/0/token/CompanyMaster/Id/0`,
      () => {},
      () => {}
    ).catch((error) => {
      console.error("Failed to fetch companies:", error);
    });

    // Load Ledgers
    Fn_FillListData(
      dispatch,
      setDropdowns,
      "ledgerList",
      `${API_WEB_URLS.MASTER}/0/token/LedgerMaster/Id/0`,
      () => {},
      () => {}
    ).catch((error) => {
      console.error("Failed to fetch ledgers:", error);
    });

    // Fetch existing Global Options data
    const fetchGlobalOptions = async () => {
      try {
        const base = API_WEB_URLS.BASE || "https://apiaccountingmain.shinewellinnovation.com/api/V1";
        const url = `${base}${API_WEB_URLS.MASTER}/0/token/GlobalOptions/Id/0`;
        const response = await fetch(url);
        const result = await response.json();
        
        let globalOptionsRecord: any = null;
        if (result?.data?.dataList && Array.isArray(result.data.dataList) && result.data.dataList.length > 0) {
          globalOptionsRecord = result.data.dataList[0];
        } else if (Array.isArray(result?.data) && result.data.length > 0) {
          globalOptionsRecord = result.data[0];
        } else if (Array.isArray(result) && result.length > 0) {
          globalOptionsRecord = result[0];
        }

        if (globalOptionsRecord) {
          setGlobalOptionsState((prev) => ({
            ...prev,
            formData: {
              FirmName: globalOptionsRecord.FirmName || "",
              F_FinancialYearMaster: String(globalOptionsRecord.F_FinancialYearMaster || ""),
              F_WarehouseMasterDefault: String(globalOptionsRecord.F_WarehouseMasterDefault || ""),
              F_ColorMasterDefault: String(globalOptionsRecord.F_ColorMasterDefault || ""),
              F_CompanyMaster: String(globalOptionsRecord.F_CompanyMaster || ""),
              MobileNo: globalOptionsRecord.MobileNo || "",
              PANNo: globalOptionsRecord.PANNo || globalOptionsRecord.PanNo || "",
              EmailId: globalOptionsRecord.EmailId || globalOptionsRecord.Email || "",
              F_LedgerMaster_InterestPaid: String(globalOptionsRecord.F_LedgerMaster_InterestPaid || ""),
              F_LedgerMaster_InterestReceived: String(globalOptionsRecord.F_LedgerMaster_InterestReceived || ""),
              IsBatchAllowed: Boolean(globalOptionsRecord.IsBatchAllowed),
              F_StateMaster: String(globalOptionsRecord.F_StateMaster || ""),
              F_CityMaster: String(globalOptionsRecord.F_CityMaster || ""),
              FirmAddress: globalOptionsRecord.FirmAddress || "",
              GSTNo: globalOptionsRecord.GSTNo || "",
            },
            isProgress: false,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch global options:", error);
      }
    };
    
    fetchGlobalOptions();
  }, [dispatch]);

  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const userId = getCurrentUserId();

      // Prepare form data
      const formData = new FormData();
      formData.append("FirmName", values.FirmName || "");
      formData.append("F_FinancialYearMaster", values.F_FinancialYearMaster || "");
      formData.append("F_StateMaster", values.F_StateMaster || "");
      formData.append("F_CityMaster", values.F_CityMaster || "");
      formData.append("FirmAddress", values.FirmAddress || "");
      formData.append("GSTNo", values.GSTNo || "");
      formData.append("PANNo", values.PANNo || "");
      formData.append("MobileNo", values.MobileNo || "");
      formData.append("EmailId", values.EmailId || "");
      formData.append("UserId", userId);

      const requestData = {
        arguList: { id: 0, formData },
      };

      const apiURL = `UpdateGlobalOptions/0/token`;

      await Fn_AddEditData(
        dispatch,
        () => {},
        requestData,
        apiURL,
        true, // isMultiPart
        "memberid",
        navigate,
        "/globalOptions"
      );
      
    } catch (error) {
      console.error("Error updating global options:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Global Options" parent="Tools" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Formik
                initialValues={initialFormValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
              >
                {({ values, handleChange, handleBlur, errors, touched, isSubmitting }: FormikProps<FormValues>) => (
                  <Form className="theme-form" onKeyDown={handleEnterToNextField}>
                    <Card>
                      <CardHeaderCommon 
                        title="Global Options Configuration"
                        tagClass="card-title mb-0"
                      />
                      <CardBody>
                        <Row className="gy-3">
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Firm Name <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="FirmName"
                                type="text"
                                placeholder="Enter firm name"
                                value={values.FirmName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.FirmName && !!errors.FirmName}
                              />
                              <ErrorMessage name="FirmName" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Financial Year <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="F_FinancialYearMaster"
                                type="select"
                                value={values.F_FinancialYearMaster}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_FinancialYearMaster && !!errors.F_FinancialYearMaster}
                              >
                                <option value="">Select Financial Year</option>
                                {dropdowns.financialYearList.map((item: any) => {
                                  const fromDate = new Date(item.FinancialYearFrom).toLocaleDateString('en-IN');
                                  const toDate = new Date(item.FinancialYearTo).toLocaleDateString('en-IN');
                                  const itemId = String(item.Id ?? item.ID ?? item.id ?? "");
                                  return (
                                    <option key={itemId} value={itemId}>
                                      {`${fromDate} - ${toDate}`}
                                    </option>
                                  );
                                })}
                              </Input>
                              <ErrorMessage name="F_FinancialYearMaster" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>

                          <Col md="6">
                            <FormGroup>
                              <Label>
                                State <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="F_StateMaster"
                                type="select"
                                value={values.F_StateMaster}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_StateMaster && !!errors.F_StateMaster}
                              >
                                <option value="">Select State</option>
                                {dropdowns.stateList.map((item: any) => (
                                  <option key={item.Id} value={item.Id}>
                                    {item.StateName || item.Name}
                                  </option>
                                ))}
                              </Input>
                              <ErrorMessage name="F_StateMaster" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>

                          <Col md="6">
                            <FormGroup>
                              <Label>
                                City <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="F_CityMaster"
                                type="select"
                                value={values.F_CityMaster}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_CityMaster && !!errors.F_CityMaster}
                              >
                                <option value="">Select City</option>
                                {dropdowns.cityList.map((item: any) => (
                                  <option key={item.Id} value={item.Id}>
                                    {item.CityName || item.Name}
                                  </option>
                                ))}
                              </Input>
                              <ErrorMessage name="F_CityMaster" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>

                          <Col md="6">
                            <FormGroup>
                              <Label>Firm Address</Label>
                              <Input
                                name="FirmAddress"
                                type="text"
                                placeholder="Enter firm address"
                                value={values.FirmAddress}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>

                          <Col md="6">
                            <FormGroup>
                              <Label>GST No</Label>
                              <Input
                                name="GSTNo"
                                type="text"
                                placeholder="Enter GST No"
                                value={values.GSTNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>

                          <Col md="6">
                            <FormGroup>
                              <Label>Mobile No</Label>
                              <Input
                                name="MobileNo"
                                type="text"
                                placeholder="Enter mobile no"
                                value={values.MobileNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>

                          <Col md="6">
                            <FormGroup>
                              <Label>PAN No</Label>
                              <Input
                                name="PANNo"
                                type="text"
                                placeholder="Enter PAN no"
                                value={values.PANNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>

                          <Col md="6">
                            <FormGroup>
                              <Label>Email</Label>
                              <Input
                                name="EmailId"
                                type="email"
                                placeholder="Enter email address"
                                value={values.EmailId}
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
                          onClick={() => navigate(-1)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Btn>
                        <Btn
                          color="primary"
                          type="submit"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Updating..." : "Update Global Options"}
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

export default GlobalOptions;