import React, { useCallback, useEffect, useMemo, useState } from "react";
import Barcode from 'react-barcode';
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table, Badge } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
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
  const [printQtys, setPrintQtys] = useState<Record<string, number>>({});

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
   * Fetch item list from API.
   */
  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, (prev: any) => (typeof prev === "function" ? prev : prev), "items", LIST_API_URL)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.dataList ?? data?.data?.dataList ?? [];
        setState((prev) => ({ ...prev, ItemMasterList: list, isProgress: false }));
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
  }, [loadData, dispatch]);

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
      Fn_DeleteData(dispatch, () => {}, Number(id), DELETE_API_URL)
        .finally(() => {
          loadData();
        });
    }
  };

  /**
   * Print barcodes for item variants
   */
  const handlePrintBarcodes = (item: any) => {
    let parsedDesign: any[] = [];
    try {
      if (typeof item.DesignDetails === "string") {
        parsedDesign = JSON.parse(item.DesignDetails || "[]");
      } else if (Array.isArray(item.DesignDetails)) {
        parsedDesign = item.DesignDetails;
      }
    } catch (e) {}

    const variantsToPrint = parsedDesign.filter((d: any, dIdx: number) => {
      const qty = printQtys[d.Id || dIdx] || 0;
      return qty > 0 && d.Barcode;
    });

    if (variantsToPrint.length === 0) {
      toast.warning("Please enter print quantity greater than 0 for at least one variant with a barcode.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to print barcodes.");
      return;
    }

    let html = `
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            body { font-family: sans-serif; text-align: center; margin: 0; padding: 0; }
            .no-print { padding: 15px; background: #f8f9fa; border-bottom: 1px solid #ddd; margin-bottom: 20px; }
            .controls { display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
            .control-group { display: flex; align-items: center; gap: 5px; }
            
            #printArea {
              display: grid;
              grid-template-columns: 1fr 1fr;
              justify-items: center;
              gap: 15px 5px;
              padding: 10px;
            }
            
            .barcode-card { 
              border: 1px dashed #999; 
              padding: 5px; 
              border-radius: 4px; 
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
              overflow: hidden;
              background: #fff;
            }
            .barcode-wrapper { margin: 0 auto; }
            .barcode-wrapper svg { width: 100% !important; height: auto !important; }
            
            .item-name { font-weight: bold; font-size: 14px; margin-bottom: 5px; text-align: center; }
            .item-price { font-size: 16px; font-weight: bold; margin-top: 5px; text-align: center; }
            
            @media print {
              @page { margin: 5mm; }
              body { margin: 0; }
              .no-print { display: none !important; }
              /* Force the exact dimensions to be respected during printing */
              .barcode-card { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                border: 1px dashed #ccc; /* Keeps cut guidelines visible in print */
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <div class="controls">
              <div class="control-group">
                <label><strong>Box Width:</strong></label>
                <input type="range" id="boxWidth" min="100" max="600" value="300" oninput="updateStyles()" />
                <span id="lblBW">300px</span>
              </div>
              <div class="control-group">
                <label><strong>Box Height:</strong></label>
                <input type="range" id="boxHeight" min="80" max="400" value="150" oninput="updateStyles()" />
                <span id="lblBH">150px</span>
              </div>
              <div class="control-group">
                <label><strong>Barcode Size:</strong></label>
                <input type="range" id="bcSize" min="50" max="400" value="150" oninput="updateStyles()" />
                <span id="lblBC">150px</span>
              </div>
              <button onclick="window.print()" style="padding: 8px 20px; background: #0d6efd; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Print Now</button>
            </div>
          </div>
          <div id="printArea">
    `;

    variantsToPrint.forEach((d: any, dIdx: number) => {
      const qty = printQtys[d.Id || dIdx] || 0;
      const el = document.querySelector(`.im-barcode-svg-${d.Id || dIdx}`);
      if (el) {
        for (let i = 0; i < qty; i++) {
          html += `<div class="barcode-card" style="width: 300px; height: 150px;">
            <div class="item-name">${item.ItemName} - ${dIdx + 1} ${d.SizeName ? '(' + d.SizeName + ')' : ''}</div>
            <div class="barcode-wrapper" style="width: 150px;">
              ${el.innerHTML}
            </div>
            <div class="item-price">₹${d.SalePrice || "0"}</div>
          </div>`;
        }
      }
    });

    html += `
          </div>
          <script>
            function updateStyles() {
              const bw = document.getElementById('boxWidth').value;
              const bh = document.getElementById('boxHeight').value;
              const bc = document.getElementById('bcSize').value;
              
              document.getElementById('lblBW').innerText = bw + 'px';
              document.getElementById('lblBH').innerText = bh + 'px';
              document.getElementById('lblBC').innerText = bc + 'px';

              document.querySelectorAll('.barcode-card').forEach(el => {
                el.style.width = bw + 'px';
                el.style.height = bh + 'px';
              });

              document.querySelectorAll('.barcode-wrapper').forEach(el => {
                el.style.width = bc + 'px';
              });
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
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
    const searchText = state.filterText.trim().toLowerCase();
    if (!searchText) {
      return rawList;
    }

    return rawList.filter((item) => {
      const fields = [
        item?.ItemName,
        item?.HSNCode,
      ];
      return fields.some((field) => String(field ?? "").toLowerCase().includes(searchText));
    });
  }, [state.ItemMasterList, state.filterText]);

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
                  <Row className="mb-3">
                    <Col md="6" className="d-flex align-items-center">
                      <Label className="me-2 mb-0">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by Item Name, HSN Code..."
                        value={state.filterText}
                        onChange={handleSearchChange}
                      />
                    </Col>
                    <Col md="6" className="text-end">
                      <Btn color="primary" onClick={handleAdd}>
                        <i className="fa fa-plus me-2" />
                        Add New Item
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
                      <Table bordered hover>
                        <thead className="table-light">
                          <tr>
                            <th>Variant / Info</th>
                            <th>Size</th>
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
                            filteredList.map((item: any, index: number) => {
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
                                    <td colSpan={7}>
                                      <strong>#{index + 1} - {item?.ItemName || "-"}</strong>
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
                                      <span className="mx-2">|</span>
                                      <strong>Alter Unit:</strong> {
                                        alterUnits.find(a => String(a.Id) === String(item?.F_AlterUnitMaster))?.AlterUnitName
                                        ?? item?.F_AlterUnitMaster 
                                        ?? "-"
                                      }
                                      <span className="mx-2">|</span>
                                      <strong>Conv:</strong> {item?.UnitConversion || "-"}
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
                                  {parsedDesign.length === 0 ? (
                                    <tr>
                                      <td colSpan={8} className="text-center text-muted py-2">
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
                                          <td>{d.SizeName || "-"}</td>
                                          <td>₹{d.SalePrice || "0"}</td>
                                          <td>
                                            {d.Barcode && d.Barcode.trim() !== "" ? (
                                              <div style={{ width: '100%', minWidth: '120px' }}>
                                                <style>{`.im-barcode-svg-${d.Id || dIdx} svg { width: 100% !important; height: auto !important; max-height: 80px; }`}</style>
                                                <div className={`im-barcode-svg-${d.Id || dIdx}`}>
                                                  <Barcode value={d.Barcode} width={2} height={60} displayValue={true} fontSize={16} margin={0} background="transparent" />
                                                </div>
                                                <div className="mt-2 d-flex align-items-center justify-content-center">
                                                  <Label className="me-2 mb-0" style={{fontSize: '12px'}}>Print Qty:</Label>
                                                  <Input 
                                                    type="number" 
                                                    min="0" 
                                                    bsSize="sm"
                                                    value={printQtys[d.Id || dIdx] || ""} 
                                                    onChange={(e) => setPrintQtys(prev => ({ ...prev, [d.Id || dIdx]: parseInt(e.target.value) || 0 }))}
                                                    style={{ width: '60px' }}
                                                  />
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
                                  )}
                                </React.Fragment>
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

export default PageList_ItemMaster;

