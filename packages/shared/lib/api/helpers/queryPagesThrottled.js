import { runChunksDelayed } from '../../helpers/promise';
import { chunk } from '../../helpers/array';

/**
 * Query pages throttled to not hit rate limiting.
 * @param {function} requestPage
 * @param {Number} pageSize
 * @param {Number} pagesPerChunk
 * @param {Number} delayPerChunk
 * @returns {Promise<Array>}
 */
const queryPagesThrottled = async ({ requestPage, pageSize, pagesPerChunk, delayPerChunk }) => {
    const firstPage = await requestPage(0);
    const n = Math.ceil(firstPage.Total / pageSize) - 1; // First page already loaded

    const pages = Array.from({ length: n }, (a, i) => i + 1);
    const chunks = chunk(pages, pagesPerChunk);

    const restPages = chunks.length > 0 ? await runChunksDelayed(chunks, requestPage, delayPerChunk) : [];

    return [firstPage].concat(restPages);
};

export default queryPagesThrottled;
