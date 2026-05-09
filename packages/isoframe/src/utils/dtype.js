export function inferDtype(values) {
    const sample = values.filter((v) => v !== null && v !== undefined).slice(0, 100);
    if (sample.length === 0)
        return 'unknown';
    const types = new Set(sample.map((v) => typeof v));
    if (types.size === 1) {
        const t = [...types][0];
        if (t === 'number')
            return 'number';
        if (t === 'string')
            return 'string';
        if (t === 'boolean')
            return 'boolean';
    }
    return 'mixed';
}
export function inferDtypes(rows, columns) {
    const dtypes = {};
    for (const col of columns) {
        const values = rows.map((r) => r[col]);
        dtypes[col] = inferDtype(values);
    }
    return dtypes;
}
//# sourceMappingURL=dtype.js.map