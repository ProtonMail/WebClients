import { renderHook } from '@testing-library/react-hooks';

import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { INDEXING_STATUS, defaultESStatus } from './constants';
import { getIndexKey } from './esHelpers/esBuild';
import { syncItemEvents } from './esHelpers/esSync';
import { readEnabled, readLimited } from './esIDB/configObjectStore';
import { deleteESDB, hasESDB } from './esIDB/indexedDB';
import { contentIndexingProgress, metadataIndexingProgress } from './esIDB/indexingProgress';
import { useEncryptedSearch } from './useEncryptedSearch';
import { useEncryptedSearchStatus } from './useEncryptedSearchStatus';

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/sentry'),
    traceInitiativeError: jest.fn(),
}));

const mockedESCallback = {
    queryItemsMetadata: jest.fn(),
    getPreviousEventID: jest.fn(),
    getSearchParams: jest.fn().mockReturnValue({
        isSearch: false,
    }),
    getKeywords: jest.fn(),
    searchKeywords: jest.fn(),
    getTotalItems: jest.fn(),
    getEventFromIDB: jest.fn(),
    getItemInfo: jest.fn(),
    resetSort: jest.fn(),
    checkIsReverse: jest.fn(),
    shouldOnlySortResults: jest.fn(),
    getSearchInterval: jest.fn(),
    applyFilters: jest.fn(),
    onContentDeletion: jest.fn(),
    correctDecryptionErrors: jest.fn(),
    getContentVersion: () => 1,
};

jest.mock('@proton/account/userKeys/hooks', () => ({
    useGetUserKeys: () => jest.fn(),
}));

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn().mockReturnValue([{ ID: 'userID' }, false]),
}));

jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: jest.fn().mockReturnValue({ createNotification: jest.fn() }),
}));

jest.mock('./useSearchTelemetry', () => ({
    ...jest.requireActual('./useSearchTelemetry'),
    useSearchTelemetry: jest.fn().mockReturnValue({
        sendDeleteESDataReport: jest.fn(),
        sendPerformSearchReport: jest.fn(),
    }),
}));

jest.mock('./useEncryptedSearchStatus', () => ({
    useEncryptedSearchStatus: jest.fn().mockReturnValue([{}, jest.fn()]),
}));

jest.mock('./esIDB/indexedDB', () => ({
    ...jest.requireActual('./esIDB/indexedDB'),
    hasESDB: jest.fn(),
    deleteESDB: jest.fn(),
}));

jest.mock('./esIDB/configObjectStore', () => ({
    ...jest.requireActual('./esIDB/configObjectStore'),
    readEnabled: jest.fn(),
    readLimited: jest.fn(),
}));

jest.mock('./esIDB/indexingProgress', () => {
    const actual = jest.requireActual('./esIDB/indexingProgress');

    return {
        ...actual,
        metadataIndexingProgress: {
            ...actual.metadataIndexingProgress,
            read: jest.fn(),
        },
        contentIndexingProgress: {
            ...actual.contentIndexingProgress,
            read: jest.fn(),
        },
    };
});

jest.mock('./esHelpers/esSync', () => ({
    ...jest.requireActual('./esHelpers/esSync'),
    syncItemEvents: jest.fn(),
}));

jest.mock('./esHelpers/esCache', () => ({
    ...jest.requireActual('./esHelpers/esCache'),
    refreshESCache: jest.fn(),
}));

jest.mock('./esHelpers/esRetries', () => ({
    ...jest.requireActual('./esHelpers/esRetries'),
    retryAPICalls: jest.fn(),
}));

jest.mock('./esIDB/events', () => ({
    ...jest.requireActual('./esIDB/events'),
    writeAllEvents: jest.fn(),
}));

jest.mock('./esHelpers/esBuild', () => ({
    ...jest.requireActual('./esHelpers/esBuild'),
    getIndexKey: jest.fn(),
}));

describe('useEncryptedSearch', () => {
    describe('correctDecryptionErrors', () => {
        it('should return 0 if there is no database', async () => {
            jest.mocked(hasESDB).mockResolvedValue(false);

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
            jest.mocked(traceInitiativeError).mockClear();
        });

        it('should return if there is no database', async () => {
            jest.mocked(hasESDB).mockResolvedValue(false);

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
            jest.mocked(hasESDB).mockResolvedValue(true);
            jest.mocked(metadataIndexingProgress.read).mockResolvedValue(undefined);

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
    });

    // What callers wait on to know whether the index can serve searches. It has to come before the
    // call returns, because resuming or restarting an index only returns once that index is built.
    describe('initializeES - onStateSettled', () => {
        const setupIndexedDB = (contentStatus: INDEXING_STATUS) => {
            jest.mocked(hasESDB).mockResolvedValue(true);
            jest.mocked(metadataIndexingProgress.read).mockResolvedValue({
                status: INDEXING_STATUS.ACTIVE,
            } as any);
            jest.mocked(contentIndexingProgress.read).mockResolvedValue({ status: contentStatus } as any);
            jest.mocked(readEnabled).mockResolvedValue(true);
            jest.mocked(readLimited).mockResolvedValue(false);
            jest.mocked(getIndexKey).mockResolvedValue({} as CryptoKey);
        };

        const initialize = async (onStateSettled: jest.Mock) => {
            const { result } = renderHook(() =>
                useEncryptedSearch({
                    refreshMask: 1,
                    esCallbacks: {
                        ...mockedESCallback,
                        getEventFromIDB: jest
                            .fn()
                            .mockResolvedValue({ newEvents: [], shouldRefresh: false, eventsToStore: {} }),
                    },
                })
            );

            await result.current.initializeES({ onStateSettled });
        };

        it('should report an index that can serve searches', async () => {
            setupIndexedDB(INDEXING_STATUS.ACTIVE);
            const onStateSettled = jest.fn();

            await initialize(onStateSettled);

            expect(onStateSettled).toHaveBeenCalledWith({
                dbExists: true,
                esEnabled: true,
                contentIndexingDone: true,
            });
        });

        it('should report an index whose content is still being indexed', async () => {
            setupIndexedDB(INDEXING_STATUS.INDEXING);
            const onStateSettled = jest.fn();

            await initialize(onStateSettled);

            expect(onStateSettled).toHaveBeenCalledWith(expect.objectContaining({ contentIndexingDone: false }));
        });

        // Nothing was concluded, so nothing is reported: the caller is expected to settle on the call
        // returning instead (see `EncryptedSearchProvider`).
        it('should report nothing when there is no database', async () => {
            jest.mocked(hasESDB).mockResolvedValue(false);
            const onStateSettled = jest.fn();

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
            jest.mocked(useEncryptedSearchStatus).mockReturnValue([
                {
                    ...defaultESStatus,
                    dbExists: true,
                    esEnabled: true,
                    isSearchPartial: false,
                    previousESSearchParams: {},
                    permanentResults,
                    cachedIndexKey: {} as CryptoKey,
                },
                jest.fn(),
            ] as any);
            jest.mocked(contentIndexingProgress.read).mockResolvedValue(undefined);
            jest.mocked(readLimited).mockResolvedValue(false);

            let finishSync = () => {};
            jest.mocked(syncItemEvents).mockImplementation(
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
                        getSearchParams: jest.fn().mockReturnValue({ isSearch: true, esSearchParams: {} }),
                        shouldOnlySortResults: jest.fn().mockReturnValue(true),
                    },
                })
            );

            await result.current.handleEvent({ Items: [{}], eventsToStore: {}, Refresh: 0 } as any);
            const setResultsList = jest.fn();
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
            jest.useFakeTimers();
            const permanentResults = [{ ID: 'kept' }, { ID: 'moved' }];
            jest.mocked(useEncryptedSearchStatus).mockReturnValue([
                {
                    ...defaultESStatus,
                    dbExists: true,
                    esEnabled: true,
                    isSearchPartial: false,
                    previousESSearchParams: {},
                    permanentResults,
                    cachedIndexKey: {} as CryptoKey,
                },
                jest.fn(),
            ] as any);
            jest.mocked(syncItemEvents).mockReturnValue(new Promise(() => {}));

            const { result } = renderHook(() =>
                useEncryptedSearch({
                    refreshMask: 1,
                    esCallbacks: {
                        ...mockedESCallback,
                        getSearchParams: jest.fn().mockReturnValue({ isSearch: true, esSearchParams: {} }),
                        shouldOnlySortResults: jest.fn().mockReturnValue(true),
                    },
                })
            );

            await result.current.handleEvent({ Items: [{}], eventsToStore: {}, Refresh: 0 } as any);
            const setResultsList = jest.fn();
            const search = result.current.encryptedSearch(setResultsList);

            await jest.advanceTimersByTimeAsync(1000);
            expect(setResultsList).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1000);
            await expect(search).resolves.toBe(true);
            expect(setResultsList).toHaveBeenCalledWith(permanentResults);

            jest.useRealTimers();
        });
    });
});
