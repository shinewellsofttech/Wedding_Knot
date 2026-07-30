import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { getBlogImageUrl } from "./AddEdit_BlogMaster";

const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/BlogMasterEdit/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/BlogMaster`;

interface BlogListState {
  BlogMasterList: any[];
  isProgress: boolean;
  filterText: string;
}

/**
 * Lists blog masters from BlogMasterEdit API endpoint.
 */
const PageList_BlogMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<BlogListState>({
    BlogMasterList: [],
    isProgress: true,
    filterText: "",
  });

  /**
   * Loads blog master list from BlogMasterEdit.
   */
  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, setState, "BlogMasterList", LIST_API_URL).catch((error) => {
      console.error("Failed to load blog masters:", error);
      setState((prev) => ({ ...prev, isProgress: false }));
    });
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Navigate to add screen.
   */
  const handleAdd = () => {
    navigate("/addEditBlogMaster", { state: { Id: 0 } });
  };

  /**
   * Navigate to edit screen.
   */
  const handleEdit = (id: number | string) => {
    if (!id) return;
    navigate("/addEditBlogMaster", { state: { Id: id } });
  };

  /**
   * Delete selected blog master.
   */
  const handleDelete = (id: number | string) => {
    if (!id) return;
    const itemToDelete = state.BlogMasterList.find((item: any) => item?.Id === id);
    const itemName = itemToDelete?.BlogTitle || itemToDelete?.Title || itemToDelete?.Name || "this blog";
    if (window.confirm(`Are you sure you want to delete '${itemName}'?`)) {
      Fn_DeleteData(dispatch, () => {}, Number(id), DELETE_API_URL).catch(() => {
        setState((prev) => {
          if (!itemToDelete) return prev;
          const newList = [...prev.BlogMasterList, itemToDelete].sort((a, b) => a.Id - b.Id);
          return { ...prev, BlogMasterList: newList };
        });
      });
      
      setState((prev) => ({
        ...prev,
        BlogMasterList: prev.BlogMasterList.filter((item: any) => item?.Id !== id),
      }));
    }
  };

  /**
   * Update search string.
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((prev) => ({
      ...prev,
      filterText: value,
    }));
  };

  /**
   * Filter list based on search text.
   */
  const filteredList = useMemo(() => {
    const rawList = Array.isArray(state.BlogMasterList) ? state.BlogMasterList : [];
    const searchText = state.filterText.trim().toLowerCase();
    if (!searchText) {
      return rawList;
    }

    return rawList.filter((item) => {
      const fields = [item?.BlogTitle, item?.Title, item?.Author, item?.ShortSummary, item?.Excerpt];
      return fields.some((field) => String(field ?? "").toLowerCase().includes(searchText));
    });
  }, [state.BlogMasterList, state.filterText]);

  const formatDate = (rawDate: any) => {
    if (!rawDate) return "-";
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return String(rawDate);
      return d.toLocaleDateString();
    } catch (e) {
      return String(rawDate);
    }
  };

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Blog Master" parent="Ecommerce" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Card>
                <CardHeaderCommon title="Blog Master List" tagClass="card-title mb-0" />
                <CardBody>
                  <Row className="mb-3">
                    <Col md="6" className="d-flex align-items-center">
                      <Label className="me-2 mb-0">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by title, author..."
                        value={state.filterText}
                        onChange={handleSearchChange}
                      />
                    </Col>
                    <Col md="6" className="text-end">
                      <Btn color="primary" onClick={handleAdd}>
                        <i className="fa fa-plus me-2" />
                        Add Blog Master
                      </Btn>
                    </Col>
                  </Row>

                  {state.isProgress ? (
                    <div className="text-center py-5">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table bordered hover striped>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Image</th>
                            <th>Blog Title</th>
                            <th>Author</th>
                            <th>Publish Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredList.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-4">
                                No records found.
                              </td>
                            </tr>
                          ) : (
                            filteredList.map((item: any, index: number) => {
                              const imgUrl = getBlogImageUrl(item?.PrimaryImage);
                              return (
                                <tr key={item?.Id ?? index}>
                                  <td>{index + 1}</td>
                                  <td>
                                    {imgUrl ? (
                                      <img
                                        src={imgUrl}
                                        alt={item?.BlogTitle || "Blog"}
                                        style={{ width: "50px", height: "40px", objectFit: "cover", borderRadius: "4px" }}
                                      />
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td>{item?.BlogTitle || item?.Title || item?.Name || "-"}</td>
                                  <td>{item?.Author || "-"}</td>
                                  <td>{formatDate(item?.PublishDate || item?.Date)}</td>
                                  <td>
                                    <Btn color="primary" size="sm" className="me-2" onClick={() => handleEdit(item?.Id)}>
                                      <i className="fa fa-edit" />
                                    </Btn>
                                    <Btn color="danger" size="sm" onClick={() => handleDelete(item?.Id)}>
                                      <i className="fa fa-trash" />
                                    </Btn>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default PageList_BlogMaster;
