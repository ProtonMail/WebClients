import { NotificationAction } from 'proton-pass-extension/app/content/types';

import { clientHasSession, clientNeedsSession } from '@proton/pass/lib/client';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import type { SanitizedPublicKeyRequest } from '@proton/pass/lib/passkeys/types';
import { type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import type { Predicate } from '@proton/pass/utils/fp/predicates';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { objectHandler } from '@proton/pass/utils/object/handler';

import {
    createBridgeAbortSignal,
    createBridgeDisconnectSignal,
    createBridgeResponse,
    isBridgeAbortSignal,
    isBridgeRequest,
} from '../bridge/message';
import { withContext } from '../context/context';

type WebAuthNServiceState = { requestToken: MaybeNull<string> };

export const createWebAuthNService = () => {
    const listeners = createListenerStore();
    const state = objectHandler<WebAuthNServiceState>({ requestToken: null });

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

    const approveRequest = (token: string, allow: () => boolean) => {
        abort(false); /* abort any on-going requests */
        state.set('requestToken', token);

        return waitUntil(
            {
                check: withContext<Predicate>((ctx) =>
                    ctx && ctx.getState().ready ? clientHasSession(ctx.getState().status) : false
                ),
                cancel: withContext<Predicate>((ctx) => {
                    if (!ctx) return true;
                    if (!ctx.getState().ready) return false;
                    if (!allow()) return true;
                    /** abort early if we have no session to resume from */
                    if (clientNeedsSession(ctx.getState().status)) return true;
                    /** cancel if request token is null or if the content-script is stale */
                    return state.get('requestToken') === null || (ctx?.getState()?.stale ?? false);
                }),
            },
            50
        );
    };

    const init = withContext((ctx) => {
        listeners.addListener(
            window,
            'message',
            withContext(async (ctx, { data }) => {
                if (!ctx) return;

                const token = state.get('requestToken');
                if (token && isBridgeAbortSignal(token)(data)) ctx?.service.iframe.notification?.close();

                if (isBridgeRequest(data)) {
                    switch (data.request.type) {
                        case WorkerMessageType.PASSKEY_CREATE: {
                            const { token } = data;
                            const { request } = data.request.payload;

                            return approveRequest(token, () => {
                                const settings = ctx.getSettings();
                                const features = ctx.getFeatures();
                                return features.Passkeys && settings.passkeys.create;
                            })
                                .then(() =>
                                    ctx?.service.iframe.attachNotification()?.open({
                                        action: NotificationAction.PASSKEY_CREATE,
                                        request,
                                        token,
                                    })
                                )
                                .catch(() => abort(true));
                        }
                        case WorkerMessageType.PASSKEY_GET: {
                            const { token } = data;
                            const { domain, request } = data.request.payload;

                            return approveRequest(token, () => {
                                const settings = ctx.getSettings();
                                const features = ctx.getFeatures();
                                return features.Passkeys && settings.passkeys.get;
                            })
                                .then(async () => {
                                    const publicKey = JSON.parse(request) as SanitizedPublicKeyRequest;
                                    const credentialIds = (publicKey.allowCredentials ?? []).map(prop('id'));

                                    await sendMessage.on(
                                        contentScriptMessage({
                                            type: WorkerMessageType.PASSKEY_QUERY,
                                            payload: { domain, credentialIds },
                                        }),
                                        (response) => {
                                            const passkeys = response.type === 'success' ? response.passkeys : [];
                                            if (!passkeys.length) return abort(true);

                                            return ctx?.service.iframe.attachNotification()?.open({
                                                action: NotificationAction.PASSKEY_GET,
                                                request,
                                                token,
                                                passkeys,
                                            });
                                        }
                                    );
                                })
                                .catch(() => abort(true));
                        }

                        case WorkerMessageType.PASSKEY_INTERCEPT: {
                            const { token } = data;
                            const settings = ctx.getSettings();
                            const features = ctx.getFeatures();
                            const intercept = features.Passkeys && (settings.passkeys.get || settings.passkeys.create);

                            return window.postMessage(
                                createBridgeResponse<WorkerMessageType.PASSKEY_INTERCEPT>(
                                    { type: 'success', intercept },
                                    token
                                )
                            );
                        }
                    }
                }
            })
        );

        /** Attach injected notification early if a webauthn input is detected */
        const webAuthFields = document.querySelectorAll('input[autocomplete*="webauthn"]').length > 0;
        if (webAuthFields) ctx?.service.iframe.attachNotification();
    });

    const destroy = () => {
        abort(false);
        window.postMessage(createBridgeDisconnectSignal());
        listeners.removeAll();
    };

    return { init, destroy };
};

export type WebAuthNService = ReturnType<typeof createWebAuthNService>;
