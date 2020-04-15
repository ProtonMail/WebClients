import { Api } from '../../interfaces';

const MAX_ITERATIONS = 100;

const paginatedFetch = async <T>(
    api: Api,
    cb: (pageNumber: number, pageSize: number) => Promise<T[]>,
    max = MAX_ITERATIONS
) => {
    const pageSize = 100;
    let pageNumber = 1;
    let result: T[] = [];

    while (pageNumber < max) {
        const page = await cb(pageNumber, pageSize);
        result = result.concat(page);
        if (page.length !== pageSize) {
            break;
        }
        pageNumber++;
    }

    return result;
};

export default paginatedFetch;
