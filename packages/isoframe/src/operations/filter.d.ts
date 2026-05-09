import { Row } from '../types';
export declare function filterRows(rows: ReadonlyArray<Row>, predicate: (row: Row, index: number) => boolean): Promise<Row[]>;
