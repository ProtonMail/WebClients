import type { ESCallbacks } from '@proton/encrypted-search/models/esCallbacks';
import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';

import type { ESBaseMessage, ESMessageContent } from '../../models/encryptedSearch';
import type { IndexListener, IndexService } from '../indexation/IndexService';
import type { MetricService } from '../metrics/MetricService';
import type { SearchService } from '../search/SearchService';
import type { Logger } from '../utils/logger';
import { ESAdapter } from './ESAdapter';

const logger: Logger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
};

/** An index service whose listener the test drives, with the historic pass finished or not. */
const fakeIndexService = (historicalFinished: boolean) => {
    let listener: IndexListener | undefined;
    const indexService = {
        subscribe: jest.fn((l: IndexListener) => {
            listener = l;
            return () => {};
        }),
        initialize: jest.fn().mockResolvedValue(undefined),
        isHistoricalFinished: jest.fn().mockResolvedValue(historicalFinished),
    } as unknown as IndexService;
    return {
        indexService,
        listener: () => {
            return listener!;
        },
    };
};

const setup = async (historicalFinished: boolean) => {
    const { indexService, listener } = fakeIndexService(historicalFinished);
    const updateESStatus = jest.fn();
    const notifyIndexingFailed = jest.fn();
    const adapter = new ESAdapter({
        searchService: {} as SearchService,
        indexService,
        metricService: {} as MetricService,
        esCallbacks: {} as ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent>,
        updateESStatus,
        updateESProgress: jest.fn(),
        notifyIndexingFailed,
        logger,
    });
    await adapter.initializeES();
    if (historicalFinished) {
        listener().reportIndexComplete();
    }
    updateESStatus.mockClear();
    return { listener: listener(), updateESStatus, notifyIndexingFailed };
};

const flushPromises = () => {
    return new Promise((resolve) => setTimeout(resolve, 0));
};

describe('ESAdapter', () => {
    describe('indexing errors', () => {
        it('reports the indexing as failed while the historic pass is unfinished', async () => {
            const { listener, updateESStatus, notifyIndexingFailed } = await setup(false);

            listener.reportError(new Error('metadata request failed'));
            await flushPromises();

            expect(updateESStatus).toHaveBeenCalledWith(expect.objectContaining({ contentIndexingDone: false }));
            expect(notifyIndexingFailed).toHaveBeenCalledTimes(1);
        });

        it('keeps search available when catch-up or a live update fails after the historic pass', async () => {
            const { listener, updateESStatus, notifyIndexingFailed } = await setup(true);

            listener.reportError(new Error('event request failed'));
            await flushPromises();

            expect(updateESStatus).not.toHaveBeenCalled();
            expect(notifyIndexingFailed).not.toHaveBeenCalled();
        });
    });
});
