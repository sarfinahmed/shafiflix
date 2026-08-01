import { format, formatDistanceToNow, differenceInDays } from 'date-fns';

export const safeToDate = (ts: any): Date | null => {
  if (!ts) return null;
  try {
    if (typeof ts.toDate === 'function') {
      const d = ts.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if (ts.seconds !== undefined && typeof ts.seconds === 'number') {
      const d = new Date(ts.seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

export const safeFormatDate = (ts: any, pattern: string = 'PPP'): string => {
  const date = safeToDate(ts);
  if (!date) return 'N/A';
  try {
    return format(date, pattern);
  } catch {
    return 'N/A';
  }
};

export const safeFormatDistanceToNow = (ts: any, fallback: string = 'Expired'): string => {
  const date = safeToDate(ts);
  if (!date) return fallback;
  try {
    return formatDistanceToNow(date);
  } catch {
    return fallback;
  }
};

export const safeDifferenceInDays = (ts: any): number => {
  const date = safeToDate(ts);
  if (!date) return -1;
  try {
    return differenceInDays(date, new Date());
  } catch {
    return -1;
  }
};
