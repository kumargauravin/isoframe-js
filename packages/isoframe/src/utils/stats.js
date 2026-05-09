/** Compute population standard deviation */
export function std(values) {
    if (values.length === 0)
        return 0;
    const m = mean(values);
    const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length;
    return Math.sqrt(variance);
}
export function mean(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}
export function quantile(sorted, q) {
    if (sorted.length === 0)
        return 0;
    const idx = q * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi)
        return sorted[lo];
    return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
}
//# sourceMappingURL=stats.js.map