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
import { IFramePortMessageType, NotificationAction } from 'proton-pass-extension/app/content/types';

import { FieldType, flagAsIgnored, removeClassifierFlags } from '@proton/pass/fathom';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { WorkerMessageType } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { asyncQueue } from '@proton/pass/utils/fp/promises';
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
                            .filter(({ getFieldsFor }) => getFieldsFor(FieldType.OTP).length > 0)
                            .forEach(({ element }) => {
                                removeClassifierFlags(element, { preserveIgnored: true });
                                flagAsIgnored(element);
                            });
                    }

                    /* handle OTP -> AutoSave sequence */
                    return ctx?.service.autosave.reconciliate();
            }
        }),
        position: () => ({ top: 15, right: 15 }),
        dimensions: ({ action }) => ({
            width: NOTIFICATION_WIDTH,
            height: action === NotificationAction.OTP ? NOTIFICATION_HEIGHT_SM : NOTIFICATION_HEIGHT,
        }),
    });

    const open = asyncQueue(
        withContext<(payload: NotificationActions) => Promise<void>>((ctx, payload) =>
            iframe
                .ensureReady()
                .then(() => {
                    /** if OTP autofill notification is opened - do not process
                     * any other actions : it should take precedence */
                    const state = ctx?.service.iframe.notification?.getState();
                    if (state?.action === NotificationAction.OTP && state.visible) return;

                    iframe.sendPortMessage({ type: IFramePortMessageType.NOTIFICATION_ACTION, payload });
                    iframe.open(payload.action);
                })
                .catch(noop)
        )
    );

    iframe.registerMessageHandler(
        IFramePortMessageType.NOTIFICATION_AUTOFILL_OTP,
        withContext((ctx, { payload: { code } }) => {
            const form = ctx?.service.formManager
                .getTrackedForms()
                .find(({ getFieldsFor }) => getFieldsFor(FieldType.OTP).length > 0);

            if (form) ctx?.service.autofill.autofillOTP(form, code);
        })
    );

    const notification: InjectedNotification = {
        close: pipe(iframe.close, () => notification),
        destroy: pipe(iframe.destroy, onDestroy),
        getState: () => iframe.state,
        init: pipe(iframe.init, () => notification),
        open: pipe(open, () => notification),
        sendMessage: iframe.sendPortMessage,
    };

    return notification;
};
