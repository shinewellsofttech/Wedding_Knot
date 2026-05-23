import React, { useEffect, useMemo, useRef, useState } from "react";
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
import DateInput from "../../CommonElements/DateInput";

interface FormValues {
  CompanyName: string;
  ShortName: string;
  Address: string;
  EmailID: string;
  Website: string;
  F_CountryMaster: string;
  F_StateMaster: string;
  F_CityMaster: string;
  Zip: string;
  OfficePhoneNo: string;
  ResidencePhoneNo: string;
  MobileNo: string;
  FaxNo: string;
  PanNo: string;
  GSTIN: string;
  LSTNo: string;
  CSTNo: string;
  RegNo: string;
  FinancialYearFrom: string;
  BooksFrom: string;
  LogoImage?: File | null;
  SignatureImage?: File | null;
  LogoImagePreview?: string;
  SignatureImagePreview?: string;
}

const initialValues: FormValues = {
  CompanyName: "",
  ShortName: "",
  Address: "",
  EmailID: "",
  Website: "",
  F_CountryMaster: "",
  F_StateMaster: "",
  F_CityMaster: "",
  Zip: "",
  OfficePhoneNo: "",
  ResidencePhoneNo: "",
  MobileNo: "",
  FaxNo: "",
  PanNo: "",
  GSTIN: "",
  LSTNo: "",
  CSTNo: "",
  RegNo: "",
  FinancialYearFrom: "",
  BooksFrom: "",
  LogoImage: null,
  SignatureImage: null,
  LogoImagePreview: "",
  SignatureImagePreview: "",
};

interface CompanyState {
  id: number;
  formData: Partial<FormValues> & {
    Name?: string;
    ShortName?: string;
    CompanyName?: string;
    City?: string;
    State?: string;
    Country?: string;
    F_CityMaster?: string;
    F_StateMaster?: string;
    F_CountryMaster?: string;
  };
  isProgress?: boolean;
}

interface DropdownState {
  countries: Array<{ Id?: number; Name?: string }>;
  states: Array<{ Id?: number; Name?: string }>;
  cities: Array<{ Id?: number; Name?: string }>;
  isProgress?: boolean;
}

const API_URL_SAVE = `${API_WEB_URLS.CompanyMaster}/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/${API_WEB_URLS.CompanyMaster}/Id`;
const COUNTRY_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CountryMaster}/Id/0`;
const STATE_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.StateMaster}/Id/0`;

/**
 * Add/Edit form for Company Master.
 */
const AddEdit_CompanyMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [companyState, setCompanyState] = useState<CompanyState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const [logoPreview, setLogoPreview] = useState<string>("");
  const [signatureImagePreview, setSignatureImagePreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureImageFile, setSignatureImageFile] = useState<File | null>(null);

  const [dropdowns, setDropdowns] = useState<DropdownState>({
    countries: [],
    states: [],
    cities: [],
    isProgress: false,
  });

  // Refs for form fields
  const companyNameRef = useRef<HTMLInputElement>(null);
  const shortNameRef = useRef<HTMLInputElement>(null);
  const emailIDRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const websiteRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const officePhoneRef = useRef<HTMLInputElement>(null);
  const residencePhoneRef = useRef<HTMLInputElement>(null);
  const mobileNoRef = useRef<HTMLInputElement>(null);
  const faxNoRef = useRef<HTMLInputElement>(null);
  const panNoRef = useRef<HTMLInputElement>(null);
  const gstinRef = useRef<HTMLInputElement>(null);
  const lstNoRef = useRef<HTMLInputElement>(null);
  const cstNoRef = useRef<HTMLInputElement>(null);
  const regNoRef = useRef<HTMLInputElement>(null);
  const financialYearFromRef = useRef<HTMLInputElement>(null);
  const booksFromRef = useRef<HTMLInputElement>(null);

  const isEditMode = companyState.id > 0;

  /**
   * Validation rules for company master form.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        CompanyName: Yup.string().trim().required("Company name is required"),
        ShortName: Yup.string().trim().required("Short name is required"),
        Address: Yup.string().trim(),
        EmailID: Yup.string().trim().email("Invalid email address"),
        Website: Yup.string().trim().url("Invalid website URL"),
        F_CountryMaster: Yup.string().trim(),
        F_StateMaster: Yup.string().trim(),
        F_CityMaster: Yup.string().trim(),
        Zip: Yup.string().trim(),
        OfficePhoneNo: Yup.string().trim(),
        ResidencePhoneNo: Yup.string().trim(),
        MobileNo: Yup.string().trim(),
        FaxNo: Yup.string().trim(),
        PanNo: Yup.string().trim(),
        GSTIN: Yup.string().trim(),
        LSTNo: Yup.string().trim(),
        CSTNo: Yup.string().trim(),
        RegNo: Yup.string().trim(),
        FinancialYearFrom: Yup.string().trim(),
        BooksFrom: Yup.string().trim(),
      }),
    []
  );

  /**
   * Load country and state dropdowns on mount.
   */
  useEffect(() => {
    Fn_FillListData(dispatch, setDropdowns, "countries", COUNTRY_LIST_URL).catch((error) => {
      console.error("Failed to fetch countries:", error);
    });
    Fn_FillListData(dispatch, setDropdowns, "states", STATE_LIST_URL).catch((error) => {
      console.error("Failed to fetch states:", error);
    });
  }, [dispatch]);

  /**
   * Loads company data for editing.
   */
  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setCompanyState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setCompanyState, recordId, API_URL_EDIT);
    } else {
      setCompanyState((prev) => ({
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
    const selectedState = companyState.formData.F_StateMaster;
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
  }, [companyState.formData.F_StateMaster, dispatch]);

  /**
   * Normalizes nullable values to empty strings.
   */
  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    CompanyName: toStringOrEmpty(companyState.formData.CompanyName || companyState.formData.Name),
    ShortName: toStringOrEmpty(companyState.formData.ShortName),
    Address: toStringOrEmpty(companyState.formData.Address),
    EmailID: toStringOrEmpty(companyState.formData.EmailID),
    Website: toStringOrEmpty(companyState.formData.Website),
    F_CountryMaster: toStringOrEmpty(companyState.formData.F_CountryMaster || companyState.formData.Country),
    F_StateMaster: toStringOrEmpty(companyState.formData.F_StateMaster || companyState.formData.State),
    F_CityMaster: toStringOrEmpty(companyState.formData.F_CityMaster || companyState.formData.City),
    Zip: toStringOrEmpty(companyState.formData.Zip),
    OfficePhoneNo: toStringOrEmpty(companyState.formData.OfficePhoneNo),
    ResidencePhoneNo: toStringOrEmpty(companyState.formData.ResidencePhoneNo),
    MobileNo: toStringOrEmpty(companyState.formData.MobileNo),
    FaxNo: toStringOrEmpty(companyState.formData.FaxNo),
    PanNo: toStringOrEmpty(companyState.formData.PanNo),
    GSTIN: toStringOrEmpty(companyState.formData.GSTIN),
    LSTNo: toStringOrEmpty(companyState.formData.LSTNo),
    CSTNo: toStringOrEmpty(companyState.formData.CSTNo),
    RegNo: toStringOrEmpty(companyState.formData.RegNo),
    FinancialYearFrom: toStringOrEmpty(companyState.formData.FinancialYearFrom),
    BooksFrom: toStringOrEmpty(companyState.formData.BooksFrom),
    LogoImagePreview: logoPreview,
    SignatureImagePreview: signatureImagePreview,
  };

  /**
   * Handles form submission.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(companyState.id ?? 0));
      formData.append("CompanyName", values.CompanyName || "");
      formData.append("ShortName", values.ShortName || "");
      formData.append("Address", values.Address || "");
      formData.append("EmailID", values.EmailID || "");
      formData.append("Website", values.Website || "");
      formData.append("F_CountryMaster", values.F_CountryMaster || "0");
      formData.append("F_StateMaster", values.F_StateMaster || "0");
      formData.append("F_CityMaster", values.F_CityMaster || "0");
      formData.append("Zip", values.Zip || "");
      formData.append("OfficePhoneNo", values.OfficePhoneNo || "");
      formData.append("ResidencePhoneNo", values.ResidencePhoneNo || "");
      formData.append("MobileNo", values.MobileNo || "");
      formData.append("FaxNo", values.FaxNo || "");
      formData.append("PanNo", values.PanNo || "");
      formData.append("GSTIN", values.GSTIN || "");
      formData.append("LSTNo", values.LSTNo || "");
      formData.append("CSTNo", values.CSTNo || "");
      formData.append("RegNo", values.RegNo || "");
      formData.append("FinancialYearFrom", values.FinancialYearFrom || "");
      formData.append("BooksFrom", values.BooksFrom || "");
      formData.append("IsActive", "true");
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      if (logoFile) {
        formData.append("Photo.ImageFileName", logoFile.name || "a");
        formData.append("Photo.ImageFile", logoFile);
      }
      // if (signatureImageFile) {
      //   formData.append("SignatureImg.ImageFileName", signatureImageFile.name || "a");
      //   formData.append("SignatureImg.ImageFile", signatureImageFile);
      // }

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: companyState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/companyMaster"
      );
    } catch (error) {
      console.error("Error saving company master:", error);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handles logo image selection.
   */
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>, setFieldValue: any) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setFieldValue("LogoImagePreview", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handles signature image selection.
   */
  const handleSignatureImageChange = (event: React.ChangeEvent<HTMLInputElement>, setFieldValue: any) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      setSignatureImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureImagePreview(reader.result as string);
        setFieldValue("SignatureImagePreview", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handles Enter key navigation between form fields.
   */
  const handleFormKeyDown = (event: React.KeyboardEvent, fieldName: string) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();

      switch (fieldName) {
        case "CompanyName":
          shortNameRef.current?.focus();
          break;
        case "ShortName":
          emailIDRef.current?.focus();
          break;
        case "EmailID":
          addressRef.current?.focus();
          break;
        case "Address":
          websiteRef.current?.focus();
          break;
        case "Website":
          countryRef.current?.focus();
          break;
        case "F_CountryMaster":
          stateRef.current?.focus();
          break;
        case "F_StateMaster":
          cityRef.current?.focus();
          break;
        case "F_CityMaster":
          zipRef.current?.focus();
          break;
        case "Zip":
          officePhoneRef.current?.focus();
          break;
        case "OfficePhoneNo":
          residencePhoneRef.current?.focus();
          break;
        case "ResidencePhoneNo":
          mobileNoRef.current?.focus();
          break;
        case "MobileNo":
          faxNoRef.current?.focus();
          break;
        case "FaxNo":
          panNoRef.current?.focus();
          break;
        case "PanNo":
          gstinRef.current?.focus();
          break;
        case "GSTIN":
          lstNoRef.current?.focus();
          break;
        case "LSTNo":
          cstNoRef.current?.focus();
          break;
        case "CSTNo":
          regNoRef.current?.focus();
          break;
        case "RegNo":
          financialYearFromRef.current?.focus();
          break;
        case "FinancialYearFrom":
          booksFromRef.current?.focus();
          break;
        case "BooksFrom":
          // Last field, do nothing or focus on submit button
          break;
        default:
          break;
      }
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Company Master" parent="Masters" />
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
                        title={`${isEditMode ? "Edit" : "Add"} Company`}
                        tagClass="card-title mb-0"
                      />
                      <CardBody>
                        <Row className="gy-2">
                          <Col md="4">
                            <FormGroup>
                              <Label>
                                Company Name <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="CompanyName"
                                innerRef={companyNameRef}
                                placeholder="Enter company name"
                                value={values.CompanyName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "CompanyName")}
                                invalid={touched.CompanyName && !!errors.CompanyName}
                              />
                              <ErrorMessage name="CompanyName" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>
                                Short Name <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="ShortName"
                                innerRef={shortNameRef}
                                placeholder="Enter short name"
                                value={values.ShortName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "ShortName")}
                                invalid={touched.ShortName && !!errors.ShortName}
                              />
                              <ErrorMessage name="ShortName" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Email ID</Label>
                              <Input
                                type="email"
                                name="EmailID"
                                innerRef={emailIDRef}
                                placeholder="Enter email"
                                value={values.EmailID}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "EmailID")}
                                invalid={touched.EmailID && !!errors.EmailID}
                              />
                              <ErrorMessage name="EmailID" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="12">
                            <FormGroup>
                              <Label>Address</Label>
                              <Input
                                type="text"
                                name="Address"
                                innerRef={addressRef}
                                placeholder="Enter address"
                                value={values.Address}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "Address")}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Website</Label>
                              <Input
                                type="text"
                                name="Website"
                                innerRef={websiteRef}
                                placeholder="Enter website"
                                value={values.Website}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "Website")}
                                invalid={touched.Website && !!errors.Website}
                              />
                              <ErrorMessage name="Website" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>State</Label>
                              <Input
                                type="select"
                                name="F_StateMaster"
                                innerRef={stateRef}
                                value={values.F_StateMaster}
                                onChange={(e) => {
                                  handleChange(e);
                                  // Reset city when state changes
                                  setFieldValue("F_CityMaster", "");
                                  // Fetch cities for selected state
                                  const selectedState = e.target.value;
                                  if (selectedState) {
                                    Fn_FillListData(dispatch, setDropdowns, "cities", `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.CityMasterByStateId}/Id/${selectedState}`)
                                      .catch((err) => {
                                        console.error("Failed to fetch cities by state:", err);
                                      });
                                  } else {
                                    setDropdowns((prev) => ({ ...prev, cities: [] }));
                                  }
                                }}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "F_StateMaster")}
                              >
                                <option value="">Select state</option>
                                {dropdowns.states.map((state) => (
                                  <option key={state?.Id} value={state?.Id ?? ""}>
                                    {state?.Name || `State ${state?.Id ?? ""}`}
                                  </option>
                                ))}
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>City</Label>
                              <Input
                                type="select"
                                name="F_CityMaster"
                                innerRef={cityRef}
                                value={values.F_CityMaster}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "F_CityMaster")}
                                disabled={!values.F_StateMaster}
                              >
                                <option value="">Select city</option>
                                {dropdowns.cities.map((city) => (
                                  <option key={city?.Id} value={city?.Id ?? ""}>
                                    {city?.Name || `City ${city?.Id ?? ""}`}
                                  </option>
                                ))}
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Zip</Label>
                              <Input
                                type="text"
                                name="Zip"
                                innerRef={zipRef}
                                placeholder="Enter zip code"
                                value={values.Zip}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "Zip")}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Country</Label>
                              <Input
                                type="select"
                                name="F_CountryMaster"
                                innerRef={countryRef}
                                value={values.F_CountryMaster}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "F_CountryMaster")}
                              >
                                <option value="">Select country</option>
                                {dropdowns.countries.map((country) => (
                                  <option key={country?.Id} value={country?.Id ?? ""}>
                                    {country?.Name || `Country ${country?.Id ?? ""}`}
                                  </option>
                                ))}
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Office Phone No</Label>
                              <Input
                                type="text"
                                name="OfficePhoneNo"
                                innerRef={officePhoneRef}
                                placeholder="Enter phone number"
                                value={values.OfficePhoneNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "OfficePhoneNo")}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Residence Phone No</Label>
                              <Input
                                type="text"
                                name="ResidencePhoneNo"
                                innerRef={residencePhoneRef}
                                placeholder="Enter residence phone"
                                value={values.ResidencePhoneNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "ResidencePhoneNo")}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Mobile No</Label>
                              <Input
                                type="text"
                                name="MobileNo"
                                innerRef={mobileNoRef}
                                placeholder="Enter mobile number"
                                value={values.MobileNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "MobileNo")}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Fax No</Label>
                              <Input
                                type="text"
                                name="FaxNo"
                                innerRef={faxNoRef}
                                placeholder="Enter fax number"
                                value={values.FaxNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "FaxNo")}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Pan No</Label>
                              <Input
                                type="text"
                                name="PanNo"
                                innerRef={panNoRef}
                                placeholder="Enter PAN number"
                                value={values.PanNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "PanNo")}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>GSTIN</Label>
                              <Input
                                type="text"
                                name="GSTIN"
                                innerRef={gstinRef}
                                placeholder="Enter GSTIN"
                                value={values.GSTIN}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "GSTIN")}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>LST No.</Label>
                              <Input
                                type="text"
                                name="LSTNo"
                                innerRef={lstNoRef}
                                placeholder="Enter LST number"
                                value={values.LSTNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "LSTNo")}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>CST No.</Label>
                              <Input
                                type="text"
                                name="CSTNo"
                                innerRef={cstNoRef}
                                placeholder="Enter CST number"
                                value={values.CSTNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "CSTNo")}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Reg No.</Label>
                              <Input
                                type="text"
                                name="RegNo"
                                innerRef={regNoRef}
                                placeholder="Enter registration number"
                                value={values.RegNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleFormKeyDown(e, "RegNo")}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Financial Year From</Label>
                              <DateInput
                                name="FinancialYearFrom"
                                innerRef={financialYearFromRef}
                                value={values.FinancialYearFrom}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e: React.KeyboardEvent) => handleFormKeyDown(e, "FinancialYearFrom")}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Books From</Label>
                              <DateInput
                                name="BooksFrom"
                                innerRef={booksFromRef}
                                value={values.BooksFrom}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e: React.KeyboardEvent) => handleFormKeyDown(e, "BooksFrom")}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Logo Image</Label>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleLogoChange(e, setFieldValue)}
                              />
                              {logoPreview && (
                                <div className="mt-2">
                                  <img src={logoPreview} alt="Logo Preview" style={{ maxWidth: "200px", maxHeight: "200px" }} />
                                </div>
                              )}
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Signature Image</Label>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleSignatureImageChange(e, setFieldValue)}
                              />
                              {signatureImagePreview && (
                                <div className="mt-2">
                                  <img src={signatureImagePreview} alt="Signature Image Preview" style={{ maxWidth: "200px", maxHeight: "200px" }} />
                                </div>
                              )}
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/companyMaster")}>
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

export default AddEdit_CompanyMaster;
