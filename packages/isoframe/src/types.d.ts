/** Scalar value stored in a cell */
export type Scalar = string | number | boolean | null | undefined;
/** A row represented as a plain object */
export type Row = Record<string, Scalar>;
/** Column-major (key → array) format */
export type ColumnMap = Record<string, Scalar[]>;
/** Input accepted by IsoFrame constructor */
export type FrameInput = Row[] | ColumnMap;
/** Merge (join) types — pandas-style naming */
export type MergeHow = 'left' | 'inner' | 'right' | 'outer';
/** Aggregation function names */
export type AggFnName = 'sum' | 'mean' | 'count' | 'min' | 'max' | 'first' | 'last';
/** Aggregation spec: column → function name */
export type AggSpec = Record<string, AggFnName | ((rows: Row[]) => Scalar)>;
/** Shape: [rows, columns] */
export type FrameShape = [number, number];
/** Dtype names */
export type Dtype = 'string' | 'number' | 'boolean' | 'mixed' | 'unknown';
/** Column dtype map */
export type DtypeMap = Record<string, Dtype>;
/** Description statistics for a numeric column */
export interface ColumnStats {
    count: number;
    mean: number;
    std: number;
    min: number;
    max: number;
    '25%': number;
    '50%': number;
    '75%': number;
}
/** IsoFrame public interface */
export interface IIsoFrame {
    /** [rows, columns] */
    readonly shape: FrameShape;
    /** Column names */
    readonly columns: string[];
    /** Dtype of each column */
    readonly dtypes: DtypeMap;
    head(n?: number): IIsoFrame;
    tail(n?: number): IIsoFrame;
    describe(): Record<string, ColumnStats | {
        count: number;
        unique: number;
        top: Scalar;
        freq: number;
    }>;
    info(): void;
    sample(n: number): IIsoFrame;
    copy(): IIsoFrame;
    select(keys: string[]): IIsoFrame;
    drop(keys: string[]): IIsoFrame;
    rename(map: Record<string, string>): IIsoFrame;
    assign(key: string, fn: (row: Row, index: number) => Scalar): IIsoFrame;
    apply(fn: (row: Row, index: number) => Row): IIsoFrame;
    set_index(key: string): IIsoFrame;
    reset_index(): IIsoFrame;
    isna(): IIsoFrame;
    notna(): IIsoFrame;
    dropna(subset?: string[]): IIsoFrame;
    fillna(value: Scalar | Record<string, Scalar>, subset?: string[]): IIsoFrame;
    sort_values(by: string, ascending?: boolean): IIsoFrame;
    paginate(pageNumber: number, pageSize: number): IIsoFrame;
    query(predicate: (row: Row, index: number) => boolean): Promise<IIsoFrame>;
    merge(other: IIsoFrame | Row[], left_on: string, right_on: string, how?: MergeHow): Promise<IIsoFrame>;
    groupby(keys: string | string[]): Promise<IGroupedFrame>;
    pivot_table(index: string, columns: string, values: string, aggfunc?: AggFnName): Promise<IIsoFrame>;
    melt(idVars: string[], valueVars?: string[]): IIsoFrame;
    col(key: string): ISeries;
    loc(indices: number[]): IIsoFrame;
    to_list(): Row[];
    to_dict(): ColumnMap;
}
/** Grouped frame returned by groupBy() */
export interface IGroupedFrame {
    sum(col: string): Promise<IIsoFrame>;
    mean(col: string): Promise<IIsoFrame>;
    count(): Promise<IIsoFrame>;
    min(col: string): Promise<IIsoFrame>;
    max(col: string): Promise<IIsoFrame>;
    first(col: string): Promise<IIsoFrame>;
    last(col: string): Promise<IIsoFrame>;
    agg(spec: AggSpec): Promise<IIsoFrame>;
    custom(fn: (rows: Row[]) => Row): Promise<IIsoFrame>;
}
/** Single column Series */
export interface ISeries {
    readonly name: string;
    readonly dtype: Dtype;
    readonly values: Scalar[];
    unique(): Scalar[];
    value_counts(): Row[];
    sum(): number;
    mean(): number;
    min(): Scalar;
    max(): Scalar;
    to_list(): Scalar[];
}
