/**
 * Creates a debounced buffer that accumulates items and flushes them in batches.
 * Useful when consuming async iterators that may yield items faster than the UI can process.
 *
 * @param flush - Called with accumulated items when the buffer is flushed
 * @param debounceMs - Delay before flushing after the last push (default: 200ms)
 *
 * TODO: Check if this debounce is still needed after full SDK migration (items may no longer
 * come from cache and cause excessive re-renders).
 */
export const createDebouncedBuffer = <T>(flush: (items: T[]) => void, debounceMs = 200) => {
    const buffer: T[] = [];
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleFlush = () => {
        if (flushTimer !== null) {
            clearTimeout(flushTimer);
        }
        flushTimer = setTimeout(() => {
            flushTimer = null;
            if (buffer.length > 0) {
                flush(buffer.splice(0));
            }
        }, debounceMs);
    };

    return {
        push: (item: T) => {
            buffer.push(item);
            scheduleFlush();
        },
        drain: () => {
            if (flushTimer !== null) {
                clearTimeout(flushTimer);
                flushTimer = null;
            }
            if (buffer.length > 0) {
                flush(buffer.splice(0));
            }
        },
    };
};
