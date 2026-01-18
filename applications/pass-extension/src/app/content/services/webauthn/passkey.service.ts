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
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { clientHasSession, clientNeedsSession } from '@proton/pass/lib/client';
import type { SanitizedPublicKeyRequest } from '@proton/pass/lib/passkeys/types';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import type { PasskeySettings } from '@proton/pass/types/worker/settings';
import { createEventLimiter } from '@proton/pass/utils/event/limiter';
import { prop } from '@proton/pass/utils/fp/lens';
import type { Predicate } from '@proton/pass/utils/fp/predicates';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { objectHandler } from '@proton/pass/utils/object/handler';

type PasskeyServiceState = { requestToken: MaybeNull<string> };

export const createPasskeyService = () => {
    const listeners = createListenerStore();
    const state = objectHandler<PasskeyServiceState>({ requestToken: null });

    /** Rate limiter to prevent DoS attacks: allows max 1 WebAuthn message per second.
     * Mitigates resource exhaustion from malicious pages flooding the extension. */
    const limiter = createEventLimiter(1, 1_000);

    /** Verifies that a given token matches the current stateful
     * value. This is useful to cancel any async side-effects upon
     * approval of a passkey message */
    const matchesRequestToken = (token: string) => state.get('requestToken') === token;

    const abort = (browserFallback: boolean) => {
        const token = state.get('requestToken');
        state.set('requestToken', null);

        if (token) {
            window.postMessage(
                browserFallback
                    ? createBridgeResponse({ type: 'success', intercept: false }, token)
                    : createBridgeAbortSignal(token)
            );
        }
    };

    const approveRequest = async (token: string, allow: () => boolean): Promise<boolean> => {
        /** Abort any pending requests. Incoming requests supersede existing ones
         * to prevent resource accumulation and ensure latest intent is honored. */
        abort(false);

        /** Set active request token for state tracking. Subsequent requests
         * that bypass the rate limiter will be cancelled via token mismatch
         * validation in the waitUntil cancel predicate. */
        state.set('requestToken', token);

        await waitUntil(
            {
                check: withContext<Predicate>((ctx) =>
                    ctx && ctx.getState().ready ? clientHasSession(ctx.getState().status) : false
                ),
                cancel: withContext<Predicate>((ctx) => {
                    if (!ctx) return true;
                    if (!ctx.getState().ready) return false;
                    if (ctx.getState().stale) return true;
                    if (!allow()) return true;
                    /** abort early if we have no session to resume from */
                    if (clientNeedsSession(ctx.getState().status)) return true;
                    /** cancel if request token has mutated or if the content-script is stale */
                    return !matchesRequestToken(token);
                }),
            },
            50
        );

        return matchesRequestToken(token);
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

    const approvePasskeyGet = withPasskeySettings(({ get }) => get);
    const approvePasskeyCreate = withPasskeySettings(({ create }) => create);
    const approveIntercept = withPasskeySettings(({ get, create }) => get || create);

    const onBridgeRequest = withContext<(data: BridgeRequest) => void>((ctx, data) => {
        if (!ctx) return;

        switch (data.request.type) {
            case WorkerMessageType.PASSKEY_CREATE: {
                if (!limiter.allowMessage(data.request.type)) return abort(false);

                const { token } = data;
                const { request } = data.request.payload;
                const domain = location.hostname;

                return approveRequest(token, approvePasskeyCreate)
                    .then((approved) => {
                        if (approved) {
                            ctx.service.inline.notification.open({
                                action: NotificationAction.PASSKEY_CREATE,
                                domain,
                                request,
                                token,
                            });
                        }
                    })
                    .catch(() => abort(true));
            }

            case WorkerMessageType.PASSKEY_GET: {
                if (!limiter.allowMessage(data.request.type)) return abort(false);

                const { token } = data;
                const { request } = data.request.payload;
                const domain = location.hostname;

                return approveRequest(token, approvePasskeyGet)
                    .then(async (approved) => {
                        if (approved) {
                            const publicKey = JSON.parse(request) as SanitizedPublicKeyRequest;
                            const credentialIds = (publicKey.allowCredentials ?? []).map(prop('id'));

                            await sendMessage.on(
                                contentScriptMessage({
                                    type: WorkerMessageType.PASSKEY_QUERY,
                                    payload: { domain, credentialIds },
                                }),
                                (response) => {
                                    if (matchesRequestToken(token)) {
                                        const passkeys = response.type === 'success' ? response.passkeys : [];
                                        if (!passkeys.length) return abort(true);

                                        return ctx?.service.inline.notification.open({
                                            action: NotificationAction.PASSKEY_GET,
                                            domain,
                                            passkeys,
                                            request,
                                            token,
                                        });
                                    }
                                }
                            );
                        }
                    })
                    .catch(() => abort(true));
            }

            case WorkerMessageType.PASSKEY_INTERCEPT: {
                if (limiter.allowMessage(data.request.type)) {
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

    const init = withContext((ctx) => {
        listeners.addListener(
            window,
            'message',
            withContext(async (ctx, { data }) => {
                const token = state.get('requestToken');
                if (token && isBridgeAbortSignal(token)(data)) ctx?.service.inline.notification.close();
                else if (isBridgeRequest(data)) onBridgeRequest(data);
            })
        );

        /** Attach injected notification early if a webauthn input is detected */
        const webAuthFields = document.querySelectorAll('input[autocomplete*="webauthn"]').length > 0;
        if (webAuthFields) ctx?.service.inline.notification.attach();
    });

    const destroy = () => {
        abort(false);
        window.postMessage(createBridgeDisconnectSignal());
        listeners.removeAll();
    };

    return { init, destroy };
};

export type PasskeyService = ReturnType<typeof createPasskeyService>;
