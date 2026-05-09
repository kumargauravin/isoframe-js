import { Row, Scalar, SortOrder } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?$/;

function compareScalars(a: Scalar, b: Scalar, order: SortOrder): number {
  // null/undefined always last
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  let cmp: number;

  if (typeof a === 'string' && typeof b === 'string') {
    // Date string detection
    if (DATE_RE.test(a) && DATE_RE.test(b)) {
      cmp = new Date(a).getTime() - new Date(b).getTime();
    } else {
      // Locale-aware alphanumeric sort
      cmp = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    }
  } else if (typeof a === 'number' && typeof b === 'number') {
    cmp = a - b;
  } else {
    cmp = String(a).localeCompare(String(b), undefined, { numeric: true });
  }

  return order === 'asc' ? cmp : -cmp;
}

export function sortRows(rows: ReadonlyArray<Row>, key: string, order: SortOrder = 'asc'): Row[] {
  return [...rows].sort((a, b) => compareScalars(a[key] as Scalar, b[key] as Scalar, order));
}
