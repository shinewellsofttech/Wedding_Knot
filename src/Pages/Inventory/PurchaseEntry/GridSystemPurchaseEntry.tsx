import React, { useRef } from "react";
import { Col, Row } from "reactstrap";

const tableStyles = `
  .purchase-entry-grid-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-left: -0.25rem;
    margin-right: -0.25rem;
  }
  .purchase-entry-grid-wrap .po-table {
    min-width: 950px;
    margin-bottom: 0;
  }
  .po-table th:nth-child(1), .po-table td:nth-child(1) { width: 5%; min-width: 40px; text-align: center; }
  .po-table th:nth-child(2), .po-table td:nth-child(2) { width: 12%; min-width: 90px; }
  .po-table th:nth-child(3), .po-table td:nth-child(3) { width: 15%; min-width: 100px; }
  .po-table th:nth-child(4), .po-table td:nth-child(4) { width: 20%; min-width: 140px; }
  .po-table th:nth-child(5), .po-table td:nth-child(5) { width: 15%; min-width: 100px; }
  .po-table th:nth-child(6), .po-table td:nth-child(6) { width: 10%; min-width: 80px; text-align: right; }
  .po-table th:nth-child(7), .po-table td:nth-child(7) { width: 10%; min-width: 90px; text-align: right; }
  .po-table th:nth-child(8), .po-table td:nth-child(8) { width: 13%; min-width: 90px; text-align: center; }
  
  @media (max-width: 991.98px) {
    .purchase-entry-grid-wrap .po-table { min-width: 900px; }
    .po-table th, .po-table td { padding: 0.28rem 0.2rem; font-size: 0.8rem; }
    .po-table .form-control { font-size: 0.8rem; padding: 0.22rem 0.3rem; min-height: 26px; height: auto; }
    .po-table .btn-sm { padding: 0.2rem 0.35rem; min-width: 28px; font-size: 0.75rem; }
  }
  @media (max-width: 767.98px) {
    .purchase-entry-grid-wrap .po-table { min-width: 850px; }
    .po-table th, .po-table td { padding: 0.2rem 0.15rem; font-size: 0.7rem; }
    .po-table .form-control { font-size: 0.7rem; padding: 0.15rem 0.25rem; min-height: 22px; height: auto; }
    .po-table .btn-sm { padding: 0.15rem 0.28rem; min-width: 26px; font-size: 0.7rem; }
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
  Variant?: string;
  ItemData: any[] | null;
  AvailableQty?: number;
}

interface GridSystemPurchaseEntryProps {
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
  saveButtonRef?: React.RefObject<HTMLButtonElement> | null;
  defaultColor?: any | null;
  getItemColorApply?: ((itemId: string | number) => Promise<boolean>) | null;
  itemColorApplyMap?: Record<string | number, boolean>;
  onQuickAddItem?: ((rowIndex: number) => void) | null;
  onQuickAddItemGroup?: ((rowIndex: number) => void) | null;
}

const GridSystemPurchaseEntry: React.FC<GridSystemPurchaseEntryProps> = ({
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
  getItemColorApply = null,
  itemColorApplyMap = {},
  onQuickAddItem = null,
  onQuickAddItemGroup = null,
}) => {
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null>>({});
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleKeyDown = (event: React.KeyboardEvent, rowIndex: number, fieldName: string) => {
    if (disabled) {
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();

      if (fieldName === 'Rate') {
        // Validate required row fields, then move to + button
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

        if (!hasItem || !hasQty || !hasRate) {
          let message = 'Please fill: ';
          const missing = [];
          if (!hasItem) missing.push('Item');
          if (!hasQty) missing.push('Quantity');
          if (!hasRate) missing.push('Rate');
          message += missing.join(', ');
          alert(message);

          // Focus first missing field
          if (!hasItem) {
            const ref = inputRefs.current[`${rowIndex}-F_ItemMaster`];
            ref?.focus();
          } else if (!hasQty) {
            const ref = inputRefs.current[`${rowIndex}-Qty`];
            ref?.focus();
          } else if (!hasRate) {
            const ref = inputRefs.current[`${rowIndex}-Rate`];
            ref?.focus();
          }
          return;
        }

        // After Rate validation, focus on + button
        const addButtonRef = buttonRefs.current[`${rowIndex}-AddButton`];
        if (addButtonRef) {
          addButtonRef.focus();
        }
      } else {
        // For other fields, move to next field in the same row
        const row = gridRows[rowIndex] || {};
        const itemRequiresColor = itemColorApplyMap[row.F_ItemMaster] !== false;
        let nextFieldName = '';

        if (fieldName === 'ItemCode') {
          nextFieldName = 'F_ItemGroupMaster';
        } else if (fieldName === 'F_ItemGroupMaster') {
          nextFieldName = 'F_ItemMaster';
        } else if (fieldName === 'F_ItemMaster') {
          nextFieldName = 'Variant';
        } else if (fieldName === 'Variant') {
          nextFieldName = 'Qty';
        } else if (fieldName === 'Qty') {
          nextFieldName = 'Rate';
        }

        // Focus on next field in the same row
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
        // Tab from + button to - button
        const removeButtonRef = buttonRefs.current[`${rowIndex}-RemoveButton`];
        if (removeButtonRef) {
          removeButtonRef.focus();
        }
      } else if (buttonType === 'RemoveButton') {
        // Check if this is the last row
        const isLastRow = rowIndex === gridRows.length - 1;

        if (isLastRow) {
          // Tab from last row's - button to save button
          let saveButton: HTMLButtonElement | null = null;

          if (saveButtonRef && saveButtonRef.current) {
            saveButton = saveButtonRef.current;
          }

          if (!saveButton) {
            saveButton =
              document.querySelector('button[type="submit"]') ||
              document.querySelector('.po-action-btn[type="submit"]') ||
              document.querySelector('button.po-action-btn');
          }

          if (saveButton) {
            requestAnimationFrame(() => {
              (saveButton as HTMLButtonElement).focus();
            });
            return;
          }
        }

        // For non-last rows OR if save button not found in last row
        // Focus on next row's ItemCode field
        const nextRowIndex = rowIndex + 1;
        if (nextRowIndex < gridRows.length) {
          const nextItemCodeRef = inputRefs.current[`${nextRowIndex}-ItemCode`];
          if (nextItemCodeRef) {
            nextItemCodeRef.focus();
          }
        } else {
          // If no more rows, focus on first row's ItemCode field
          const firstItemCodeRef = inputRefs.current[`0-ItemCode`];
          if (firstItemCodeRef) {
            firstItemCodeRef.focus();
          }
        }
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();

      if (buttonType === 'AddButton') {
        onAddRow();

        // Focus on the new row's ItemCode field
        setTimeout(() => {
          const newRowIndex = gridRows.length;
          const newItemCodeRef = inputRefs.current[`${newRowIndex}-ItemCode`];
          if (newItemCodeRef) {
            newItemCodeRef.focus();
          } else {
            setTimeout(() => {
              const retryRef = inputRefs.current[`${newRowIndex}-ItemCode`];
              if (retryRef) {
                retryRef.focus();
              }
            }, 50);
          }
        }, 150);
      } else if (buttonType === 'RemoveButton') {
        onRemoveRow(rowIndex);

        // Focus on the same row's ItemCode field (or previous row if this was the last row)
        setTimeout(() => {
          const targetRowIndex = rowIndex < gridRows.length - 1 ? rowIndex : Math.max(0, rowIndex - 1);
          const targetItemCodeRef = inputRefs.current[`${targetRowIndex}-ItemCode`];
          if (targetItemCodeRef) {
            targetItemCodeRef.focus();
          }
        }, 100);
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
          <div className="table-responsive purchase-entry-grid-wrap">
            <table className="table table-bordered table-striped po-table">
              <thead>
                <tr>
                  <th>Sr.No.</th>
                  <th>Barcode</th>
                  <th>Category</th>
                  <th>Item</th>
                  <th>Varient</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Action</th>
                </tr> 
              </thead>
              <tbody>
                {gridRows.map((row, index) => (
                  <tr key={index}>
                    <td className="py-0">{index + 1}</td>



                    <td className="py-0">
                      <input
                        ref={(ref) => setInputRef(ref, index, 'ItemCode')}
                        type="text"
                        className="form-control"
                        value={row.ItemCode}
                        onChange={(e) => {
                          const itemCode = e.target.value;
                          onUpdateRow(index, 'ItemCode', itemCode);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index, 'ItemCode')}
                        data-row={index}
                        data-field="ItemCode"
                        disabled={disabled}
                        placeholder="Enter Item Code"
                      />
                    </td>

                    <td className="py-0">
                      <select
                        ref={(ref) => setInputRef(ref, index, 'F_ItemGroupMaster')}
                        className="form-control"
                        value={row.F_ItemGroupMaster}
                        onChange={(e) => onUpdateRow(index, 'F_ItemGroupMaster', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'F_ItemGroupMaster')}
                        data-row={index}
                        data-field="F_ItemGroupMaster"
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
                        ref={(ref) => setInputRef(ref, index, 'F_ItemMaster')}
                        className="form-control"
                        value={row.F_ItemMaster}
                        onChange={(e) => onUpdateRow(index, 'F_ItemMaster', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'F_ItemMaster')}
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
                      <input
                        ref={(ref) => setInputRef(ref, index, 'Variant')}
                        type="text"
                        className="form-control"
                        value={row.Variant || ""}
                        onChange={(e) => onUpdateRow(index, 'Variant', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'Variant')}
                        data-row={index}
                        data-field="Variant"
                        disabled={disabled}
                        placeholder="Varient"
                      />
                    </td>

                    <td className="py-0" style={{ textAlign: 'right' }}>
                      <input
                        ref={(ref) => setInputRef(ref, index, 'Qty')}
                        type="number"
                        className="form-control"
                        style={{ textAlign: 'right', width: '100%', minWidth: '75px' }}
                        value={row.Qty}
                        onChange={(e) => onUpdateRow(index, 'Qty', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'Qty')}
                        data-row={index}
                        data-field="Qty"
                        disabled={disabled}
                        placeholder="Qty"
                        min="1"
                      />
                    </td>

                    <td className="py-0" style={{ textAlign: 'right' }}>
                      <input
                        ref={(ref) => setInputRef(ref, index, 'Rate')}
                        type="number"
                        className="form-control"
                        style={{ textAlign: 'right', width: '100%', minWidth: '80px' }}
                        value={row.Rate}
                        onChange={(e) => onUpdateRow(index, 'Rate', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'Rate')}
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
                          ref={(ref) => setButtonRef(ref, index, 'AddButton')}
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={onAddRow}
                          onKeyDown={(e) => handleButtonKeyDown(e, index, 'AddButton')}
                          disabled={disabled}
                          title="Add Row (Press Enter to continue)"
                        >
                               <i className="fa fa-plus"></i>
                        </button>
                        <button
                          ref={(ref) => setButtonRef(ref, index, 'RemoveButton')}
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => onRemoveRow(index)}
                          onKeyDown={(e) => handleButtonKeyDown(e, index, 'RemoveButton')}
                          disabled={disabled}
                          title="Remove Row"
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

export default GridSystemPurchaseEntry;
