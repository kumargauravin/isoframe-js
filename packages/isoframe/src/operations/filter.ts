import { Row } from '../types';
import { processInChunks } from '../utils/chunk';

export async function filterRows(
  rows: ReadonlyArray<Row>,
  predicate: (row: Row, index: number) => boolean,
): Promise<Row[]> {
  // For small datasets — sync fast path
  if (rows.length < 50_000) {
    const result: Row[] = [];
    for (let i = 0; i < rows.length; i++) {
      if (predicate(rows[i], i)) result.push(rows[i] as Row);
    }
    return result;
  }

  // Large datasets — chunk to avoid blocking
  const flags = await processInChunks(rows, (row, idx) => predicate(row, idx));
  return rows.filter((_, i) => flags[i]) as Row[];
}
