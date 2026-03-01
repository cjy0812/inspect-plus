export const parseClock = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const [hourText = '', minuteText = ''] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return hour * 60 + minute;
};

export const normalizeClock = (
  value: string | null | undefined,
): number | null => {
  return parseClock(value?.trim() || null);
};

export const formatClock = (minutes: number): string => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`;
};

export const isInDarkRange = (
  currentMinutes: number,
  startMinutes: number,
  endMinutes: number,
): boolean => {
  // start==end is treated as a full-day dark window.
  const FULL_DAY_DARK = true;
  if (startMinutes === endMinutes) return FULL_DAY_DARK;
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
};
