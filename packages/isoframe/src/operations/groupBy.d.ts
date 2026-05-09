import { AggSpec, IGroupedFrame, IIsoFrame, Row } from '../types';
export declare class GroupedFrame implements IGroupedFrame {
    private readonly _keys;
    private readonly _groups;
    private readonly _IsoFrameClass;
    constructor(keys: string[], groups: Map<string, Row[]>, IsoFrameClass: new (rows: Row[]) => IIsoFrame);
    private _reduce;
    private _parseGroupKey;
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
/** Build group map from rows */
export declare function buildGroups(rows: ReadonlyArray<Row>, keys: string[]): Promise<Map<string, Row[]>>;
