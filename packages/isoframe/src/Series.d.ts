import { Dtype, ISeries, Row, Scalar } from './types';
export declare class Series implements ISeries {
    readonly name: string;
    readonly dtype: Dtype;
    readonly values: Scalar[];
    constructor(name: string, values: Scalar[]);
    unique(): Scalar[];
    value_counts(): Row[];
    sum(): number;
    mean(): number;
    min(): Scalar;
    max(): Scalar;
    to_list(): Scalar[];
}
