import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';

import { IndexReader } from './IndexReader';
import SearchWorker from './SearchWorker';

jest.mock('../init', () => ({ initWasm: jest.fn() }));
jest.mock('../db/open', () => ({ openContentSearchDB: jest.fn() }));
jest.mock('./query', () => ({ buildQuery: jest.fn() }));
jest.mock('./IndexReader', () => ({ IndexReader: jest.fn() }));

const IndexReaderMock = jest.mocked(IndexReader);

const startWorker = async (readerSearch: jest.Mock) => {
    IndexReaderMock.mockImplementation(() => {
        return { search: readerSearch } as unknown as IndexReader;
    });
    const worker = new SearchWorker();
    await worker.init('user1', {} as CryptoKey, jest.fn());
    return worker;
};

const flush = () => {
    return new Promise((resolve) => setTimeout(resolve, 0));
};

describe('SearchWorker.search', () => {
    it('resolves only once every result batch was delivered to the main thread', async () => {
        const worker = await startWorker(
            jest.fn(async (_exp, resultCallback: (results: string[]) => void) => {
                resultCallback(['a']);
                resultCallback(['b']);
            })
        );
        const deliveries: (() => void)[] = [];
        const resultCallback = jest.fn((_results: string[]) => {
            return new Promise<void>((resolve) => {
                deliveries.push(resolve);
            });
        });

        let isDone = false;
        const search = worker.search({} as NormalizedSearchParams, resultCallback).then(() => {
            isDone = true;
        });
        await flush();

        expect(resultCallback.mock.calls).toEqual([[['a']], [['b']]]);
        expect(isDone).toBe(false);

        deliveries[0]();
        await flush();
        expect(isDone).toBe(false);

        deliveries[1]();
        await search;
        expect(isDone).toBe(true);
    });

    it('waits for the batches it already sent when a newer search aborts it', async () => {
        const readerSearch: jest.Mock = jest.fn(async () => {});
        readerSearch.mockImplementationOnce(
            async (_exp: unknown, resultCallback: (results: string[]) => void, abortSignal: AbortSignal) => {
                resultCallback(['a']);
                await new Promise<void>((_resolve, reject) => {
                    abortSignal.addEventListener('abort', () => {
                        const error = new Error('aborted');
                        error.name = 'AbortError';
                        reject(error);
                    });
                });
            }
        );
        const worker = await startWorker(readerSearch);
        let resolveDelivery: () => void = () => {};
        const resultCallback = jest.fn((_results: string[]) => {
            return new Promise<void>((resolve) => {
                resolveDelivery = resolve;
            });
        });

        let isDone = false;
        const abortedSearch = worker.search({} as NormalizedSearchParams, resultCallback).then(() => {
            isDone = true;
        });
        await flush();
        await worker.search({} as NormalizedSearchParams, jest.fn());
        await flush();

        expect(resultCallback.mock.calls).toEqual([[['a']]]);
        expect(isDone).toBe(false);

        resolveDelivery();
        await abortedSearch;
        expect(isDone).toBe(true);
    });
});
