import { act, renderHook, waitFor } from '@testing-library/react';
import { IDBFactory } from 'fake-indexeddb';
import type { Mock } from 'vitest';
import 'fake-indexeddb/auto';

import { SearchModule } from '../mainThread/SearchModule';
import { FakeBroadcastChannel } from '../testing/FakeBroadcastChannel';
import { useSearchModule } from './useSearchModule';

// --- Infrastructure mocks (browser APIs not available in jsdom) ---

global.BroadcastChannel = FakeBroadcastChannel as unknown as typeof BroadcastChannel;

const mockWorkerStart = vi.fn();

const mockQueryIndexerState = vi.fn().mockResolvedValue({});
const mockIsPartialIndexNoticeDismissed = vi.fn().mockResolvedValue(false);
const mockDismissPartialIndexNotice = vi.fn().mockResolvedValue(undefined);
const mockReset = vi.fn().mockResolvedValue(undefined);
const mockRebuild = vi.fn().mockResolvedValue(undefined);

vi.mock('../mainThread/WorkerClient', () => ({
    WorkerClient: vi.fn().mockImplementation(function () {
        return {
            start: mockWorkerStart,
            queryIndexerState: mockQueryIndexerState,
            isPartialIndexNoticeDismissed: mockIsPartialIndexNoticeDismissed,
            dismissPartialIndexNotice: mockDismissPartialIndexNotice,
            reset: mockReset,
            rebuild: mockRebuild,
            search: vi.fn(),
            dispose: vi.fn(),
        };
    }),
}));

vi.mock('../mainThread/ClientAppVersionGuard', () => ({
    ClientAppVersionGuard: vi.fn(),
}));

vi.mock('../shared/errors', async () => {
    const actual = await vi.importActual('../shared/errors');
    return { ...actual, sendErrorReportForSearch: vi.fn(), listenForWorkerErrors: vi.fn() };
});

vi.mock('../shared/Logger', () => ({
    Logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), listenForWorkerLogs: vi.fn() },
}));

// --- Stub external hooks ---

vi.mock('@proton/account/user/hooks', () => ({
    useUser: () => [{ ID: 'test-user' }],
}));

vi.mock('@proton/account/userKeys/hooks', () => ({
    useGetUserKeys: () => vi.fn().mockResolvedValue([]),
}));

vi.mock('@proton/app-context/useConfig', () => ({
    useConfig: () => ({ APP_VERSION: '1.0.0' }),
}));

vi.mock('@proton/app-context/useApi', () => ({
    useApi: () => vi.fn(),
}));

vi.mock('@proton/drive/sdk', async () => ({
    ...(await vi.importActual('@proton/drive/sdk')),
    useDrive: () => ({
        drive: { onMessage: vi.fn().mockReturnValue(vi.fn()) },
        internal: { createSearchDriveInstance: vi.fn().mockReturnValue({}) },
    }),
}));

vi.mock('@proton/shared/lib/api/drive/volume', () => ({
    queryLatestVolumeEvent: vi.fn(),
}));

function resetSingleton() {
    SearchModule.resetForTesting();
}

type AvailableReturn = Extract<ReturnType<typeof useSearchModule>, { isAvailable: true }>;

function expectAvailable(result: { current: ReturnType<typeof useSearchModule> }): AvailableReturn {
    const r = result.current;
    expect(r.isAvailable).toBe(true);
    return r as AvailableReturn;
}

// --- Tests ---

beforeEach(() => {
    vi.clearAllMocks();
    globalThis.indexedDB = new IDBFactory();
    FakeBroadcastChannel.reset();
    resetSingleton();
    vi.spyOn(SearchModule, 'isEnvironmentCompatible').mockResolvedValue(true);
});

describe('useSearchModule', () => {
    describe('availability', () => {
        it('returns isAvailable: false when environment is incompatible', () => {
            (SearchModule.isEnvironmentCompatible as Mock).mockResolvedValue(false);
            const { result } = renderHook(() => useSearchModule());
            expect(result.current.isAvailable).toBe(false);
        });

        it('returns isAvailable: true after init', async () => {
            const { result } = renderHook(() => useSearchModule());
            expect(result.current.isAvailable).toBe(false);

            await waitFor(() => expect(result.current.isAvailable).toBe(true));

            expect(result.current.isAvailable).toBe(true);
        });
    });

    describe('auto-start when idle', () => {
        it('does not start when user has not opted in', async () => {
            const { result } = renderHook(() => useSearchModule());
            await waitFor(() => expect(result.current.isAvailable).toBe(true));

            expect(mockWorkerStart).not.toHaveBeenCalled();
        });
    });

    describe('optIn triggers start', () => {
        it('calling optIn also calls WorkerClient.start', async () => {
            const { result } = renderHook(() => useSearchModule());
            await waitFor(() => expect(result.current.isAvailable).toBe(true));

            await act(async () => {
                await expectAvailable(result).optIn();
            });

            expect(mockWorkerStart).toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        it('does not update state if unmounted before init resolves', async () => {
            const { result, unmount } = renderHook(() => useSearchModule());
            unmount();

            await act(() => Promise.resolve());

            expect(result.current.isAvailable).toBe(false);
        });
    });

    describe('partial-index notice dismissal survives reset()/rebuild()', () => {
        // reset()/rebuild() clear the persisted dismissal (SearchDB.clear()/clearIndex()) because
        // a fresh index may or may not end up capped again. The cached flag on SearchModule (and
        // this hook's local state) must follow, in the same render pass - not just after a reload.
        it('re-flips isPartialIndexNoticeDismissed to false after reset(), without remounting', async () => {
            const { result } = renderHook(() => useSearchModule());
            await waitFor(() => expect(result.current.isAvailable).toBe(true));

            await act(async () => {
                await expectAvailable(result).dismissPartialIndexNotice();
            });
            expect(expectAvailable(result).isPartialIndexNoticeDismissed).toBe(true);

            await act(async () => {
                await expectAvailable(result).reset();
            });

            expect(mockReset).toHaveBeenCalledTimes(1);
            expect(expectAvailable(result).isPartialIndexNoticeDismissed).toBe(false);
        });

        it('re-flips isPartialIndexNoticeDismissed to false after rebuild(), without remounting', async () => {
            const { result } = renderHook(() => useSearchModule());
            await waitFor(() => expect(result.current.isAvailable).toBe(true));

            await act(async () => {
                await expectAvailable(result).dismissPartialIndexNotice();
            });
            expect(expectAvailable(result).isPartialIndexNoticeDismissed).toBe(true);

            await act(async () => {
                await expectAvailable(result).rebuild();
            });

            expect(mockRebuild).toHaveBeenCalledTimes(1);
            expect(expectAvailable(result).isPartialIndexNoticeDismissed).toBe(false);
        });
    });
});
