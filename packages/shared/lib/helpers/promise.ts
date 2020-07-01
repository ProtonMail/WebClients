export const wait = (delay: number) => new Promise<void>((resolve) => setTimeout(resolve, delay));

/**
 * Runs each chunk from a chunks array and waits after each one has run (unless it's the last one).
 */
export const runChunksDelayed = async <T>(
    chunks: number[][] = [],
    cb: (index: number) => Promise<T>,
    delay: number
) => {
    const promises = [];

    for (let i = 0; i < chunks.length; ++i) {
        promises.push(...chunks[i].map(cb));
        if (i !== chunks.length - 1) {
            await wait(delay);
        }
    }

    return Promise.all(promises);
};
