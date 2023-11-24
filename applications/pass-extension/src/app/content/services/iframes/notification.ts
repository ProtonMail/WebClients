import { NOTIFICATION_IFRAME_SRC } from 'proton-pass-extension/app/content/constants.runtime';
import {
    NOTIFICATION_HEIGHT,
    NOTIFICATION_HEIGHT_SM,
    NOTIFICATION_WIDTH,
} from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { createIFrameApp } from 'proton-pass-extension/app/content/injections/iframe/create-iframe-app';
import type { InjectedNotification, NotificationActions } from 'proton-pass-extension/app/content/types';
import { IFrameMessageType, NotificationAction } from 'proton-pass-extension/app/content/types';

import { FormType, flagAsIgnored, removeClassifierFlags } from '@proton/pass/fathom';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import noop from '@proton/utils/noop';

export const createNotification = (): InjectedNotification => {
    const iframe = createIFrameApp<NotificationAction>({
        id: 'notification',
        src: NOTIFICATION_IFRAME_SRC,
        animation: 'slidein',
        backdropClose: false,
        classNames: ['fixed'],
        onError: withContext((ctx) => ctx.service.iframe.detachNotification()),
        onClose: withContext(({ service }, { action }, options) => {
            switch (action) {
                /* stash the form submission if the user discarded
                 * the autosave prompt */
                case NotificationAction.AUTOSAVE_PROMPT:
                    return (
                        options?.discard &&
                        sendMessage(
                            contentScriptMessage({
                                type: WorkerMessageType.FORM_ENTRY_STASH,
                                payload: { reason: 'AUTOSAVE_DISMISSED' },
                            })
                        )
                    );
                /* flag all MFA forms as ignorable on user discards the
                 * OTP autofill prompt */
                case NotificationAction.AUTOFILL_OTP_PROMPT:
                    if (options?.discard) {
                        service.formManager
                            .getTrackedForms()
                            .filter(({ formType }) => formType === FormType.MFA)
                            .forEach(({ element }) => {
                                removeClassifierFlags(element);
                                flagAsIgnored(element);
                            });
                    }

                    /* handle OTP -> AutoSave sequence */
                    return service.autosave.reconciliate().catch(noop);
            }
        }),
        position: () => ({ top: 15, right: 15 }),
        dimensions: ({ action }) => ({
            width: NOTIFICATION_WIDTH,
            height: action === NotificationAction.AUTOFILL_OTP_PROMPT ? NOTIFICATION_HEIGHT_SM : NOTIFICATION_HEIGHT,
        }),
    });

    const open = async (payload: NotificationActions) => {
        await waitUntil(() => iframe.state.ready, 50);

        if (!iframe.state.visible) {
            iframe.sendPortMessage({ type: IFrameMessageType.NOTIFICATION_ACTION, payload });
            iframe.open(payload.action);
        }
    };

    iframe.registerMessageHandler(
        IFrameMessageType.NOTIFICATION_AUTOFILL_OTP,
        withContext(({ service: { formManager, autofill } }, { payload: { code } }) => {
            const form = formManager.getTrackedForms().find(({ formType }) => formType === FormType.MFA);
            if (!form) return;

            autofill.autofillOTP(form, code);
        })
    );

    const notification: InjectedNotification = {
        close: pipe(iframe.close, () => notification),
        destroy: iframe.destroy,
        getState: () => iframe.state,
        init: pipe(iframe.init, () => notification),
        open: pipe(open, () => notification),
        setPort: pipe(iframe.setPort, () => notification),
    };

    return notification;
};
