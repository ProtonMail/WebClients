import chunk from '@proton/utils/chunk';

import { runChunksDelayed } from '../../helpers/promise';
import runInQueue from '../../helpers/runInQueue';

interface Arguments {
    pageSize: number;
    pagesPerChunk: number;
    delayPerChunk: number;
    /**
     * Run at most this many page requests at once instead of firing all chunks. Use it for slow pages:
     * a request's timeout starts when it is created, so time spent queued in the browser counts against it.
     */
    maxConcurrency?: number;
}

const queryPages = async <T extends { Total: number }>(
    requestPage: (page: number, pageSize: number) => Promise<T>,
    { pageSize = 50, pagesPerChunk = 10, delayPerChunk = 100, maxConcurrency }: Partial<Arguments> = {}
) => {
    const firstPage = await requestPage(0, pageSize);
    const n = Math.ceil((firstPage?.Total || 0) / pageSize) - 1; // First page already loaded

    if (n <= 0) {
        return [firstPage];
    }

    const pages = Array.from({ length: n }, (a, i) => i + 1);

    if (maxConcurrency) {
        // Stop taking new pages once one fails, the result is already lost
        let failed = false;
        const restPages = await runInQueue(
            pages.map((page) => () => {
                if (failed) {
                    return Promise.reject(new Error('Aborted'));
                }
                return requestPage(page, pageSize).catch((e) => {
                    failed = true;
                    throw e;
                });
            }),
            maxConcurrency
        );
        return [firstPage].concat(restPages);
    }

    const chunks = chunk(pages, pagesPerChunk);

    const restPages =
        chunks.length > 0 ? await runChunksDelayed(chunks, (idx) => requestPage(idx, pageSize), delayPerChunk) : [];

    return [firstPage].concat(restPages);
};

export default queryPages;
