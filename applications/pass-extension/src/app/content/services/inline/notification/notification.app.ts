import { NOTIFICATION_IFRAME_SRC, NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { NOTIFICATION_MIN_HEIGHT, NOTIFICATION_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { InlineAppHandler, InlineEvent } from 'proton-pass-extension/app/content/services/inline/inline.app';
import { createInlineApp } from 'proton-pass-extension/app/content/services/inline/inline.app';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import type { PopoverController } from 'proton-pass-extension/app/content/services/inline/inline.popover';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { flagAsIgnored, removeClassifierFlags } from '@proton/pass/fathom';
import { FieldType } from '@proton/pass/fathom/labels';
import type { SelectedPasskey } from '@proton/pass/lib/passkeys/types';
import type { AutosavePayload, LoginItemPreview } from '@proton/pass/types';
import { asyncQueue } from '@proton/pass/utils/fp/promises';
import noop from '@proton/utils/noop';

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

export interface NotificationApp extends InlineAppHandler<NotificationRequest> {}
type NotificationEvent<T extends InlineEvent<any>['type']> = Extract<InlineEvent<NotificationAction>, { type: T }>;

export const createNotification = (popover: PopoverController): NotificationApp => {
    const iframe = createInlineApp<NotificationAction>({
        id: 'notification',
        src: NOTIFICATION_IFRAME_SRC,
        animation: 'slidein',
        classNames: ['fixed'],
        popover,
        position: () => ({ top: 15, right: 15 }),
        dimensions: () => ({ width: NOTIFICATION_WIDTH, height: NOTIFICATION_MIN_HEIGHT }),
    });

    const onClose = withContext<(evt: NotificationEvent<'close'>) => void>((ctx, { state, options }) => {
        switch (state.action) {
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
    });

    iframe.subscribe((evt) => {
        switch (evt.type) {
            case 'close':
                return onClose(evt);
            case 'error':
                return iframe.destroy();
        }
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

                iframe.sendPortMessage({ type: InlinePortMessageType.NOTIFICATION_ACTION, payload });
                iframe.open(payload.action);
                iframe.updatePosition();
            })
            .catch(noop)
    );

    iframe.registerMessageHandler(
        InlinePortMessageType.AUTOFILL_OTP,
        withContext(async (ctx, { payload: { code } }) => {
            const form = ctx?.service.formManager
                .getTrackedForms()
                .find(({ getFieldsFor }) => getFieldsFor(FieldType.OTP).length > 0);

            if (form) await ctx?.service.autofill.autofillOTP(form, code);
        }),
        { userAction: true }
    );

    iframe.registerMessageHandler(
        InlinePortMessageType.PASSKEY_RELAY,
        ({ payload }) => window.postMessage(payload, '*'),
        { userAction: true }
    );

    const notification: NotificationApp = {
        close: iframe.close,
        destroy: iframe.destroy,
        getState: () => iframe.state,
        init: iframe.init,
        open,
        sendMessage: iframe.sendPortMessage,
        subscribe: iframe.subscribe,
    };

    return notification;
};
