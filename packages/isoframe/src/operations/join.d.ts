import { MergeHow, Row } from '../types';
/**
 * Hash-Join — O(n+m) not O(n*m).
 * Builds a hash-map of `other` keyed by `foreignKey`, then streams `primary`.
 */
export declare function hashJoin(primaryRows: ReadonlyArray<Row>, otherRows: ReadonlyArray<Row>, primaryKey: string, foreignKey: string, type?: MergeHow): Promise<Row[]>;
