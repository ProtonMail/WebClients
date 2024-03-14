import { NotificationAction } from 'proton-pass-extension/app/content/types';

import { clientStatusResolved } from '@proton/pass/lib/client';
import { type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import type { Predicate } from '@proton/pass/utils/fp/predicates';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { objectHandler } from '@proton/pass/utils/object/handler';

import { createBridgeAbortSignal, isBridgeAbortSignal, isBridgeRequest } from '../bridge/message';
import { withContext } from '../context/context';

type WebAuthNServiceState = { requestToken: MaybeNull<string> };

export const createWebAuthNService = () => {
    const listeners = createListenerStore();
    const state = objectHandler<WebAuthNServiceState>({ requestToken: null });

    const ensureReady = () =>
        waitUntil(
            {
                check: withContext<Predicate>((ctx) => (ctx ? clientStatusResolved(ctx.getState().status) : false)),
                cancel: withContext<Predicate>(
                    (ctx) => state.get('requestToken') === null || (ctx?.getState()?.stale ?? false)
                ),
            },
            50
        );

    const init = withContext((ctx) => {
        listeners.addListener(
            window,
            'message',
            withContext(async (ctx, { data }) => {
                if (!ctx) return;

                if (isBridgeAbortSignal(data) && data.token === state.get('requestToken')) {
                    ctx?.service.iframe.notification?.close();
                }

                if (isBridgeRequest(data)) {
                    state.set('requestToken', data.token);

                    switch (data.request.type) {
                        case WorkerMessageType.PASSKEY_CREATE: {
                            await ensureReady();
                            return ctx?.service.iframe.attachNotification()?.open({
                                action: NotificationAction.PASSKEY_CREATE,
                                domain: ctx.getExtensionContext().url.domain!,
                                request: data.request.payload.request,
                                token: data.token,
                            });
                        }
                        case WorkerMessageType.PASSKEY_GET: {
                            await ensureReady();
                            return ctx?.service.iframe.attachNotification()?.open({
                                action: NotificationAction.PASSKEY_GET,
                                domain: ctx.getExtensionContext().url.domain!,
                                request: data.request.payload.request,
                                token: data.token,
                            });
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
        const token = state.get('requestToken');
        if (token) window.postMessage(createBridgeAbortSignal(token), '*');

        listeners.removeAll();
        state.set('requestToken', null);
    };

    return { init, destroy };
};

export type WebAuthNService = ReturnType<typeof createWebAuthNService>;
