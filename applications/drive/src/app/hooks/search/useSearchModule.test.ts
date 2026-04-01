import { act, renderHook } from '@testing-library/react-hooks';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchModule } from '../../modules/search/internal/mainThread/SearchModule';
import { FakeBroadcastChannel } from '../../modules/search/internal/testing/FakeBroadcastChannel';
import { useSearchModule } from './useSearchModule';

// --- Infrastructure mocks (browser APIs not available in jsdom) ---

global.BroadcastChannel = FakeBroadcastChannel as unknown as typeof BroadcastChannel;

const mockWorkerStart = jest.fn();

const mockQueryIndexerState = jest.fn().mockResolvedValue({});

jest.mock('../../modules/search/internal/mainThread/WorkerClient', () => ({
    WorkerClient: jest.fn().mockImplementation(() => ({
        start: mockWorkerStart,
        queryIndexerState: mockQueryIndexerState,
        search: jest.fn(),
        dispose: jest.fn(),
    })),
}));

jest.mock('../../modules/search/internal/mainThread/AppVersionGuard', () => ({
    AppVersionGuard: jest.fn(),
}));

jest.mock('../../modules/search/internal/shared/errors', () => {
    const actual = jest.requireActual('../../modules/search/internal/shared/errors');
    return { ...actual, sendErrorReportForSearch: jest.fn() };
});

jest.mock('../../modules/search/internal/shared/Logger', () => ({
    Logger: { info: jest.fn(), error: jest.fn(), listenForWorkerLogs: jest.fn() },
}));

// --- Stub external hooks ---

jest.mock('@proton/account/user/hooks', () => ({
    useUser: () => [{ ID: 'test-user' }],
}));

jest.mock('@proton/components', () => ({
    useApi: () => jest.fn(),
    useConfig: () => ({ APP_VERSION: '1.0.0' }),
}));

jest.mock('@proton/drive', () => ({
    useDrive: () => ({
        drive: {},
        internal: { createSearchDriveInstance: jest.fn().mockReturnValue({}) },
    }),
}));

jest.mock('@proton/shared/lib/api/drive/volume', () => ({
    queryLatestVolumeEvent: jest.fn(),
}));

jest.mock('../../flags/useFlagsDriveFoundationSearch');

const { useFlagsDriveFoundationSearch } = require('../../flags/useFlagsDriveFoundationSearch');

function setFeatureFlag(enabled: boolean) {
    (useFlagsDriveFoundationSearch as jest.Mock).mockReturnValue(enabled);
}

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
    jest.clearAllMocks();
    globalThis.indexedDB = new IDBFactory();
    FakeBroadcastChannel.reset();
    resetSingleton();
    jest.spyOn(SearchModule, 'isEnvironmentCompatible').mockReturnValue(true);
    setFeatureFlag(true);
});

describe('useSearchModule', () => {
    describe('availability', () => {
        it('returns isAvailable: false when feature flag is disabled', () => {
            setFeatureFlag(false);
            const { result } = renderHook(() => useSearchModule());
            expect(result.current.isAvailable).toBe(false);
        });

        it('returns isAvailable: false when environment is incompatible', () => {
            (SearchModule.isEnvironmentCompatible as jest.Mock).mockReturnValue(false);
            const { result } = renderHook(() => useSearchModule());
            expect(result.current.isAvailable).toBe(false);
        });

        it('returns isAvailable: true after init', async () => {
            const { result, waitForNextUpdate } = renderHook(() => useSearchModule());
            expect(result.current.isAvailable).toBe(false);

            await waitForNextUpdate();

            expect(result.current.isAvailable).toBe(true);
        });
    });

    describe('auto-start when idle', () => {
        it('does not start when user has not opted in', async () => {
            const { waitForNextUpdate } = renderHook(() => useSearchModule());
            await waitForNextUpdate();

            expect(mockWorkerStart).not.toHaveBeenCalled();
        });
    });

    describe('optIn triggers start', () => {
        it('calling optIn also calls WorkerClient.start', async () => {
            const { result, waitForNextUpdate } = renderHook(() => useSearchModule());
            await waitForNextUpdate();

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
});
