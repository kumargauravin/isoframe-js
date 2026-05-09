import { Row } from '../types';

export function paginateRows(rows: ReadonlyArray<Row>, pageNumber: number, pageSize: number): Row[] {
  if (pageSize <= 0) throw new Error('pageSize must be > 0');
  if (pageNumber < 1) throw new Error('pageNumber must be >= 1');
  const start = (pageNumber - 1) * pageSize;
  return rows.slice(start, start + pageSize) as Row[];
}
