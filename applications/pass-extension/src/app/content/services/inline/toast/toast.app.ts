import { flagAsIgnored, removeClassifierFlags } from '@protontech/autofill';
import { FieldType } from '@protontech/autofill/types';

import type { SelectedPasskey } from '@proton/pass/lib/passkeys/types';
import type { PromptDescriptor } from '@proton/pass/store/notifications/prompts/definitions';
import type { AutosavePayload } from '@proton/pass/types/worker/autosave';
import type { LoginItemPreview } from '@proton/pass/types/worker/data';
import { asyncQueue } from '@proton/pass/utils/fp/promises';
import noop from '@proton/utils/noop';

import { contentScriptMessage, sendMessage } from '../../../../../lib/message/send-message';
import { WorkerMessageType } from '../../../../../types/messages';
import { InlineToastAction, TOAST_IFRAME_SRC } from '../../../constants.runtime';
import { TOAST_MIN_HEIGHT, TOAST_WIDTH } from '../../../constants.static';
import { withContext } from '../../../context/context';
import type { InlineAppHandler, InlineEvent } from '../inline.app';
import { createInlineApp } from '../inline.app';
import { InlinePortMessageType } from '../inline.messages';
import type { PopoverController } from '../inline.popover';

export type InlineToastRequest =
    | { action: InlineToastAction.AUTOSAVE; data: AutosavePayload }
    | { action: InlineToastAction.OFFLINE_SETUP; data: PromptDescriptor }
    | { action: InlineToastAction.OTP; item: LoginItemPreview }
    | {
          action: InlineToastAction.PASSKEY_CREATE;
          domain: string;
          request: string;
          token: string;
      }
    | {
          action: InlineToastAction.PASSKEY_GET;
          domain: string;
          passkeys: SelectedPasskey[];
          request: string;
          token: string;
      }
    | { action: InlineToastAction.TOAST; message: string };

export interface InlineToastApp extends InlineAppHandler<InlineToastRequest> {}
type InlineToastEvent<T extends InlineEvent<any>['type']> = Extract<InlineEvent<InlineToastRequest>, { type: T }>;

/** Toast priority arbitration: a visible toast can only be replaced
 * by a request of strictly higher priority. Real user ceremonies
 * (OTP autofill, passkeys) outrank transient prompts. */
const TOAST_PRIORITY: Record<InlineToastAction, number> = {
    [InlineToastAction.OFFLINE_SETUP]: 1,
    [InlineToastAction.TOAST]: 1,
    [InlineToastAction.AUTOSAVE]: 2,
    [InlineToastAction.OTP]: 3,
    [InlineToastAction.PASSKEY_CREATE]: 3,
    [InlineToastAction.PASSKEY_GET]: 3,
};

export const createToastApp = (popover: PopoverController): InlineToastApp => {
    const iframe = createInlineApp<InlineToastRequest>({
        id: 'toast',
        src: TOAST_IFRAME_SRC,
        animation: 'slidein',
        classNames: ['fixed'],
        popover,
        dimensions: () => ({ width: TOAST_WIDTH, height: TOAST_MIN_HEIGHT }),
    });

    const onClose = withContext<(evt: InlineToastEvent<'close'>) => void>((ctx, evt) => {
        const { state, request, options } = evt;
        if (!request) return;

        switch (state.action) {
            /* stash the form submission if the user
             * discarded the autosave prompt */
            case InlineToastAction.AUTOSAVE:
                return (
                    options?.discard &&
                    sendMessage(
                        contentScriptMessage({
                            type: WorkerMessageType.FORM_ENTRY_STASH,
                            payload: { reason: 'AUTOSAVE_DISMISSED' },
                        })
                    )
                );
            /* flag all MFA forms as ignorable on user
             * discards the OTP autofill prompt */
            case InlineToastAction.OTP:
                if (options?.discard) {
                    ctx?.service.formManager
                        .getForms()
                        .filter(({ getFieldsFor }) => getFieldsFor(FieldType.OTP).length > 0)
                        .forEach(({ element, getFieldsFor }) => {
                            removeClassifierFlags(element, { preserveIgnored: true });
                            flagAsIgnored(element);
                            getFieldsFor(FieldType.OTP).forEach((field) => flagAsIgnored(field.element));
                        });
                }

                /* handle OTP -> AutoSave sequence */
                return ctx?.service.autosave.reconciliate();
            /* record the dismissal in the ledger (X and
             * "Not now" both count — ticket requirement) */
            case InlineToastAction.OFFLINE_SETUP:
                if (options?.discard && request.action === InlineToastAction.OFFLINE_SETUP) {
                    return sendMessage(
                        contentScriptMessage({
                            type: WorkerMessageType.PROMPT_DISMISS,
                            payload: { id: request.data.id },
                        })
                    ).catch(noop);
                }
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

    iframe.registerMessageHandler(
        InlinePortMessageType.AUTOFILL_OTP,
        withContext(async (ctx, { payload: { code } }) => {
            const form = ctx?.service.formManager
                .getForms()
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

    const toast: InlineToastApp = {
        close: iframe.close,
        destroy: iframe.destroy,
        getState: () => iframe.state,
        init: iframe.init,
        open: asyncQueue(async (request: InlineToastRequest) => {
            /** a visible toast can only be preempted by a
             * higher-priority request : otherwise dropped.
             * NB: `open` is queue-serialized, so dropping
             * (rather than queueing behind the visible toast)
             * is the correct behavior for stale prompts */
            const { action, visible } = iframe.state;
            if (visible && action && TOAST_PRIORITY[request.action] < TOAST_PRIORITY[action]) return;

            iframe.sendPortMessage({ type: InlinePortMessageType.TOAST_ACTION, payload: request });
            iframe.setPosition(() => ({ top: 15, right: 15 }));
            return iframe.open(request);
        }),
        sendMessage: iframe.sendPortMessage,
        subscribe: iframe.subscribe,
    };

    return toast;
};
