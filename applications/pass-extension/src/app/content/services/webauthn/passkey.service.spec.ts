import browser, { clearBrowserMocks } from 'proton-pass-extension/__mocks__/webextension-polyfill';
import { BRIDGE_REQUEST } from 'proton-pass-extension/app/content/bridge/constants';
import { createBridgeAbortSignal, createBridgeResponse } from 'proton-pass-extension/app/content/bridge/message';
import type { BridgeRequest } from 'proton-pass-extension/app/content/bridge/types';
import { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { CSContext } from 'proton-pass-extension/app/content/context/context';
import type { CSContextState, CSFeatures, ContentScriptContext } from 'proton-pass-extension/app/content/context/types';
import type { NotificationHandler } from 'proton-pass-extension/app/content/services/inline/notification/notification.abstract';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { AppStatus } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { PasskeyServiceError } from './passkey.errors';
import { type PasskeyService, createPasskeyService } from './passkey.service';

const expectPasskeyError = async (fn: () => Promise<void>, allowNativeWebAuthn: boolean) => {
    try {
        await fn();
        fail('Expected PasskeyError to be thrown');
    } catch (error) {
        expect(error).toBeInstanceOf(PasskeyServiceError);
        expect(error).toMatchObject({ allowNativeWebAuthn });
    }
};

describe('PasskeyService', () => {
    let service: PasskeyService;
    let postMessage: jest.SpyInstance;
    let context: jest.MockedObject<ContentScriptContext>;
    let notification: NotificationHandler;
    let settings: ProxiedSettings;
    let features: Record<CSFeatures, boolean>;
    let state: CSContextState;

    beforeEach(() => {
        postMessage = jest.spyOn(window, 'postMessage').mockImplementation();
        service = createPasskeyService();

        jest.useFakeTimers();

        browser.runtime.sendMessage.mockImplementation(async () => ({
            type: 'success',
            passkeys: [{ id: 'test-passkey' }],
        }));

        notification = { open: jest.fn(), close: jest.fn() } as any;
        settings = { passkeys: { get: true, create: true } } as any;
        features = { Passkeys: true } as any;

        context = {
            getState: () => state,
            getSettings: () => settings,
            getFeatures: () => features,
            service: { inline: { notification: notification } },
        } as any;

        state = { ready: true, status: AppStatus.READY, stale: false } as any;
        CSContext.set(context);
    });

    afterEach(() => {
        postMessage.mockRestore();
        CSContext.clear();
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.clearAllMocks();
        clearBrowserMocks();
    });

    describe('PasskeyService::abort', () => {
        test('should noop when no `requestToken` is set', () => {
            service.abort(null, false);
            expect(postMessage).not.toHaveBeenCalled();
            expect(service.state.get('requestToken')).toBeNull();
        });

        test('should post abort signal when `allowNativeWebAuthn` is `false`', () => {
            const token = uniqueId();
            service.state.set('requestToken', token);
            service.abort(token, false);
            expect(postMessage).toHaveBeenCalledWith(createBridgeAbortSignal(token));
        });

        test('should post success response when `allowNativeWebAuthn` is `true`', () => {
            const token = uniqueId();
            const expected = createBridgeResponse({ type: 'success', intercept: false }, token);
            service.state.set('requestToken', token);
            service.abort(token, true);
            expect(postMessage).toHaveBeenCalledWith(expected);
        });
    });

    describe('PasskeyService::approve', () => {
        test('should abort existing request and set new token', async () => {
            const prevToken = uniqueId();
            const nextToken = uniqueId();
            service.state.set('requestToken', prevToken);

            const approval = service.approve(nextToken, () => true);
            expect(postMessage).toHaveBeenCalledWith(createBridgeAbortSignal(prevToken));
            expect(service.state.get('requestToken')).toBe(nextToken);

            await jest.advanceTimersByTimeAsync(50);
            await expect(approval).resolves.toBeUndefined();
        });

        test('should wait for context ready', async () => {
            state.ready = false;
            const approval = service.approve(uniqueId(), () => true);
            await jest.advanceTimersByTimeAsync(50);

            state.ready = true;
            await jest.advanceTimersByTimeAsync(50);
            await expect(approval).resolves.toBeUndefined();
        });

        test('should throw `PasskeyServiceError` when context is cleared', async () => {
            CSContext.clear();
            await expectPasskeyError(() => service.approve(uniqueId(), () => true), true);
        });

        test('should throw `PasskeyServiceError` when context is stale', async () => {
            state.stale = true;
            await expectPasskeyError(() => service.approve(uniqueId(), () => true), true);
        });

        test('should throw `PasskeyServiceError` when no session is available', async () => {
            state.status = AppStatus.UNAUTHORIZED;
            state.ready = true;
            await expectPasskeyError(() => service.approve(uniqueId(), () => true), true);
        });

        test('should throw `PasskeyServiceError` when allow function returns false', async () => {
            state.status = AppStatus.READY;
            state.ready = true;
            await expectPasskeyError(() => service.approve(uniqueId(), () => false), true);
        });

        test('should throw `PasskeyServiceError` when token is mutated during approval', async () => {
            state.ready = false;

            await expectPasskeyError(
                async () =>
                    new Promise(async (_, rej) => {
                        service.approve(uniqueId(), () => true).catch(rej);
                        service.state.set('requestToken', uniqueId());
                        await jest.advanceTimersByTimeAsync(50);
                    }),
                false
            );
        });
    });

    describe('PasskeyService::onBridgeRequest', () => {
        const createPasskeyCreateRequest = (
            token: string = uniqueId()
        ): BridgeRequest<WorkerMessageType.PASSKEY_CREATE> => ({
            type: BRIDGE_REQUEST,
            token,
            request: {
                type: WorkerMessageType.PASSKEY_CREATE,
                payload: { request: 'test-challenge' },
            },
        });

        const createPasskeyGetRequest = (token: string = uniqueId()): BridgeRequest<WorkerMessageType.PASSKEY_GET> => ({
            type: BRIDGE_REQUEST,
            token,
            request: {
                type: WorkerMessageType.PASSKEY_GET,
                payload: {
                    request: JSON.stringify({
                        challenge: 'test-challenge',
                        allowCredentials: [{ id: 'test-cred-id' }],
                    }),
                },
            },
        });

        const createPasskeyInterceptRequest = (
            token: string = uniqueId(),
            reason: string = 'conditionalMediationAvailable'
        ): BridgeRequest<WorkerMessageType.PASSKEY_INTERCEPT> => ({
            type: BRIDGE_REQUEST,
            token,
            request: { type: WorkerMessageType.PASSKEY_INTERCEPT, payload: { reason } },
        });

        describe('PASSKEY_CREATE handler', () => {
            test('should open notification with underlying request', async () => {
                const token = uniqueId();
                const req = createPasskeyCreateRequest(token);
                await service.handler(req);

                expect(notification.open).toHaveBeenCalledWith({
                    action: NotificationAction.PASSKEY_CREATE,
                    domain: 'localhost',
                    request: 'test-challenge',
                    token,
                });
            });

            test('should abort when passkey creation is disabled', async () => {
                settings.passkeys.create = false;

                const token = uniqueId();
                const req = createPasskeyCreateRequest(token);
                const res = createBridgeResponse({ type: 'success', intercept: false }, token);
                await service.handler(req);

                expect(postMessage).toHaveBeenCalledWith(res);
                expect(notification.open).not.toHaveBeenCalled();
            });

            test('should abort when feature is disabled', async () => {
                features.Passkeys = false;

                const token = uniqueId();
                const req = createPasskeyCreateRequest(token);
                const res = createBridgeResponse({ type: 'success', intercept: false }, token);
                await service.handler(req);

                expect(postMessage).toHaveBeenCalledWith(res);
                expect(notification.open).not.toHaveBeenCalled();
            });

            test('should block rapid requests within rate limit window', async () => {
                const token1 = uniqueId();
                const token2 = uniqueId();
                const token3 = uniqueId();

                await Promise.all([
                    service.handler(createPasskeyCreateRequest(token1)),
                    service.handler(createPasskeyCreateRequest(token2)),
                    service.handler(createPasskeyCreateRequest(token3)),
                ]);

                expect(service.state.get('requestToken')).toBe(null);
                expect(postMessage).toHaveBeenCalledWith(createBridgeAbortSignal(token1));
                expect(postMessage).toHaveBeenCalledWith(createBridgeAbortSignal(token2));
                expect(postMessage).toHaveBeenCalledWith(createBridgeAbortSignal(token3));
            });

            test('should allow requests after rate limit window', async () => {
                const token1 = uniqueId();
                const token2 = uniqueId();

                await service.handler(createPasskeyCreateRequest(token1));
                jest.advanceTimersByTime(500);

                await service.handler(createPasskeyCreateRequest(token2));
                expect(service.state.get('requestToken')).toBe(token2);
            });
        });

        describe('PASSKEY_GET handler', () => {
            test('should query passkeys and open notification with results', async () => {
                const token = uniqueId();
                const req = createPasskeyGetRequest(token);
                await service.handler(req);

                expect(notification.open).toHaveBeenCalledWith({
                    action: NotificationAction.PASSKEY_GET,
                    domain: 'localhost',
                    passkeys: [{ id: 'test-passkey' }],
                    request: req.request.payload.request,
                    token,
                });
            });

            test('should abort when passkey retrieval is disabled', async () => {
                settings.passkeys.get = false;

                const token = uniqueId();
                const req = createPasskeyGetRequest(token);
                const res = createBridgeResponse({ type: 'success', intercept: false }, token);
                await service.handler(req);

                expect(postMessage).toHaveBeenCalledWith(res);
                expect(notification.open).not.toHaveBeenCalled();
            });

            test('should abort when feature is disabled', async () => {
                features.Passkeys = false;

                const token = uniqueId();
                const req = createPasskeyGetRequest(token);
                const res = createBridgeResponse({ type: 'success', intercept: false }, token);
                await service.handler(req);

                expect(postMessage).toHaveBeenCalledWith(res);
                expect(notification.open).not.toHaveBeenCalled();
            });

            test('should abort when no passkeys are found', async () => {
                browser.runtime.sendMessage.mockImplementation(async () => ({ type: 'success', passkeys: [] }));

                const token = uniqueId();
                const req = createPasskeyGetRequest(token);
                const res = createBridgeResponse({ type: 'success', intercept: false }, token);
                await service.handler(req);

                expect(postMessage).toHaveBeenCalledWith(res);
                expect(notification.open).not.toHaveBeenCalled();
            });

            test('should block rapid requests within rate limit window', async () => {
                const token1 = uniqueId();
                const token2 = uniqueId();
                const token3 = uniqueId();

                await Promise.all([
                    service.handler(createPasskeyGetRequest(token1)),
                    service.handler(createPasskeyGetRequest(token2)),
                    service.handler(createPasskeyGetRequest(token3)),
                ]);

                expect(service.state.get('requestToken')).toBe(null);
                expect(postMessage).toHaveBeenCalledWith(createBridgeAbortSignal(token1));
                expect(postMessage).toHaveBeenCalledWith(createBridgeAbortSignal(token2));
                expect(postMessage).toHaveBeenCalledWith(createBridgeAbortSignal(token3));
            });

            test('should not open notification if request token invalidated during processing', async () => {
                const token = uniqueId();
                const req = createPasskeyGetRequest(token);

                browser.runtime.sendMessage.mockImplementation(async () => {
                    service.state.set('requestToken', uniqueId());
                    return { type: 'success', passkeys: [] };
                });

                await service.handler(req);
                expect(notification.open).not.toHaveBeenCalled();
                expect(postMessage).toHaveBeenCalledWith(createBridgeAbortSignal(token));
            });

            test('should handle query errors gracefully', async () => {
                browser.runtime.sendMessage.mockImplementation(async () => ({ type: 'error', error: 'Test' }));

                const token = uniqueId();
                const req = createPasskeyGetRequest(token);
                const res = createBridgeResponse({ type: 'success', intercept: false }, token);
                await service.handler(req);

                expect(postMessage).toHaveBeenCalledWith(res);
                expect(notification.open).not.toHaveBeenCalled();
            });
        });

        describe('PASSKEY_INTERCEPT handler', () => {
            test('should respond with `intercept: true` when passkey operations enabled', async () => {
                const token = uniqueId();
                const req = createPasskeyInterceptRequest(token);
                const res = createBridgeResponse({ type: 'success', intercept: true }, token);
                await service.handler(req);

                expect(postMessage).toHaveBeenCalledWith(res);
            });

            test('should respond with `intercept: true` when only get is enabled', async () => {
                settings.passkeys.get = true;
                settings.passkeys.create = false;

                const token = uniqueId();
                const req = createPasskeyInterceptRequest(token);
                const res = createBridgeResponse({ type: 'success', intercept: true }, token);
                await service.handler(req);

                expect(postMessage).toHaveBeenCalledWith(res);
            });

            test('should respond with `intercept: true` when only create is enabled', async () => {
                settings.passkeys.get = false;
                settings.passkeys.create = true;

                const token = uniqueId();
                const req = createPasskeyInterceptRequest(token);
                const res = createBridgeResponse({ type: 'success', intercept: true }, token);
                await service.handler(req);

                expect(postMessage).toHaveBeenCalledWith(res);
            });

            test('should respond with `intercept: false` when both passkey operations disabled', async () => {
                settings.passkeys.get = false;
                settings.passkeys.create = false;

                const token = uniqueId();
                const req = createPasskeyInterceptRequest(token);
                const res = createBridgeResponse({ type: 'success', intercept: false }, token);
                await service.handler(req);

                expect(postMessage).toHaveBeenCalledWith(res);
            });

            test('should respond with `intercept: false` when Passkeys feature disabled', async () => {
                features.Passkeys = false;

                const token = uniqueId();
                const req = createPasskeyInterceptRequest(token);
                const res = createBridgeResponse({ type: 'success', intercept: false }, token);
                await service.handler(req);

                expect(postMessage).toHaveBeenCalledWith(res);
            });

            test('should block rapid requests exceeding per-reason rate limit window', async () => {
                /** PASSKEY_INTERCEPT uses windowMax=5 per reason key - send 6 to trigger blocking */
                const tokens = Array.from({ length: 6 }, () => uniqueId());
                const reason = 'conditionalMediationAvailable';

                await Promise.all(tokens.map((token) => service.handler(createPasskeyInterceptRequest(token, reason))));

                expect(postMessage).toHaveBeenCalledTimes(5);
                tokens.slice(0, 5).forEach((token) => {
                    expect(postMessage).toHaveBeenCalledWith(
                        createBridgeResponse<WorkerMessageType.PASSKEY_INTERCEPT>(
                            { type: 'success', intercept: true },
                            token
                        )
                    );
                });
            });

            test('should track rate limits independently per reason', async () => {
                const token1 = uniqueId();
                const token2 = uniqueId();

                /** each reason gets its own 5/500ms bucket */
                await service.handler(createPasskeyInterceptRequest(token1, 'conditionalMediationAvailable'));
                await service.handler(createPasskeyInterceptRequest(token2, 'verifyingPlatformAuthenticatorAvailable'));

                expect(postMessage).toHaveBeenCalledTimes(2);
            });

            test('should not modify request token state', async () => {
                const token = uniqueId();
                service.state.set('requestToken', token);
                await service.handler(createPasskeyInterceptRequest());
                expect(service.state.get('requestToken')).toBe(token);
            });
        });
    });
});
