/**
 * Yields chunks of an array for non-blocking processing.
 * Uses setImmediate (Node) or setTimeout (browser) between chunks.
 */
export async function* asyncChunks(items, chunkSize = 5_000) {
    for (let i = 0; i < items.length; i += chunkSize) {
        yield items.slice(i, i + chunkSize);
        if (i + chunkSize < items.length) {
            await yieldControl();
        }
    }
}
/** Yield control to the event loop */
export function yieldControl() {
    return new Promise((resolve) => {
        if (typeof setImmediate !== 'undefined') {
            setImmediate(resolve);
        }
        else {
            setTimeout(resolve, 0);
        }
    });
}
/** Process large arrays non-blocking, returning all results */
export async function processInChunks(items, fn, chunkSize = 5_000) {
    const results = new Array(items.length);
    let globalIndex = 0;
    for await (const chunk of asyncChunks(items, chunkSize)) {
        for (const item of chunk) {
            results[globalIndex] = fn(item, globalIndex);
            globalIndex++;
        }
    }
    return results;
}
//# sourceMappingURL=chunk.js.map