import { NotificationAction } from 'proton-pass-extension/app/content/types';

import { clientStatusResolved } from '@proton/pass/lib/client';
import { WorkerMessageType } from '@proton/pass/types';
import type { Predicate } from '@proton/pass/utils/fp/predicates';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { createListenerStore } from '@proton/pass/utils/listener/factory';

import { isBridgeRequest } from '../bridge/message';
import { withContext } from '../context/context';

export const createWebAuthNService = () => {
    const listeners = createListenerStore();

    const ensureReady = () =>
        waitUntil(
            {
                check: withContext<Predicate>((ctx) => (ctx ? clientStatusResolved(ctx.getState().status) : false)),
                cancel: withContext<Predicate>((ctx) => ctx?.getState()?.stale ?? false),
            },
            50
        );

    const init = withContext((ctx) => {
        listeners.addListener(
            window,
            'message',
            withContext(async (ctx, { data }) => {
                if (!ctx) return;

                if (isBridgeRequest(data)) {
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

    return {
        init,
        destroy: () => listeners.removeAll(),
    };
};

export type WebAuthNService = ReturnType<typeof createWebAuthNService>;
