/**
 * Yields chunks of an array for non-blocking processing.
 * Uses setImmediate (Node) or setTimeout (browser) between chunks.
 */
export async function* asyncChunks<T>(
  items: ReadonlyArray<T>,
  chunkSize = 5_000,
): AsyncGenerator<T[]> {
  for (let i = 0; i < items.length; i += chunkSize) {
    yield items.slice(i, i + chunkSize) as T[];
    if (i + chunkSize < items.length) {
      await yieldControl();
    }
  }
}

/** Yield control to the event loop */
export function yieldControl(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof setImmediate !== 'undefined') {
      setImmediate(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/** Process large arrays non-blocking, returning all results */
export async function processInChunks<T, R>(
  items: ReadonlyArray<T>,
  fn: (item: T, index: number) => R,
  chunkSize = 5_000,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let globalIndex = 0;
  for await (const chunk of asyncChunks(items, chunkSize)) {
    for (const item of chunk) {
      results[globalIndex] = fn(item, globalIndex);
      globalIndex++;
    }
  }
  return results;
}
