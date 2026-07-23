import { isValidHoursInput } from "../utils/hourValidation";

interface HoursInputProps {
  ariaLabel?: string;
  className: string;
  disabled: boolean;
  draftValue?: string;
  maximum?: number;
  onBlur: () => void;
  onChange: (value: string) => void;
  value: string;
}

export function HoursInput({
  ariaLabel,
  className,
  disabled,
  draftValue,
  maximum,
  onBlur,
  onChange,
  value,
}: HoursInputProps) {
  const isInvalid =
    draftValue !== undefined && !isValidHoursInput(draftValue, maximum);
  const validationMessage =
    maximum === undefined
      ? "Enter zero or more hours in half-hour increments."
      : `Enter 0 to ${maximum} hours in half-hour increments.`;

  return (
    <input
      aria-invalid={isInvalid}
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
      max={maximum}
      min="0"
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
      step="0.5"
      title={isInvalid ? validationMessage : undefined}
      type="number"
      value={value}
    />
  );
}
