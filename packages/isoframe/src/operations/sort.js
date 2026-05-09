const DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?$/;
function compareScalars(a, b, order) {
    // null/undefined always last
    if (a === null || a === undefined)
        return 1;
    if (b === null || b === undefined)
        return -1;
    let cmp;
    if (typeof a === 'string' && typeof b === 'string') {
        // Date string detection
        if (DATE_RE.test(a) && DATE_RE.test(b)) {
            cmp = new Date(a).getTime() - new Date(b).getTime();
        }
        else {
            // Locale-aware alphanumeric sort
            cmp = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        }
    }
    else if (typeof a === 'number' && typeof b === 'number') {
        cmp = a - b;
    }
    else {
        cmp = String(a).localeCompare(String(b), undefined, { numeric: true });
    }
    return order === 'asc' ? cmp : -cmp;
}
export function sortRows(rows, key, order = 'asc') {
    return [...rows].sort((a, b) => compareScalars(a[key], b[key], order));
}
//# sourceMappingURL=sort.js.map