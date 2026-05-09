import { processInChunks } from '../utils/chunk';
export async function filterRows(rows, predicate) {
    // For small datasets — sync fast path
    if (rows.length < 50_000) {
        const result = [];
        for (let i = 0; i < rows.length; i++) {
            if (predicate(rows[i], i))
                result.push(rows[i]);
        }
        return result;
    }
    // Large datasets — chunk to avoid blocking
    const flags = await processInChunks(rows, (row, idx) => predicate(row, idx));
    return rows.filter((_, i) => flags[i]);
}
//# sourceMappingURL=filter.js.map