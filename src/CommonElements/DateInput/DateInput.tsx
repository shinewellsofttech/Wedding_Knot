import React, { useRef } from "react";
import { Input } from "reactstrap";
import { getCurrentDateYYYYMMDD } from "../../helpers/dateUtils";

/**
 * Date input that auto-selects current year when empty and user focuses to pick date.
 * When day and month are selected (via picker), year defaults to current year.
 * On focus of empty field, sets value to today so picker opens with current year.
 */
interface DateInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  type?: "date";
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value = "", onChange, onFocus, disabled, ...rest }, ref) => {
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

    return (
      <Input
        innerRef={internalRef}
        type="date"
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        disabled={disabled}
        {...rest}
      />
    );
  }
);

DateInput.displayName = "DateInput";

export default DateInput;
