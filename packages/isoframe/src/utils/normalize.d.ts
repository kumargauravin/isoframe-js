import { ColumnMap, FrameInput, Row } from '../types';
/** Normalize any FrameInput into an immutable array of row objects. */
export declare function normalizeInput(input: FrameInput): ReadonlyArray<Row>;
/** Convert row array to column-major object */
export declare function toColumnMap(rows: ReadonlyArray<Row>): ColumnMap;
/** Infer column names from row array */
export declare function inferColumns(rows: ReadonlyArray<Row>): string[];
