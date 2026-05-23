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
  Alias: string;
  F_LedgerGroupMaster: string;
  Address: string;
  Address1: string;
  F_CountryMaster: string;
  F_StateMaster: string;
    F_CityMaster: string;
  PinCode: string;
  PhoneNo: string;
  MobileNo: string;
  Email: string;
  GSTIN: string;
  PANNo: string;
  CreditDays: string;
  CreditLimit: string;
  Rate: string;
  F_Type: string;
  F_CalculationType: string;
  F_AddLess: string;
  YesNoActs: boolean;
  F_GSTGroupMaster: string;
  F_TaxPayerType: string;
  F_LedgerMasterSales: string;
  F_LedgerMasterPurchase: string;
  F_YearScheme: string;
  F_IntCalcMethod: string;
  BankName: string;
  BankAccountNo: string;
  BankIFSCCode: string;
  ISDalal: boolean;
  F_LedgerMasterDalal: string;
  IsTransport: boolean;
  F_TCSonSales: string;
}

const initialValues: FormValues = {
  Name: "",
  Alias: "",
  F_LedgerGroupMaster: "",
  Address: "",
  Address1: "",
  F_CountryMaster: "",
  F_StateMaster: "",
  F_CityMaster: "",
  PinCode: "",
  PhoneNo: "",
  MobileNo: "",
  Email: "",
  GSTIN: "",
  PANNo: "",
  CreditDays: "",
  CreditLimit: "",
  Rate: "",
  F_Type: "",
  F_CalculationType: "",
  F_AddLess: "",
  YesNoActs: false,
  F_GSTGroupMaster: "",
  F_TaxPayerType: "",
  F_LedgerMasterSales: "",
  F_LedgerMasterPurchase: "",
  F_YearScheme: "",
  F_IntCalcMethod: "",
  BankName: "",
  BankAccountNo: "",
  BankIFSCCode: "",
  ISDalal: false,
  F_LedgerMasterDalal: "",
  IsTransport: false,
  F_TCSonSales: "",
};

interface LedgerMasterState {
  id: number;
  formData: Partial<FormValues> & {
    // Legacy field names for backward compatibility
    Type?: string;
    F_Type?: string;
    CalculationType?: string;
    AddLess?: string;
    TaxPayerType?: string;
    YearScheme?: string;
    IntCalcMethod?: string;
    TCSonSales?: string;
  };
  isProgress?: boolean;
}

interface DropdownState {
  ledgerGroups: Array<{ Id?: number; Name?: string }>;
  countries: Array<{ Id?: number; Name?: string }>;
  states: Array<{ Id?: number; Name?: string }>;
  cities: Array<{ Id?: number; Name?: string; CityName?: string; name?: string }>;
  gstGroups: Array<{ Id?: number; Name?: string }>;
  ledgers: Array<{ Id?: number; Name?: string; LedgerName?: string }>;
  purchaseLedgers: Array<{ Id?: number; Name?: string; LedgerName?: string }>;
  salesLedgers: Array<{ Id?: number; Name?: string; LedgerName?: string }>;
  typeMasters: Array<{ Id?: number; Name?: string }>;
  calculationTypeMasters: Array<{ Id?: number; Name?: string }>;
  addLessMasters: Array<{ Id?: number; Name?: string }>;
  taxPayerTypeMasters: Array<{ Id?: number; Name?: string }>;
  isProgress?: boolean;
}

const LEDGER_GROUP_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/LedgerGroupMaster/Id/0`;
const COUNTRY_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CountryMaster}/Id/0`;
const STATE_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.StateMaster}/Id/0`;
const CITY_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CityMaster}/Id/0`;
const GST_GROUP_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/TaxGroup/Id/0`;
const PURCHASE_LEDGER_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.LedgerMaster}/TBL.F_LedgerGroupMaster/27`;
const SALES_LEDGER_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.LedgerMaster}/TBL.F_LedgerGroupMaster/31`;
const TAX_PAYER_TYPE_MASTER_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.TaxPayerTypeMaster}/Id/0`;
const ADD_LESS_MASTER_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.AddLessMaster}/Id/0`;
const TYPE_MASTER_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.TypeMaster}/Id/0`;
const CALCULATION_TYPE_MASTER_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CalculationTypeMaster}/Id/0`;
const API_URL_SAVE = `${API_WEB_URLS.LedgerMaster}/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/${API_WEB_URLS.LedgerMaster}/Id`;

/**
 * Add/Edit form for Ledger Master.
 */
const AddEdit_LedgerMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [ledgerState, setLedgerState] = useState<LedgerMasterState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const [dropdowns, setDropdowns] = useState<DropdownState>({
    ledgerGroups: [],
    countries: [],
    states: [],
    cities: [],
    gstGroups: [],
    ledgers: [],
    purchaseLedgers: [],
    salesLedgers: [],
    typeMasters: [],
    calculationTypeMasters: [],
    addLessMasters: [],
    taxPayerTypeMasters: [],
    isProgress: false,
  });

  const isEditMode = ledgerState.id > 0;

  const validationSchema = useMemo(
    () =>
      Yup.object({
        Name: Yup.string().trim().required("Name is required"),
        F_LedgerGroupMaster: Yup.string().trim().required("Ledger Group is required"),
        F_Type: Yup.string().when("F_LedgerGroupMaster", {
          is: (value: string) => value === "12",
          then: (schema) => schema.required("Type is required when Ledger Group is 12"),
          otherwise: (schema) => schema.notRequired(),
        }),
        F_LedgerMasterSales: Yup.string().when(["F_LedgerGroupMaster", "F_Type"], {
          is: (ledgerGroup: string, type: string) => ledgerGroup === "12" && type === "1",
          then: (schema) => schema.required("Ledger Master Sales is required when Type is 1"),
          otherwise: (schema) => schema.notRequired(),
        }),
        F_LedgerMasterPurchase: Yup.string().when(["F_LedgerGroupMaster", "F_Type"], {
          is: (ledgerGroup: string, type: string) => ledgerGroup === "12" && type === "1",
          then: (schema) => schema.required("Ledger Master Purchase is required when Type is 1"),
          otherwise: (schema) => schema.notRequired(),
        }),
        Email: Yup.string()
          .nullable()
          .notRequired(),
        MobileNo: Yup.string()
          .nullable()
          .notRequired(),
        PinCode: Yup.string()
          .nullable()
          .notRequired(),
      }),
    []
  );

  useEffect(() => {
    Fn_FillListData(dispatch, setDropdowns, "ledgerGroups", LEDGER_GROUP_LIST_URL).catch((error) => {
      console.error("Failed to fetch ledger groups:", error);
    });
    Fn_FillListData(dispatch, setDropdowns, "countries", COUNTRY_LIST_URL).catch((error) => {
      console.error("Failed to fetch countries:", error);
    });
    Fn_FillListData(dispatch, setDropdowns, "states", STATE_LIST_URL).catch((error) => {
      console.error("Failed to fetch states:", error);
    });
    Fn_FillListData(dispatch, setDropdowns, "gstGroups", GST_GROUP_LIST_URL).catch((error) => {
      console.error("Failed to fetch GST groups:", error);
    });
    Fn_FillListData(dispatch, setDropdowns, "purchaseLedgers", PURCHASE_LEDGER_LIST_URL).catch((error) => {
      console.error("Failed to fetch purchase ledgers:", error);
    });
    Fn_FillListData(dispatch, setDropdowns, "salesLedgers", SALES_LEDGER_LIST_URL).catch((error) => {
      console.error("Failed to fetch sales ledgers:", error);
    });
    Fn_FillListData(dispatch, setDropdowns, "typeMasters", TYPE_MASTER_URL).catch((error) => {
      console.error("Failed to fetch type masters:", error);
    });
    Fn_FillListData(dispatch, setDropdowns, "calculationTypeMasters", CALCULATION_TYPE_MASTER_URL).catch((error) => {
      console.error("Failed to fetch calculation type masters:", error);
    });
    Fn_FillListData(dispatch, setDropdowns, "addLessMasters", ADD_LESS_MASTER_URL).catch((error) => {
      console.error("Failed to fetch add less masters:", error);
    });
    Fn_FillListData(dispatch, setDropdowns, "taxPayerTypeMasters", TAX_PAYER_TYPE_MASTER_URL).catch((error) => {
      console.error("Failed to fetch tax payer type masters:", error);
    });
  }, [dispatch]);

  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setLedgerState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setLedgerState, recordId, API_URL_EDIT);
    } else {
      setLedgerState((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
    }
  }, [dispatch, location.state]);

  /**
   * When the selected state changes, fetch the corresponding set of cities.
   */
  useEffect(() => {
    const selectedState = ledgerState.formData.F_StateMaster;
    if (selectedState) {
      Fn_FillListData(dispatch, setDropdowns, "cities", `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CityMasterByStateId}/Id/${selectedState}`)
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.error("Failed to fetch cities by state:", err);
        });
    } else {
      setDropdowns((prev) => ({ ...prev, cities: [] }));
    }
  }, [ledgerState.formData.F_StateMaster, dispatch]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    Name: toStringOrEmpty(ledgerState.formData.Name),
    Alias: toStringOrEmpty(ledgerState.formData.Alias),
    F_LedgerGroupMaster: toStringOrEmpty(ledgerState.formData.F_LedgerGroupMaster),
    Address: toStringOrEmpty(ledgerState.formData.Address),
    Address1: toStringOrEmpty(ledgerState.formData.Address1),
    F_CountryMaster: toStringOrEmpty(ledgerState.formData.F_CountryMaster),
    F_StateMaster: toStringOrEmpty(ledgerState.formData.F_StateMaster),
    F_CityMaster: toStringOrEmpty(ledgerState.formData.F_CityMaster),
    PinCode: toStringOrEmpty(ledgerState.formData.PinCode),
    PhoneNo: toStringOrEmpty(ledgerState.formData.PhoneNo),
    MobileNo: toStringOrEmpty(ledgerState.formData.MobileNo),
    Email: toStringOrEmpty(ledgerState.formData.Email),
    GSTIN: toStringOrEmpty(ledgerState.formData.GSTIN),
    PANNo: toStringOrEmpty(ledgerState.formData.PANNo),
    CreditDays: toStringOrEmpty(ledgerState.formData.CreditDays),
    CreditLimit: toStringOrEmpty(ledgerState.formData.CreditLimit),
    Rate: toStringOrEmpty(ledgerState.formData.Rate),
    F_Type: toStringOrEmpty(ledgerState.formData.F_Type || ledgerState.formData.Type),
    F_CalculationType: toStringOrEmpty(ledgerState.formData.F_CalculationType || ledgerState.formData.CalculationType),
    F_AddLess: toStringOrEmpty(ledgerState.formData.F_AddLess || ledgerState.formData.AddLess),
    YesNoActs: Boolean(ledgerState.formData.YesNoActs),
    F_GSTGroupMaster: toStringOrEmpty(ledgerState.formData.F_GSTGroupMaster),
    F_TaxPayerType: toStringOrEmpty(ledgerState.formData.F_TaxPayerType || ledgerState.formData.TaxPayerType),
    F_LedgerMasterSales: toStringOrEmpty(ledgerState.formData.F_LedgerMasterSales),
    F_LedgerMasterPurchase: toStringOrEmpty(ledgerState.formData.F_LedgerMasterPurchase),
    F_YearScheme: toStringOrEmpty(ledgerState.formData.F_YearScheme || ledgerState.formData.YearScheme),
    F_IntCalcMethod: toStringOrEmpty(ledgerState.formData.F_IntCalcMethod || ledgerState.formData.IntCalcMethod),
    BankName: toStringOrEmpty(ledgerState.formData.BankName),
    BankAccountNo: toStringOrEmpty(ledgerState.formData.BankAccountNo),
    BankIFSCCode: toStringOrEmpty(ledgerState.formData.BankIFSCCode),
    ISDalal: Boolean(ledgerState.formData.ISDalal),
    F_LedgerMasterDalal: toStringOrEmpty(ledgerState.formData.F_LedgerMasterDalal),
    IsTransport: Boolean(ledgerState.formData.IsTransport),
    F_TCSonSales: toStringOrEmpty(ledgerState.formData.F_TCSonSales || ledgerState.formData.TCSonSales),
  };

  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    console.log("handleSubmit called", values);
    try {
      const formData = new FormData();
      formData.append("Id", String(ledgerState.id ?? 0));
      formData.append("Name", values.Name || "0");
      formData.append("Alias", values.Alias || "0");
      formData.append("F_LedgerGroupMaster", values.F_LedgerGroupMaster || "0");
      formData.append("Address", values.Address || "0");
      formData.append("Address1", values.Address1 || "0");
      formData.append("F_CountryMaster", values.F_CountryMaster || "0");
      formData.append("F_StateMaster", values.F_StateMaster || "0");
      formData.append("F_CityMaster", values.F_CityMaster || "0");
      formData.append("PinCode", values.PinCode || "0");
      formData.append("PhoneNo", values.PhoneNo || "0");
      formData.append("MobileNo", values.MobileNo || "0");
      formData.append("Email", values.Email || "0");
      formData.append("GSTIN", values.GSTIN || "0");
      formData.append("PANNo", values.PANNo || "0");
      formData.append("CreditDays", values.CreditDays || "0");
      formData.append("CreditLimit", values.CreditLimit || "0");
      formData.append("Rate", values.Rate || "0");
      formData.append("F_Type", values.F_Type || "0");
      formData.append("F_CalculationType", values.F_CalculationType || "0");
      formData.append("F_AddLess", values.F_AddLess || "0");
      formData.append("YesNoActs", values.YesNoActs.toString());
      formData.append("F_GSTGroupMaster", values.F_GSTGroupMaster || "0");
      formData.append("F_TaxPayerType", values.F_TaxPayerType || "0");
      formData.append("F_LedgerMasterSales", values.F_LedgerMasterSales || "0");
      formData.append("F_LedgerMasterPurchase", values.F_LedgerMasterPurchase || "0");
      formData.append("F_YearScheme", values.F_YearScheme || "0");
      formData.append("F_IntCalcMethod", values.F_IntCalcMethod || "0");
      formData.append("BankName", values.BankName || "0");
      formData.append("BankAccountNo", values.BankAccountNo || "0");
      formData.append("BankIFSCCode", values.BankIFSCCode || "0");
      formData.append("ISDalal", values.ISDalal.toString());
      formData.append("F_LedgerMasterDalal", values.F_LedgerMasterDalal || "0");
      formData.append("IsTransport", values.IsTransport.toString());
      formData.append("F_TCSonSales", values.F_TCSonSales || "0");
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: ledgerState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/ledgerMaster"
      );
    } catch (error) {
      console.error("Ledger master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Ledger Master" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Formik<FormValues>
                initialValues={initialFormValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
              >
                {({ values, handleChange, handleBlur, errors, touched, isSubmitting, handleSubmit: formikHandleSubmit }: FormikProps<FormValues>) => {
                  /**
                   * Updates form state and optionally reloads cities when the state selection changes.
                   */
                  const handleStateChange = (
                    e: React.ChangeEvent<HTMLInputElement>,
                    handleChange: FormikProps<FormValues>["handleChange"]
                  ) => {
                    handleChange(e);
                    const selectedState = e.target.value;
                    if (selectedState) {
                      Fn_FillListData(dispatch, setDropdowns, "cities", `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CityMasterByStateId}/Id/${selectedState}`)
                        .then((res) => {
                          console.log(res);
                        })
                        .catch((err) => {
                          console.error("Failed to fetch cities by state:", err);
                        });
                    } else {
                      setDropdowns((prev) => ({ ...prev, cities: [] }));
                    }
                    // Reset city when state changes
                    handleChange({ target: { name: "F_CityMaster", value: "" } } as any);
                  };

                  // Convert to number, handling empty strings and invalid values
                  const ledgerGroupValue = values.F_LedgerGroupMaster?.toString().trim() || "";
                  const ledgerGroupId = ledgerGroupValue ? parseInt(ledgerGroupValue, 10) : 0;
                  const isValidGroupId = !isNaN(ledgerGroupId) && ledgerGroupId > 0;
                  
                  const isGroup35_36_40 = isValidGroupId && (ledgerGroupId === 35 || ledgerGroupId === 36 || ledgerGroupId === 40);
                  const isGroup12 = isValidGroupId && ledgerGroupId === 12;

                  // Debug: Log validation errors
                  if (Object.keys(errors).length > 0) {
                    console.log("Form validation errors:", errors);
                  }

                  return (
                    <Form className="theme-form" onKeyDown={handleEnterToNextField}>
                      <Card>
                        <CardHeaderCommon title={`${isEditMode ? "Edit" : "Add"} Ledger`} tagClass="card-title mb-0" />
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
                                <Label>Alias</Label>
                                <Input
                                  type="text"
                                  name="Alias"
                                  placeholder="Enter alias"
                                  value={values.Alias}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Ledger Group <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="select"
                                  name="F_LedgerGroupMaster"
                                  value={values.F_LedgerGroupMaster}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  invalid={touched.F_LedgerGroupMaster && !!errors.F_LedgerGroupMaster}
                                >
                                  <option value="">Select ledger group</option>
                                  {dropdowns.ledgerGroups.map((group) => (
                                    <option key={group?.Id} value={String(group?.Id ?? "")}>
                                      {group?.Name ?? `Group ${group?.Id ?? ""}`}
                                    </option>
                                  ))}
                                </Input>
                                <ErrorMessage name="F_LedgerGroupMaster" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            {/* Fields for Ledger Group 35, 36, 40 */}
                            {isGroup35_36_40 && (
                              <>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Address</Label>
                                    <Input
                                      type="textarea"
                                      name="Address"
                                      placeholder="Enter address"
                                      value={values.Address}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Address Line 2</Label>
                                    <Input
                                      type="text"
                                      name="Address1"
                                      placeholder="Enter address line 2"
                                      value={values.Address1}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Country</Label>
                                    <Input
                                      type="select"
                                      name="F_CountryMaster"
                                      value={values.F_CountryMaster}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    >
                                      <option value="">Select country</option>
                                      {dropdowns.countries.map((country) => (
                                        <option key={country?.Id} value={country?.Id ?? ""}>
                                          {country?.Name ?? `Country ${country?.Id ?? ""}`}
                                        </option>
                                      ))}
                                    </Input>
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>State</Label>
                                    <Input
                                      type="select"
                                      name="F_StateMaster"
                                      value={values.F_StateMaster}
                                      onChange={(e) => handleStateChange(e, handleChange)}
                                      onBlur={handleBlur}
                                    >
                                      <option value="">Select state</option>
                                      {dropdowns.states.map((state) => (
                                        <option key={state?.Id} value={state?.Id ?? ""}>
                                          {state?.Name ?? `State ${state?.Id ?? ""}`}
                                        </option>
                                      ))}
                                    </Input>
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>City</Label>
                                    <Input
                                      type="select"
                                      name="F_CityMaster"
                                      value={values.F_CityMaster}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      disabled={!values.F_StateMaster}
                                    >
                                      <option value="">Select city</option>
                                      {dropdowns.cities.map((city) => (
                                        <option key={city?.Id} value={city?.Id ?? ""}>
                                          {city?.Name || city?.CityName || city?.name || `City ${city?.Id ?? ""}`}
                                        </option>
                                      ))}
                                    </Input>
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Pin Code</Label>
                                    <Input
                                      type="text"
                                      name="PinCode"
                                      placeholder="Enter 6-digit pin code"
                                      value={values.PinCode}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      invalid={touched.PinCode && !!errors.PinCode}
                                    />
                                    <ErrorMessage name="PinCode" component="div" className="text-danger small" />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Phone No.</Label>
                                    <Input
                                      type="text"
                                      name="PhoneNo"
                                      placeholder="Enter phone number"
                                      value={values.PhoneNo}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Mobile No.</Label>
                                    <Input
                                      type="text"
                                      name="MobileNo"
                                      placeholder="Enter 10-digit mobile number"
                                      value={values.MobileNo}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      invalid={touched.MobileNo && !!errors.MobileNo}
                                    />
                                    <ErrorMessage name="MobileNo" component="div" className="text-danger small" />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Email</Label>
                                    <Input
                                      type="email"
                                      name="Email"
                                      placeholder="Enter email"
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
                                    <Label>GSTIN</Label>
                                    <Input
                                      type="text"
                                      name="GSTIN"
                                      placeholder="Enter GSTIN"
                                      value={values.GSTIN}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>PAN No.</Label>
                                    <Input
                                      type="text"
                                      name="PANNo"
                                      placeholder="Enter PAN number"
                                      value={values.PANNo}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Credit Days</Label>
                                    <Input
                                      type="text"
                                      name="CreditDays"
                                      placeholder="Enter credit days"
                                      value={values.CreditDays}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Credit Limit (Rs.)</Label>
                                    <Input
                                      type="text"
                                      name="CreditLimit"
                                      placeholder="Maximum limit customer can avail"
                                      value={values.CreditLimit}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Tax Payer Type</Label>
                                    <Input
                                      type="select"
                                      name="F_TaxPayerType"
                                      value={values.F_TaxPayerType}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    >
                                      <option value="">Select tax payer type</option>
                                      {dropdowns.taxPayerTypeMasters.map((taxPayerType) => (
                                        <option key={taxPayerType?.Id} value={taxPayerType?.Id ?? ""}>
                                          {taxPayerType?.Name ?? `Tax Payer Type ${taxPayerType?.Id ?? ""}`}
                                        </option>
                                      ))}
                                    </Input>
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Year Scheme (Interest)</Label>
                                    <Input
                                      type="select"
                                      name="F_YearScheme"
                                      value={values.F_YearScheme}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    >
                                      <option value="">Select year scheme</option>
                                      <option value="1">1 - 360</option>
                                      <option value="2">2 - 365</option>
                                      <option value="3">3 - 366</option>
                                    </Input>
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Interest Calculation Method</Label>
                                    <Input
                                      type="select"
                                      name="F_IntCalcMethod"
                                      value={values.F_IntCalcMethod}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    >
                                      <option value="">Select method</option>
                                      <option value="1">1 - Simple Interest</option>
                                      <option value="2">2 - Compound Interest</option>
                                    </Input>
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Bank Name</Label>
                                    <Input
                                      type="text"
                                      name="BankName"
                                      placeholder="Enter bank name"
                                      value={values.BankName}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Bank Account No.</Label>
                                    <Input
                                      type="text"
                                      name="BankAccountNo"
                                      placeholder="Enter bank account number"
                                      value={values.BankAccountNo}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Bank IFSC Code</Label>
                                    <Input
                                      type="text"
                                      name="BankIFSCCode"
                                      placeholder="Enter IFSC code"
                                      value={values.BankIFSCCode}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <div className="form-check form-switch">
                                      <Input
                                        type="checkbox"
                                        role="switch"
                                        className="form-check-input"
                                        name="ISDalal"
                                        checked={values.ISDalal}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                      />
                                      <Label check className="form-check-label ms-2">
                                        Is Dalal
                                      </Label>
                                    </div>
                                  </FormGroup>
                                </Col>
                                {values.ISDalal && (
                                  <Col md="6">
                                    <FormGroup>
                                      <Label>Ledger Master Dalal</Label>
                                      <Input
                                        type="select"
                                        name="F_LedgerMasterDalal"
                                        value={values.F_LedgerMasterDalal}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                      >
                                        <option value="">Select ledger</option>
                                        {dropdowns.ledgers.map((ledger) => (
                                          <option key={ledger?.Id} value={ledger?.Id ?? ""}>
                                            {ledger?.Name || ledger?.LedgerName || `Ledger ${ledger?.Id ?? ""}`}
                                          </option>
                                        ))}
                                      </Input>
                                    </FormGroup>
                                  </Col>
                                )}
                                <Col md="6">
                                  <FormGroup>
                                    <div className="form-check form-switch">
                                      <Input
                                        type="checkbox"
                                        role="switch"
                                        className="form-check-input"
                                        name="IsTransport"
                                        checked={values.IsTransport}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                      />
                                      <Label check className="form-check-label ms-2">
                                        Is Transport
                                      </Label>
                                    </div>
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>TCS on Sales</Label>
                                    <Input
                                      type="select"
                                      name="F_TCSonSales"
                                      value={values.F_TCSonSales}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    >
                                      <option value="">Select TCS</option>
                                      <option value="0">0 - None</option>
                                      <option value="1">1 - Normal Rate</option>
                                      <option value="2">2 - Higher Rate</option>
                                    </Input>
                                  </FormGroup>
                                </Col>
                              </>
                            )}

                            {/* Fields for Ledger Group 12 */}
                            {isGroup12 && (
                              <>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Rate (GST Rate)</Label>
                                    <Input
                                      type="text"
                                      name="Rate"
                                      placeholder="Enter GST rate"
                                      value={values.Rate}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>
                                      Type <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                      type="select"
                                      name="F_Type"
                                      value={values.F_Type}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      invalid={touched.F_Type && !!errors.F_Type}
                                    >
                                      <option value="">Select type</option>
                                      {dropdowns.typeMasters.map((type) => (
                                        <option key={type?.Id} value={type?.Id ?? ""}>
                                          {type?.Name ?? `Type ${type?.Id ?? ""}`}
                                        </option>
                                      ))}
                                    </Input>
                                    <ErrorMessage name="F_Type" component="div" className="text-danger small" />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Calculation Type</Label>
                                    <Input
                                      type="select"
                                      name="F_CalculationType"
                                      value={values.F_CalculationType}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    >
                                      <option value="">Select calculation type</option>
                                      {dropdowns.calculationTypeMasters.map((calcType) => (
                                        <option key={calcType?.Id} value={calcType?.Id ?? ""}>
                                          {calcType?.Name ?? `Calculation Type ${calcType?.Id ?? ""}`}
                                        </option>
                                      ))}
                                    </Input>
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Add/Less</Label>
                                    <Input
                                      type="select"
                                      name="F_AddLess"
                                      value={values.F_AddLess}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    >
                                      <option value="">Select</option>
                                      {dropdowns.addLessMasters.map((addLess) => (
                                        <option key={addLess?.Id} value={addLess?.Id ?? ""}>
                                          {addLess?.Name ?? `Add/Less ${addLess?.Id ?? ""}`}
                                        </option>
                                      ))}
                                    </Input>
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <div className="form-check form-switch">
                                      <Input
                                        type="checkbox"
                                        role="switch"
                                        className="form-check-input"
                                        name="YesNoActs"
                                        checked={values.YesNoActs}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                      />
                                      <Label check className="form-check-label ms-2">
                                        Yes/No Acts
                                      </Label>
                                    </div>
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>GST Group</Label>
                                    <Input
                                      type="select"
                                      name="F_GSTGroupMaster"
                                      value={values.F_GSTGroupMaster}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    >
                                      <option value="">Select Tax group</option>
                                      {dropdowns.gstGroups.map((group) => (
                                        <option key={group?.Id} value={group?.Id ?? ""}>
                                          {(group as any)?.groupName ?? group?.Name ?? `Tax Group ${group?.Id ?? ""}`}
                                        </option>
                                      ))}
                                    </Input>
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Tax Payer Type</Label>
                                    <Input
                                      type="select"
                                      name="F_TaxPayerType"
                                      value={values.F_TaxPayerType}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    >
                                      <option value="">Select tax payer type</option>
                                      {dropdowns.taxPayerTypeMasters.map((taxPayerType) => (
                                        <option key={taxPayerType?.Id} value={taxPayerType?.Id ?? ""}>
                                          {taxPayerType?.Name ?? `Tax Payer Type ${taxPayerType?.Id ?? ""}`}
                                        </option>
                                      ))}
                                    </Input>
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>
                                      Ledger Master Sales (for tax entry, ItemMaster)
                                      {values.F_LedgerGroupMaster === "12" && values.F_Type === "1" && (
                                        <span className="text-danger"> *</span>
                                      )}
                                    </Label>
                                    <Input
                                      type="select"
                                      name="F_LedgerMasterSales"
                                      value={values.F_LedgerMasterSales}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      invalid={touched.F_LedgerMasterSales && !!errors.F_LedgerMasterSales}
                                    >
                                      <option value="">Select ledger</option>
                                      {dropdowns.salesLedgers.map((ledger) => (
                                        <option key={ledger?.Id} value={ledger?.Id ?? ""}>
                                          {ledger?.Name || ledger?.LedgerName || `Ledger ${ledger?.Id ?? ""}`}
                                        </option>
                                      ))}
                                    </Input>
                                    <ErrorMessage name="F_LedgerMasterSales" component="div" className="text-danger small" />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>
                                      Ledger Master Purchase (for tax entry, ItemMaster)
                                      {values.F_LedgerGroupMaster === "12" && values.F_Type === "1" && (
                                        <span className="text-danger"> *</span>
                                      )}
                                    </Label>
                                    <Input
                                      type="select"
                                      name="F_LedgerMasterPurchase"
                                      value={values.F_LedgerMasterPurchase}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      invalid={touched.F_LedgerMasterPurchase && !!errors.F_LedgerMasterPurchase}
                                    >
                                      <option value="">Select ledger</option>
                                      {dropdowns.purchaseLedgers.map((ledger) => (
                                        <option key={ledger?.Id} value={ledger?.Id ?? ""}>
                                          {ledger?.Name || ledger?.LedgerName || `Ledger ${ledger?.Id ?? ""}`}
                                        </option>
                                      ))}
                                    </Input>
                                    <ErrorMessage name="F_LedgerMasterPurchase" component="div" className="text-danger small" />
                                  </FormGroup>
                                </Col>
                              </>
                            )}
                          </Row>
                        </CardBody>
                        <CardFooter className="text-end">
                          <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/ledgerMaster")}>
                            Cancel
                          </Btn>
                          <Btn 
                            color="primary" 
                            type="submit" 
                            disabled={isSubmitting}
                            onClick={(e) => {
                              e.preventDefault();
                              console.log("Button clicked, errors:", errors);
                              formikHandleSubmit();
                            }}
                          >
                            {isEditMode ? "Update" : "Submit"}
                          </Btn>
                        </CardFooter>
                      </Card>
                    </Form>
                  );
                }}
              </Formik>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default AddEdit_LedgerMaster;