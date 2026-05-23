import React, { useRef } from "react";
import { Col, Row } from "reactstrap";

const tableStyles = `
  .so-grid-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-left: -0.25rem;
    margin-right: -0.25rem;
  }
  .so-grid-wrap .so-table {
    min-width: 900px;
    margin-bottom: 0;
  }
  .so-table th:nth-child(1), .so-table td:nth-child(1) { width: 5%; min-width: 40px; text-align: center; }
  .so-table th:nth-child(2), .so-table td:nth-child(2) { width: 11%; min-width: 90px; }
  .so-table th:nth-child(3), .so-table td:nth-child(3) { width: 11%; min-width: 90px; }
  .so-table th:nth-child(4), .so-table td:nth-child(4) { width: 12%; min-width: 100px; }
  .so-table th:nth-child(5), .so-table td:nth-child(5) { width: 15%; min-width: 120px; }
  .so-table th:nth-child(6), .so-table td:nth-child(6) { width: 11%; min-width: 90px; }
  .so-table th:nth-child(7), .so-table td:nth-child(7) { width: 10%; min-width: 80px; text-align: right; }
  .so-table th:nth-child(8), .so-table td:nth-child(8) { width: 12%; min-width: 100px; text-align: right; }
  .so-table th:nth-child(9), .so-table td:nth-child(9) { width: 8%; min-width: 65px; text-align: center; }
  
  @media (max-width: 991.98px) {
    .so-grid-wrap .so-table { min-width: 850px; }
    .so-table th, .so-table td { padding: 0.28rem 0.2rem; font-size: 0.8rem; }
    .so-table .form-control { font-size: 0.8rem; padding: 0.22rem 0.3rem; min-height: 26px; height: auto; }
    .so-table .btn-sm { padding: 0.2rem 0.35rem; min-width: 28px; font-size: 0.75rem; }
  }
  @media (max-width: 767.98px) {
    .so-grid-wrap .so-table { min-width: 800px; }
    .so-table th, .so-table td { padding: 0.2rem 0.15rem; font-size: 0.7rem; }
    .so-table .form-control { font-size: 0.7rem; padding: 0.15rem 0.25rem; min-height: 22px; height: auto; }
    .so-table .btn-sm { padding: 0.15rem 0.28rem; min-width: 26px; font-size: 0.7rem; }
  }
`;

interface GridRow {
  ItemCode: string;
  F_ItemGroup: string;
  F_ItemMaster: string;
  F_ColorMaster?: string;
  Qty: string;
  AvailableQty?: string;
  ItemData: any[] | null;
}

interface GridSystemSOProps {
  gridRows: GridRow[];
  itemGroupMaster: any[];
  colorMaster?: any[];
  onQuickAddItem?: ((rowIndex: number) => void) | null;
  onQuickAddItemGroup?: ((rowIndex: number) => void) | null;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onUpdateRow: (index: number, field: string, value: any) => void;
  disabled?: boolean;
  saveButtonRef?: React.RefObject<HTMLButtonElement> | null;
  defaultColor?: any | null;
  getItemColorApply?: ((itemId: string | number) => Promise<boolean>) | null;
  itemColorApplyMap?: Record<string | number, boolean>;
}

const GridSystemSO: React.FC<GridSystemSOProps> = ({ 
  gridRows, 
  itemGroupMaster,
  colorMaster = [],
  onQuickAddItem = null,
  onQuickAddItemGroup = null,
  onAddRow, 
  onRemoveRow, 
  onUpdateRow,
  disabled = false,
  saveButtonRef = null,
  defaultColor = null,
  getItemColorApply = null,
  itemColorApplyMap = {},
}) => {
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null>>({});

  const handleKeyDown = (event: React.KeyboardEvent, rowIndex: number, fieldName: string) => {
    if (disabled) {
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      
      if (fieldName === 'Qty') {
        // Validate required row fields, then move to + button
        const row = gridRows[rowIndex] || {};
        const hasItem = !!row.F_ItemMaster;
        // Check if item requires color selection for validation
        const itemRequiresColor = itemColorApplyMap[row.F_ItemMaster] !== false;
        const hasColor = itemRequiresColor ? !!row.F_ColorMaster : true;
        const qtyVal = parseFloat(row.Qty);
        const hasQty = !isNaN(qtyVal) && qtyVal > 0;
        if (!hasItem || !hasColor || !hasQty) {
          let message = 'Please fill: ';
          const missing = [];
          if (!hasItem) missing.push('Item');
          if (itemRequiresColor && !hasColor) missing.push('Color');
          if (!hasQty) missing.push('Quantity');
          message += missing.join(', ');
          alert(message);
          // Focus first missing field
          if (!hasItem) {
            const ref = inputRefs.current[`${rowIndex}-F_ItemMaster`];
            ref?.focus();
          } else if (itemRequiresColor && !hasColor) {
            const ref = inputRefs.current[`${rowIndex}-F_ColorMaster`];
            ref?.focus();
          } else {
            const ref = inputRefs.current[`${rowIndex}-Qty`];
            ref?.focus();
          }
          return;
        }
        
        // After Qty validation, focus on + button
        const addButtonRef = inputRefs.current[`${rowIndex}-AddButton`];
        if (addButtonRef) {
          addButtonRef.focus();
        }
      } else if (fieldName === 'AddButton') {
        // From + button, add new row and then move focus
        const isLastRow = rowIndex === gridRows.length - 1;
        
        if (isLastRow) {
          // Add new row first
          onAddRow();
          
          // Then focus on the new row's first field (ItemCode)
          setTimeout(() => {
            const newRowIndex = rowIndex + 1;
            const newRowFirstRef = inputRefs.current[`${newRowIndex}-ItemCode`];
            if (newRowFirstRef) {
              newRowFirstRef.focus();
            } else {
              // Fallback: try again after a bit more time
              setTimeout(() => {
                const retryRef = inputRefs.current[`${newRowIndex}-ItemCode`];
                if (retryRef) {
                  retryRef.focus();
                }
              }, 50);
            }
          }, 150);
        } else {
          // Not last row - just move to next row without adding
          const nextRowIndex = rowIndex + 1;
          const nextFirstRef = inputRefs.current[`${nextRowIndex}-ItemCode`];
          if (nextFirstRef) {
            nextFirstRef.focus();
          }
        }
      } else {
        // For other fields, move to next field in the same row
        const row = gridRows[rowIndex] || {};
        const itemRequiresColor = itemColorApplyMap[row.F_ItemMaster] !== false;
        let nextFieldName = '';
        
        if (fieldName === 'ItemCode') {
          nextFieldName = 'F_ItemGroup';
        } else if (fieldName === 'F_ItemGroup') {
          nextFieldName = 'F_ItemMaster';
        } else if (fieldName === 'F_ItemMaster') {
          // Skip color field if item doesn't require color
          nextFieldName = itemRequiresColor ? 'F_ColorMaster' : 'Qty';
        } else if (fieldName === 'F_ColorMaster') {
          nextFieldName = 'Qty';
        }
        
        // Focus on next field in the same row
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
          <div className="table-responsive so-grid-wrap">
            <table className="table table-bordered table-striped so-table">
              <thead>
                <tr>
                  <th>Sr.No.</th>
                  <th>Add Item</th>
                  <th>Item Code</th>
                  <th>Item Group</th>
                  <th>Item</th>
                  <th>Color</th>
                  <th style={{ textAlign: 'right' }}>Available Qty</th>
                  <th style={{ textAlign: 'right' }}>Quantity</th>
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
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <select
                        ref={(ref) => setInputRef(ref, index, 'F_ItemGroup')}
                        className="form-control"
                        value={row.F_ItemGroup}
                        onChange={(e) => onUpdateRow(index, 'F_ItemGroup', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'F_ItemGroup')}
                        data-row={index}
                        data-field="F_ItemGroup"
                        disabled={disabled}
                      >
                        <option value="">Select Item Group</option>
                        {itemGroupMaster && itemGroupMaster.map((item) => (
                          <option key={item.Id} value={item.Id}>
                            {item.GroupName || item.Name}
                          </option>
                        ))}
                      </select>
                    </div>
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
                      {row.ItemData && row.ItemData.map((item) => (
                        <option key={item.Id} value={item.Id}>
                          {item.ItemName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-0">
                    <select
                      ref={(ref) => setInputRef(ref, index, 'F_ColorMaster')}
                      className="form-control"
                      value={
                        (itemColorApplyMap[row.F_ItemMaster] === false) 
                          ? (defaultColor?.Id || '') 
                          : (row.F_ColorMaster || '')
                      }
                      onChange={(e) => onUpdateRow(index, 'F_ColorMaster', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, 'F_ColorMaster')}
                      data-row={index}
                      data-field="F_ColorMaster"
                      disabled={disabled || (itemColorApplyMap[row.F_ItemMaster] === false)}
                      style={{
                        backgroundColor: (itemColorApplyMap[row.F_ItemMaster] === false) ? '#f8f9fa' : 'white',
                        color: (itemColorApplyMap[row.F_ItemMaster] === false) ? '#6c757d' : 'black'
                      }}
                    >
                      <option value="">Select Color</option>
                      {colorMaster && colorMaster.map((color) => (
                        <option key={color.Id} value={color.Id}>
                          {color.Name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-0" style={{textAlign: 'right'}}>
                    <input
                      type="text"
                      className="form-control"
                      style={{ textAlign: 'right', width: '100%', minWidth: '80px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}
                      value={row.AvailableQty && parseFloat(row.AvailableQty) > 0 ? row.AvailableQty : ''}
                      readOnly
                      placeholder="Available"
                      tabIndex={-1}
                    />
                  </td>
                  <td className="py-0" style={{textAlign: 'right'}}>
                    <input
                      ref={(ref) => setInputRef(ref, index, 'Qty')}
                      type="number"
                      className="form-control"
                      style={{ 
                        textAlign: 'right', 
                        width: '100%', 
                        minWidth: '80px',
                        borderColor: row.AvailableQty && parseFloat(row.AvailableQty) > 0 && parseFloat(row.Qty) > parseFloat(row.AvailableQty) ? '#dc3545' : '#e9ecef'
                      }}
                      name="Qty"
                      value={row.Qty}
                      onChange={(e) => onUpdateRow(index, 'Qty', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, 'Qty')}
                      data-row={index}
                      data-field="Qty"
                      disabled={disabled}
                      placeholder="Qty"
                      min="1"
                      max={row.AvailableQty && parseFloat(row.AvailableQty) > 0 ? parseFloat(row.AvailableQty) : undefined}
                      title={row.AvailableQty && parseFloat(row.AvailableQty) > 0 ? `Maximum allowed: ${row.AvailableQty}` : ''}
                    />
                    {row.AvailableQty && parseFloat(row.AvailableQty) > 0 && parseFloat(row.Qty) > parseFloat(row.AvailableQty) && (
                      <small className="text-danger d-block mt-1">
                        Max: {row.AvailableQty}
                      </small>
                    )}
                  </td>
                  <td className="py-0">
                    <div className="d-flex gap-1 justify-content-center">
                      <button
                        ref={(ref) => setInputRef(ref, index, 'AddButton')}
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={onAddRow}
                        onKeyDown={(e) => handleKeyDown(e, index, 'AddButton')}
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
                      >
                        <i className="fa fa-minus"></i>
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

export default GridSystemSO;
