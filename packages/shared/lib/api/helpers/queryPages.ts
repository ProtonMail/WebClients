import { runChunksDelayed } from '../../helpers/promise';
import { chunk } from '../../helpers/array';

interface Arguments {
    pageSize: number;
    pagesPerChunk: number;
    delayPerChunk: number;
}

const queryPages = async <T extends { Total: number }>(
    requestPage: (page: number, pageSize: number) => Promise<T>,
    { pageSize = 50, pagesPerChunk = 10, delayPerChunk = 100 }: Partial<Arguments> = {}
) => {
    const firstPage = await requestPage(0, pageSize);
    const n = Math.ceil((firstPage?.Total || 0) / pageSize) - 1; // First page already loaded

    if (n <= 0) {
        return [firstPage];
    }

    const pages = Array.from({ length: n }, (a, i) => i + 1);
    const chunks = chunk(pages, pagesPerChunk);

    const restPages =
        chunks.length > 0 ? await runChunksDelayed(chunks, (idx) => requestPage(idx, pageSize), delayPerChunk) : [];

    return [firstPage].concat(restPages);
};

export default queryPages;
