import { Row } from '../types';
type SortOrder = 'asc' | 'desc';
export declare function sortRows(rows: ReadonlyArray<Row>, key: string, order?: SortOrder): Row[];
export {};
