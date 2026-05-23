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
import { allowNonNegative, getCurrentUserId, handleEnterToNextField } from "../../utils/formUtils";
import DateInput from "../../CommonElements/DateInput";

interface FormValues {
  Name: string;
  VoucherStartNo: string;
  IsAutoVoucherNo: number;
  PrefixType: number;
  VoucherPrefix: string;
  DefaultVoucherPrefix: string;
  SeperateDayWise: number;
  Disclaimer1: string;
  Disclaimer2: string;
  Disclaimer3: string;
  Disclaimer4: string;
  Disclaimer5: string;
  LockFromDate: string;
  LockToDate: string;
}

const initialValues: FormValues = {
  Name: "",
  VoucherStartNo: "1",
  IsAutoVoucherNo: 1,
  PrefixType: 1,
  VoucherPrefix: "",
  DefaultVoucherPrefix: "",
  SeperateDayWise: 0,
  Disclaimer1: "",
  Disclaimer2: "",
  Disclaimer3: "",
  Disclaimer4: "",
  Disclaimer5: "",
  LockFromDate: "",
  LockToDate: "",
};

interface VoucherTypeState {
  id: number;
  formData: Partial<FormValues> & Record<string, unknown>;
  isProgress?: boolean;
}

const API_URL_SAVE = "VoucherTypeMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/VoucherTypeMaster/Id";

const AddEdit_VoucherType = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [voucherTypeState, setVoucherTypeState] = useState<VoucherTypeState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const isEditMode = voucherTypeState.id > 0;

  const validationSchema = useMemo(
    () =>
      Yup.object({
        Name: Yup.string().trim().required("Name (Caption) is required"),
        VoucherStartNo: Yup.string().trim(),
        IsAutoVoucherNo: Yup.number(),
        PrefixType: Yup.number(),
        VoucherPrefix: Yup.string().trim(),
        SeperateDayWise: Yup.number(),
        LockFromDate: Yup.string().trim(),
        LockToDate: Yup.string().trim(),
      }),
    []
  );

  useEffect(() => {
    const fetchRecord = async () => {
      const locationState = location.state as { Id?: number; record?: any } | undefined;
      const recordId = locationState?.Id ?? 0;
      const preloadedRecord = locationState?.record;

      if (recordId > 0) {
        // If the list page passed the full record directly, use it immediately
        if (preloadedRecord && (preloadedRecord.Id === recordId || String(preloadedRecord.Id) === String(recordId))) {
          setVoucherTypeState((prev) => ({ ...prev, id: Number(recordId), formData: preloadedRecord, isProgress: false }));
          return;
        }

        // Fallback: fetch from API and filter by Id
        setVoucherTypeState((prev) => ({ ...prev, id: Number(recordId), isProgress: true }));
        try {
          const result = await Fn_FillListData(dispatch, () => ({}), "voucherTypeData", `${API_URL_EDIT}/${recordId}`);
          let dataList: any[] = [];
          
          if (Array.isArray(result)) dataList = result;
          else if (result?.data?.dataList && Array.isArray(result.data.dataList)) dataList = result.data.dataList;
          else if (result?.dataList && Array.isArray(result.dataList)) dataList = result.dataList;
          else if (result?.data?.response && Array.isArray(result.data.response)) dataList = result.data.response;
          
          const record = dataList.find((item: any) => String(item.Id) === String(recordId));
          
          if (record) {
            setVoucherTypeState((prev) => ({ ...prev, formData: record, isProgress: false }));
          } else {
            setVoucherTypeState((prev) => ({ ...prev, isProgress: false }));
          }
        } catch (error) {
          console.error("Error fetching voucher type", error);
          setVoucherTypeState((prev) => ({ ...prev, isProgress: false }));
        }
      } else {
        setVoucherTypeState((prev) => ({
          ...prev,
          id: 0,
          formData: { ...initialValues },
          isProgress: false
        }));
      }
    };
    
    fetchRecord();
  }, [dispatch, location.state]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");
  const toNum = (value: unknown, def: number) => {
    if (value === undefined || value === null) return def;
    const n = Number(value);
    return Number.isNaN(n) ? def : n;
  };

  const fd = voucherTypeState.formData as any;
  const initialFormValues: FormValues = {
    ...initialValues,
    Name: toStringOrEmpty(fd.Name),
    VoucherStartNo: toStringOrEmpty(fd.VoucherStartNo) || "1",
    IsAutoVoucherNo: (fd.IsAutoVoucherNo === true || fd.IsAutoVoucherNo === 1 || fd.VoucherNoAuto === 1) ? 1 : 0,
    PrefixType: toNum(fd.PrefixType, 1),
    VoucherPrefix: toStringOrEmpty(fd.VoucherPrefix),
    DefaultVoucherPrefix: toStringOrEmpty(fd.DefaultVoucherPrefix),
    SeperateDayWise: toNum(voucherTypeState.formData.SeperateDayWise, 0),
    Disclaimer1: toStringOrEmpty(voucherTypeState.formData.Disclaimer1),
    Disclaimer2: toStringOrEmpty(voucherTypeState.formData.Disclaimer2),
    Disclaimer3: toStringOrEmpty(voucherTypeState.formData.Disclaimer3),
    Disclaimer4: toStringOrEmpty(voucherTypeState.formData.Disclaimer4),
    Disclaimer5: toStringOrEmpty(voucherTypeState.formData.Disclaimer5),
    LockFromDate: voucherTypeState.formData.LockFromDate ? new Date(voucherTypeState.formData.LockFromDate as string).toISOString().split("T")[0] : "",
    LockToDate: voucherTypeState.formData.LockToDate ? new Date(voucherTypeState.formData.LockToDate as string).toISOString().split("T")[0] : "",
  };

  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(voucherTypeState.id ?? 0));
      formData.append("Name", values.Name || "");
      formData.append("VoucherStartNo", values.VoucherStartNo || "1");
      formData.append("IsAutoVoucherNo", Number(values.IsAutoVoucherNo) === 1 ? "true" : "false");
      formData.append("VoucherNoAuto", String(values.IsAutoVoucherNo));
      formData.append("PrefixType", String(values.PrefixType));
      formData.append("VoucherPrefix", values.VoucherPrefix || "");
      formData.append("DefaultVoucherPrefix", values.DefaultVoucherPrefix || "");
      formData.append("SeperateDayWise", String(values.SeperateDayWise));
      formData.append("Disclaimer1", values.Disclaimer1 || "");
      formData.append("Disclaimer2", values.Disclaimer2 || "");
      formData.append("Disclaimer3", values.Disclaimer3 || "");
      formData.append("Disclaimer4", values.Disclaimer4 || "");
      formData.append("Disclaimer5", values.Disclaimer5 || "");
      formData.append("LockFromDate", values.LockFromDate || "");
      formData.append("LockToDate", values.LockToDate || "");
      formData.append("UserId", getCurrentUserId());
      formData.append("F_CompanyMaster", (() => { try { const a = JSON.parse(localStorage.getItem("authUser")||"{}"); return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0"); } catch(e){return "0";} })());

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: voucherTypeState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/voucherTypeMaster"
      );
    } catch (error) {
      console.error("Voucher type submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Voucher Type" parent="Masters" />
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
                      title={`${isEditMode ? "Edit" : "Add"} Voucher Type`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Row className="gy-3">
                        <Col md="6">
                          <FormGroup>
                            <Label>Name (Caption) <span className="text-danger">*</span></Label>
                            <Input
                              type="text"
                              name="Name"
                              placeholder="e.g. Sales"
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
                            <Label>Voucher Starting No</Label>
                            <Input
                              type="number"
                              name="VoucherStartNo"
                              min={0}
                              value={values.VoucherStartNo}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (allowNonNegative(v)) handleChange(e);
                              }}
                              onBlur={handleBlur}
                            />
                          </FormGroup>
                        </Col>

                        <Col md="12">
                          <FormGroup>
                            <Label className="me-3">Auto Voucher No</Label>
                            <div className="d-inline-block me-4">
                              <Input
                                type="radio"
                                name="IsAutoVoucherNo"
                                value={1}
                                checked={Number(values.IsAutoVoucherNo) === 1}
                                onChange={handleChange}
                              />
                              <Label check className="ms-1">Yes</Label>
                            </div>
                            <div className="d-inline-block">
                              <Input
                                type="radio"
                                name="IsAutoVoucherNo"
                                value={0}
                                checked={Number(values.IsAutoVoucherNo) === 0}
                                onChange={handleChange}
                              />
                              <Label check className="ms-1">No</Label>
                            </div>
                          </FormGroup>
                        </Col>

                        <Col md="12">
                          <FormGroup>
                            <Label className="me-3">Prefix Type</Label>
                            <div className="d-inline-block me-3">
                              <Input
                                type="radio"
                                name="PrefixType"
                                value={2}
                                checked={Number(values.PrefixType) === 2}
                                onChange={handleChange}
                              />
                              <Label check className="ms-1">User</Label>
                            </div>
                            <div className="d-inline-block">
                              <Input
                                type="radio"
                                name="PrefixType"
                                value={1}
                                checked={Number(values.PrefixType) === 1}
                                onChange={handleChange}
                              />
                              <Label check className="ms-1">Default</Label>
                            </div>
                          </FormGroup>
                        </Col>

                        <Col md="6">
                          <FormGroup>
                            <Label>Prefix</Label>
                            <Input
                              type="text"
                              name="VoucherPrefix"
                              placeholder="e.g. Ropl/25-26/"
                              value={values.VoucherPrefix}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </FormGroup>
                        </Col>
                        
                        <Col md="6">
                          <FormGroup>
                            <Label>Default Voucher Prefix</Label>
                            <Input
                              type="text"
                              name="DefaultVoucherPrefix"
                              placeholder="e.g. J/25-26/"
                              value={values.DefaultVoucherPrefix}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </FormGroup>
                        </Col>

                        <Col md="12">
                          <FormGroup>
                            <Label className="me-3">Separate Day Wise</Label>
                            <div className="d-inline-block me-4">
                              <Input
                                type="radio"
                                name="SeperateDayWise"
                                value={1}
                                checked={Number(values.SeperateDayWise) === 1}
                                onChange={handleChange}
                              />
                              <Label check className="ms-1">Yes</Label>
                            </div>
                            <div className="d-inline-block">
                              <Input
                                type="radio"
                                name="SeperateDayWise"
                                value={0}
                                checked={Number(values.SeperateDayWise) === 0}
                                onChange={handleChange}
                              />
                              <Label check className="ms-1">No</Label>
                            </div>
                          </FormGroup>
                        </Col>

                        <Col xs="12">
                          <Card className="mb-3">
                            <CardBody className="py-3">
                              <h6 className="mb-3">Invoice Disclaimers</h6>
                              {([1, 2, 3, 4, 5] as const).map((i) => (
                                <FormGroup key={i} className="mb-2">
                                  <Label className="small">{i}.</Label>
                                  <Input
                                    type="text"
                                    name={`Disclaimer${i}` as keyof FormValues}
                                    value={values[`Disclaimer${i}` as keyof FormValues] as string}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder={`Disclaimer ${i}`}
                                  />
                                </FormGroup>
                              ))}
                            </CardBody>
                          </Card>
                        </Col>

                        <Col xs="12">
                          <Card className="mb-0">
                            <CardBody className="py-3">
                              <h6 className="mb-3">Lock Data</h6>
                              <Row>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>From</Label>
                                    <DateInput
                                      name="LockFromDate"
                                      value={values.LockFromDate}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>To</Label>
                                    <DateInput
                                      name="LockToDate"
                                      value={values.LockToDate}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </FormGroup>
                                </Col>
                              </Row>
                            </CardBody>
                          </Card>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/voucherTypeMaster")}>
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

export default AddEdit_VoucherType;
