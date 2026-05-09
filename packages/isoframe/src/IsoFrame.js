import { normalizeInput, toColumnMap, inferColumns } from './utils/normalize';
import { inferDtypes } from './utils/dtype';
import { mean, std, quantile } from './utils/stats';
import { hashJoin } from './operations/join';
import { GroupedFrame, buildGroups } from './operations/groupBy';
import { filterRows } from './operations/filter';
import { sortRows } from './operations/sort';
import { paginateRows } from './operations/paginate';
import { Series } from './Series';
export class IsoFrame {
    _rows;
    _columns;
    _index = null;
    constructor(input) {
        if (Array.isArray(input) && (input.length === 0 || typeof input[0] === 'object' && !Array.isArray(input[0]))) {
            // Already normalized row array or empty
            this._rows = input.length === 0
                ? Object.freeze([])
                : normalizeInput(input);
        }
        else {
            this._rows = normalizeInput(input);
        }
        this._columns = inferColumns(this._rows);
    }
    /** Private constructor from already-frozen rows (internal use) */
    static _fromRows(rows) {
        const frame = Object.create(IsoFrame.prototype);
        frame._rows = rows;
        frame._columns = inferColumns(rows);
        frame._index = null;
        return frame;
    }
    // ── Shape & metadata ──────────────────────────────────────────────────────
    get shape() {
        return [this._rows.length, this._columns.length];
    }
    get columns() {
        return [...this._columns];
    }
    get dtypes() {
        return inferDtypes(this._rows, this._columns);
    }
    // ── Inspection ────────────────────────────────────────────────────────────
    head(n = 5) {
        return IsoFrame._fromRows(this._rows.slice(0, n));
    }
    tail(n = 5) {
        return IsoFrame._fromRows(this._rows.slice(-n));
    }
    sample(n) {
        const copy = [...this._rows];
        // Fisher-Yates
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return IsoFrame._fromRows(copy.slice(0, n));
    }
    describe() {
        const result = {};
        for (const col of this._columns) {
            const values = this._rows.map((r) => r[col]);
            const nonNull = values.filter((v) => v !== null && v !== undefined);
            const nums = nonNull.filter((v) => typeof v === 'number');
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
                };
            }
            else {
                const counts = new Map();
                for (const v of nonNull)
                    counts.set(v, (counts.get(v) ?? 0) + 1);
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
    info() {
        const [rows, cols] = this.shape;
        console.log(`IsoFrame: ${rows} rows × ${cols} columns`);
        const dtypes = this.dtypes;
        for (const col of this._columns) {
            const nonNull = this._rows.filter((r) => r[col] !== null && r[col] !== undefined).length;
            console.log(`  ${col}: ${dtypes[col]} (${nonNull} non-null)`);
        }
    }
    copy() {
        return IsoFrame._fromRows(this._rows);
    }
    // ── Selection / wrangling ─────────────────────────────────────────────────
    select(keys) {
        const rows = this._rows.map((row) => {
            const r = {};
            for (const k of keys)
                r[k] = row[k];
            return Object.freeze(r);
        });
        return IsoFrame._fromRows(rows);
    }
    drop(keys) {
        const keep = this._columns.filter((c) => !keys.includes(c));
        return this.select(keep);
    }
    rename(map) {
        const rows = this._rows.map((row) => {
            const r = {};
            for (const k of Object.keys(row)) {
                r[map[k] ?? k] = row[k];
            }
            return Object.freeze(r);
        });
        return IsoFrame._fromRows(rows);
    }
    assign(key, fn) {
        const rows = this._rows.map((row, i) => Object.freeze({ ...row, [key]: fn(row, i) }));
        return IsoFrame._fromRows(rows);
    }
    apply(fn) {
        const rows = this._rows.map((row, i) => Object.freeze(fn(row, i)));
        return IsoFrame._fromRows(rows);
    }
    set_index(key) {
        const frame = this.copy();
        frame._index = key;
        return frame;
    }
    reset_index() {
        const frame = this.copy();
        frame._index = null;
        return frame;
    }
    // ── Missing values ────────────────────────────────────────────────────────
    isna() {
        const rows = this._rows.map((row) => {
            const r = {};
            for (const k of this._columns) {
                r[k] = row[k] === null || row[k] === undefined ? true : false;
            }
            return Object.freeze(r);
        });
        return IsoFrame._fromRows(rows);
    }
    notna() {
        const rows = this._rows.map((row) => {
            const r = {};
            for (const k of this._columns) {
                r[k] = row[k] !== null && row[k] !== undefined ? true : false;
            }
            return Object.freeze(r);
        });
        return IsoFrame._fromRows(rows);
    }
    dropna(subset) {
        const checkKeys = subset ?? this._columns;
        const rows = this._rows.filter((row) => checkKeys.every((k) => row[k] !== null && row[k] !== undefined));
        return IsoFrame._fromRows(rows);
    }
    fillna(value, subset) {
        const isMap = typeof value === 'object' && value !== null && !Array.isArray(value);
        const fillKeys = subset ?? this._columns;
        const rows = this._rows.map((row) => {
            const r = { ...row };
            for (const k of fillKeys) {
                if (r[k] === null || r[k] === undefined) {
                    r[k] = isMap ? value[k] ?? null : value;
                }
            }
            return Object.freeze(r);
        });
        return IsoFrame._fromRows(rows);
    }
    // ── Sort & paginate ───────────────────────────────────────────────────────
    sort_values(by, ascending = true) {
        return IsoFrame._fromRows(sortRows(this._rows, by, ascending ? 'asc' : 'desc'));
    }
    paginate(pageNumber, pageSize) {
        return IsoFrame._fromRows(paginateRows(this._rows, pageNumber, pageSize));
    }
    // ── Async operations ──────────────────────────────────────────────────────
    async query(predicate) {
        const filtered = await filterRows(this._rows, predicate);
        return IsoFrame._fromRows(filtered);
    }
    async merge(other, left_on, right_on, how = 'left') {
        const otherRows = Array.isArray(other) ? other : other.to_list();
        const joined = await hashJoin(this._rows, otherRows, left_on, right_on, how);
        return IsoFrame._fromRows(joined);
    }
    async groupby(keys) {
        const keyArr = Array.isArray(keys) ? keys : [keys];
        const groups = await buildGroups(this._rows, keyArr);
        return new GroupedFrame(keyArr, groups, IsoFrame);
    }
    // ── Reshape ───────────────────────────────────────────────────────────────
    async pivot_table(index, columns, values, aggfunc = 'sum') {
        const grouped = await this.groupby([index, columns]);
        const aggResult = await grouped.agg({ [values]: aggfunc });
        // Pivot: turn column values into column headers
        const aggRows = aggResult.to_list();
        const colVals = [...new Set(aggRows.map((r) => String(r[columns])))];
        const indexVals = [...new Set(aggRows.map((r) => r[index]))];
        const pivotRows = indexVals.map((idxVal) => {
            const row = { [index]: idxVal };
            for (const cv of colVals) {
                const match = aggRows.find((r) => r[index] === idxVal && String(r[columns]) === cv);
                const aggKey = `${values}_${aggfunc}`;
                row[cv] = match ? match[aggKey] ?? null : null;
            }
            return Object.freeze(row);
        });
        return IsoFrame._fromRows(pivotRows);
    }
    melt(idVars, valueVars) {
        const vars = valueVars ?? this._columns.filter((c) => !idVars.includes(c));
        const rows = [];
        for (const row of this._rows) {
            for (const v of vars) {
                rows.push(Object.freeze({
                    ...Object.fromEntries(idVars.map((k) => [k, row[k]])),
                    variable: v,
                    value: row[v],
                }));
            }
        }
        return IsoFrame._fromRows(rows);
    }
    // ── Accessors ─────────────────────────────────────────────────────────────
    col(key) {
        return new Series(key, this._rows.map((r) => r[key]));
    }
    loc(indices) {
        const rows = indices.map((i) => this._rows[i]).filter(Boolean);
        return IsoFrame._fromRows(rows);
    }
    // ── Export ────────────────────────────────────────────────────────────────
    to_list() {
        return this._rows.map((r) => ({ ...r }));
    }
    to_dict() {
        return toColumnMap(this._rows);
    }
    // ── Static ────────────────────────────────────────────────────────────────
    static concat(frames) {
        const rows = [];
        for (const f of frames)
            rows.push(...f.to_list());
        return IsoFrame._fromRows(rows.map((r) => Object.freeze(r)));
    }
}
//# sourceMappingURL=IsoFrame.js.map