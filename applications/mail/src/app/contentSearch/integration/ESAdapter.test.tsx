import type { ESCallbacks } from '@proton/encrypted-search/models/esCallbacks';
import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';

import type { ESBaseMessage, ESMessageContent } from '../../models/encryptedSearch';
import type { IndexListener, IndexService } from '../indexation/IndexService';
import type { MetricService } from '../metrics/MetricService';
import type { SearchService } from '../search/SearchService';
import type { Logger } from '../utils/logger';
import { ESAdapter } from './ESAdapter';

const logger: Logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
};

/** An index service whose listener the test drives, with the historic pass finished or not. */
const fakeIndexService = (historicalFinished: boolean) => {
    let listener: IndexListener | undefined;
    const indexService = {
        subscribe: vi.fn((l: IndexListener) => {
            listener = l;
            return () => {};
        }),
        initialize: vi.fn().mockResolvedValue(undefined),
        isHistoricalFinished: vi.fn().mockResolvedValue(historicalFinished),
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
    const updateESStatus = vi.fn();
    const updateESProgress = vi.fn();
    const notifyIndexingFailed = vi.fn();
    const adapter = new ESAdapter({
        searchService: {} as SearchService,
        indexService,
        metricService: {} as MetricService,
        esCallbacks: {} as ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent>,
        updateESStatus,
        updateESProgress,
        notifyIndexingFailed,
        logger,
    });
    await adapter.initializeES();
    if (historicalFinished) {
        listener().reportIndexComplete();
    }
    updateESStatus.mockClear();
    return { listener: listener(), updateESStatus, updateESProgress, notifyIndexingFailed };
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

    describe('historic progress', () => {
        it('estimates the time remaining in a tab that only gets the progress, as one following the leader', async () => {
            const now = vi.spyOn(performance, 'now');
            const { listener, updateESProgress } = await setup(false);

            now.mockReturnValue(1_000);
            listener.reportHistoricProgress(100, 1000);
            now.mockReturnValue(61_000);
            listener.reportHistoricProgress(200, 1000);

            // 100 messages a minute, 800 to go
            expect(updateESProgress).toHaveBeenLastCalledWith(
                [200, 1000],
                expect.objectContaining({ esProgress: 200, totalIndexingItems: 1000, estimatedMinutes: 8 })
            );
            now.mockRestore();
        });
    });
});
