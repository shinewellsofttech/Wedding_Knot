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
  Title: string;
  Slug: string;
  Author: string;
  Date: string;
  ReadTime: string;
  Img1: string;
  Img2: string;
  Excerpt: string;
  Content: string;
  Tags: string;
}

const initialValues: FormValues = {
  Title: "",
  Slug: "",
  Author: "Wedding Knot",
  Date: new Date().toISOString().split("T")[0],
  ReadTime: "3 min read",
  Img1: "",
  Img2: "",
  Excerpt: "",
  Content: "",
  Tags: "",
};

interface BlogMasterState {
  id: number;
  formData: Partial<FormValues>;
  isProgress?: boolean;
}

const API_URL_SAVE = `BlogMaster/0/token`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/BlogMasterEdit/Id`;

export const getBlogImageUrl = (imagePath: string, fallback = "") => {
  if (!imagePath || typeof imagePath !== "string") return fallback;
  const cleanPath = imagePath.trim();
  if (!cleanPath) return fallback;
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) return cleanPath;
  if (cleanPath.startsWith("/assets/") || cleanPath.startsWith("assets/")) {
    return (process.env.PUBLIC_URL || "") + (cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath);
  }
  return `https://accountingwkr.shinewellsofttech.co.in/MemberImages/${cleanPath.replace(/^\/+/, "")}`;
};

/**
 * Helper to fetch an existing image URL and convert it into a binary File object.
 */
export const urlToFile = async (url: string, defaultFilename: string): Promise<File | null> => {
  try {
    if (!url || typeof url !== "string") return null;
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    let filename = defaultFilename;
    try {
      const urlPath = new URL(url, window.location.origin).pathname;
      const extractedName = urlPath.split("/").pop();
      if (extractedName && extractedName.includes(".")) {
        filename = extractedName;
      }
    } catch (e) {
      // fallback
    }
    const mimeType = blob.type || "image/jpeg";
    return new File([blob], filename, { type: mimeType });
  } catch (error) {
    console.error("Failed to convert image URL to File:", error);
    return null;
  }
};

/**
 * Add/Edit form for Blog master matching swagger schema.
 */
const AddEdit_BlogMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [blogMasterState, setBlogMasterState] = useState<BlogMasterState>({
    id: 0,
    formData: { ...initialValues },
    isProgress: false,
  });

  const [img1File, setImg1File] = useState<File | null>(null);
  const [img1Preview, setImg1Preview] = useState<string>("");
  const [img2File, setImg2File] = useState<File | null>(null);
  const [img2Preview, setImg2Preview] = useState<string>("");

  const isEditMode = blogMasterState.id > 0;

  /**
   * Validation schema for Blog master form.
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        Title: Yup.string().trim().required("Title is required"),
        Excerpt: Yup.string().trim().required("Short Summary is required"),
        Content: Yup.string().trim().required("Full Content is required"),
        Author: Yup.string().trim().required("Author is required"),
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
      setBlogMasterState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setBlogMasterState, recordId, API_URL_EDIT);
    } else {
      setBlogMasterState((prev) => ({
        ...prev,
        id: 0,
        formData: { ...initialValues },
      }));
      setImg1File(null);
      setImg1Preview("");
      setImg2File(null);
      setImg2Preview("");
    }
  }, [dispatch, location.state]);

  /**
   * Update previews when editing existing record.
   * Note: Using PrimaryImage / SecondaryImage directly, skipping Thumb images.
   */
  useEffect(() => {
    const rawImg1 = (blogMasterState.formData as any).PrimaryImage || blogMasterState.formData.Img1;
    if (rawImg1 && typeof rawImg1 === "string" && !img1File && !img1Preview) {
      setImg1Preview(getBlogImageUrl(rawImg1));
    }
    const rawImg2 = (blogMasterState.formData as any).SecondaryImage || blogMasterState.formData.Img2;
    if (rawImg2 && typeof rawImg2 === "string" && !img2File && !img2Preview) {
      setImg2Preview(getBlogImageUrl(rawImg2));
    }
  }, [blogMasterState.formData]);

  const toStringOrEmpty = (value: unknown) => (value !== undefined && value !== null ? String(value) : "");

  const initialFormValues: FormValues = {
    ...initialValues,
    Title: toStringOrEmpty(blogMasterState.formData.Title || (blogMasterState.formData as any).BlogTitle || (blogMasterState.formData as any).Name),
    Slug: toStringOrEmpty(blogMasterState.formData.Slug || (blogMasterState.formData as any).BlogSlug),
    Author: toStringOrEmpty(blogMasterState.formData.Author || initialValues.Author),
    Date: toStringOrEmpty((blogMasterState.formData as any).PublishDate || blogMasterState.formData.Date || initialValues.Date).split("T")[0],
    ReadTime: toStringOrEmpty(blogMasterState.formData.ReadTime || initialValues.ReadTime),
    Img1: toStringOrEmpty((blogMasterState.formData as any).PrimaryImage || blogMasterState.formData.Img1),
    Img2: toStringOrEmpty((blogMasterState.formData as any).SecondaryImage || blogMasterState.formData.Img2),
    Excerpt: toStringOrEmpty((blogMasterState.formData as any).ShortSummary || blogMasterState.formData.Excerpt),
    Content: toStringOrEmpty((blogMasterState.formData as any).FullContent || blogMasterState.formData.Content),
    Tags: toStringOrEmpty(blogMasterState.formData.Tags),
  };

  /**
   * Auto-generate slug from title if slug is empty
   */
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>, setFieldValue: (field: string, value: any) => void) => {
    const val = e.target.value;
    setFieldValue("Title", val);
    const slugified = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFieldValue("Slug", slugified);
  };

  /**
   * Handle Primary Image File Selection
   */
  const handleImg1Change = (e: React.ChangeEvent<HTMLInputElement>, setFieldValue: (field: string, value: any) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setImg1File(file);
      setImg1Preview(URL.createObjectURL(file));
      setFieldValue("Img1", file.name);
    }
  };

  /**
   * Handle Secondary Image File Selection
   */
  const handleImg2Change = (e: React.ChangeEvent<HTMLInputElement>, setFieldValue: (field: string, value: any) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setImg2File(file);
      setImg2Preview(URL.createObjectURL(file));
      setFieldValue("Img2", file.name);
    }
  };

  /**
   * Submit handler for blog master matching API Swagger specs.
   */
  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      const formData = new FormData();
      formData.append("Id", String(blogMasterState.id ?? 0));
      formData.append("BlogTitle", values.Title || "");
      formData.append("Slug", values.Slug || "");
      formData.append("Author", values.Author || "");
      formData.append("ReadTime", values.ReadTime || "");
      formData.append("PublishDate", values.Date ? `${values.Date}T00:00:00` : "");
      formData.append("Tags", values.Tags || "");
      formData.append("ShortSummary", values.Excerpt || "");
      formData.append("FullContent", values.Content || "");
      formData.append("UserId", getCurrentUserId());

      // PrimaryImage: use new uploaded file, or convert existing image URL to binary File
      let primaryFileToUpload: File | null = img1File;
      if (!primaryFileToUpload) {
        const existingImg1Path = values.Img1 || (blogMasterState.formData as any).PrimaryImage || blogMasterState.formData.Img1 || "";
        if (existingImg1Path && typeof existingImg1Path === "string" && existingImg1Path.trim() !== "") {
          const fullUrl = getBlogImageUrl(existingImg1Path);
          if (fullUrl) {
            primaryFileToUpload = await urlToFile(fullUrl, "primary_image.jpg");
          }
        }
      }

      // SecondaryImage: use new uploaded file, or convert existing image URL to binary File
      let secondaryFileToUpload: File | null = img2File;
      if (!secondaryFileToUpload) {
        const existingImg2Path = values.Img2 || (blogMasterState.formData as any).SecondaryImage || blogMasterState.formData.Img2 || "";
        if (existingImg2Path && typeof existingImg2Path === "string" && existingImg2Path.trim() !== "") {
          const fullUrl = getBlogImageUrl(existingImg2Path);
          if (fullUrl) {
            secondaryFileToUpload = await urlToFile(fullUrl, "secondary_image.jpg");
          }
        }
      }

      if (primaryFileToUpload) {
        formData.append("PrimaryImage", primaryFileToUpload);
      }

      if (secondaryFileToUpload) {
        formData.append("SecondaryImage", secondaryFileToUpload);
      }

      await Fn_AddEditData(
        dispatch,
        () => undefined,
        { arguList: { id: blogMasterState.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/blogMaster"
      );
    } catch (error) {
      console.error("Blog master submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Blog Master" parent="Ecommerce" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Formik<FormValues>
                initialValues={initialFormValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
              >
                {({ values, handleChange, handleBlur, setFieldValue, errors, touched, isSubmitting }: FormikProps<FormValues>) => (
                  <Form className="theme-form" onKeyDown={handleEnterToNextField}>
                    <Card>
                      <CardHeaderCommon
                        title={`${isEditMode ? "Edit" : "Add"} Blog Master`}
                        tagClass="card-title mb-0"
                      />
                      <CardBody>
                        <Row className="gy-3">
                          {/* Title */}
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Blog Title <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="Title"
                                placeholder="Enter blog title"
                                value={values.Title}
                                onChange={(e) => handleTitleChange(e, setFieldValue)}
                                onBlur={handleBlur}
                                invalid={touched.Title && !!errors.Title}
                              />
                              <ErrorMessage name="Title" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>

                          {/* Slug */}
                          <Col md="6">
                            <FormGroup>
                              <Label>Slug / URL Keyword</Label>
                              <Input
                                type="text"
                                name="Slug"
                                placeholder="e.g. royal-bridal-accessories-guide"
                                value={values.Slug}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>

                          {/* Author */}
                          <Col md="4">
                            <FormGroup>
                              <Label>
                                Author <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="Author"
                                placeholder="Enter author name"
                                value={values.Author}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.Author && !!errors.Author}
                              />
                              <ErrorMessage name="Author" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>

                          {/* Read Time */}
                          <Col md="4">
                            <FormGroup>
                              <Label>Read Time</Label>
                              <Input
                                type="text"
                                name="ReadTime"
                                placeholder="e.g. 3 min read"
                                value={values.ReadTime}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>

                          {/* Date */}
                          <Col md="4">
                            <FormGroup>
                              <Label>Publish Date</Label>
                              <Input
                                type="date"
                                name="Date"
                                value={values.Date}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>

                          {/* Primary Image Upload (PrimaryImage) */}
                          <Col md="6">
                            <FormGroup>
                              <Label>Primary Image (Upload)</Label>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImg1Change(e, setFieldValue)}
                              />
                              {img1Preview && (
                                <div className="mt-2 d-flex align-items-center gap-2">
                                  <img
                                    src={img1Preview}
                                    alt="Primary Preview"
                                    style={{ width: "100px", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid #ddd" }}
                                  />
                                  <Btn
                                    color="danger"
                                    size="xs"
                                    type="button"
                                    onClick={() => {
                                      setImg1File(null);
                                      setImg1Preview("");
                                      setFieldValue("Img1", "");
                                    }}
                                  >
                                    Remove
                                  </Btn>
                                </div>
                              )}
                            </FormGroup>
                          </Col>

                          {/* Secondary Image Upload (SecondaryImage) */}
                          <Col md="6">
                            <FormGroup>
                              <Label>Secondary Image (Upload)</Label>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImg2Change(e, setFieldValue)}
                              />
                              {img2Preview && (
                                <div className="mt-2 d-flex align-items-center gap-2">
                                  <img
                                    src={img2Preview}
                                    alt="Secondary Preview"
                                    style={{ width: "100px", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid #ddd" }}
                                  />
                                  <Btn
                                    color="danger"
                                    size="xs"
                                    type="button"
                                    onClick={() => {
                                      setImg2File(null);
                                      setImg2Preview("");
                                      setFieldValue("Img2", "");
                                    }}
                                  >
                                    Remove
                                  </Btn>
                                </div>
                              )}
                            </FormGroup>
                          </Col>

                          {/* Tags */}
                          <Col md="12">
                            <FormGroup>
                              <Label>Tags (Comma Separated)</Label>
                              <Input
                                type="text"
                                name="Tags"
                                placeholder="e.g. Bridal, Jewellery, Haldi, Mehendi"
                                value={values.Tags}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </Col>

                          {/* Excerpt / Short Summary */}
                          <Col md="12">
                            <FormGroup>
                              <Label>
                                Short Summary <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="textarea"
                                rows="3"
                                name="Excerpt"
                                placeholder="Enter short summary for blog card display..."
                                value={values.Excerpt}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.Excerpt && !!errors.Excerpt}
                              />
                              <ErrorMessage name="Excerpt" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>

                          {/* Full Content */}
                          <Col md="12">
                            <FormGroup>
                              <Label>
                                Full Content <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="textarea"
                                rows="6"
                                name="Content"
                                placeholder="Write complete blog article content..."
                                value={values.Content}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.Content && !!errors.Content}
                              />
                              <ErrorMessage name="Content" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter className="text-end">
                        <Btn color="secondary" type="button" className="me-2" onClick={() => navigate("/blogMaster")}>
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

export default AddEdit_BlogMaster;
