import type { Store } from 'redux';

import { type AuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { cacheConflict, itemsUpdated } from '@proton/pass/store/actions';
import { AppStatus } from '@proton/pass/types';

import { broadcastMiddleware, resolveBroadcast } from './broadcast';

jest.mock('proton-pass-web/app/ServiceWorker/client/constants', () => ({
    ServiceWorkerEnabled: true,
    ServiceWorkerClientID: 'test-client',
}));

describe('resolveBroadcast', () => {
    const action = { type: 'cross::tab' };

    test('event-sources the action when the tab is booted', () => {
        expect(resolveBroadcast(AppStatus.READY, action)).toBe(action);
        expect(resolveBroadcast(AppStatus.OFFLINE, action)).toBe(action);
    });

    test('signals a cache conflict while booting (stale hydration)', () => {
        expect(resolveBroadcast(AppStatus.BOOTING, action)).toEqual(cacheConflict());
    });

    test('ignores the broadcast in other non-booted states', () => {
        expect(resolveBroadcast(AppStatus.ERROR, action)).toBeUndefined();
        expect(resolveBroadcast(AppStatus.PASSWORD_LOCKED, action)).toBeUndefined();
        expect(resolveBroadcast(AppStatus.IDLE, action)).toBeUndefined();
    });
});

describe('broadcastMiddleware', () => {
    const postMessage = jest.fn();

    beforeAll(() => {
        exposeAuthStore({ getLocalID: () => 42 } as AuthStore);
        Object.defineProperty(navigator, 'serviceWorker', {
            value: { controller: { postMessage } },
            configurable: true,
        });
    });

    beforeEach(() => postMessage.mockClear());

    const dispatch = (action: any) => {
        const next = jest.fn((a) => a);
        broadcastMiddleware({} as Store)(next)(action);
        return next;
    };

    test('broadcasts caching actions sanitized with `meta.cache = false`', () => {
        const next = dispatch(itemsUpdated([]));
        expect(postMessage).toHaveBeenCalledTimes(1);
        const { type, action, localID } = postMessage.mock.calls[0][0];

        expect(type).toBe('action');
        expect(localID).toEqual(42);
        expect(action.meta.cache).toBe(false);
        expect(next).toHaveBeenCalled();
    });

    test('does not broadcast non-caching actions', () => {
        dispatch({ type: 'noop' });
        expect(postMessage).not.toHaveBeenCalled();
    });
});
