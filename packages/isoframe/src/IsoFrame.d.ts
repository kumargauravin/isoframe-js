import { AggFnName, ColumnMap, ColumnStats, DtypeMap, FrameInput, FrameShape, IGroupedFrame, IIsoFrame, ISeries, MergeHow, Row, Scalar } from './types';
export declare class IsoFrame implements IIsoFrame {
    private readonly _rows;
    private readonly _columns;
    private _index;
    constructor(input: FrameInput | ReadonlyArray<Row>);
    /** Private constructor from already-frozen rows (internal use) */
    private static _fromRows;
    get shape(): FrameShape;
    get columns(): string[];
    get dtypes(): DtypeMap;
    head(n?: number): IsoFrame;
    tail(n?: number): IsoFrame;
    sample(n: number): IsoFrame;
    describe(): Record<string, ColumnStats | {
        count: number;
        unique: number;
        top: Scalar;
        freq: number;
    }>;
    info(): void;
    copy(): IsoFrame;
    select(keys: string[]): IsoFrame;
    drop(keys: string[]): IsoFrame;
    rename(map: Record<string, string>): IsoFrame;
    assign(key: string, fn: (row: Row, index: number) => Scalar): IsoFrame;
    apply(fn: (row: Row, index: number) => Row): IsoFrame;
    set_index(key: string): IsoFrame;
    reset_index(): IsoFrame;
    isna(): IsoFrame;
    notna(): IsoFrame;
    dropna(subset?: string[]): IsoFrame;
    fillna(value: Scalar | Record<string, Scalar>, subset?: string[]): IsoFrame;
    sort_values(by: string, ascending?: boolean): IsoFrame;
    paginate(pageNumber: number, pageSize: number): IsoFrame;
    query(predicate: (row: Row, index: number) => boolean): Promise<IsoFrame>;
    merge(other: IIsoFrame | Row[], left_on: string, right_on: string, how?: MergeHow): Promise<IsoFrame>;
    groupby(keys: string | string[]): Promise<IGroupedFrame>;
    pivot_table(index: string, columns: string, values: string, aggfunc?: AggFnName): Promise<IsoFrame>;
    melt(idVars: string[], valueVars?: string[]): IsoFrame;
    col(key: string): ISeries;
    loc(indices: number[]): IsoFrame;
    to_list(): Row[];
    to_dict(): ColumnMap;
    static concat(frames: IIsoFrame[]): IsoFrame;
}
