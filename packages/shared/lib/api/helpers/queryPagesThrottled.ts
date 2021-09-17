import { runChunksDelayed } from '../../helpers/promise';
import { chunk } from '../../helpers/array';

interface Arguments<T> {
    requestPage: (page: number) => Promise<T>;
    pageSize: number;
    pagesPerChunk: number;
    delayPerChunk: number;
}
const queryPagesThrottled = async <T extends { Total: number }>({
    requestPage,
    pageSize,
    pagesPerChunk,
    delayPerChunk,
}: Arguments<T>) => {
    const firstPage = await requestPage(0);
    const n = Math.ceil((firstPage?.Total || 0) / pageSize) - 1; // First page already loaded

    if (n <= 0) {
        return [firstPage];
    }

    const pages = Array.from({ length: n }, (a, i) => i + 1);
    const chunks = chunk(pages, pagesPerChunk);

    const restPages = chunks.length > 0 ? await runChunksDelayed(chunks, requestPage, delayPerChunk) : [];

    return [firstPage].concat(restPages);
};

export default queryPagesThrottled;
