import React, { useRef } from "react";
import { Col, Row } from "reactstrap";

const tableStyles = `
  .po-grid-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-left: -0.25rem;
    margin-right: -0.25rem;
  }
  .po-grid-wrap .po-table {
    min-width: 800px;
    margin-bottom: 0;
  }
  .po-table th:nth-child(1), .po-table td:nth-child(1) { width: 5%; min-width: 40px; text-align: center; }
  .po-table th:nth-child(2), .po-table td:nth-child(2) { width: 10%; min-width: 80px; }
  .po-table th:nth-child(3), .po-table td:nth-child(3) { width: 12%; min-width: 100px; }
  .po-table th:nth-child(4), .po-table td:nth-child(4) { width: 11%; min-width: 95px; }
  .po-table th:nth-child(5), .po-table td:nth-child(5) { width: 11%; min-width: 95px; }
  .po-table th:nth-child(6), .po-table td:nth-child(6) { width: 10%; min-width: 85px; }
  .po-table th:nth-child(7), .po-table td:nth-child(7) { width: 12%; min-width: 100px; text-align: right; }
  .po-table th:nth-child(8), .po-table td:nth-child(8) { width: 12%; min-width: 100px; text-align: right; display: none; }
  .po-table th:nth-child(9), .po-table td:nth-child(9) { width: 8%; min-width: 65px; text-align: center; }
  
  @media (max-width: 991.98px) {
    .po-grid-wrap .po-table { min-width: 750px; }
    .po-table th, .po-table td { padding: 0.28rem 0.2rem; font-size: 0.8rem; }
    .po-table .form-control { font-size: 0.8rem; padding: 0.22rem 0.3rem; min-height: 26px; height: auto; }
    .po-table .btn-sm { padding: 0.2rem 0.35rem; min-width: 28px; font-size: 0.75rem; }
  }
  @media (max-width: 767.98px) {
    .po-grid-wrap .po-table { min-width: 700px; }
    .po-table th, .po-table td { padding: 0.2rem 0.15rem; font-size: 0.7rem; }
    .po-table .form-control { font-size: 0.7rem; padding: 0.15rem 0.25rem; min-height: 22px; height: auto; }
    .po-table .btn-sm { padding: 0.15rem 0.28rem; min-width: 26px; font-size: 0.7rem; }
  }
`;

interface GridRow {
  ItemCode: string;
  F_ItemGroup: string;
  F_ItemMaster: string;
  F_ColorMaster?: string;
  Qty: string;
  Rate: string;
  ItemData: any[] | null;
}

interface GridSystemPOProps {
  gridRows: GridRow[];
  itemGroupMaster: any[];
  colorMaster?: any[];
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onUpdateRow: (index: number, field: string, value: any) => void;
  onQuickAddItem?: (rowIndex: number) => void;
  disabled?: boolean;
  saveButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

const GridSystemPO: React.FC<GridSystemPOProps> = ({
  gridRows,
  itemGroupMaster,
  colorMaster = [],
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  onQuickAddItem,
  disabled = false,
  saveButtonRef = null,
}) => {
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null }>({});

  const handleKeyDown = (event: React.KeyboardEvent, rowIndex: number, fieldName: string) => {
    if (disabled) return;
    
    if (event.key === "Enter") {
      event.preventDefault();

      if (fieldName === "Qty") {
        const row = gridRows[rowIndex] || {};
        const hasItem = !!row.F_ItemMaster;
        const qtyVal = parseFloat(row.Qty);
        const hasQty = !isNaN(qtyVal) && qtyVal > 0;

        if (!hasItem || !hasQty) {
          const missing = [];
          if (!hasItem) missing.push("Item");
          if (!hasQty) missing.push("Quantity");
          alert(`Row ${rowIndex + 1}: Please fill ${missing.join(", ")}`);

          if (!hasItem) {
            const ref = inputRefs.current[`${rowIndex}-F_ItemMaster`];
            ref?.focus();
          } else {
            const ref = inputRefs.current[`${rowIndex}-Qty`];
            ref?.focus();
          }
          return;
        }

        const addButtonRef = inputRefs.current[`${rowIndex}-AddButton`];
        if (addButtonRef) {
          addButtonRef.focus();
        }
      } else if (fieldName === "AddButton") {
        onAddRow();
        setTimeout(() => {
          const newRowIndex = gridRows.length;
          const newRowFirstRef = inputRefs.current[`${newRowIndex}-ItemCode`];
          if (newRowFirstRef) {
            newRowFirstRef.focus();
          }
        }, 150);
      } else {
        let nextFieldName = "";

        if (fieldName === "ItemCode") {
          nextFieldName = "F_ItemGroup";
        } else if (fieldName === "F_ItemGroup") {
          nextFieldName = "F_ItemMaster";
        } else if (fieldName === "F_ItemMaster") {
          nextFieldName = "F_ColorMaster";
        } else if (fieldName === "F_ColorMaster") {
          nextFieldName = "Qty";
        } else if (fieldName === "Qty") {
          const addButtonRef = inputRefs.current[`${rowIndex}-AddButton`];
          if (addButtonRef) {
            addButtonRef.focus();
          }
          return;
        }

        const nextRef = inputRefs.current[`${rowIndex}-${nextFieldName}`];
        if (nextRef) {
          nextRef.focus();
        }
      }
    }
  };

  const setInputRef = (ref: any, rowIndex: number, fieldName: string) => {
    inputRefs.current[`${rowIndex}-${fieldName}`] = ref;
  };

  return (
    <>
      <style>{tableStyles}</style>
      <Row className="mb-3">
        <Col xs="12">
          <div className="table-responsive po-grid-wrap">
            <table className="table table-bordered table-striped po-table">
              <thead>
                <tr>
                  <th>Sr.No.</th>
                  <th>Add Item</th>
                  <th>Item Code</th>
                  <th>Item Group</th>
                  <th>Item</th>
                  <th>Color</th>
                  <th style={{ textAlign: "right" }}>Quantity</th>
                  <th style={{ textAlign: "right" }}>Rate</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {gridRows.map((row, index) => (
                  <tr key={index}>
                    <td className="py-0">{index + 1}</td>

                    <td className="py-0">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100"
                        onClick={() => onQuickAddItem && onQuickAddItem(index)}
                        disabled={disabled || !onQuickAddItem}
                        title="Quick add a new item"
                        tabIndex={-1}
                      >
                        <i className="bx bx-plus-medical me-1"></i>
                        Add Item
                      </button>
                    </td>

                    <td className="py-0">
                      <input
                        ref={(ref) => setInputRef(ref, index, "ItemCode")}
                        type="text"
                        className="form-control"
                        value={row.ItemCode}
                        onChange={(e) => {
                          onUpdateRow(index, "ItemCode", e.target.value);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index, "ItemCode")}
                        data-row={index}
                        data-field="ItemCode"
                        disabled={disabled}
                        placeholder="Item Code"
                      />
                    </td>

                    <td className="py-0">
                      <select
                        ref={(ref) => setInputRef(ref, index, "F_ItemGroup")}
                        className="form-control"
                        value={row.F_ItemGroup}
                        onChange={(e) => onUpdateRow(index, "F_ItemGroup", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, "F_ItemGroup")}
                        data-row={index}
                        data-field="F_ItemGroup"
                        disabled={disabled}
                      >
                        <option value="">Select Item Group</option>
                        {itemGroupMaster &&
                          itemGroupMaster.map((item: any) => (
                            <option key={item.Id} value={item.Id}>
                              {item.Name || item.GroupName}
                            </option>
                          ))}
                      </select>
                    </td>

                    <td className="py-0">
                      <select
                        ref={(ref) => setInputRef(ref, index, "F_ItemMaster")}
                        className="form-control"
                        value={row.F_ItemMaster}
                        onChange={(e) => onUpdateRow(index, "F_ItemMaster", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, "F_ItemMaster")}
                        data-row={index}
                        data-field="F_ItemMaster"
                        disabled={disabled}
                      >
                        <option value="">Select Item</option>
                        {row.ItemData &&
                          row.ItemData.map((item: any) => (
                            <option key={item.Id} value={item.Id}>
                              {item.ItemName || item.Name}
                            </option>
                          ))}
                      </select>
                    </td>

                    <td className="py-0">
                      <select
                        ref={(ref) => setInputRef(ref, index, "F_ColorMaster")}
                        className="form-control"
                        value={row.F_ColorMaster || ""}
                        onChange={(e) => onUpdateRow(index, "F_ColorMaster", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, "F_ColorMaster")}
                        data-row={index}
                        data-field="F_ColorMaster"
                        disabled={disabled}
                      >
                        <option value="">Select Color</option>
                        {colorMaster && colorMaster.map((color: any) => (
                          <option key={color.Id} value={color.Id}>
                            {color.Name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-0" style={{ textAlign: "right" }}>
                      <input
                        ref={(ref) => setInputRef(ref, index, "Qty")}
                        type="number"
                        className="form-control"
                        style={{ textAlign: "right", width: "100%", minWidth: "75px" }}
                        value={row.Qty}
                        onChange={(e) => onUpdateRow(index, "Qty", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, "Qty")}
                        data-row={index}
                        data-field="Qty"
                        disabled={disabled}
                        placeholder="Qty"
                        min="1"
                      />
                    </td>

                    <td className="py-0" style={{ textAlign: "right" }}>
                      <input
                        ref={(ref) => setInputRef(ref, index, "Rate")}
                        type="number"
                        className="form-control"
                        style={{ textAlign: "right", width: "100%", minWidth: "75px" }}
                        value={row.Rate}
                        onChange={(e) => onUpdateRow(index, "Rate", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, "Rate")}
                        data-row={index}
                        data-field="Rate"
                        disabled={disabled}
                        placeholder="Rate"
                        min="0"
                        step="0.01"
                      />
                    </td>

                    <td className="py-0">
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          ref={(ref) => setInputRef(ref, index, "AddButton")}
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={onAddRow}
                          onKeyDown={(e) => handleKeyDown(e, index, "AddButton")}
                          disabled={disabled}
                          title="Add Row (Press Enter to continue)"
                        >
                       <i className="fa fa-plus"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => onRemoveRow(index)}
                          disabled={disabled || gridRows.length === 1}
                          title="Remove Row"
                          tabIndex={-1}
                        >
                         <i className="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default GridSystemPO;
