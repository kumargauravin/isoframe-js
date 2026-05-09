/**
 * Yields chunks of an array for non-blocking processing.
 * Uses setImmediate (Node) or setTimeout (browser) between chunks.
 */
export declare function asyncChunks<T>(items: ReadonlyArray<T>, chunkSize?: number): AsyncGenerator<T[]>;
/** Yield control to the event loop */
export declare function yieldControl(): Promise<void>;
/** Process large arrays non-blocking, returning all results */
export declare function processInChunks<T, R>(items: ReadonlyArray<T>, fn: (item: T, index: number) => R, chunkSize?: number): Promise<R[]>;
