import { format, endOfMonth, addMonths } from 'date-fns';

/**
 * Returns the cycle_start_date string for the current quarter.
 * Quarters: Apr-Jun, Jul-Sep, Oct-Dec, Jan-Mar
 */
export const getCurrentCycleStart = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  let qStartMonth;
  if (month >= 3 && month <= 5) qStartMonth = 3;
  else if (month >= 6 && month <= 8) qStartMonth = 6;
  else if (month >= 9 && month <= 11) qStartMonth = 9;
  else qStartMonth = 0;

  const year = now.getFullYear();
  return format(new Date(year, qStartMonth, 1), 'yyyy-MM-dd');
};

/**
 * Generates dropdown options for fiscal year quarters.
 * Returns options for the current FY and next FY (8 quarters).
 */
export const generateCycleOptions = () => {
  const today = new Date();
  const fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;

  const quarters = [];
  for (let y = fyStartYear; y <= fyStartYear + 1; y++) {
    const fySuffix = `FY ${y}-${String(y + 1).slice(-2)}`;
    quarters.push(
      { value: format(new Date(y, 3, 1), 'yyyy-MM-dd'), label: `Apr - Jun ${y} (Q1 ${fySuffix})` },
      { value: format(new Date(y, 6, 1), 'yyyy-MM-dd'), label: `Jul - Sep ${y} (Q2 ${fySuffix})` },
      { value: format(new Date(y, 9, 1), 'yyyy-MM-dd'), label: `Oct - Dec ${y} (Q3 ${fySuffix})` },
      { value: format(new Date(y + 1, 0, 1), 'yyyy-MM-dd'), label: `Jan - Mar ${y + 1} (Q4 ${fySuffix})` }
    );
  }
  return quarters;
};

/**
 * Returns 3 month ranges for a given cycle start date.
 * Each range: { start: 'yyyy-MM-dd', end: 'yyyy-MM-dd', label: 'Apr 2026' }
 */
export const getCycleMonthRanges = (cycleStartDate) => {
  const base = new Date(cycleStartDate + 'T00:00:00');
  const ranges = [];
  for (let i = 0; i < 3; i++) {
    const monthStart = addMonths(base, i);
    const monthEnd = endOfMonth(monthStart);
    ranges.push({
      start: format(monthStart, 'yyyy-MM-dd'),
      end: format(monthEnd, 'yyyy-MM-dd'),
      label: format(monthStart, 'MMM yyyy')
    });
  }
  return ranges;
};

/**
 * Returns a human-readable label for a cycle start date.
 * e.g. '2026-04-01' -> 'Apr - Jun 2026'
 */
export const getCycleLabel = (cycleStartDate) => {
  const base = new Date(cycleStartDate + 'T00:00:00');
  const end = addMonths(base, 2);
  return `${format(base, 'MMM')} - ${format(end, 'MMM yyyy')}`;
};
