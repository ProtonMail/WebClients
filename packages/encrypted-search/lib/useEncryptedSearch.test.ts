import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { INDEXING_STATUS, defaultESStatus } from './constants';
import { getIndexKey } from './esHelpers/esBuild';
import { syncItemEvents } from './esHelpers/esSync';
import { readEnabled, readLimited } from './esIDB/configObjectStore';
import { deleteESDB, hasESDB } from './esIDB/indexedDB';
import { contentIndexingProgress, metadataIndexingProgress } from './esIDB/indexingProgress';
import type * as IndexingProgress from './esIDB/indexingProgress';
import { useEncryptedSearch } from './useEncryptedSearch';
import { useEncryptedSearchStatus } from './useEncryptedSearchStatus';

vi.mock('@proton/shared/lib/helpers/sentry', async () => ({
    ...(await vi.importActual('@proton/shared/lib/helpers/sentry')),
    traceInitiativeError: vi.fn(),
}));

const mockedESCallback = {
    queryItemsMetadata: vi.fn(),
    getPreviousEventID: vi.fn(),
    getSearchParams: vi.fn().mockReturnValue({
        isSearch: false,
    }),
    getKeywords: vi.fn(),
    searchKeywords: vi.fn(),
    getTotalItems: vi.fn(),
    getEventFromIDB: vi.fn(),
    getItemInfo: vi.fn(),
    resetSort: vi.fn(),
    checkIsReverse: vi.fn(),
    shouldOnlySortResults: vi.fn(),
    getSearchInterval: vi.fn(),
    applyFilters: vi.fn(),
    onContentDeletion: vi.fn(),
    correctDecryptionErrors: vi.fn(),
    getContentVersion: () => 1,
};

vi.mock('@proton/account/userKeys/hooks', async () => ({
    useGetUserKeys: () => vi.fn(),
}));

vi.mock('@proton/account/user/hooks', async () => ({
    useUser: vi.fn().mockReturnValue([{ ID: 'userID' }, false]),
}));

vi.mock('@proton/app-context/useNotifications', async () => ({
    useNotifications: vi.fn().mockReturnValue({ createNotification: vi.fn() }),
}));

vi.mock('./useSearchTelemetry', async () => ({
    ...(await vi.importActual('./useSearchTelemetry')),
    useSearchTelemetry: vi.fn().mockReturnValue({
        sendDeleteESDataReport: vi.fn(),
        sendPerformSearchReport: vi.fn(),
    }),
}));

vi.mock('./useEncryptedSearchStatus', async () => ({
    useEncryptedSearchStatus: vi.fn().mockReturnValue([{}, vi.fn()]),
}));

vi.mock('./esIDB/indexedDB', async () => ({
    ...(await vi.importActual('./esIDB/indexedDB')),
    hasESDB: vi.fn(),
    deleteESDB: vi.fn(),
}));

vi.mock('./esIDB/configObjectStore', async () => ({
    ...(await vi.importActual('./esIDB/configObjectStore')),
    readEnabled: vi.fn(),
    readLimited: vi.fn(),
}));

vi.mock('./esIDB/indexingProgress', async () => {
    const actual = await vi.importActual<typeof IndexingProgress>('./esIDB/indexingProgress');

    return {
        ...actual,
        metadataIndexingProgress: {
            ...actual.metadataIndexingProgress,
            read: vi.fn(),
        },
        contentIndexingProgress: {
            ...actual.contentIndexingProgress,
            read: vi.fn(),
        },
    };
});

vi.mock('./esHelpers/esSync', async () => ({
    ...(await vi.importActual('./esHelpers/esSync')),
    syncItemEvents: vi.fn(),
}));

vi.mock('./esHelpers/esCache', async () => ({
    ...(await vi.importActual('./esHelpers/esCache')),
    refreshESCache: vi.fn(),
}));

vi.mock('./esHelpers/esRetries', async () => ({
    ...(await vi.importActual('./esHelpers/esRetries')),
    retryAPICalls: vi.fn(),
}));

vi.mock('./esIDB/events', async () => ({
    ...(await vi.importActual('./esIDB/events')),
    writeAllEvents: vi.fn(),
}));

vi.mock('./esHelpers/esBuild', async () => ({
    ...(await vi.importActual('./esHelpers/esBuild')),
    getIndexKey: vi.fn(),
}));

describe('useEncryptedSearch', () => {
    describe('correctDecryptionErrors', () => {
        it('should return 0 if there is no database', async () => {
            vi.mocked(hasESDB).mockResolvedValue(false);

            const { result } = renderHook(() =>
                useEncryptedSearch({
                    refreshMask: 1,
                    esCallbacks: { ...mockedESCallback },
                })
            );

            const returnValue = await result.current.correctDecryptionErrors();
            expect(returnValue).toBe(0);
        });
    });

    describe('initializeES', () => {
        beforeEach(() => {
            vi.mocked(traceInitiativeError).mockClear();
        });

        it('should return if there is no database', async () => {
            vi.mocked(hasESDB).mockResolvedValue(false);

            const { result } = renderHook(() =>
                useEncryptedSearch({
                    refreshMask: 1,
                    esCallbacks: { ...mockedESCallback },
                })
            );

            const returnValue = await result.current.initializeES();
            expect(returnValue).toBe(undefined);
        });

        it('should delete the database if metadata progress is missing (zombie DB)', async () => {
            vi.mocked(hasESDB).mockResolvedValue(true);
            vi.mocked(metadataIndexingProgress.read).mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useEncryptedSearch({
                    refreshMask: 1,
                    esCallbacks: { ...mockedESCallback },
                })
            );

            const returnValue = await result.current.initializeES();
            expect(returnValue).toBe(undefined);
            expect(deleteESDB).toHaveBeenCalled();
            expect(traceInitiativeError).not.toHaveBeenCalled();
        });

        it('should delete the database if the index key is missing', async () => {
            vi.mocked(deleteESDB).mockClear();
            vi.mocked(traceInitiativeError).mockClear();
            vi.mocked(hasESDB).mockResolvedValue(true);
            vi.mocked(metadataIndexingProgress.read).mockResolvedValue({
                status: INDEXING_STATUS.ACTIVE,
            } as any);
            vi.mocked(getIndexKey).mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useEncryptedSearch({
                    refreshMask: 1,
                    esCallbacks: { ...mockedESCallback },
                })
            );

            const returnValue = await result.current.initializeES();
            expect(returnValue).toBe(undefined);
            expect(deleteESDB).toHaveBeenCalled();
            expect(traceInitiativeError).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ message: expect.stringContaining('initializeES - No index key') })
            );
        });
    });

    // What callers wait on to know whether the index can serve searches. It has to come before the
    // call returns, because resuming or restarting an index only returns once that index is built.
    describe('initializeES - onStateSettled', () => {
        const setupIndexedDB = (contentStatus: INDEXING_STATUS) => {
            vi.mocked(hasESDB).mockResolvedValue(true);
            vi.mocked(metadataIndexingProgress.read).mockResolvedValue({
                status: INDEXING_STATUS.ACTIVE,
            } as any);
            vi.mocked(contentIndexingProgress.read).mockResolvedValue({ status: contentStatus } as any);
            vi.mocked(readEnabled).mockResolvedValue(true);
            vi.mocked(readLimited).mockResolvedValue(false);
            vi.mocked(getIndexKey).mockResolvedValue({} as CryptoKey);
        };

        const initialize = async (onStateSettled: Mock) => {
            const { result } = renderHook(() =>
                useEncryptedSearch({
                    refreshMask: 1,
                    esCallbacks: {
                        ...mockedESCallback,
                        getEventFromIDB: vi
                            .fn()
                            .mockResolvedValue({ newEvents: [], shouldRefresh: false, eventsToStore: {} }),
                    },
                })
            );

            await result.current.initializeES({ onStateSettled });
        };

        it('should report an index that can serve searches', async () => {
            setupIndexedDB(INDEXING_STATUS.ACTIVE);
            const onStateSettled = vi.fn();

            await initialize(onStateSettled);

            expect(onStateSettled).toHaveBeenCalledWith({
                dbExists: true,
                esEnabled: true,
                contentIndexingDone: true,
            });
        });

        it('should report an index whose content is still being indexed', async () => {
            setupIndexedDB(INDEXING_STATUS.INDEXING);
            const onStateSettled = vi.fn();

            await initialize(onStateSettled);

            expect(onStateSettled).toHaveBeenCalledWith(expect.objectContaining({ contentIndexingDone: false }));
        });

        // Nothing was concluded, so nothing is reported: the caller is expected to settle on the call
        // returning instead (see `EncryptedSearchProvider`).
        it('should report nothing when there is no database', async () => {
            vi.mocked(hasESDB).mockResolvedValue(false);
            const onStateSettled = vi.fn();

            await initialize(onStateSettled);

            expect(onStateSettled).not.toHaveBeenCalled();
        });
    });

    // The same query runs again when an event invalidates the mail list. If that event is still being
    // synced into the results, handing them back early puts a message just moved out of them (e.g. to
    // Trash) back in the list.
    describe('encryptedSearch - same query while an event is syncing', () => {
        it('should hand back the results only once the event is synced', async () => {
            const kept = { ID: 'kept' };
            const moved = { ID: 'moved' };
            const permanentResults = [kept, moved];
            vi.mocked(useEncryptedSearchStatus).mockReturnValue([
                {
                    ...defaultESStatus,
                    dbExists: true,
                    esEnabled: true,
                    isSearchPartial: false,
                    previousESSearchParams: {},
                    permanentResults,
                    cachedIndexKey: {} as CryptoKey,
                },
                vi.fn(),
            ] as any);
            vi.mocked(contentIndexingProgress.read).mockResolvedValue(undefined);
            vi.mocked(readLimited).mockResolvedValue(false);

            let finishSync = () => {};
            vi.mocked(syncItemEvents).mockImplementation(
                () =>
                    new Promise((resolve) => {
                        finishSync = () => {
                            permanentResults.splice(permanentResults.indexOf(moved), 1);
                            resolve(false);
                        };
                    })
            );

            const { result } = renderHook(() =>
                useEncryptedSearch({
                    refreshMask: 1,
                    esCallbacks: {
                        ...mockedESCallback,
                        getSearchParams: vi.fn().mockReturnValue({ isSearch: true, esSearchParams: {} }),
                        shouldOnlySortResults: vi.fn().mockReturnValue(true),
                    },
                })
            );

            await result.current.handleEvent({ Items: [{}], eventsToStore: {}, Refresh: 0 } as any);
            const setResultsList = vi.fn();
            const search = result.current.encryptedSearch(setResultsList);
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(setResultsList).not.toHaveBeenCalled();

            finishSync();

            await expect(search).resolves.toBe(true);
            expect(setResultsList).toHaveBeenCalledTimes(1);
            expect(setResultsList).toHaveBeenCalledWith([kept]);
        });

        // A failing sync retries itself indefinitely, so the wait is capped
        it('should hand back the results anyway when the sync takes too long', async () => {
            vi.useFakeTimers();
            const permanentResults = [{ ID: 'kept' }, { ID: 'moved' }];
            vi.mocked(useEncryptedSearchStatus).mockReturnValue([
                {
                    ...defaultESStatus,
                    dbExists: true,
                    esEnabled: true,
                    isSearchPartial: false,
                    previousESSearchParams: {},
                    permanentResults,
                    cachedIndexKey: {} as CryptoKey,
                },
                vi.fn(),
            ] as any);
            vi.mocked(syncItemEvents).mockReturnValue(new Promise(() => {}));

            const { result } = renderHook(() =>
                useEncryptedSearch({
                    refreshMask: 1,
                    esCallbacks: {
                        ...mockedESCallback,
                        getSearchParams: vi.fn().mockReturnValue({ isSearch: true, esSearchParams: {} }),
                        shouldOnlySortResults: vi.fn().mockReturnValue(true),
                    },
                })
            );

            await result.current.handleEvent({ Items: [{}], eventsToStore: {}, Refresh: 0 } as any);
            const setResultsList = vi.fn();
            const search = result.current.encryptedSearch(setResultsList);

            await vi.advanceTimersByTimeAsync(1000);
            expect(setResultsList).not.toHaveBeenCalled();

            await vi.advanceTimersByTimeAsync(1000);
            await expect(search).resolves.toBe(true);
            expect(setResultsList).toHaveBeenCalledWith(permanentResults);

            vi.useRealTimers();
        });
    });
});
