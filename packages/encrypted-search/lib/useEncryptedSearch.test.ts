import { renderHook } from '@testing-library/react-hooks';

import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { INDEXING_STATUS } from './constants';
import * as esHelpers from './esHelpers';
import * as esIDB from './esIDB';
import { useEncryptedSearch } from './useEncryptedSearch';

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

jest.mock('@proton/account/addresses/hooks', () => ({
    useAddresses: jest.fn().mockReturnValue([[], false]),
}));

jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: jest.fn().mockReturnValue({ createNotification: jest.fn() }),
}));

jest.mock('./useSearchTelemetry', () => ({
    useSearchTelemetry: jest.fn().mockReturnValue({
        sendDeleteESDataReport: jest.fn(),
    }),
}));

jest.mock('./useContentSearchTelemetry', () => ({
    useContentSearchTelemetry: jest.fn().mockReturnValue({
        sendQueryCompletedReport: jest.fn(),
        sendResultOpenedReport: jest.fn(),
        sendResultActionReport: jest.fn(),
        sendMailboxIndexCompletedReport: jest.fn(),
    }),
    getMailboxAddressType: jest.fn().mockReturnValue('proton'),
}));

jest.mock('./useEncryptedSearchStatus', () => ({
    useEncryptedSearchStatus: jest.fn().mockReturnValue([{}, jest.fn()]),
}));

jest.mock('./esIDB', () => {
    const actual = jest.requireActual('./esIDB');

    return {
        ...actual,
        hasESDB: jest.fn(),
        deleteESDB: jest.fn(),
        readEnabled: jest.fn(),
        readLimited: jest.fn(),
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

jest.mock('./esHelpers', () => ({
    ...jest.requireActual('./esHelpers'),
    getIndexKey: jest.fn(),
}));

describe('useEncryptedSearch', () => {
    describe('correctDecryptionErrors', () => {
        it('should return 0 if there is no database', async () => {
            jest.mocked(esIDB.hasESDB).mockResolvedValue(false);

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
        it('should return if there is no database', async () => {
            jest.mocked(esIDB.hasESDB).mockResolvedValue(false);

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
            jest.mocked(esIDB.hasESDB).mockResolvedValue(true);
            jest.mocked(esIDB.metadataIndexingProgress.read).mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useEncryptedSearch({
                    refreshMask: 1,
                    esCallbacks: { ...mockedESCallback },
                })
            );

            const returnValue = await result.current.initializeES();
            expect(returnValue).toBe(undefined);
            expect(esIDB.deleteESDB).toHaveBeenCalled();
            expect(traceInitiativeError).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ message: 'initializeES - zombie DB deleted (no metadata progress)' })
            );
        });
    });

    // What callers wait on to know whether the index can serve searches. It has to come before the
    // call returns, because resuming or restarting an index only returns once that index is built.
    describe('initializeES - onStateSettled', () => {
        const setupIndexedDB = (contentStatus: INDEXING_STATUS) => {
            jest.mocked(esIDB.hasESDB).mockResolvedValue(true);
            jest.mocked(esIDB.metadataIndexingProgress.read).mockResolvedValue({
                status: INDEXING_STATUS.ACTIVE,
            } as any);
            jest.mocked(esIDB.contentIndexingProgress.read).mockResolvedValue({ status: contentStatus } as any);
            jest.mocked(esIDB.readEnabled).mockResolvedValue(true);
            jest.mocked(esIDB.readLimited).mockResolvedValue(false);
            jest.mocked(esHelpers.getIndexKey).mockResolvedValue({} as CryptoKey);
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
            jest.mocked(esIDB.hasESDB).mockResolvedValue(false);
            const onStateSettled = jest.fn();

            await initialize(onStateSettled);

            expect(onStateSettled).not.toHaveBeenCalled();
        });
    });
});
