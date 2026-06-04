import React, { useCallback, useEffect, useMemo, useState } from "react";
import Barcode from 'react-barcode';
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table, Badge, Pagination, PaginationItem, PaginationLink } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData, Fn_GetReport } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";



const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/ItemMasterData/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.ItemMaster}`;
const CATEGORY_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/CategoryMaster/Id/0`;

interface ItemListState {
  ItemMasterList: any[];
  isProgress: boolean;
  filterText: string;
}

/**
 * Lists item masters with search and CRUD options.
 */
const PageList_ItemMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<ItemListState>({
    ItemMasterList: [],
    isProgress: true,
    filterText: "",
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [gstGroups, setGstGroups] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [alterUnits, setAlterUnits] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [globalOptions, setGlobalOptions] = useState<any[]>([]);

  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterGstGroup, setFilterGstGroup] = useState<string>("");

  // Barcode Printing - opens wizard in new tab
  const [selectedItemForPrint, setSelectedItemForPrint] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [state.filterText, filterCategory, filterGstGroup]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /**
   * Transforms standard video URLs into embeddable iframe URLs.
   */
  const getEmbedUrl = (url: string) => {
    if (!url) return url;
    try {
      if (url.includes("youtube.com/watch")) {
        const urlObj = new URL(url);
        const v = urlObj.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
      } else if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
      } else if (url.includes("vimeo.com/")) {
        const id = url.split("vimeo.com/")[1]?.split("?")[0];
        if (id && !Number.isNaN(Number(id))) return `https://player.vimeo.com/video/${id}`;
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
    return url;
  };

  /**
   * Fetch item list from API based on filters.
   */
  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));

    Fn_FillListData(dispatch, () => {}, "custom", LIST_API_URL)
      .then((data: any) => {
        let rawList: any[] = [];
        if (Array.isArray(data)) rawList = data;
        else if (data?.data?.response && Array.isArray(data.data.response)) rawList = data.data.response;
        else if (data?.dataList && Array.isArray(data.dataList)) rawList = data.dataList;
        else if (data?.data?.dataList && Array.isArray(data.data.dataList)) rawList = data.data.dataList;
        
        setState((prev) => ({ ...prev, ItemMasterList: rawList, isProgress: false }));
      })
      .catch((error) => {
        console.error("Failed to load items:", error);
        setState((prev) => ({ ...prev, ItemMasterList: [], isProgress: false }));
      });
  }, [dispatch]);

  useEffect(() => {
    loadData();
    Fn_FillListData(dispatch, () => {}, "categories", CATEGORY_LIST_URL)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.dataList ?? data?.data?.dataList ?? [];
        setCategories(Array.isArray(list) ? list : []);
      })
      .catch(console.error);

    Fn_FillListData(dispatch, () => {}, "gstGroups", "Masters/0/token/GSTGroupMaster/Id/0")
      .then((data: any) => setGstGroups(Array.isArray(data) ? data : data?.dataList ?? data?.data?.dataList ?? []))
      .catch(console.error);

    Fn_FillListData(dispatch, () => {}, "units", "Masters/0/token/UnitMaster/Id/0")
      .then((data: any) => setUnits(Array.isArray(data) ? data : data?.dataList ?? data?.data?.dataList ?? []))
      .catch(console.error);

    Fn_FillListData(dispatch, () => {}, "alterUnits", "Masters/0/token/AlterUnitMaster/Id/0")
      .then((data: any) => setAlterUnits(Array.isArray(data) ? data : data?.dataList ?? data?.data?.dataList ?? []))
      .catch(console.error);

    Fn_FillListData(dispatch, () => {}, "globalOptions", "Masters/0/token/GlobalOptions/Id/0")
      .then((data: any) => setGlobalOptions(Array.isArray(data) ? data : data?.dataList ?? data?.data?.dataList ?? []))
      .catch(console.error);
  }, [dispatch]); // Removed loadData from dependency to prevent infinite loop

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Navigate to add form.
   */
  const handleAdd = () => {
    navigate("/addEditItemMaster", { state: { Id: 0 } });
  };

  /**
   * Navigate to edit form.
   */
  const handleEdit = (id: number | string) => {
    navigate("/addEditItemMaster", { state: { Id: id } });
  };

  /**
   * Delete an item.
   */
  const handleDelete = (id: number | string) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this item?")) {
      const itemToDelete = state.ItemMasterList.find((item: any) => item?.Id === id);

      Fn_DeleteData(dispatch, () => {}, Number(id), DELETE_API_URL).catch(() => {
        // Rollback the optimistic UI update if delete fails
        setState((prev) => {
          if (!itemToDelete) return prev;
          const newList = [...prev.ItemMasterList, itemToDelete].sort((a, b) => a.Id - b.Id);
          return { ...prev, ItemMasterList: newList };
        });
      });
      
      setState((prev) => ({
        ...prev,
        ItemMasterList: prev.ItemMasterList.filter((item: any) => item?.Id !== id),
      }));
    }
  };

  /**
   * Print barcodes for item variants (opens the advanced printer setup dashboard)
   */
  const handlePrintBarcodes = (item: any) => {
    sessionStorage.setItem("barcodePrintItem", JSON.stringify(item));
    sessionStorage.setItem("barcodePrintFirmName", globalOptions[0]?.FirmName || "FIRM NAME");
    window.open(`${process.env.PUBLIC_URL}/barcodePrintWizard`, "_blank");
  };

  /**
   * Update search filter.
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((prev) => ({
      ...prev,
      filterText: value,
    }));
  };

  /**
   * Filter logic across multiple fields.
   */
  const filteredList = useMemo(() => {
    const rawList = Array.isArray(state.ItemMasterList) ? state.ItemMasterList : [];
    let result = rawList;

    if (filterCategory) {
      result = result.filter(item => String(item?.F_CategoryMaster) === String(filterCategory));
    }
    
    if (filterGstGroup) {
      result = result.filter(item => String(item?.F_GSTGroupMaster) === String(filterGstGroup));
    }

    const searchText = state.filterText.trim().toLowerCase();
    if (searchText) {
      result = result.filter((item) => {
        const fields = [
          item?.ItemName,
          item?.HSNCode,
        ];
        return fields.some((field) => String(field ?? "").toLowerCase().includes(searchText));
      });
    }

    return result;
  }, [state.ItemMasterList, state.filterText, filterCategory, filterGstGroup]);

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Item Master" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Card>
                <CardHeaderCommon title="Item Master List" tagClass="card-title mb-0" />
                <CardBody>
                  <div className="p-3 mb-4 bg-light rounded border">
                    <Row className="g-3 align-items-end">
                      <Col md="3">
                        <Label className="mb-1 text-muted fw-bold" style={{ fontSize: "0.85rem" }}>Search Items</Label>
                        <Input
                          type="search"
                          placeholder="Search Item..."
                          value={state.filterText}
                          onChange={handleSearchChange}
                        />
                      </Col>
                      <Col md="3">
                        <Label className="mb-1 text-muted fw-bold" style={{ fontSize: "0.85rem" }}>Category</Label>
                        <Input
                          type="select"
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                        >
                          <option value="">All Categories</option>
                          {categories.map((c: any) => (
                            <option key={c.Id} value={c.Id}>
                              {c.Name || c.GroupName || c.Id}
                            </option>
                          ))}
                        </Input>
                      </Col>
                      <Col md="2">
                        <Label className="mb-1 text-muted fw-bold" style={{ fontSize: "0.85rem" }}>GST Group</Label>
                        <Input
                          type="select"
                          value={filterGstGroup}
                          onChange={(e) => setFilterGstGroup(e.target.value)}
                        >
                          <option value="">All GST Groups</option>
                          {gstGroups.map((g: any) => (
                            <option key={g.Id} value={g.Id}>
                              {g.GSTGroupName || g.Id}
                            </option>
                          ))}
                        </Input>
                      </Col>
                      <Col md="2">
                        <Btn color="success" onClick={loadData} className="w-100">
                          <i className="fa fa-refresh me-2" />
                          Refresh
                        </Btn>
                      </Col>
                      <Col md="2">
                        <Btn color="primary" onClick={handleAdd} className="w-100">
                          <i className="fa fa-plus me-2" />
                          Add Item
                        </Btn>
                      </Col>
                    </Row>
                  </div>

                  {(() => {
                    const totalPages = Math.ceil(filteredList.length / itemsPerPage);
                    const currentItems = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                    
                    return state.isProgress ? (
                      <div className="text-center py-5">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="table-responsive">
                      <Table bordered hover>
                        <thead className="table-light">
                          <tr>
                            <th>Variant / Info</th>
                            <th>Length</th>
                            <th>Width</th>
                            <th>Height</th>
                            <th>Weight</th>
                            <th>Unit Val</th>
                            <th>Price</th>
                            <th>Barcode</th>
                            <th>Stock</th>
                            <th>Photos</th>
                            <th>Video Link</th>
                            <th style={{ width: 100 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredList.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-4">
                                No records found.
                              </td>
                            </tr>
                          ) : (
                            currentItems.map((item: any, index: number) => {
                              const absoluteIndex = (currentPage - 1) * itemsPerPage + index;
                              let parsedDesign: any[] = [];
                              try {
                                if (typeof item.DesignDetails === "string") {
                                  parsedDesign = JSON.parse(item.DesignDetails || "[]");
                                } else if (Array.isArray(item.DesignDetails)) {
                                  parsedDesign = item.DesignDetails;
                                }
                              } catch (e) {
                                // ignore parse errors
                              }
                              
                              return (
                                <React.Fragment key={item?.Id ?? index}>
                                  {/* Item Master Header Row */}
                                  <tr className="table-primary">
                                    <td colSpan={11}>
                                      <Btn 
                                        color="primary" 
                                        outline 
                                        size="sm" 
                                        className="me-2 px-2 py-0 rounded-circle" 
                                        style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                        onClick={() => toggleRow(String(item?.Id ?? index))}
                                        title={expandedRows[String(item?.Id ?? index)] ? "Collapse" : "Expand"}
                                      >
                                        <i className={`fa ${expandedRows[String(item?.Id ?? index)] ? "fa-chevron-down" : "fa-chevron-right"}`} />
                                      </Btn>
                                      <strong>#{absoluteIndex + 1} - {item?.ItemName || "-"}</strong>
                                      <span className="mx-2">|</span>
                                      <strong>HSN:</strong> {item?.HSNCode || "-"}
                                      <span className="mx-2">|</span>
                                      <strong>Has Size:</strong> {item?.HasSize ? "Yes" : "No"}
                                      <span className="mx-2">|</span>
                                      <strong>Category:</strong> {
                                        categories.find(c => String(c.Id) === String(item?.F_CategoryMaster))?.Name 
                                        ?? categories.find(c => String(c.Id) === String(item?.F_CategoryMaster))?.GroupName 
                                        ?? item?.F_CategoryMaster 
                                        ?? "-"
                                      }
                                      <span className="mx-2">|</span>
                                      <strong>GST:</strong> {
                                        gstGroups.find(g => String(g.Id) === String(item?.F_GSTGroupMaster))?.GSTGroupName
                                        ?? item?.F_GSTGroupMaster 
                                        ?? "-"
                                      }
                                      <span className="mx-2">|</span>
                                      <strong>Unit:</strong> {
                                        units.find(u => String(u.Id) === String(item?.F_UnitMaster))?.UnitName
                                        ?? item?.F_UnitMaster 
                                        ?? "-"
                                      }
                                    </td>
                                    <td>
                                      <Btn color="info" size="sm" className="me-2" onClick={() => handlePrintBarcodes(item)} title="Print Barcodes">
                                        <i className="fa fa-print" />
                                      </Btn>
                                      <Btn color="primary" size="sm" className="me-2" onClick={() => handleEdit(item?.Id)} title="Edit Item">
                                        <i className="fa fa-edit" />
                                      </Btn>
                                      <Btn color="danger" size="sm" onClick={() => handleDelete(item?.Id)} title="Delete Item">
                                        <i className="fa fa-trash" />
                                      </Btn>
                                    </td>
                                  </tr>
                                  
                                  {/* Item Design Master Variant Rows */}
                                  {expandedRows[String(item?.Id ?? index)] && (
                                    parsedDesign.length === 0 ? (
                                      <tr>
                                        <td colSpan={12} className="text-center text-muted py-2">
                                          No variants available for this item.
                                        </td>
                                      </tr>
                                    ) : (
                                      parsedDesign.map((d: any, dIdx: number) => {
                                      const images = [
                                        d.DesignPhoto,
                                        d.DesignPhoto2,
                                        d.DesignPhoto3,
                                        d.DesignPhoto4,
                                        d.DesignPhoto5
                                      ].filter(img => img && img.trim() !== "");

                                      return (
                                        <tr key={d.Id || dIdx}>
                                          <td className="ps-4">Variant {dIdx + 1}</td>
                                          <td>{d.Length || "-"}</td>
                                          <td>{d.Width || "-"}</td>
                                          <td>{d.Height || "-"}</td>
                                          <td>{d.Weight || "-"}</td>
                                          <td>{d.UnitConversion || "-"}</td>
                                          <td>₹{d.SalePrice || "0"}</td>
                                          <td>
                                            {d.Barcode && d.Barcode.trim() !== "" ? (
                                              <div style={{ width: '100%', minWidth: '120px' }}>
                                                <style>{`.im-barcode-svg-${d.Id || dIdx} svg { width: 100% !important; height: auto !important; max-height: 80px; }`}</style>
                                                <div className={`im-barcode-svg-${d.Id || dIdx}`}>
                                                  <Barcode value={d.Barcode} width={2} height={60} displayValue={true} fontSize={16} margin={0} background="transparent" />
                                                </div>
                                              </div>
                                            ) : (
                                              "-"
                                            )}
                                          </td>
                                          <td>{d.OpeningStock || "0"}</td>
                                          <td>
                                            <div className="d-flex flex-wrap gap-2">
                                              {images.map((img: string, i: number) => (
                                                <a href={img} target="_blank" rel="noopener noreferrer" key={i}>
                                                  <img 
                                                    src={img} 
                                                    alt={`img-${i}`} 
                                                    style={{ width: 45, height: 45, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd', cursor: 'pointer' }} 
                                                    title="Click to view full size"
                                                  />
                                                </a>
                                              ))}
                                              {images.length === 0 && <span className="text-muted small">No photos</span>}
                                            </div>
                                          </td>
                                          <td>
                                            {d.VideoLink && d.VideoLink.trim() !== "" ? (
                                              activeVideo === (d.Id || dIdx) ? (
                                                <div>
                                                  <iframe 
                                                    src={getEmbedUrl(d.VideoLink)} 
                                                    style={{ width: "200px", height: "120px", border: "none", borderRadius: "4px" }} 
                                                    allowFullScreen
                                                    title={`Video-${d.Id}`}
                                                  />
                                                  <div className="mt-1">
                                                    <Btn color="secondary" size="xs" onClick={() => setActiveVideo(null)} style={{ padding: "0.1rem 0.3rem", fontSize: "0.7rem" }}>
                                                      Close Video
                                                    </Btn>
                                                  </div>
                                                </div>
                                              ) : (
                                                <span 
                                                  className="text-primary text-decoration-underline" 
                                                  style={{ cursor: 'pointer' }}
                                                  onClick={() => setActiveVideo(d.Id || dIdx)}
                                                >
                                                  View Video
                                                </span>
                                              )
                                            ) : (
                                              <span className="text-muted">-</span>
                                            )}
                                          </td>
                                          <td></td>
                                        </tr>
                                      );
                                    })
                                  ))}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                      </Table>
                    </div>
                          
                    {totalPages > 0 && (
                      <div className="d-flex justify-content-between align-items-center mt-3 p-2 bg-light rounded border">
                        <div className="d-flex align-items-center flex-wrap gap-2">
                          <div className="text-muted small">
                            Showing {filteredList.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length} items
                          </div>
                          <div className="d-flex align-items-center ms-0 ms-md-3">
                            <Label className="mb-0 me-2 small text-muted text-nowrap">Rows:</Label>
                            <Input
                              type="number"
                              bsSize="sm"
                              min="1"
                              max="20"
                              value={itemsPerPage || ""}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                  setItemsPerPage(Math.min(20, Math.max(1, val)));
                                  setCurrentPage(1);
                                } else {
                                  setItemsPerPage(10);
                                  setCurrentPage(1);
                                }
                              }}
                              style={{ width: "70px" }}
                            />
                          </div>
                        </div>
                        <Pagination className="mb-0">
                          <PaginationItem disabled={currentPage === 1}>
                            <PaginationLink previous onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} />
                          </PaginationItem>
                          {[...Array(totalPages)].map((_, i) => {
                            if (i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 2 && i + 1 <= currentPage + 2)) {
                              return (
                                <PaginationItem active={i + 1 === currentPage} key={i}>
                                  <PaginationLink onClick={() => setCurrentPage(i + 1)}>
                                    {i + 1}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                            if (i + 1 === currentPage - 3 || i + 1 === currentPage + 3) {
                              return <PaginationItem disabled key={i}><PaginationLink>...</PaginationLink></PaginationItem>;
                            }
                            return null;
                          })}
                          <PaginationItem disabled={currentPage === totalPages}>
                            <PaginationLink next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} />
                          </PaginationItem>
                        </Pagination>
                      </div>
                    )}
                      </>
                    );
                  })()}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

    </>
  );
};

export default PageList_ItemMaster;

