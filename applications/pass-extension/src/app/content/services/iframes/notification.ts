import { NOTIFICATION_IFRAME_SRC } from 'proton-pass-extension/app/content/constants.runtime';
import { NOTIFICATION_MIN_HEIGHT, NOTIFICATION_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { createIFrameApp } from 'proton-pass-extension/app/content/injections/iframe/create-iframe-app';
import type { PopoverController } from 'proton-pass-extension/app/content/services/iframes/popover';
import type { InjectedNotification, NotificationActions } from 'proton-pass-extension/app/content/types';
import { IFramePortMessageType, NotificationAction } from 'proton-pass-extension/app/content/types';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { FieldType, flagAsIgnored, removeClassifierFlags } from '@proton/pass/fathom';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { asyncQueue } from '@proton/pass/utils/fp/promises';
import noop from '@proton/utils/noop';

type NotificationOptions = { popover: PopoverController; onDestroy: () => void };

export const createNotification = ({ popover, onDestroy }: NotificationOptions): InjectedNotification => {
    const iframe = createIFrameApp<NotificationAction>({
        animation: 'slidein',
        backdropClose: false,
        classNames: ['fixed'],
        id: 'notification',
        popover,
        src: NOTIFICATION_IFRAME_SRC,
        onDestroy,
        onError: () => iframe.destroy(),
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
                            .forEach(({ element, getFieldsFor }) => {
                                removeClassifierFlags(element, { preserveIgnored: true });
                                flagAsIgnored(element);
                                getFieldsFor(FieldType.OTP).forEach((field) => flagAsIgnored(field.element));
                            });
                    }

                    /* handle OTP -> AutoSave sequence */
                    return ctx?.service.autosave.reconciliate();
            }
        }),
        position: () => ({ top: 15, right: 15 }),
        dimensions: () => ({
            width: NOTIFICATION_WIDTH,
            height: NOTIFICATION_MIN_HEIGHT,
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
        IFramePortMessageType.AUTOFILL_OTP,
        withContext(async (ctx, { payload: { code } }) => {
            const form = ctx?.service.formManager
                .getTrackedForms()
                .find(({ getFieldsFor }) => getFieldsFor(FieldType.OTP).length > 0);

            if (form) await ctx?.service.autofill.autofillOTP(form, code);
        }),
        { userAction: true }
    );

    iframe.registerMessageHandler(
        IFramePortMessageType.PASSKEY_RELAY,
        ({ payload }) => window.postMessage(payload, '*'),
        { userAction: true }
    );

    const notification: InjectedNotification = {
        close: pipe(iframe.close, () => notification),
        destroy: iframe.destroy,
        getState: () => iframe.state,
        init: pipe(iframe.init, () => notification),
        open: pipe(open, () => notification),
        sendMessage: iframe.sendPortMessage,
    };

    return notification;
};
