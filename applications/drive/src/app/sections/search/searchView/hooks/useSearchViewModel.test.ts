import { act, renderHook, waitFor } from '@testing-library/react';

import { getNotificationsManager } from '@proton/drive/modules/notifications';

import { useSearchModule, useUrlSearchParams } from '../../../../modules/search';
import { sendErrorReportForSearch } from '../../../../modules/search/internal/shared/errors';
import { useSearchViewStore } from '../store';
import { loadNodesForSearchView } from './loadNodesForSearchView';
import { useSearchViewModel } from './useSearchViewModel';

jest.mock('../../../../modules/search', () => ({
    useSearchModule: jest.fn(),
    useUrlSearchParams: jest.fn(),
    tryCatchWithNotification: jest.fn((fn: () => unknown) => fn),
}));

jest.mock('./loadNodesForSearchView', () => ({
    loadNodesForSearchView: jest.fn(),
}));

jest.mock('../../../../modules/search/internal/shared/errors', () => ({
    sendErrorReportForSearch: jest.fn(),
}));

jest.mock('@proton/drive/modules/notifications', () => ({
    getNotificationsManager: jest.fn(),
}));

const mockedUseSearchModule = jest.mocked(useSearchModule);
const mockedUseUrlSearchParams = jest.mocked(useUrlSearchParams);
const mockedLoadNodesForSearchView = jest.mocked(loadNodesForSearchView);
const mockedGetNotificationsManager = jest.mocked(getNotificationsManager);
const mockedSendErrorReportForSearch = jest.mocked(sendErrorReportForSearch);

const makeModule = (overrides: Record<string, unknown> = {}) => ({
    isAvailable: true,
    isUserOptIn: true,
    isSearchable: true,
    search: jest.fn().mockImplementation(async function* () {
        return;
    }),
    optIn: jest.fn(),
    indexingProgress: { files: 0, folders: 0, albums: 0, photos: 0 },
    ...overrides,
});

const makeSearch = (...uids: string[]) =>
    jest.fn().mockImplementation(async function* () {
        for (const uid of uids) {
            yield { nodeUid: uid, score: 0.9 };
        }
    });

const range = (n: number, prefix = 'uid-') => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);

describe('useSearchViewModel', () => {
    let mockClearAll: jest.Mock;
    let mockSetLoading: jest.Mock;
    let mockCreateNotification: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockClearAll = jest.fn();
        mockSetLoading = jest.fn();
        mockCreateNotification = jest.fn();

        jest.spyOn(useSearchViewStore, 'getState').mockReturnValue({
            clearAll: mockClearAll,
            setLoading: mockSetLoading,
        } as any);

        mockedUseUrlSearchParams.mockReturnValue(['test-query', jest.fn()] as any);
        mockedLoadNodesForSearchView.mockResolvedValue({ hadPartialErrors: false });
        mockedGetNotificationsManager.mockReturnValue({ createNotification: mockCreateNotification } as any);
        mockedUseSearchModule.mockReturnValue(makeModule() as any);
    });

    it('does not search when module is not searchable', async () => {
        mockedUseSearchModule.mockReturnValue(makeModule({ isSearchable: false }) as any);
        renderHook(() => useSearchViewModel());

        await act(async () => {});

        expect(mockedLoadNodesForSearchView).not.toHaveBeenCalled();
        expect(mockClearAll).not.toHaveBeenCalled();
    });

    it('passes all UIDs to loadNodesForSearchView in a single call', async () => {
        mockedUseSearchModule.mockReturnValue(makeModule({ search: makeSearch('uid-1', 'uid-2', 'uid-3') }) as any);

        renderHook(() => useSearchViewModel());

        await waitFor(() => expect(mockSetLoading).toHaveBeenCalledWith(false));

        expect(mockClearAll).toHaveBeenCalledTimes(1);
        expect(mockedLoadNodesForSearchView).toHaveBeenCalledTimes(1);
        expect(mockedLoadNodesForSearchView).toHaveBeenCalledWith(['uid-1', 'uid-2', 'uid-3'], expect.any(AbortSignal));
    });

    it('passes all UIDs regardless of count in a single call', async () => {
        mockedUseSearchModule.mockReturnValue(makeModule({ search: makeSearch(...range(600)) }) as any);

        renderHook(() => useSearchViewModel());

        await waitFor(() => expect(mockedLoadNodesForSearchView).toHaveBeenCalledTimes(1));

        expect(mockedLoadNodesForSearchView.mock.calls[0][0]).toHaveLength(600);
    });

    it('deduplicates UIDs yielded multiple times by the generator', async () => {
        mockedUseSearchModule.mockReturnValue(makeModule({ search: makeSearch('uid-1', 'uid-1', 'uid-2') }) as any);

        renderHook(() => useSearchViewModel());

        await waitFor(() => expect(mockSetLoading).toHaveBeenCalledWith(false));

        expect(mockedLoadNodesForSearchView).toHaveBeenCalledWith(['uid-1', 'uid-2'], expect.any(AbortSignal));
    });

    it('isSearching is true during search and false after', async () => {
        let resolveGenerator!: () => void;
        const blocker = new Promise<void>((res) => {
            resolveGenerator = res;
        });

        mockedUseSearchModule.mockReturnValue(
            makeModule({
                search: jest.fn().mockImplementation(async function* () {
                    yield { nodeUid: 'uid-1', score: 0.9 };
                    await blocker;
                }),
            }) as any
        );

        const { result } = renderHook(() => useSearchViewModel());

        await waitFor(() => expect(result.current.isSearching).toBe(true));

        act(() => resolveGenerator());

        await waitFor(() => expect(result.current.isSearching).toBe(false));
    });

    it('shows one notification when any chunk reports partial errors', async () => {
        mockedUseSearchModule.mockReturnValue(makeModule({ search: makeSearch('uid-1') }) as any);
        mockedLoadNodesForSearchView.mockResolvedValue({ hadPartialErrors: true });

        renderHook(() => useSearchViewModel());

        await waitFor(() => expect(mockCreateNotification).toHaveBeenCalledTimes(1));

        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    it('shows fatal-error notification and reports to Sentry when load throws', async () => {
        mockedUseSearchModule.mockReturnValue(makeModule({ search: makeSearch('uid-1') }) as any);
        mockedLoadNodesForSearchView.mockRejectedValue(new Error('boom'));

        renderHook(() => useSearchViewModel());

        await waitFor(() => expect(mockCreateNotification).toHaveBeenCalled());

        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
        expect(mockedSendErrorReportForSearch).toHaveBeenCalled();
    });

    it('swallows AbortError without showing a notification', async () => {
        mockedUseSearchModule.mockReturnValue(makeModule({ search: makeSearch('uid-1') }) as any);
        mockedLoadNodesForSearchView.mockRejectedValue(new DOMException('aborted', 'AbortError'));

        renderHook(() => useSearchViewModel());

        await waitFor(() => expect(mockedLoadNodesForSearchView).toHaveBeenCalled());
        await act(async () => {});

        expect(mockCreateNotification).not.toHaveBeenCalled();
        expect(mockedSendErrorReportForSearch).not.toHaveBeenCalled();
    });

    it('calls clearAll again when refreshResults triggers a new search', async () => {
        mockedUseSearchModule.mockReturnValue(makeModule({ search: makeSearch('uid-1') }) as any);

        const { result } = renderHook(() => useSearchViewModel());

        await waitFor(() => expect(mockClearAll).toHaveBeenCalledTimes(1));

        act(() => result.current.refreshResults());

        await waitFor(() => expect(mockClearAll).toHaveBeenCalledTimes(2));
    });
});
