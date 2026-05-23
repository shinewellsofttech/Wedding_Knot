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
  AllowNegativeStock: boolean;
  F_CompanyMaster: string;
  F_LedgerMaster_InterestPaid: string;
  F_LedgerMaster_InterestReceived: string;
  IsBatchAllowed: boolean;
}

const initialValues: FormValues = {
  FirmName: "",
  F_FinancialYearMaster: "",
  F_WarehouseMasterDefault: "",
  F_ColorMasterDefault: "",
  AllowNegativeStock: false,
  F_CompanyMaster: "",
  F_LedgerMaster_InterestPaid: "",
  F_LedgerMaster_InterestReceived: "",
  IsBatchAllowed: false,
};

interface DropdownState {
  financialYearList: any[];
  warehouseList: any[];
  colorList: any[];
  companyList: any[];
  ledgerList: any[];
}

interface GlobalOptionsState {
  formData: FormValues;
  isProgress: boolean;
}

const validationSchema = Yup.object().shape({
  FirmName: Yup.string().required("Firm Name is required"),
  F_FinancialYearMaster: Yup.string().required("Financial Year is required"),
  F_WarehouseMasterDefault: Yup.string().required("Default Warehouse is required"),
  F_ColorMasterDefault: Yup.string().required("Default Color is required"),
  F_CompanyMaster: Yup.string().required("Company is required"),
  F_LedgerMaster_InterestPaid: Yup.string().required("Interest Paid Ledger is required"),
  F_LedgerMaster_InterestReceived: Yup.string().required("Interest Received Ledger is required"),
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
  });

  // Helper function to convert values to string or empty
  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    FirmName: toStringOrEmpty(globalOptionsState.formData.FirmName),
    F_FinancialYearMaster: toStringOrEmpty(globalOptionsState.formData.F_FinancialYearMaster),
    F_WarehouseMasterDefault: toStringOrEmpty(globalOptionsState.formData.F_WarehouseMasterDefault),
    F_ColorMasterDefault: toStringOrEmpty(globalOptionsState.formData.F_ColorMasterDefault),
    AllowNegativeStock: Boolean(globalOptionsState.formData.AllowNegativeStock),
    F_CompanyMaster: toStringOrEmpty(globalOptionsState.formData.F_CompanyMaster),
    F_LedgerMaster_InterestPaid: toStringOrEmpty(globalOptionsState.formData.F_LedgerMaster_InterestPaid),
    F_LedgerMaster_InterestReceived: toStringOrEmpty(globalOptionsState.formData.F_LedgerMaster_InterestReceived),
    IsBatchAllowed: Boolean(globalOptionsState.formData.IsBatchAllowed),
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
              AllowNegativeStock: Boolean(globalOptionsRecord.AllowNegativeStock),
              F_CompanyMaster: String(globalOptionsRecord.F_CompanyMaster || ""),
              F_LedgerMaster_InterestPaid: String(globalOptionsRecord.F_LedgerMaster_InterestPaid || ""),
              F_LedgerMaster_InterestReceived: String(globalOptionsRecord.F_LedgerMaster_InterestReceived || ""),
              IsBatchAllowed: Boolean(globalOptionsRecord.IsBatchAllowed),
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
      formData.append("Id", "0");
      formData.append("FirmName", values.FirmName || "");
      formData.append("F_FinancialYearMaster", values.F_FinancialYearMaster || "");
      formData.append("F_WarehouseMasterDefault", values.F_WarehouseMasterDefault || "");
      formData.append("F_ColorMasterDefault", values.F_ColorMasterDefault || "");
      formData.append("AllowNegativeStock", values.AllowNegativeStock.toString());
      formData.append("UserId", userId);
      formData.append("F_LedgerMaster_InterestPaid", values.F_LedgerMaster_InterestPaid || "");
      formData.append("F_LedgerMaster_InterestReceived", values.F_LedgerMaster_InterestReceived || "");
      formData.append("IsBatchAllowed", values.IsBatchAllowed.toString());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

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
                                Default Warehouse <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="F_WarehouseMasterDefault"
                                type="select"
                                value={values.F_WarehouseMasterDefault}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_WarehouseMasterDefault && !!errors.F_WarehouseMasterDefault}
                              >
                                <option value="">Select Default Warehouse</option>
                                {dropdowns.warehouseList.map((item: any) => {
                                  const itemId = String(item.Id ?? item.ID ?? item.id ?? "");
                                  return (
                                    <option key={itemId} value={itemId}>
                                      {item.Name || item.GodownName}
                                    </option>
                                  );
                                })}
                              </Input>
                              <ErrorMessage name="F_WarehouseMasterDefault" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Default Color <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="F_ColorMasterDefault"
                                type="select"
                                value={values.F_ColorMasterDefault}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_ColorMasterDefault && !!errors.F_ColorMasterDefault}
                              >
                                <option value="">Select Default Color</option>
                                {dropdowns.colorList.map((item: any) => {
                                  const itemId = String(item.Id ?? item.ID ?? item.id ?? "");
                                  return (
                                    <option key={itemId} value={itemId}>
                                      {item.Name || item.ColorName}
                                    </option>
                                  );
                                })}
                              </Input>
                              <ErrorMessage name="F_ColorMasterDefault" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Company <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="F_CompanyMaster"
                                type="select"
                                value={values.F_CompanyMaster}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_CompanyMaster && !!errors.F_CompanyMaster}
                              >
                                <option value="">Select Company</option>
                                {dropdowns.companyList.map((item: any) => {
                                  const itemId = String(item.Id ?? item.ID ?? item.id ?? "");
                                  return (
                                    <option key={itemId} value={itemId}>
                                      {item.CompanyName || item.Name}
                                    </option>
                                  );
                                })}
                              </Input>
                              <ErrorMessage name="F_CompanyMaster" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Interest Paid Ledger <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="F_LedgerMaster_InterestPaid"
                                type="select"
                                value={values.F_LedgerMaster_InterestPaid}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_LedgerMaster_InterestPaid && !!errors.F_LedgerMaster_InterestPaid}
                              >
                                <option value="">Select Interest Paid Ledger</option>
                                {dropdowns.ledgerList.map((item: any) => {
                                  const itemId = String(item.Id ?? item.ID ?? item.id ?? "");
                                  return (
                                    <option key={itemId} value={itemId}>
                                      {item.Name || item.LedgerName}
                                    </option>
                                  );
                                })}
                              </Input>
                              <ErrorMessage name="F_LedgerMaster_InterestPaid" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Interest Received Ledger <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="F_LedgerMaster_InterestReceived"
                                type="select"
                                value={values.F_LedgerMaster_InterestReceived}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.F_LedgerMaster_InterestReceived && !!errors.F_LedgerMaster_InterestReceived}
                              >
                                <option value="">Select Interest Received Ledger</option>
                                {dropdowns.ledgerList.map((item: any) => {
                                  const itemId = String(item.Id ?? item.ID ?? item.id ?? "");
                                  return (
                                    <option key={itemId} value={itemId}>
                                      {item.Name || item.LedgerName}
                                    </option>
                                  );
                                })}
                              </Input>
                              <ErrorMessage name="F_LedgerMaster_InterestReceived" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <div className="form-check form-switch">
                                <Input
                                  name="AllowNegativeStock"
                                  type="checkbox"
                                  role="switch"
                                  className="form-check-input"
                                  checked={values.AllowNegativeStock}
                                  onChange={handleChange}
                                />
                                <Label check className="form-check-label ms-2">
                                  Allow Negative Stock
                                </Label>
                              </div>
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <div className="form-check form-switch">
                                <Input
                                  name="IsBatchAllowed"
                                  type="checkbox"
                                  role="switch"
                                  className="form-check-input"
                                  checked={values.IsBatchAllowed}
                                  onChange={handleChange}
                                />
                                <Label check className="form-check-label ms-2">
                                  Is Batch Allowed
                                </Label>
                              </div>
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