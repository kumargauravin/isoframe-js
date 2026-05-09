/** Detect whether input is column-major (key→array) or row-major (array of dicts). */
function isColumnMap(input) {
    if (Array.isArray(input))
        return false;
    const values = Object.values(input);
    return values.length > 0 && Array.isArray(values[0]);
}
/** Normalize any FrameInput into an immutable array of row objects. */
export function normalizeInput(input) {
    if (!input)
        return Object.freeze([]);
    if (isColumnMap(input)) {
        const keys = Object.keys(input);
        if (keys.length === 0)
            return Object.freeze([]);
        const len = input[keys[0]].length;
        const rows = new Array(len);
        for (let i = 0; i < len; i++) {
            const row = {};
            for (const k of keys) {
                row[k] = input[k][i] ?? null;
            }
            rows[i] = Object.freeze(row);
        }
        return Object.freeze(rows);
    }
    // Array of row objects
    return Object.freeze(input.map((r) => Object.freeze({ ...r })));
}
/** Convert row array to column-major object */
export function toColumnMap(rows) {
    if (rows.length === 0)
        return {};
    const keys = Object.keys(rows[0]);
    const result = {};
    for (const k of keys) {
        result[k] = rows.map((r) => r[k]);
    }
    return result;
}
/** Infer column names from row array */
export function inferColumns(rows) {
    if (rows.length === 0)
        return [];
    // Union of all keys across rows
    const set = new Set();
    for (const row of rows) {
        for (const k of Object.keys(row)) {
            set.add(k);
        }
    }
    return [...set];
}
//# sourceMappingURL=normalize.js.map