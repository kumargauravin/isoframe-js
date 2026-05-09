/**
 * Hash-Join — O(n+m) not O(n*m).
 * Builds a hash-map of `other` keyed by `foreignKey`, then streams `primary`.
 */
export async function hashJoin(primaryRows, otherRows, primaryKey, foreignKey, type = 'left') {
    // Phase 1: Build hash map of other (O(m))
    const hashMap = new Map();
    for (const row of otherRows) {
        const key = row[foreignKey];
        const bucket = hashMap.get(key);
        if (bucket) {
            bucket.push(row);
        }
        else {
            hashMap.set(key, [row]);
        }
    }
    const result = [];
    // Phase 2: Probe (O(n))
    const matchedOtherKeys = new Set();
    for (const pRow of primaryRows) {
        const key = pRow[primaryKey];
        const matches = hashMap.get(key);
        if (matches && matches.length > 0) {
            for (const oRow of matches) {
                result.push({ ...oRow, ...pRow }); // primary wins on collision
            }
            if (type === 'right' || type === 'outer') {
                matchedOtherKeys.add(key);
            }
        }
        else if (type === 'left' || type === 'outer') {
            result.push({ ...pRow });
        }
    }
    // For right/outer: add unmatched rows from other
    if (type === 'right' || type === 'outer') {
        for (const oRow of otherRows) {
            const key = oRow[foreignKey];
            if (!matchedOtherKeys.has(key)) {
                result.push({ ...oRow });
            }
        }
    }
    return result;
}
//# sourceMappingURL=join.js.map