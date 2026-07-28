import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Row, Table, Modal, ModalHeader, ModalBody, FormGroup, Label } from "reactstrap";
import { toast } from "react-toastify";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/BarcodeTemplateMaster/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/BarcodeTemplateMaster`;

interface TemplateRecord {
  Id: number;
  Name: string; // Serialized JSON string of the template
  UserId?: number;
}

interface TemplateListState {
  BarcodeTemplateList: TemplateRecord[];
  isProgress: boolean;
  filterText: string;
}

const PageList_BarcodeTemplate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<TemplateListState>({
    BarcodeTemplateList: [],
    isProgress: true,
    filterText: "",
  });

  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));
    Fn_FillListData(dispatch, setState as any, "BarcodeTemplateList", LIST_API_URL)
      .catch((error) => {
        console.error("Failed to load barcode templates:", error);
        setState((prev) => ({ ...prev, BarcodeTemplateList: [], isProgress: false }));
      });
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [localPrinters, setLocalPrinters] = useState<string[]>([]);
  const [selectedLocalPrinter, setSelectedLocalPrinter] = useState(() => {
    return localStorage.getItem("barcodePrinterName") || "";
  });
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTemplate, setPrintTemplate] = useState<any>(null);
  const [printQty, setPrintQty] = useState(1);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const checkPrinters = async () => {
      try {
        const r = await fetch("http://127.0.0.1:9187/printers");
        if (r.ok) {
          const d = await r.json();
          const list: string[] = d.printers || [];
          setLocalPrinters(list);
          if (list.length > 0 && !localStorage.getItem("barcodePrinterName")) {
            setSelectedLocalPrinter(d.defaultPrinter || list[0]);
            localStorage.setItem("barcodePrinterName", d.defaultPrinter || list[0]);
          }
        }
      } catch (e) {}
    };
    checkPrinters();
  }, []);

  const buildTsplForPrint = (template: any, quantity: number) => {
    const dots = 8;
    const { labelW, labelH, columns, rowGap, elements } = template;
    const singleLabelW = labelW / columns;
    
    const queue = Array(quantity).fill({
      barcode: "89012345",
      itemName: "Demo Gold Ring 22K",
      sizeName: "18",
      salePrice: "75000"
    });

    let cmd = "";
    for (let i = 0; i < queue.length; i += columns) {
      const row = queue.slice(i, i + columns);
      cmd += `SIZE ${labelW} mm, ${labelH} mm\nGAP ${rowGap} mm, 0 mm\nDIRECTION 1\nCLS\n`;

      row.forEach((label: any, colIdx: number) => {
        const colXmm = colIdx * singleLabelW;

        if (Array.isArray(elements)) {
          elements.forEach((el: any) => {
            let val = el.value || "";
            val = val.replace(/\{\{FirmName\}\}/g, "DEMO JEWELLERS");
            val = val.replace(/\{\{ItemName\}\}/g, label.itemName);
            val = val.replace(/\{\{SalePrice\}\}/g, label.salePrice);
            val = val.replace(/\{\{Barcode\}\}/g, label.barcode);
            val = val.replace(/\{\{SizeName\}\}/g, label.sizeName);

            const actualXmm = colXmm + el.x;
            const actualYmm = el.y;

            const xDots = Math.round(actualXmm * dots);
            const yDots = Math.round(actualYmm * dots);

            if (el.type === "text") {
              const font = String(el.fontSize || 2);
              const rotation = el.rotation || 0;
              const align = el.alignment || 1;
              if (align > 1) {
                cmd += `TEXT ${xDots}, ${yDots}, "${font}", ${rotation}, 1, 1, ${align}, "${val}"\n`;
              } else {
                cmd += `TEXT ${xDots}, ${yDots}, "${font}", ${rotation}, 1, 1, "${val}"\n`;
              }
            } else if (el.type === "barcode") {
              const bh = Math.round(el.h * dots);
              const rotation = el.rotation || 0;
              const scale = el.barcodeScale || 2;
              const showText = el.showText ? 1 : 0;
              cmd += `BARCODE ${xDots}, ${yDots}, "128", ${bh}, ${showText}, ${rotation}, ${scale}, ${scale}, "${val}"\n`;
            } else if (el.type === "line") {
              const lwDots = Math.round(el.w * dots);
              const lhDots = Math.round(el.h * dots);
              cmd += `BAR ${xDots}, ${yDots}, ${lwDots}, ${lhDots}\n`;
            }
          });
        }
      });

      cmd += `PRINT 1\n\n`;
    }
    return cmd;
  };

  const handleOpenPrintModal = (template: any) => {
    setPrintTemplate(template);
    setPrintQty(1);
    setIsPrintModalOpen(true);
  };

  const handleTestPrint = async () => {
    if (!selectedLocalPrinter) {
      toast.error("Please select a local printer first.");
      return;
    }
    if (!printTemplate) return;

    setPrinting(true);
    const tspl = buildTsplForPrint(printTemplate, printQty);

    try {
      const response = await fetch("http://127.0.0.1:9187/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tspl, printerName: selectedLocalPrinter.trim() })
      });
      const d = await response.json();
      if (response.ok && d.success) {
        toast.success("✅ Test barcode printed successfully!");
        setIsPrintModalOpen(false);
      } else {
        toast.error(`Print Error: ${d.error || "Failed to print"}`);
      }
    } catch (err) {
      toast.error("Cannot connect to Local Print Agent. Make sure it is running.");
    } finally {
      setPrinting(false);
    }
  };

  const handleAdd = () => {
    navigate("/addEditBarcodeTemplate", { state: { Id: 0 } });
  };

  const handleEdit = (id: number | string) => {
    if (!id) return;
    navigate("/addEditBarcodeTemplate", { state: { Id: id } });
  };

  const handleDelete = (id: number | string) => {
    if (!id) return;
    const itemToDelete = state.BarcodeTemplateList.find(
      (item) => String(item?.Id) === String(id)
    );
    let name = "this template";
    try {
      if (itemToDelete) {
        const parsed = typeof itemToDelete.Name === "string" ? JSON.parse(itemToDelete.Name) : (itemToDelete.Name || {});
        name = parsed.name || name;
      }
    } catch (e) {}

    if (window.confirm(`Are you sure you want to delete '${name}'?`)) {
      Fn_DeleteData(dispatch, setState as any, Number(id), DELETE_API_URL, LIST_API_URL)
        .then(() => {
          loadData();
        })
        .catch((error) => {
          console.error("Failed to delete barcode template:", error);
          toast.error("Failed to delete barcode template from database.");
        });
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((prev) => ({
      ...prev,
      filterText: value,
    }));
  };

  const parsedTemplates = useMemo(() => {
    const list = Array.isArray(state.BarcodeTemplateList) ? state.BarcodeTemplateList : [];
    return list.map((record) => {
      let parsed = {
        name: "Unknown Template",
        labelW: 50,
        labelH: 25,
        columns: 1,
        elementsCount: 0,
      };
      try {
        const data = typeof record.Name === "string" ? JSON.parse(record.Name) : (record.Name || {});
        parsed = {
          name: data.name || parsed.name,
          labelW: data.labelW || parsed.labelW,
          labelH: data.labelH || parsed.labelH,
          columns: data.columns || parsed.columns,
          elementsCount: Array.isArray(data.elements) ? data.elements.length : 0,
        };
      } catch (e) {}
      return {
        ...record,
        parsed,
      };
    });
  }, [state.BarcodeTemplateList]);

  const filteredList = useMemo(() => {
    const query = state.filterText.toLowerCase().trim();
    if (!query) return parsedTemplates;
    return parsedTemplates.filter(
      (item) => item.parsed.name.toLowerCase().includes(query)
    );
  }, [parsedTemplates, state.filterText]);

  return (
    <>
      <div className="page-body">
        <Container fluid>
          <Breadcrumbs mainTitle="Barcode Template Master" parent="Masters" />
        <Row>
          <Col sm="12">
            <Card className="border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <CardHeaderCommon title="Barcode Template List" tagClass="card-title mb-0" />
              <CardBody className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <Input
                      type="text"
                      className="form-control-sm"
                      placeholder="Search templates..."
                      style={{ maxWidth: 260 }}
                      value={state.filterText}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <Btn color="primary" className="btn-sm" onClick={handleAdd}>
                    <i className="fa fa-plus me-1" /> Add Template
                  </Btn>
                </div>

                <div className="table-responsive">
                  <Table bordered hover striped className="align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th style={{ width: 60 }} className="text-center">Sr.</th>
                        <th>Template Name</th>
                        <th style={{ width: 150 }} className="text-center">Dimensions</th>
                        <th style={{ width: 120 }} className="text-center">Columns</th>
                        <th style={{ width: 120 }} className="text-center">Elements</th>
                        <th style={{ width: 120 }} className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredList.map((item, index) => (
                        <tr key={item.Id}>
                          <td className="text-center">{index + 1}</td>
                          <td><strong>{item.parsed.name}</strong></td>
                          <td className="text-center">{item.parsed.labelW} × {item.parsed.labelH} mm</td>
                          <td className="text-center">{item.parsed.columns} Col{item.parsed.columns > 1 ? "s" : ""}</td>
                          <td className="text-center">{item.parsed.elementsCount}</td>
                          <td className="text-center">
                            <div className="d-flex gap-2 justify-content-center">
                              <Btn color="success" className="btn-xs px-2 py-1" onClick={() => handleOpenPrintModal({ ...item.parsed, id: String(item.Id) })} title="Test Print Template">
                                <i className="fa fa-print" />
                              </Btn>
                              <Btn color="info" className="btn-xs px-2 py-1" onClick={() => handleEdit(item.Id)}>
                                <i className="fa fa-edit" />
                              </Btn>
                              <Btn color="danger" className="btn-xs px-2 py-1" onClick={() => handleDelete(item.Id)}>
                                <i className="fa fa-trash" />
                              </Btn>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-5 text-muted">
                            <i className="fa fa-info-circle fa-2x mb-2 d-block" />
                            No barcode templates found. Click <strong>Add Template</strong> to design one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
        </Container>
      </div>

      {/* Test Print Modal */}
      <Modal isOpen={isPrintModalOpen} toggle={() => setIsPrintModalOpen(false)} centered style={{ color: "#212529" }}>
        <ModalHeader toggle={() => setIsPrintModalOpen(false)} className="bg-primary text-white py-3 fw-bold">
          <i className="fa fa-print me-2" /> Test Print Barcode Template
        </ModalHeader>
        <ModalBody className="p-4">
          {printTemplate && (
            <>
              <div className="mb-3 p-3 bg-light rounded border">
                <div style={{ fontSize: "14px" }} className="mb-1"><strong>Template Name:</strong> {printTemplate.name}</div>
                <div style={{ fontSize: "13px" }}><strong>Label Size:</strong> {printTemplate.labelW} × {printTemplate.labelH} mm</div>
              </div>

              <FormGroup className="mb-3">
                <Label className="fw-bold small">Select Local Printer</Label>
                <Input type="select" value={selectedLocalPrinter} onChange={(e) => {
                  setSelectedLocalPrinter(e.target.value);
                  localStorage.setItem("barcodePrinterName", e.target.value);
                }}>
                  <option value="">-- Choose Printer --</option>
                  {localPrinters.map((p, idx) => (
                    <option key={idx} value={p}>{p}</option>
                  ))}
                </Input>
                {localPrinters.length === 0 && (
                  <small className="text-danger mt-1 d-block"><i className="fa fa-warning me-1" />No local printer detected. Please launch the Print Agent.</small>
                )}
              </FormGroup>

              <FormGroup className="mb-3">
                <Label className="fw-bold small">Print Quantity</Label>
                <Input type="number" min="1" max="100" value={printQty} onChange={(e) => setPrintQty(Math.max(1, parseInt(e.target.value) || 1))} />
              </FormGroup>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Btn color="secondary" size="sm" onClick={() => setIsPrintModalOpen(false)}>Cancel</Btn>
                <Btn color="success" size="sm" onClick={handleTestPrint} disabled={printing || !selectedLocalPrinter}>
                  {printing ? <><i className="fa fa-spinner fa-spin me-1" /> Printing...</> : <><i className="fa fa-print me-1" /> Print Dummy</>}
                </Btn>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default PageList_BarcodeTemplate;
