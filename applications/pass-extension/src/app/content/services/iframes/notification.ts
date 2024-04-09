import { NOTIFICATION_IFRAME_SRC } from 'proton-pass-extension/app/content/constants.runtime';
import {
    NOTIFICATION_HEIGHT,
    NOTIFICATION_HEIGHT_SM,
    NOTIFICATION_WIDTH,
} from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ProtonPassRoot } from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassRoot';
import { createIFrameApp } from 'proton-pass-extension/app/content/injections/iframe/create-iframe-app';
import type { InjectedNotification, NotificationActions } from 'proton-pass-extension/app/content/types';
import { IFrameMessageType, NotificationAction } from 'proton-pass-extension/app/content/types';

import { FormType, flagAsIgnored, removeClassifierFlags } from '@proton/pass/fathom';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import noop from '@proton/utils/noop';

type NotificationOptions = { root: ProtonPassRoot; onDestroy: () => void };

export const createNotification = ({ root, onDestroy }: NotificationOptions): InjectedNotification => {
    const iframe = createIFrameApp<NotificationAction>({
        animation: 'slidein',
        backdropClose: false,
        classNames: ['fixed'],
        id: 'notification',
        root,
        src: NOTIFICATION_IFRAME_SRC,
        onError: onDestroy,
        onClose: withContext((ctx, { action }, options) => {
            switch (action) {
                /* stash the form submission if the user discarded
                 * the autosave prompt */
                case NotificationAction.AUTOSAVE:
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
                case NotificationAction.OTP:
                    if (options?.discard) {
                        ctx?.service.formManager
                            .getTrackedForms()
                            .filter(({ formType }) => formType === FormType.MFA)
                            .forEach(({ element }) => {
                                removeClassifierFlags(element, { preserveIgnored: true });
                                flagAsIgnored(element);
                            });
                    }

                    /* handle OTP -> AutoSave sequence */
                    return ctx?.service.autosave.reconciliate().catch(noop);
            }
        }),
        position: () => ({ top: 15, right: 15 }),
        dimensions: ({ action }) => ({
            width: NOTIFICATION_WIDTH,
            height: action === NotificationAction.OTP ? NOTIFICATION_HEIGHT_SM : NOTIFICATION_HEIGHT,
        }),
    });

    const open = (payload: NotificationActions) =>
        iframe
            .ensureReady()
            .then(() => {
                iframe.sendPortMessage({ type: IFrameMessageType.NOTIFICATION_ACTION, payload });
                iframe.open(payload.action);
            })
            .catch(noop);

    iframe.registerMessageHandler(
        IFrameMessageType.NOTIFICATION_AUTOFILL_OTP,
        withContext((ctx, { payload: { code } }) => {
            const form = ctx?.service.formManager.getTrackedForms().find(({ formType }) => formType === FormType.MFA);
            if (!form) return;

            ctx?.service.autofill.autofillOTP(form, code);
        })
    );

    const notification: InjectedNotification = {
        close: pipe(iframe.close, () => notification),
        destroy: pipe(iframe.destroy, onDestroy),
        getState: () => iframe.state,
        init: pipe(iframe.init, () => notification),
        open: pipe(open, () => notification),
    };

    return notification;
};
