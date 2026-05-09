import { Dtype, Row, Scalar } from '../types';
export declare function inferDtype(values: Scalar[]): Dtype;
export declare function inferDtypes(rows: ReadonlyArray<Row>, columns: string[]): Record<string, Dtype>;
