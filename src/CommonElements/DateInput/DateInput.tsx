import React, { useRef } from "react";
import { Input } from "reactstrap";
import { getCurrentDateYYYYMMDD, parseDateFromAPI } from "../../helpers/dateUtils";

/**
 * Standard DateInput component across the application.
 * - Enforces 4-digit year format (max 9999-12-31, min 1000-01-01) which constrains Chrome/Edge year input to 4 digits.
 * - On focus of empty field, auto-selects today's date.
 * - Preserves day and month while typing in the year field.
 */
interface DateInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  type?: "date";
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  min?: string;
  max?: string;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value = "", onChange, onFocus, disabled, min = "1000-01-01", max = "9999-12-31", ...rest }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);

    // Properly forward the internal input ref to the external ref
    React.useImperativeHandle(ref, () => internalRef.current as HTMLInputElement);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!disabled && !value && onChange) {
        const today = getCurrentDateYYYYMMDD();
        onChange({
          ...e,
          target: { ...e.target, value: today },
        } as React.ChangeEvent<HTMLInputElement>);
      }
      onFocus?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return;
      onChange(e);
    };

    const normalizedValue = parseDateFromAPI(value);

    return (
      <Input
        innerRef={internalRef}
        type="date"
        value={normalizedValue}
        onChange={handleChange}
        onFocus={handleFocus}
        disabled={disabled}
        min={min}
        max={max}
        {...rest}
      />
    );
  }
);

DateInput.displayName = "DateInput";

export default DateInput;
