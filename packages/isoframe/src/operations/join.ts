import { JoinType, Row, Scalar } from '../types';

/**
 * Hash-Join — O(n+m) not O(n*m).
 * Builds a hash-map of `other` keyed by `foreignKey`, then streams `primary`.
 */
export async function hashJoin(
  primaryRows: ReadonlyArray<Row>,
  otherRows: ReadonlyArray<Row>,
  primaryKey: string,
  foreignKey: string,
  type: JoinType = 'left',
): Promise<Row[]> {
  // Phase 1: Build hash map of other (O(m))
  const hashMap = new Map<Scalar, Row[]>();
  for (const row of otherRows) {
    const key = row[foreignKey] as Scalar;
    const bucket = hashMap.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      hashMap.set(key, [row]);
    }
  }

  const result: Row[] = [];

  // Phase 2: Probe (O(n))
  const matchedOtherKeys = new Set<Scalar>();

  for (const pRow of primaryRows) {
    const key = pRow[primaryKey] as Scalar;
    const matches = hashMap.get(key);
    if (matches && matches.length > 0) {
      for (const oRow of matches) {
        result.push({ ...oRow, ...pRow }); // primary wins on collision
      }
      if (type === 'right' || type === 'outer') {
        matchedOtherKeys.add(key);
      }
    } else if (type === 'left' || type === 'outer') {
      result.push({ ...pRow });
    }
  }

  // For right/outer: add unmatched rows from other
  if (type === 'right' || type === 'outer') {
    for (const oRow of otherRows) {
      const key = oRow[foreignKey] as Scalar;
      if (!matchedOtherKeys.has(key)) {
        result.push({ ...oRow });
      }
    }
  }

  return result;
}
