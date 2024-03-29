import { CLIENT_SCRIPT_READY_EVENT } from 'proton-pass-extension/app/content/constants.static';

import * as domUtils from '@proton/pass/utils/dom/state';
import { error } from '@proton/pass/utils/fp/throw';
import * as stringUtils from '@proton/pass/utils/string/unique-id';
import { wait } from '@proton/shared/lib/helpers/promise';

import { ALLOWED_MESSAGES, BRIDGE_ABORT, BRIDGE_DISCONNECT, BRIDGE_REQUEST, BRIDGE_RESPONSE } from './constants';
import {
    BRIDGE_INIT_TIMEOUT,
    createBridgeAbortSignal,
    createBridgeDisconnectSignal,
    createBridgeResponse,
    createMessageBridge,
    isBridgeAbortSignal,
    isBridgeDisconnectSignal,
    isBridgeRequest,
    isBridgeResponse,
    messageValidator,
} from './message';

const uniqueId = jest.spyOn(stringUtils, 'uniqueId');
const waitForPageReady = jest.spyOn(domUtils, 'waitForPageReady');
let removeEventListenerSpy: jest.SpyInstance, addEventListenerSpy: jest.SpyInstance;

let counter = 0;

describe('Bridge', () => {
    beforeEach(() => {
        counter = 0;
        removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
        addEventListenerSpy = jest.spyOn(window, 'addEventListener');
        uniqueId.mockImplementation(() => `token-${counter++}`);
        jest.useFakeTimers();
    });

    afterEach(() => {
        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
        uniqueId.mockClear();
        waitForPageReady.mockReset();
        jest.useRealTimers();
    });

    describe('message utils', () => {
        test('validators', () => {
            expect(messageValidator('type')('token')({ token: 'token', type: 'type' })).toBe(true);
            expect(messageValidator('type')('token')({ token: 'token', type: 'invalid' })).toBe(false);
            expect(messageValidator('type')('token')({ token: 'invalid', type: 'type' })).toBe(false);
            expect(messageValidator('type')()({ token: 'invalid', type: 'type' })).toBe(false);
            expect(messageValidator('type')('token')({ type: 'type' })).toBe(false);
            expect(messageValidator('type')('token')([])).toBe(false);
            expect(messageValidator('type')('token')({})).toBe(false);
            expect(messageValidator('type')('token')(null)).toBe(false);
            expect(messageValidator('type')('token')(undefined)).toBe(false);
        });

        test('abort signals', () => {
            expect(createBridgeAbortSignal('token')).toEqual({ token: 'token', type: BRIDGE_ABORT });
            expect(isBridgeAbortSignal('token')({ token: 'token', type: BRIDGE_ABORT })).toBe(true);
            expect(isBridgeAbortSignal('token')({ token: 'invalid', type: BRIDGE_ABORT })).toBe(false);
            expect(isBridgeAbortSignal('token')({ token: 'token', type: 'invalid' })).toBe(false);
        });

        test('disconnect signals', () => {
            expect(createBridgeDisconnectSignal()).toEqual({ type: BRIDGE_DISCONNECT });
            expect(isBridgeDisconnectSignal()({ type: BRIDGE_DISCONNECT })).toBe(true);
            expect(isBridgeDisconnectSignal()({ type: 'invalid' })).toBe(false);
        });

        test('response', () => {
            const data = {
                response: { type: 'success' },
                type: BRIDGE_RESPONSE,
                token: 'token',
            };

            expect(createBridgeResponse({ type: 'success' } as any, 'token')).toEqual(data);
            expect(isBridgeResponse('token')(data)).toBe(true);
            expect(isBridgeResponse('invalid')(data)).toBe(false);
            expect(isBridgeResponse('token')({ ...data, token: 'invalid' })).toBe(false);
            expect(isBridgeResponse('token')({ ...data, type: 'invalid' })).toBe(false);
        });

        test('request', () => {
            const data = {
                request: { type: 'type' },
                type: BRIDGE_REQUEST,
                token: 'token',
            };

            ALLOWED_MESSAGES.forEach((type) => expect(isBridgeRequest({ ...data, request: { type } })).toBe(true));
            expect(isBridgeRequest(data)).toBe(false);
            expect(isBridgeRequest({ ...data, token: undefined })).toBe(false);
            expect(isBridgeRequest({ ...data, type: undefined })).toBe(false);
        });
    });

    describe('createMessageBridge', () => {
        describe('getState', () => {
            test('should setup default state', async () => {
                const bridge = createMessageBridge();
                const { connected, ready } = bridge.getState();
                ready.resolve();

                expect(connected).toBe(true);
                await expect(ready).resolves.toBe(undefined);
            });
        });

        describe('init', () => {
            test('ready state should resolve if page and content-script ready', async () => {
                waitForPageReady.mockReturnValueOnce(Promise.resolve());
                const bridge = createMessageBridge();
                bridge.init();
                window.postMessage({ type: CLIENT_SCRIPT_READY_EVENT });

                await expect(bridge.getState().ready).resolves.toBeUndefined();
            });

            test('ready state should reject after timeout if page not ready', async () => {
                waitForPageReady.mockReturnValueOnce(wait(BRIDGE_INIT_TIMEOUT + 1));
                const bridge = createMessageBridge();
                bridge.init();

                jest.advanceTimersByTime(BRIDGE_INIT_TIMEOUT);
                await expect(bridge.getState().ready).rejects.toEqual(error({ name: 'BridgeTimeout' }));
            });

            test('ready state should reject after timeout if content-script not ready', async () => {
                waitForPageReady.mockReturnValueOnce(Promise.resolve());
                const bridge = createMessageBridge();
                bridge.init();

                /* CLIENT_SCRIPT_READY_EVENT not dispatched */
                jest.advanceTimersByTime(BRIDGE_INIT_TIMEOUT);
                await expect(bridge.getState().ready).rejects.toEqual(error({ name: 'BridgeTimeout' }));
            });
        });

        describe('sendMessage', () => {
            const setupBridge = async (init: boolean = true) => {
                waitForPageReady.mockReturnValue(Promise.resolve());
                const bridge = createMessageBridge();
                if (init) {
                    bridge.init();
                    window.postMessage('some-other-window-event');
                    window.postMessage({ type: CLIENT_SCRIPT_READY_EVENT });
                    await bridge.getState().ready;
                }
                return bridge;
            };

            test('should proxy postMessage response', async () => {
                const bridge = await setupBridge();
                addEventListenerSpy.mockClear();
                removeEventListenerSpy.mockClear();

                const job = bridge.sendMessage({ type: 'bridge-message' } as any);
                await jest.advanceTimersByTimeAsync(0);

                expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
                const params = addEventListenerSpy.mock.lastCall!;

                window.postMessage({ type: BRIDGE_RESPONSE, token: 'token-0', response: 'response-data' });
                await expect(job).resolves.toEqual('response-data');
                expect(removeEventListenerSpy).toHaveBeenCalledWith(...params);
            });

            test('should allow aborting via messaging', async () => {
                const bridge = await setupBridge();
                addEventListenerSpy.mockClear();
                removeEventListenerSpy.mockClear();

                const job = bridge.sendMessage({ type: 'bridge-message' } as any);
                await jest.advanceTimersByTimeAsync(0);

                expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
                const params = addEventListenerSpy.mock.lastCall!;

                window.postMessage({ type: BRIDGE_ABORT, token: 'token-0' });
                await expect(job).resolves.toEqual({ error: 'BridgeAbort', message: '', type: 'error' });
                expect(removeEventListenerSpy).toHaveBeenCalledWith(...params);
            });

            test('should allow aborting via signal', async () => {
                const bridge = await setupBridge();
                const ctrl = new AbortController();
                const job = bridge.sendMessage({ type: 'bridge-message' } as any, { signal: ctrl.signal });
                await jest.advanceTimersByTimeAsync(0);

                ctrl.abort();
                await expect(job).resolves.toEqual({ error: 'BridgeAbort', message: '', type: 'error' });
            });

            test('should allow aborting via timeout', async () => {
                const bridge = await setupBridge();
                const job = bridge.sendMessage({ type: 'bridge-message' } as any, { timeout: 500 });
                await jest.advanceTimersByTimeAsync(501);

                await expect(job).resolves.toEqual({ error: 'BridgeAbort', message: '', type: 'error' });
            });

            test('should support content-script disconnection', async () => {
                const bridge = await setupBridge();
                const job = bridge.sendMessage({ type: 'bridge-message' } as any);

                window.postMessage({ type: BRIDGE_DISCONNECT });
                await expect(job).resolves.toEqual({ error: 'BridgeDisconnected', message: '', type: 'error' });
                expect(bridge.getState().connected).toBe(false);

                /* next calls should all fail */
                const nextJob = bridge.sendMessage({ type: 'bridge-message' } as any);
                await expect(nextJob).resolves.toEqual({ error: 'BridgeDisconnected', message: '', type: 'error' });
            });

            test('should handle unknown errors', async () => {
                const bridge = await setupBridge(false);
                bridge.getState().ready.reject({ not: 'an-error' });

                const job = bridge.sendMessage({ type: 'bridge-message' } as any);
                await jest.advanceTimersByTimeAsync(0);
                await expect(job).resolves.toEqual({ error: 'UnknownError', type: 'error' });
            });
        });
    });
});
