import { NotificationAction } from 'proton-pass-extension/app/content/types';

import { clientHasSession, clientNeedsSession } from '@proton/pass/lib/client';
import { type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import type { Predicate } from '@proton/pass/utils/fp/predicates';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { objectHandler } from '@proton/pass/utils/object/handler';

import { createBridgeAbortSignal, createBridgeResponse, isBridgeAbortSignal, isBridgeRequest } from '../bridge/message';
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
                    : createBridgeAbortSignal(token),
                '*'
            );
        }
    };

    const approveRequest = (token: string) => {
        abort(false); /* abort any on-going requests */
        state.set('requestToken', token);
        return waitUntil(
            {
                check: withContext<Predicate>((ctx) => (ctx ? clientHasSession(ctx.getState().status) : false)),
                cancel: withContext<Predicate>((ctx) => {
                    /** abort early if we have no session to resume from */
                    if (!ctx || clientNeedsSession(ctx.getState().status)) return true;
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
                            return approveRequest(data.token)
                                .then(() =>
                                    ctx?.service.iframe.attachNotification()?.open({
                                        action: NotificationAction.PASSKEY_CREATE,
                                        domain: data.request.payload.domain,
                                        request: data.request.payload.request,
                                        token: data.token,
                                    })
                                )
                                .catch(() => abort(true));
                        }
                        case WorkerMessageType.PASSKEY_GET: {
                            return approveRequest(data.token)
                                .then(() => {
                                    ctx?.service.iframe.attachNotification()?.open({
                                        action: NotificationAction.PASSKEY_GET,
                                        domain: data.request.payload.domain,
                                        request: data.request.payload.request,
                                        token: data.token,
                                    });
                                })
                                .catch(() => abort(true));
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
        listeners.removeAll();
        abort(false);
    };

    return { init, destroy };
};

export type WebAuthNService = ReturnType<typeof createWebAuthNService>;
