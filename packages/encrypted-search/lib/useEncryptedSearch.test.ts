import { renderHook } from '@testing-library/react-hooks';

import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import * as esIDB from './esIDB';
import { useEncryptedSearch } from './useEncryptedSearch';

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    traceInitiativeError: jest.fn(),
    SentryCommonInitiatives: jest.requireActual('@proton/shared/lib/helpers/sentry').SentryCommonInitiatives,
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
};

jest.mock('@proton/account/userKeys/hooks', () => ({
    useGetUserKeys: () => jest.fn(),
}));

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn().mockReturnValue([{ ID: 'userID' }, false]),
}));

jest.mock('@proton/components/hooks/useNotifications', () =>
    jest.fn().mockReturnValue({ createNotification: jest.fn() })
);

jest.mock('./useSearchTelemetry', () => ({
    useSearchTelemetry: jest.fn().mockReturnValue({
        sendDeleteESDataReport: jest.fn(),
    }),
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
        metadataIndexingProgress: {
            ...actual.metadataIndexingProgress,
            read: jest.fn(),
        },
    };
});

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
});
