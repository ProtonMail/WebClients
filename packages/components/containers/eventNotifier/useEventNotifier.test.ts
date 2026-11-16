import { renderHook } from '@testing-library/react';

import { EventNotifier } from '@proton/shared/lib/eventNotifier/EventNotifier';
import { EventNotifierLoopType } from '@proton/shared/lib/eventNotifier/interface';
import { trackPendingAction } from '@proton/shared/lib/eventNotifier/pendingActions';
import noop from '@proton/utils/noop';

import { useEventNotifier } from './useEventNotifier';

const mockCall = jest.fn();
const mockEventManager = { call: mockCall, setIntervalsOverride: jest.fn() };
const mockApi = jest.fn();
const mockUser = { ID: 'user-1' };
const mockConfig = { API_URL: '/api' };

jest.mock('@proton/account/user/hooks', () => ({ useUser: () => [mockUser] }));
jest.mock('@proton/app-context/useApi', () => ({ useApi: () => mockApi }));
jest.mock('@proton/app-context/useConfig', () => ({ useConfig: () => mockConfig }));
jest.mock('@proton/unleash/useFlag', () => ({ useFlag: (name: string) => name === 'PingOMatic' }));
jest.mock('@proton/unleash/useVariant', () => ({ useVariant: () => ({ payload: undefined }) }));
jest.mock('../../hooks/useEventManager', () => ({ __esModule: true, default: () => mockEventManager }));
jest.mock('@proton/shared/lib/eventNotifier/EventNotifier', () => ({
    EventNotifier: jest.fn().mockImplementation(() => ({ start: jest.fn(), stop: jest.fn() })),
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
    const { onPing } = jest.mocked(EventNotifier).mock.calls[0][0];
    return () => {
        onPing({ type: EventNotifierLoopType.Mail });
    };
};

describe('useEventNotifier', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
