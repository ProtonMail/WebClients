import { renderHook } from '@testing-library/react';

import { EventNotifier } from '@proton/shared/lib/eventNotifier/EventNotifier';
import { EventNotifierLoopType } from '@proton/shared/lib/eventNotifier/interface';
import { trackPendingAction } from '@proton/shared/lib/eventNotifier/pendingActions';
import noop from '@proton/utils/noop';

import { useEventNotifier } from './useEventNotifier';

const mockCall = vi.fn();
const mockEventManager = { call: mockCall, setIntervalsOverride: vi.fn() };
const mockApi = vi.fn();
const mockUser = { ID: 'user-1' };
const mockConfig = { API_URL: '/api' };

vi.mock('@proton/account/user/hooks', () => ({ useUser: () => [mockUser] }));
vi.mock('@proton/app-context/useApi', () => ({ useApi: () => mockApi }));
vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => mockConfig }));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: (name: string) => name === 'PingOMatic' }));
vi.mock('@proton/unleash/useVariant', () => ({ useVariant: () => ({ payload: undefined }) }));
vi.mock('../../hooks/useEventManager', () => ({ __esModule: true, default: () => mockEventManager }));
vi.mock('@proton/shared/lib/eventNotifier/EventNotifier', () => ({
    EventNotifier: vi.fn().mockImplementation(function () {
        return { start: vi.fn(), stop: vi.fn() };
    }),
}));

const TYPES = [EventNotifierLoopType.Mail];

const createDeferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>((res) => {
        resolve = res;
    });
    return { promise, resolve };
};

const flushPromises = () => {
    return new Promise((resolve) => setTimeout(resolve, 0));
};

const renderAndGetPing = () => {
    renderHook(() => useEventNotifier({ types: TYPES, debug: noop }));
    const { onPing } = vi.mocked(EventNotifier).mock.calls[0][0];
    return () => {
        onPing({ type: EventNotifierLoopType.Mail });
    };
};

describe('useEventNotifier', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCall.mockResolvedValue(undefined);
    });

    it('should call the event loop on ping', async () => {
        const ping = renderAndGetPing();

        ping();
        await flushPromises();

        expect(mockCall).toHaveBeenCalledTimes(1);
        expect(mockCall).toHaveBeenCalledWith('Ping');
    });

    it('should wait for pending actions before calling the event loop on ping', async () => {
        const ping = renderAndGetPing();
        const action = createDeferred();
        void trackPendingAction(action.promise);

        ping();
        await flushPromises();
        expect(mockCall).not.toHaveBeenCalled();

        action.resolve();
        await flushPromises();
        expect(mockCall).toHaveBeenCalledTimes(1);
    });

    it('should call the event loop once for pings received while waiting for pending actions', async () => {
        const ping = renderAndGetPing();
        const action = createDeferred();
        void trackPendingAction(action.promise);

        ping();
        ping();
        ping();
        action.resolve();
        await flushPromises();

        expect(mockCall).toHaveBeenCalledTimes(1);
    });
});
