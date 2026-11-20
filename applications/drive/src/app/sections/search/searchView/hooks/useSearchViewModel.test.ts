import { act, renderHook, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { getNotificationsManager } from '@proton/drive/modules/notifications';

import { useSearchModule, useUrlSearchParams } from '../../../../modules/search';
import { sendErrorReportForSearch } from '../../../../modules/search/internal/shared/errors';
import { useSearchViewStore } from '../store';
import { loadNodesForSearchView } from './loadNodesForSearchView';
import { useSearchViewModel } from './useSearchViewModel';

vi.mock('../../../../modules/search', () => ({
    useSearchModule: vi.fn(),
    useUrlSearchParams: vi.fn(),
    tryCatchWithNotification: vi.fn((fn: () => unknown) => fn),
}));

vi.mock('./loadNodesForSearchView', () => ({
    loadNodesForSearchView: vi.fn(),
}));

vi.mock('../../../../modules/search/internal/shared/errors', () => ({
    sendErrorReportForSearch: vi.fn(),
}));

vi.mock('@proton/drive/modules/notifications', () => ({
    getNotificationsManager: vi.fn(),
}));

const mockedUseSearchModule = vi.mocked(useSearchModule);
const mockedUseUrlSearchParams = vi.mocked(useUrlSearchParams);
const mockedLoadNodesForSearchView = vi.mocked(loadNodesForSearchView);
const mockedGetNotificationsManager = vi.mocked(getNotificationsManager);
const mockedSendErrorReportForSearch = vi.mocked(sendErrorReportForSearch);

const makeModule = (overrides: Record<string, unknown> = {}) => ({
    isAvailable: true,
    isUserOptIn: true,
    isSearchable: true,
    search: vi.fn().mockImplementation(async function* () {
        return;
    }),
    optIn: vi.fn(),
    indexingProgress: { files: 0, folders: 0, albums: 0, photos: 0 },
    ...overrides,
});

const makeSearch = (...uids: string[]) =>
    vi.fn().mockImplementation(async function* () {
        for (const uid of uids) {
            yield { nodeUid: uid, score: 0.9 };
        }
    });

const range = (n: number, prefix = 'uid-') => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);

describe('useSearchViewModel', () => {
    let mockClearAll: Mock;
    let mockSetLoading: Mock;
    let mockCreateNotification: Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        mockClearAll = vi.fn();
        mockSetLoading = vi.fn();
        mockCreateNotification = vi.fn();

        vi.spyOn(useSearchViewStore, 'getState').mockReturnValue({
            clearAll: mockClearAll,
            setLoading: mockSetLoading,
        } as any);

        mockedUseUrlSearchParams.mockReturnValue(['test-query', vi.fn()] as any);
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
                search: vi.fn().mockImplementation(async function* () {
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
