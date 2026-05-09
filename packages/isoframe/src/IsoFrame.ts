import {
  AggSpec,
  AggFnName,
  ColumnMap,
  ColumnStats,
  Dtype,
  DtypeMap,
  FrameInput,
  FrameShape,
  IGroupedFrame,
  IIsoFrame,
  ISeries,
  JoinType,
  Row,
  Scalar,
  SortOrder,
} from './types';
import { normalizeInput, toColumnMap, inferColumns } from './utils/normalize';
import { inferDtypes } from './utils/dtype';
import { mean, std, quantile } from './utils/stats';
import { hashJoin } from './operations/join';
import { GroupedFrame, buildGroups } from './operations/groupBy';
import { filterRows } from './operations/filter';
import { sortRows } from './operations/sort';
import { paginateRows } from './operations/paginate';
import { Series } from './Series';

export class IsoFrame implements IIsoFrame {
  private readonly _rows: ReadonlyArray<Row>;
  private readonly _columns: string[];
  private _index: string | null = null;

  constructor(input: FrameInput | ReadonlyArray<Row>) {
    if (Array.isArray(input) && (input.length === 0 || typeof input[0] === 'object' && !Array.isArray(input[0]))) {
      // Already normalized row array or empty
      this._rows = input.length === 0
        ? Object.freeze([])
        : normalizeInput(input as Row[]);
    } else {
      this._rows = normalizeInput(input as FrameInput);
    }
    this._columns = inferColumns(this._rows);
  }

  /** Private constructor from already-frozen rows (internal use) */
  private static _fromRows(rows: ReadonlyArray<Row>): IsoFrame {
    const frame = Object.create(IsoFrame.prototype) as IsoFrame;
    (frame as any)._rows = rows;
    (frame as any)._columns = inferColumns(rows);
    (frame as any)._index = null;
    return frame;
  }

  // ── Shape & metadata ──────────────────────────────────────────────────────

  get shape(): FrameShape {
    return [this._rows.length, this._columns.length];
  }

  get columns(): string[] {
    return [...this._columns];
  }

  get dtypes(): DtypeMap {
    return inferDtypes(this._rows, this._columns);
  }

  // ── Inspection ────────────────────────────────────────────────────────────

  head(n = 5): IsoFrame {
    return IsoFrame._fromRows(this._rows.slice(0, n) as Row[]);
  }

  tail(n = 5): IsoFrame {
    return IsoFrame._fromRows(this._rows.slice(-n) as Row[]);
  }

  sample(n: number): IsoFrame {
    const copy = [...this._rows] as Row[];
    // Fisher-Yates
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return IsoFrame._fromRows(copy.slice(0, n));
  }

  describe(): Record<string, ColumnStats | { count: number; unique: number; top: Scalar; freq: number }> {
    const result: Record<string, any> = {};
    for (const col of this._columns) {
      const values = this._rows.map((r) => r[col]);
      const nonNull = values.filter((v) => v !== null && v !== undefined);
      const nums = nonNull.filter((v): v is number => typeof v === 'number');
      if (nums.length > 0) {
        const sorted = [...nums].sort((a, b) => a - b);
        result[col] = {
          count: nonNull.length,
          mean: mean(nums),
          std: std(nums),
          min: sorted[0],
          '25%': quantile(sorted, 0.25),
          '50%': quantile(sorted, 0.5),
          '75%': quantile(sorted, 0.75),
          max: sorted[sorted.length - 1],
        } as ColumnStats;
      } else {
        const counts = new Map<Scalar, number>();
        for (const v of nonNull) counts.set(v as Scalar, (counts.get(v as Scalar) ?? 0) + 1);
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        result[col] = {
          count: nonNull.length,
          unique: counts.size,
          top: top?.[0] ?? null,
          freq: top?.[1] ?? 0,
        };
      }
    }
    return result;
  }

  info(): void {
    const [rows, cols] = this.shape;
    console.log(`IsoFrame: ${rows} rows × ${cols} columns`);
    const dtypes = this.dtypes;
    for (const col of this._columns) {
      const nonNull = this._rows.filter((r) => r[col] !== null && r[col] !== undefined).length;
      console.log(`  ${col}: ${dtypes[col]} (${nonNull} non-null)`);
    }
  }

  clone(): IsoFrame {
    return IsoFrame._fromRows(this._rows);
  }

  // ── Selection / wrangling ─────────────────────────────────────────────────

  select(keys: string[]): IsoFrame {
    const rows = this._rows.map((row) => {
      const r: Row = {};
      for (const k of keys) r[k] = row[k] as Scalar;
      return Object.freeze(r) as Row;
    });
    return IsoFrame._fromRows(rows);
  }

  drop(keys: string[]): IsoFrame {
    const keep = this._columns.filter((c) => !keys.includes(c));
    return this.select(keep);
  }

  rename(map: Record<string, string>): IsoFrame {
    const rows = this._rows.map((row) => {
      const r: Row = {};
      for (const k of Object.keys(row)) {
        r[map[k] ?? k] = row[k] as Scalar;
      }
      return Object.freeze(r) as Row;
    });
    return IsoFrame._fromRows(rows);
  }

  mutate(key: string, fn: (row: Row, index: number) => Scalar): IsoFrame {
    const rows = this._rows.map((row, i) =>
      Object.freeze({ ...row, [key]: fn(row as Row, i) }) as Row,
    );
    return IsoFrame._fromRows(rows);
  }

  apply(fn: (row: Row, index: number) => Row): IsoFrame {
    const rows = this._rows.map((row, i) => Object.freeze(fn(row as Row, i)) as Row);
    return IsoFrame._fromRows(rows);
  }

  setIndex(key: string): IsoFrame {
    const frame = this.clone();
    (frame as any)._index = key;
    return frame;
  }

  resetIndex(): IsoFrame {
    const frame = this.clone();
    (frame as any)._index = null;
    return frame;
  }

  // ── Missing values ────────────────────────────────────────────────────────

  isNa(): IsoFrame {
    const rows = this._rows.map((row) => {
      const r: Row = {};
      for (const k of this._columns) {
        r[k] = row[k] === null || row[k] === undefined ? true : false;
      }
      return Object.freeze(r) as Row;
    });
    return IsoFrame._fromRows(rows);
  }

  notNa(): IsoFrame {
    const rows = this._rows.map((row) => {
      const r: Row = {};
      for (const k of this._columns) {
        r[k] = row[k] !== null && row[k] !== undefined ? true : false;
      }
      return Object.freeze(r) as Row;
    });
    return IsoFrame._fromRows(rows);
  }

  dropNa(keys?: string[]): IsoFrame {
    const checkKeys = keys ?? this._columns;
    const rows = this._rows.filter((row) =>
      checkKeys.every((k) => row[k] !== null && row[k] !== undefined),
    ) as Row[];
    return IsoFrame._fromRows(rows);
  }

  fillNa(value: Scalar | Record<string, Scalar>, keys?: string[]): IsoFrame {
    const isMap = typeof value === 'object' && value !== null && !Array.isArray(value);
    const fillKeys = keys ?? this._columns;
    const rows = this._rows.map((row) => {
      const r: Row = { ...row };
      for (const k of fillKeys) {
        if (r[k] === null || r[k] === undefined) {
          r[k] = isMap ? (value as Record<string, Scalar>)[k] ?? null : (value as Scalar);
        }
      }
      return Object.freeze(r) as Row;
    });
    return IsoFrame._fromRows(rows);
  }

  // ── Sort & paginate ───────────────────────────────────────────────────────

  sortBy(key: string, order: SortOrder = 'asc'): IsoFrame {
    return IsoFrame._fromRows(sortRows(this._rows, key, order));
  }

  paginate(pageNumber: number, pageSize: number): IsoFrame {
    return IsoFrame._fromRows(paginateRows(this._rows, pageNumber, pageSize));
  }

  // ── Async operations ──────────────────────────────────────────────────────

  async where(predicate: (row: Row, index: number) => boolean): Promise<IsoFrame> {
    const filtered = await filterRows(this._rows, predicate);
    return IsoFrame._fromRows(filtered);
  }

  async join(
    other: IIsoFrame | Row[],
    primaryKey: string,
    foreignKey: string,
    type: JoinType = 'left',
  ): Promise<IsoFrame> {
    const otherRows: ReadonlyArray<Row> =
      Array.isArray(other) ? (other as Row[]) : (other as IsoFrame).toArray();
    const joined = await hashJoin(this._rows, otherRows, primaryKey, foreignKey, type);
    return IsoFrame._fromRows(joined);
  }

  async groupBy(keys: string | string[]): Promise<IGroupedFrame> {
    const keyArr = Array.isArray(keys) ? keys : [keys];
    const groups = await buildGroups(this._rows, keyArr);
    return new GroupedFrame(keyArr, groups, IsoFrame as unknown as new (rows: Row[]) => IIsoFrame);
  }

  // ── Reshape ───────────────────────────────────────────────────────────────

  async pivot(
    index: string,
    columns: string,
    values: string,
    aggFn: AggFnName = 'sum',
  ): Promise<IsoFrame> {
    const grouped = await this.groupBy([index, columns]);
    const aggResult = await grouped.agg({ [values]: aggFn });
    // Pivot: turn column values into column headers
    const aggRows = aggResult.toArray();
    const colVals = [...new Set(aggRows.map((r) => String(r[columns])))] as string[];
    const indexVals = [...new Set(aggRows.map((r) => r[index] as Scalar))];
    const pivotRows: Row[] = indexVals.map((idxVal) => {
      const row: Row = { [index]: idxVal };
      for (const cv of colVals) {
        const match = aggRows.find((r) => r[index] === idxVal && String(r[columns]) === cv);
        const aggKey = `${values}_${aggFn}`;
        row[cv] = match ? match[aggKey] ?? null : null;
      }
      return Object.freeze(row) as Row;
    });
    return IsoFrame._fromRows(pivotRows);
  }

  melt(idVars: string[], valueVars?: string[]): IsoFrame {
    const vars = valueVars ?? this._columns.filter((c) => !idVars.includes(c));
    const rows: Row[] = [];
    for (const row of this._rows) {
      for (const v of vars) {
        rows.push(
          Object.freeze({
            ...Object.fromEntries(idVars.map((k) => [k, row[k]])),
            variable: v,
            value: row[v] as Scalar,
          }) as Row,
        );
      }
    }
    return IsoFrame._fromRows(rows);
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  col(key: string): ISeries {
    return new Series(key, this._rows.map((r) => r[key] as Scalar));
  }

  loc(indices: number[]): IsoFrame {
    const rows = indices.map((i) => this._rows[i] as Row).filter(Boolean);
    return IsoFrame._fromRows(rows);
  }

  // ── Export ────────────────────────────────────────────────────────────────

  toArray(): Row[] {
    return this._rows.map((r) => ({ ...r }));
  }

  toObject(): ColumnMap {
    return toColumnMap(this._rows);
  }

  // ── Static ────────────────────────────────────────────────────────────────

  static concat(frames: IIsoFrame[]): IsoFrame {
    const rows: Row[] = [];
    for (const f of frames) rows.push(...f.toArray());
    return IsoFrame._fromRows(rows.map((r) => Object.freeze(r) as Row));
  }
}
