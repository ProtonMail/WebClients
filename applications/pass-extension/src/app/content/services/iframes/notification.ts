import { NOTIFICATION_IFRAME_SRC, NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { NOTIFICATION_MIN_HEIGHT, NOTIFICATION_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/services/iframes/messages';
import type { PopoverController } from 'proton-pass-extension/app/content/services/iframes/popover';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { FieldType, flagAsIgnored, removeClassifierFlags } from '@proton/pass/fathom';
import type { SelectedPasskey } from '@proton/pass/lib/passkeys/types';
import type { AutosaveFormEntry, AutosavePayload, Item, LoginItemPreview } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { asyncQueue } from '@proton/pass/utils/fp/promises';
import noop from '@proton/utils/noop';

import type { IFrameAppService } from './factory';
import { createIFrameApp } from './factory';

export type NotificationRequest =
    | { action: NotificationAction.AUTOSAVE; data: AutosavePayload }
    | { action: NotificationAction.OTP; item: LoginItemPreview }
    | {
          action: NotificationAction.PASSKEY_CREATE;
          domain: string;
          request: string;
          token: string;
      }
    | {
          action: NotificationAction.PASSKEY_GET;
          domain: string;
          passkeys: SelectedPasskey[];
          request: string;
          token: string;
      };

export type AutosaveRequest = { item: Item<'login'>; submission: AutosaveFormEntry };
export interface InjectedNotification extends IFrameAppService<NotificationRequest> {}
export type NotificationOptions = { popover: PopoverController; onDestroy: () => void };

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

    const open = asyncQueue((payload: NotificationRequest) =>
        iframe
            .ensureReady()
            .then(() => {
                /** if OTP autofill notification is opened - do not process
                 * any other actions : it should take precedence */
                const autosave = payload.action === NotificationAction.AUTOSAVE;
                const { action, visible } = iframe.state;
                if (autosave && visible && action === NotificationAction.OTP) return;

                iframe.sendPortMessage({ type: IFramePortMessageType.NOTIFICATION_ACTION, payload });
                iframe.open(payload.action);
                iframe.updatePosition();
            })
            .catch(noop)
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
