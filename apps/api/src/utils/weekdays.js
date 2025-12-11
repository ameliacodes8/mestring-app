export const WEEKDAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export function todayWeekdayCode(date = new Date()) {
  return WEEKDAY_CODES[date.getDay()];
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
