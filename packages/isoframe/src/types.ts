/** Scalar value stored in a cell */
export type Scalar = string | number | boolean | null | undefined;

/** A row represented as a plain object */
export type Row = Record<string, Scalar>;

/** Column-major (key → array) format */
export type ColumnMap = Record<string, Scalar[]>;

/** Input accepted by IsoFrame constructor */
export type FrameInput = Row[] | ColumnMap;

/** Sort order */
export type SortOrder = 'asc' | 'desc';

/** Join types */
export type JoinType = 'left' | 'inner' | 'right' | 'outer';

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

  // Inspection
  head(n?: number): IIsoFrame;
  tail(n?: number): IIsoFrame;
  describe(): Record<string, ColumnStats | { count: number; unique: number; top: Scalar; freq: number }>;
  info(): void;
  sample(n: number): IIsoFrame;
  clone(): IIsoFrame;

  // Selection / wrangling
  select(keys: string[]): IIsoFrame;
  drop(keys: string[]): IIsoFrame;
  rename(map: Record<string, string>): IIsoFrame;
  mutate(key: string, fn: (row: Row, index: number) => Scalar): IIsoFrame;
  apply(fn: (row: Row, index: number) => Row): IIsoFrame;
  set_index(key: string): IIsoFrame;
  reset_index(): IIsoFrame;

  // Missing value handling
  is_na(): IIsoFrame;
  not_na(): IIsoFrame;
  drop_na(keys?: string[]): IIsoFrame;
  fill_na(value: Scalar | Record<string, Scalar>, keys?: string[]): IIsoFrame;

  // Sorting & pagination
  sort_by(key: string, order?: SortOrder): IIsoFrame;
  paginate(pageNumber: number, pageSize: number): IIsoFrame;

  // Async operations
  where(predicate: (row: Row, index: number) => boolean): Promise<IIsoFrame>;
  join(other: IIsoFrame | Row[], primaryKey: string, foreignKey: string, type?: JoinType): Promise<IIsoFrame>;
  group_by(keys: string | string[]): Promise<IGroupedFrame>;

  // Reshaping
  pivot(index: string, columns: string, values: string, aggFn?: AggFnName): Promise<IIsoFrame>;
  melt(idVars: string[], valueVars?: string[]): IIsoFrame;

  // Accessors
  col(key: string): ISeries;
  loc(indices: number[]): IIsoFrame;

  // Export
  to_array(): Row[];
  to_object(): ColumnMap;

  // Static
  // concat is on the class, not the instance
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
  to_array(): Scalar[];
}
