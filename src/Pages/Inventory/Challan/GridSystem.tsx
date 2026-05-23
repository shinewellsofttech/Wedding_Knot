import React, { useRef } from "react";
import { Col, Row } from "reactstrap";

const tableStyles = `
  .sales-invoice-grid-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-left: -0.25rem;
    margin-right: -0.25rem;
  }
  .sales-invoice-grid-wrap .si-table {
    min-width: 1150px;
    margin-bottom: 0;
  }
  .si-table th:nth-child(1), .si-table td:nth-child(1) { width: 5%; min-width: 40px; text-align: center; }
  .si-table th:nth-child(2), .si-table td:nth-child(2) { width: 10%; min-width: 80px; }
  .si-table th:nth-child(3), .si-table td:nth-child(3) { width: 11%; min-width: 90px; }
  .si-table th:nth-child(4), .si-table td:nth-child(4) { width: 11%; min-width: 90px; }
  .si-table th:nth-child(5), .si-table td:nth-child(5) { width: 12%; min-width: 100px; }
  .si-table th:nth-child(6), .si-table td:nth-child(6) { width: 10%; min-width: 85px; }
  .si-table th:nth-child(7), .si-table td:nth-child(7) { width: 10%; min-width: 85px; }
  .si-table th:nth-child(8), .si-table td:nth-child(8) { width: 9%; min-width: 75px; text-align: right; }
  .si-table th:nth-child(9), .si-table td:nth-child(9) { width: 10%; min-width: 80px; text-align: right; }
  .si-table th:nth-child(10), .si-table td:nth-child(10) { width: 8%; min-width: 65px; text-align: center; }
  
  @media (max-width: 991.98px) {
    .sales-invoice-grid-wrap .si-table { min-width: 950px; }
    .si-table th, .si-table td { padding: 0.28rem 0.2rem; font-size: 0.8rem; }
    .si-table .form-control { font-size: 0.8rem; padding: 0.22rem 0.3rem; min-height: 26px; height: auto; }
    .si-table .btn-sm { padding: 0.2rem 0.35rem; min-width: 28px; font-size: 0.75rem; }
  }
  @media (max-width: 767.98px) {
    .sales-invoice-grid-wrap .si-table { min-width: 900px; }
    .si-table th, .si-table td { padding: 0.2rem 0.15rem; font-size: 0.7rem; }
    .si-table .form-control { font-size: 0.7rem; padding: 0.15rem 0.25rem; min-height: 22px; height: auto; }
    .si-table .btn-sm { padding: 0.15rem 0.28rem; min-width: 26px; font-size: 0.7rem; }
  }
`;

interface GridRow {
  ItemCode: string;
  F_ItemGroupMaster: string;
  F_ItemMaster: string;
  F_ColorMaster?: string;
  F_WarehouseMaster: string;
  F_BatchMaster?: string;
  Qty: string;
  Rate: string;
  ItemData: any[] | null;
  AvailableQty?: number;
}

interface GridSystemSalesInvoiceProps {
  gridRows: GridRow[];
  itemGroupMaster: any[];
  itemMaster?: any[];
  colorMaster?: any[];
  warehouseMaster?: any[];
  batchMaster?: any[];
  isBatchAllowed?: boolean;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onUpdateRow: (index: number, field: string, value: any) => void;
  disabled?: boolean;
  saveButtonRef?: React.RefObject<HTMLButtonElement | null> | null;
  defaultColor?: any | null;
  itemColorApplyMap?: Record<string | number, boolean>;
  onQuickAddItem?: ((rowIndex: number) => void) | null;
}

const GridSystemSalesInvoice: React.FC<GridSystemSalesInvoiceProps> = ({
  gridRows,
  itemGroupMaster,
  itemMaster = [],
  colorMaster = [],
  warehouseMaster = [],
  batchMaster = [],
  isBatchAllowed = false,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  disabled = false,
  saveButtonRef = null,
  defaultColor = null,
  itemColorApplyMap = {},
  onQuickAddItem = null,
}) => {
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null>>({});
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleKeyDown = (event: React.KeyboardEvent, rowIndex: number, fieldName: string) => {
    if (disabled) return;
    if (event.key === 'Enter') {
      event.preventDefault();

      if (fieldName === 'Rate') {
        const row = gridRows[rowIndex] || {};
        const hasItem = !!row.F_ItemMaster;
        const itemRequiresColor = itemColorApplyMap[row.F_ItemMaster] !== false;
        const hasColor = itemRequiresColor ? !!row.F_ColorMaster : true;
        const hasWarehouse = !!row.F_WarehouseMaster;
        const hasBatch = isBatchAllowed ? !!row.F_BatchMaster : true;
        const qtyVal = parseFloat(row.Qty);
        const hasQty = !isNaN(qtyVal) && qtyVal > 0;
        const rateVal = parseFloat(row.Rate);
        const hasRate = !isNaN(rateVal) && rateVal >= 0;

        if (!hasItem || !hasQty || !hasWarehouse || !hasColor || !hasRate || !hasBatch) {
          let message = 'Please fill: ';
          const missing = [];
          if (!hasItem) missing.push('Item');
          if (!hasWarehouse) missing.push('Warehouse');
          if (itemRequiresColor && !hasColor) missing.push('Color');
          if (isBatchAllowed && !hasBatch) missing.push('Batch');
          if (!hasQty) missing.push('Quantity');
          if (!hasRate) missing.push('Rate');
          message += missing.join(', ');
          alert(message);
          return;
        }

        const addButtonRef = buttonRefs.current[`${rowIndex}-AddButton`];
        if (addButtonRef) {
          addButtonRef.focus();
        }
      } else {
        const row = gridRows[rowIndex] || {};
        const itemRequiresColor = itemColorApplyMap[row.F_ItemMaster] !== false;
        let nextFieldName = '';

        if (fieldName === 'ItemCode') {
          nextFieldName = 'F_ItemGroupMaster';
        } else if (fieldName === 'F_ItemGroupMaster') {
          nextFieldName = 'F_ItemMaster';
        } else if (fieldName === 'F_ItemMaster') {
          nextFieldName = itemRequiresColor ? 'F_ColorMaster' : 'F_WarehouseMaster';
        } else if (fieldName === 'F_ColorMaster') {
          nextFieldName = 'F_WarehouseMaster';
        } else if (fieldName === 'F_WarehouseMaster') {
          nextFieldName = isBatchAllowed ? 'F_BatchMaster' : 'Qty';
        } else if (fieldName === 'F_BatchMaster') {
          nextFieldName = 'Qty';
        } else if (fieldName === 'Qty') {
          nextFieldName = 'Rate';
        }

        const nextRef = inputRefs.current[`${rowIndex}-${nextFieldName}`];
        if (nextRef) {
          nextRef.focus();
        }
      }
    }
  };

  const handleButtonKeyDown = (event: React.KeyboardEvent, rowIndex: number, buttonType: string) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      if (buttonType === 'AddButton') {
        const removeButtonRef = buttonRefs.current[`${rowIndex}-RemoveButton`];
        if (removeButtonRef) removeButtonRef.focus();
      } else if (buttonType === 'RemoveButton') {
        const isLastRow = rowIndex === gridRows.length - 1;
        if (isLastRow) {
          const saveButton = saveButtonRef?.current || document.querySelector('button[type="submit"]') || document.querySelector('.si-action-btn');
          if (saveButton) {
            (saveButton as HTMLButtonElement).focus();
            return;
          }
        }
        const nextRowIndex = rowIndex + 1;
        if (nextRowIndex < gridRows.length) {
          const nextItemCodeRef = inputRefs.current[`${nextRowIndex}-ItemCode`];
          if (nextItemCodeRef) nextItemCodeRef.focus();
        }
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (buttonType === 'AddButton') {
        onAddRow();
        setTimeout(() => {
          const newRowIndex = gridRows.length;
          const newItemCodeRef = inputRefs.current[`${newRowIndex}-ItemCode`];
          if (newItemCodeRef) newItemCodeRef.focus();
        }, 150);
      } else if (buttonType === 'RemoveButton') {
        onRemoveRow(rowIndex);
      }
    }
  };

  const setInputRef = (ref: any, rowIndex: number, fieldName: string) => {
    inputRefs.current[`${rowIndex}-${fieldName}`] = ref;
  };

  const setButtonRef = (ref: any, rowIndex: number, buttonType: string) => {
    buttonRefs.current[`${rowIndex}-${buttonType}`] = ref;
  };

  return (
    <>
      <style>{tableStyles}</style>
      <Row className="mb-3">
        <Col xs="12">
          <div className="table-responsive sales-invoice-grid-wrap">
            <table className="table table-bordered table-striped si-table">
              <thead>
                <tr>
                  <th>Sr.No.</th>
                  <th>Add Item</th>
                  <th>Item Code</th>
                  <th>Item Group</th>
                  <th>Item</th>
                  <th>Color</th>
                  <th>Warehouse</th>
                  {isBatchAllowed && <th>Batch</th>}
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Amount</th>
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
                        <i className="fa fa-plus me-1"></i> Add
                      </button>
                    </td>
                    <td className="py-0">
                      <input
                        ref={(ref) => setInputRef(ref, index, 'ItemCode')}
                        type="text"
                        className="form-control"
                        value={row.ItemCode}
                        onChange={(e) => onUpdateRow(index, 'ItemCode', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'ItemCode')}
                        disabled={disabled}
                        placeholder="Code"
                      />
                    </td>
                    <td className="py-0">
                      <select
                        ref={(ref) => setInputRef(ref, index, 'F_ItemGroupMaster')}
                        className="form-control"
                        value={row.F_ItemGroupMaster}
                        onChange={(e) => onUpdateRow(index, 'F_ItemGroupMaster', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'F_ItemGroupMaster')}
                        disabled={disabled}
                      >
                        <option value="">Select Group</option>
                        {itemGroupMaster.map((group: any) => (
                           <option key={group.Id} value={group.Id}>{group.Name || group.GroupName || group.ItemGroupName}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-0">
                      <select
                        ref={(ref) => setInputRef(ref, index, 'F_ItemMaster')}
                        className="form-control"
                        value={row.F_ItemMaster}
                        onChange={(e) => onUpdateRow(index, 'F_ItemMaster', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'F_ItemMaster')}
                        disabled={disabled}
                      >
                        <option value="">Select Item</option>
                        {row.ItemData && row.ItemData.map((item: any) => (
                          <option key={item.Id} value={item.Id}>{item.ItemName || item.Name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-0">
                      <select
                        ref={(ref) => setInputRef(ref, index, 'F_ColorMaster')}
                        className="form-control"
                        value={itemColorApplyMap[row.F_ItemMaster] === false ? defaultColor?.Id || '' : row.F_ColorMaster || ''}
                        onChange={(e) => onUpdateRow(index, 'F_ColorMaster', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'F_ColorMaster')}
                        disabled={disabled || itemColorApplyMap[row.F_ItemMaster] === false}
                      >
                        <option value="">Select Color</option>
                        {colorMaster.map((color: any) => (
                          <option key={color.Id} value={color.Id}>{color.Name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-0">
                      <select
                        ref={(ref) => setInputRef(ref, index, 'F_WarehouseMaster')}
                        className="form-control"
                        value={row.F_WarehouseMaster}
                        onChange={(e) => onUpdateRow(index, 'F_WarehouseMaster', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'F_WarehouseMaster')}
                        disabled={disabled}
                      >
                        <option value="">Select Warehouse</option>
                        {warehouseMaster.map((wh: any) => (
                          <option key={wh.Id} value={wh.Id}>{wh.Name}</option>
                        ))}
                      </select>
                    </td>
                    {isBatchAllowed && (
                      <td className="py-0">
                        <select
                          ref={(ref) => setInputRef(ref, index, 'F_BatchMaster')}
                          className="form-control"
                          value={row.F_BatchMaster || ""}
                          onChange={(e) => onUpdateRow(index, 'F_BatchMaster', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'F_BatchMaster')}
                          disabled={disabled}
                        >
                          <option value="">Select Batch</option>
                          {batchMaster.map((batch: any) => (
                            <option key={batch.Id} value={batch.Id}>{batch.BatchNo || batch.Name}</option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="py-0">
                      <input
                        ref={(ref) => setInputRef(ref, index, 'Qty')}
                        type="number"
                        className="form-control text-end"
                        value={row.Qty}
                        onChange={(e) => onUpdateRow(index, 'Qty', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'Qty')}
                        disabled={disabled}
                        placeholder="Qty"
                      />
                    </td>
                    <td className="py-0">
                      <input
                        ref={(ref) => setInputRef(ref, index, 'Rate')}
                        type="number"
                        className="form-control text-end"
                        value={row.Rate}
                        onChange={(e) => onUpdateRow(index, 'Rate', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'Rate')}
                        disabled={disabled}
                        placeholder="Rate"
                      />
                    </td>
                    <td className="py-0">
                      <input
                        type="text"
                        className="form-control text-end font-weight-bold"
                        value={((parseFloat(row.Qty) || 0) * (parseFloat(row.Rate) || 0)).toFixed(2)}
                        disabled
                        placeholder="Amount"
                      />
                    </td>
                    <td className="py-0">
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          ref={(ref) => setButtonRef(ref, index, 'AddButton')}
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={onAddRow}
                          onKeyDown={(e) => handleButtonKeyDown(e, index, 'AddButton')}
                          disabled={disabled}
                        >
                          <i className="fa fa-plus"></i>
                        </button>
                        <button
                          ref={(ref) => setButtonRef(ref, index, 'RemoveButton')}
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => onRemoveRow(index)}
                          onKeyDown={(e) => handleButtonKeyDown(e, index, 'RemoveButton')}
                          disabled={disabled || gridRows.length === 1}
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

export default GridSystemSalesInvoice;
