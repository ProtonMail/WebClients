import type { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { DROPDOWN_IFRAME_SRC } from 'proton-pass-extension/app/content/constants.runtime';
import { DROPDOWN_MIN_HEIGHT, DROPDOWN_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { type InlineAppHandler, createInlineApp } from 'proton-pass-extension/app/content/services/inline/inline.app';
import type { InlineCloseOptions } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import type { PopoverController } from 'proton-pass-extension/app/content/services/inline/inline.popover';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import type { AutofillActionDTO, WithAutofillOrigin } from 'proton-pass-extension/types/autofill';
import type { Coords } from 'proton-pass-extension/types/inline';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { PasswordAutosuggestOptions } from '@proton/pass/lib/password/types';
import type { MaybeNull } from '@proton/pass/types';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import type { InlineFieldTarget, InlineFrameTarget } from './dropdown.abstract';
import { createDropdownFocusController } from './dropdown.focus';
import { getDropdownPosition, intoDropdownAction, matchesDropdownAnchor, onCloseEffects } from './dropdown.utils';

export type DropdownAnchor = InlineFieldTarget | InlineFrameTarget;
export type DropdownAnchorRef = { current: MaybeNull<DropdownAnchor> };
export type AbortControllerRef = { current: MaybeNull<AbortController> };

export type DropdownActions = WithAutofillOrigin<
    | { action: DropdownAction.AUTOFILL_CC }
    | { action: DropdownAction.AUTOFILL_IDENTITY }
    | { action: DropdownAction.AUTOFILL_LOGIN; startsWith: string }
    | { action: DropdownAction.AUTOSUGGEST_ALIAS; prefix: string }
    | ({ action: DropdownAction.AUTOSUGGEST_PASSWORD } & PasswordAutosuggestOptions)
>;

export type DropdownRequest = {
    action: DropdownAction;
    /** Indicates that the request was triggered from a focus event */
    autofocused: boolean;
    /** Indicates wether the initiator field was previously autofilled */
    autofilled: boolean;
} & (InlineFieldTarget | InlineFrameTarget<{ coords: Coords; origin: string }>);

export interface DropdownApp extends InlineAppHandler<DropdownRequest> {
    /** Important Note: the anchor state is heavily used to infer
     * UX decisions with regards to dropdown interaction */
    anchor: MaybeNull<DropdownAnchor>;
    focused: boolean;
}

export const createDropdown = (popover: PopoverController): DropdownApp => {
    const anchor: DropdownAnchorRef = { current: null };
    const listeners = createListenerStore();

    const iframe = createInlineApp<DropdownRequest>({
        id: 'dropdown',
        animation: 'fadein',
        src: DROPDOWN_IFRAME_SRC,
        popover,
        dimensions: () => ({ width: DROPDOWN_WIDTH, height: DROPDOWN_MIN_HEIGHT }),
    });

    const focus = createDropdownFocusController({ iframe, popover, anchor });

    const onOpen = () => {
        const target = anchor.current;

        if (target?.type === 'frame') {
            const { formId, fieldId, frameId } = target;
            void sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.INLINE_DROPDOWN_OPENED,
                    payload: { type: 'initial', frameId, formId, fieldId },
                })
            );
        }
    };

    const onClose = (options: InlineCloseOptions) => {
        const target = anchor.current;

        switch (target?.type) {
            case 'field': {
                onCloseEffects(target.field, options);
                break;
            }

            case 'frame': {
                const { formId, fieldId, frameId } = target;
                void sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.INLINE_DROPDOWN_CLOSED,
                        payload: {
                            ...options,
                            type: 'initial',
                            frameId,
                            formId,
                            fieldId,
                        },
                    })
                );

                break;
            }
        }

        anchor.current = null;
    };

    const onAbort = (request: DropdownRequest) => {
        const match = matchesDropdownAnchor(anchor.current, request);
        if (!match) anchor.current = null;
        else logger.debug(`[DropdownApp] aborted but anchor changed`);
    };

    const onDestroy = () => {
        anchor.current = null;
        listeners.removeAll();
        focus.disconnect();
    };

    iframe.subscribe((evt) => {
        switch (evt.type) {
            case 'open':
                return onOpen();
            case 'close':
                return onClose(evt.options);
            case 'abort':
                return onAbort(evt.request);
            case 'error':
                return iframe.destroy();
            case 'destroy':
                return onDestroy();
        }
    });

    /* On a login autofill request - resolve the credentials via
     * worker communication and autofill the parent form of the
     * field the current dropdown is attached to. */
    iframe.registerMessageHandler(
        InlinePortMessageType.AUTOFILL_LOGIN,
        withContext(async (ctx, { payload }) => {
            const target = anchor.current;
            if (target?.type !== 'field') return;

            const form = target.field.getFormHandle();
            if (!form) return;

            await ctx?.service.autofill.autofillLogin(form, payload);
            target.field.focus({ preventAction: true });
        }),
        { userAction: true }
    );

    /* For a password auto-suggestion - the password will have
     * been generated in the injected iframe and passed in clear
     * text through the secure extension port channel */
    iframe.registerMessageHandler(
        InlinePortMessageType.AUTOFILL_GENERATED_PW,
        withContext(async (ctx, { payload }) => {
            const target = anchor.current;
            if (target?.type !== 'field') return;

            const form = target.field.getFormHandle();
            if (!form) return;

            const prompt = ctx?.getSettings().autosave.passwordSuggest;
            await ctx?.service.autofill.autofillPassword(form, payload.password);
            target.field.focus({ preventAction: true });

            form.tracker
                ?.processForm({ submit: false, partial: true })
                .then((res) => res && prompt && ctx.service.autosave.prompt(res))
                .catch(noop);
        }),
        { userAction: true }
    );

    /* When suggesting an alias on a register form, the alias will
     * only be created upon user action - this avoids creating
     * aliases everytime the injected iframe dropdown is opened */
    iframe.registerMessageHandler(
        InlinePortMessageType.AUTOFILL_EMAIL,
        withContext(async (ctx, { payload }) => {
            const target = anchor.current;
            if (target?.type !== 'field') return;

            await ctx?.service.autofill.autofillEmail(target.field, payload.email);
            target.field.focus({ preventAction: true });
            void target.field.getFormHandle()?.tracker?.processForm({ submit: false, partial: true });
        }),
        { userAction: true }
    );

    iframe.registerMessageHandler(
        InlinePortMessageType.AUTOFILL_IDENTITY,
        withContext(async (ctx, { payload }) => {
            const target = anchor.current;
            if (target?.type !== 'field') return;

            await ctx?.service.autofill.autofillIdentity(target.field, payload);
            target.field.focus({ preventAction: true });
        }),
        { userAction: true }
    );

    const validateAutofillAction = withContext<(payload: AutofillActionDTO) => AutofillActionDTO>((ctx, payload) => {
        if (payload.type === 'creditCard') {
            /** Optimize cross-frame detection for credit card autofill. If the
             * target form exists in the top frame and contains no iframes, we can
             * safely mark this as a same-frame operation. */
            const form = ctx?.service.formManager.getFormById(payload.formId);
            if (form && !form.element.querySelector('iframe')) payload.crossFrame = false;
        }

        return payload;
    });

    iframe.registerMessageHandler(
        InlinePortMessageType.AUTOFILL_ACTION,
        async ({ payload }) => {
            switch (payload.type) {
                case 'creditCard':
                    return sendMessage(
                        contentScriptMessage({
                            type: WorkerMessageType.AUTOFILL_CC,
                            payload: validateAutofillAction(payload),
                        })
                    );
            }
        },
        { userAction: true }
    );

    const dropdown: DropdownApp = {
        get anchor() {
            return anchor.current;
        },
        get focused() {
            return focus.focused || focus.willFocus;
        },

        close: iframe.close,
        destroy: iframe.destroy,
        getState: () => iframe.state,
        init: iframe.init,

        open: async (request, ctrl) => {
            const payload = await intoDropdownAction(request).catch(noop);

            if (!payload) return ctrl?.abort();
            if (ctrl?.signal.aborted) return;

            anchor.current =
                request.type === 'field'
                    ? { type: 'field', field: request.field }
                    : { type: 'frame', fieldId: request.fieldId, formId: request.formId, frameId: request.frameId };

            iframe.sendPortMessage({ type: InlinePortMessageType.DROPDOWN_ACTION, payload });
            iframe.setPosition(getDropdownPosition(request));

            await iframe.open(request, ctrl);
        },

        sendMessage: iframe.sendPortMessage,
        subscribe: iframe.subscribe,
    };

    return dropdown;
};
