export function isValidHours(value: number, maximum?: number) {
  return (
    Number.isFinite(value) &&
    value >= 0 &&
    (maximum === undefined || value <= maximum) &&
    Math.round(value * 2) === value * 2
  );
}

export function isValidHoursInput(value: string, maximum?: number) {
  return value.trim() !== "" && isValidHours(Number(value), maximum);
}

export function normalizeHours(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue === "" ? "0" : String(Number(trimmedValue));
}
