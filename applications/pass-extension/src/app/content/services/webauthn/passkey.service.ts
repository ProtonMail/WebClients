import {
    createBridgeAbortSignal,
    createBridgeDisconnectSignal,
    createBridgeResponse,
    isBridgeAbortSignal,
    isBridgeRequest,
} from 'proton-pass-extension/app/content/bridge/message';
import type { BridgeRequest } from 'proton-pass-extension/app/content/bridge/types';
import { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { PasskeyServiceError } from 'proton-pass-extension/app/content/services/webauthn/passkey.errors';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { clientHasSession, clientNeedsSession } from '@proton/pass/lib/client';
import type { SanitizedPublicKeyRequest } from '@proton/pass/lib/passkeys/types';
import type { MaybeNull, MaybePromise } from '@proton/pass/types/utils/index';
import type { PasskeySettings } from '@proton/pass/types/worker/settings';
import { createEventLimiter } from '@proton/pass/utils/event/limiter';
import { prop } from '@proton/pass/utils/fp/lens';
import type { Predicate } from '@proton/pass/utils/fp/predicates';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { objectHandler } from '@proton/pass/utils/object/handler';

type PasskeyServiceState = {
    /** current WebAuthn request token */
    requestToken: MaybeNull<string>;
};

export const createPasskeyService = () => {
    const listeners = createListenerStore();
    const state = objectHandler<PasskeyServiceState>({ requestToken: null });

    /** Rate limiter guarding against malicious pages flooding the extension with
     * WebAuthn requests. Default window: max 1 message per key per 500ms. */
    const limiter = createEventLimiter({ windowMax: 1, windowMs: 500 });

    /** Verifies that a given token matches the current request token in state.
     * This prevents race conditions and ensures only the current request proceeds. */
    const matchesRequestToken = (token: string) => state.get('requestToken') === token;

    /** Aborts the current WebAuthn request and optionally allows native API fallback.
     * Clears the request token state and sends appropriate response message. */
    const abort = (token: MaybeNull<string>, allowNativeWebAuthn: boolean) => {
        if (token) {
            window.postMessage(
                allowNativeWebAuthn
                    ? createBridgeResponse({ type: 'success', intercept: false }, token)
                    : createBridgeAbortSignal(token)
            );
        }
    };

    const abortPending = withContext<() => void>((ctx) => {
        const token = state.get('requestToken');
        if (token) {
            abort(token, false);
            state.set('requestToken', null);
            ctx?.service.inline.notification.close();
        }
    });

    /** Handles errors during passkey operations by aborting the request.
     * PasskeyServiceErrors contain fallback preference. */
    const onPasskeyError = (token: string, err: unknown) => {
        if (err instanceof PasskeyServiceError) abort(token, err.allowNativeWebAuthn);
        else abort(token, true);
    };

    /**
     * Approves a WebAuthn request after validation and state management :
     * 1. Abort any pending requests (new requests supersede existing ones)
     * 2. Set active request token for state tracking and race condition prevention
     * 3. Wait for extension context to be ready and validate permissions
     * 4. Ensure request token still matches (guards against concurrent requests)
     */
    const approve = async (token: string, allow: () => boolean): Promise<void> => {
        abortPending();
        state.set('requestToken', token);

        await waitUntil(
            withContext<Predicate>((ctx) => {
                if (!ctx) throw new PasskeyServiceError({ allowNativeWebAuthn: true });
                const { ready, status, stale } = ctx.getState();
                const hasSession = clientHasSession(status);
                const noSession = clientNeedsSession(status);

                if (stale) throw new PasskeyServiceError({ allowNativeWebAuthn: true });
                if (!matchesRequestToken(token)) throw new PasskeyServiceError({ allowNativeWebAuthn: false });

                if (ready) {
                    if (noSession) throw new PasskeyServiceError({ allowNativeWebAuthn: true });
                    if (hasSession && !allow()) throw new PasskeyServiceError({ allowNativeWebAuthn: true });
                    return hasSession;
                }

                return false;
            }),
            50
        );
    };

    const withPasskeySettings = (fn: (settings: PasskeySettings) => boolean) =>
        withContext<() => boolean>((ctx) => {
            const settings = ctx?.getSettings();
            const features = ctx?.getFeatures();

            if (!features?.Passkeys) return false;
            return fn({
                get: settings?.passkeys.get ?? false,
                create: settings?.passkeys.create ?? false,
            });
        });

    /** Check if passkey retrieval (authentication) is enabled in user settings */
    const approvePasskeyGet = withPasskeySettings(({ get }) => get);
    /** Check if passkey creation (registration) is enabled in user settings */
    const approvePasskeyCreate = withPasskeySettings(({ create }) => create);
    /** Check if any passkey operation (get or create) is enabled for request interception */
    const approveIntercept = withPasskeySettings(({ get, create }) => get || create);

    /** Handles incoming WebAuthn bridge requests from the injected content script.
     * Processes different request types (create, get, intercept) with rate limiting. */
    const onBridgeRequest = withContext<(data: BridgeRequest) => MaybePromise<void>>((ctx, data) => {
        switch (data.request.type) {
            case WorkerMessageType.PASSKEY_CREATE: {
                const { token } = data;
                const { request } = data.request.payload;
                const domain = location.hostname;

                if (!limiter.allowMessage(data.request.type)) {
                    abortPending();
                    abort(token, false);
                    return;
                }

                return approve(token, approvePasskeyCreate)
                    .then(() => {
                        ctx?.service.inline.notification.open({
                            action: NotificationAction.PASSKEY_CREATE,
                            domain,
                            request,
                            token,
                        });
                    })
                    .catch((err) => onPasskeyError(token, err));
            }

            case WorkerMessageType.PASSKEY_GET: {
                const { token } = data;
                const { request } = data.request.payload;
                const domain = location.hostname;

                if (!limiter.allowMessage(data.request.type)) {
                    abortPending();
                    abort(token, false);
                    return;
                }

                return approve(token, approvePasskeyGet)
                    .then(async () => {
                        const publicKey = JSON.parse(request) as SanitizedPublicKeyRequest;
                        const credentialIds = (publicKey.allowCredentials ?? []).map(prop('id'));

                        await sendMessage.on(
                            contentScriptMessage({
                                type: WorkerMessageType.PASSKEY_QUERY,
                                payload: { domain, credentialIds },
                            }),
                            (response) => {
                                if (!matchesRequestToken(token)) return abort(token, false);

                                const passkeys = response.type === 'success' ? response.passkeys : [];
                                if (!passkeys.length) return abort(token, true);

                                return ctx?.service.inline.notification.open({
                                    action: NotificationAction.PASSKEY_GET,
                                    domain,
                                    passkeys,
                                    request,
                                    token,
                                });
                            }
                        );
                    })
                    .catch((err) => onPasskeyError(token, err));
            }

            case WorkerMessageType.PASSKEY_INTERCEPT: {
                /** Use a more permissive rate limit per reason key (5/500ms) to accommodate
                 * sites like paypal.com that fire multiple rapid availability checks on login. */
                if (limiter.allowMessage(data.request.payload.reason, { windowMax: 5 })) {
                    return window.postMessage(
                        createBridgeResponse<WorkerMessageType.PASSKEY_INTERCEPT>(
                            {
                                type: 'success',
                                intercept: approveIntercept(),
                            },
                            data.token
                        )
                    );
                }
            }
        }
    });

    /** Initializes the passkey service by setting up message listeners.
     * Attaches inline notification early if WebAuthn fields are detected. */
    const init = withContext((ctx) => {
        listeners.addListener(
            window,
            'message',
            withContext(async (ctx, { data }) => {
                const token = state.get('requestToken');
                if (token && isBridgeAbortSignal(token)(data)) ctx?.service.inline.notification.close();
                else if (isBridgeRequest(data)) return onBridgeRequest(data);
            })
        );

        const webAuthFields = document.querySelectorAll('input[autocomplete*="webauthn"]').length > 0;
        if (webAuthFields) ctx?.service.inline.notification.attach();
    });

    /** Cleans up the passkey service by aborting active requests,
     * signaling disconnection, and removing all event listeners. */
    const destroy = () => {
        abort(state.get('requestToken'), false);
        state.set('requestToken', null);
        window.postMessage(createBridgeDisconnectSignal());
        listeners.removeAll();
    };

    return {
        abort,
        approve,
        destroy,
        handler: onBridgeRequest,
        init,
        limiter,
        state,
    };
};

export type PasskeyService = ReturnType<typeof createPasskeyService>;
