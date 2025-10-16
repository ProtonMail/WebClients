import type { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { DROPDOWN_IFRAME_SRC } from 'proton-pass-extension/app/content/constants.runtime';
import { DROPDOWN_MIN_HEIGHT, DROPDOWN_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { onFieldDropdownClose } from 'proton-pass-extension/app/content/services/inline/dropdown/dropdown.utils';
import type {
    InlineFieldTarget,
    InlineFrameTarget,
} from 'proton-pass-extension/app/content/services/inline/inline.abstract';
import { type InlineAppHandler, createInlineApp } from 'proton-pass-extension/app/content/services/inline/inline.app';
import type { IFrameCloseOptions } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import type { PopoverController } from 'proton-pass-extension/app/content/services/inline/inline.popover';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import type { WithAutofillOrigin } from 'proton-pass-extension/types/autofill';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { clientSessionLocked } from '@proton/pass/lib/client';
import type { PasswordAutosuggestOptions } from '@proton/pass/lib/password/types';
import type { Coords, MaybeNull } from '@proton/pass/types';
import { createStyleParser, getComputedHeight } from '@proton/pass/utils/dom/computed-styles';
import { animatePositionChange } from '@proton/pass/utils/dom/position';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import noop from '@proton/utils/noop';

import { createDropdownFocusController } from './dropdown.focus';
import { prepareDropdownAction } from './dropdown.utils';

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
} & (InlineFieldTarget | InlineFrameTarget<{ coords: Coords; origin: string }>);

export interface DropdownApp extends InlineAppHandler<DropdownRequest> {
    anchor: MaybeNull<DropdownAnchor>;
    focused: boolean;
}

export const createDropdown = (popover: PopoverController): DropdownApp => {
    const anchor: DropdownAnchorRef = { current: null };
    const listeners = createListenerStore();

    const iframe = createInlineApp<DropdownAction>({
        id: 'dropdown',
        animation: 'fadein',
        src: DROPDOWN_IFRAME_SRC,
        popover,
        dimensions: () => ({ width: DROPDOWN_WIDTH, height: DROPDOWN_MIN_HEIGHT }),
        position: (root: HTMLElement) => {
            const target = anchor.current;

            if (!target || target.type === 'frame') return { top: 0, left: 0 };

            const { element } = target.field;
            const boxElement = target.field.getAnchor().element;
            const boxed = boxElement !== element;
            const bodyTop = root.getBoundingClientRect().top;

            const styles = createStyleParser(boxElement);
            const computedHeight = getComputedHeight(styles, boxed ? 'inner' : 'outer');
            const { value: height, offset: offsetBox } = computedHeight;
            const { left: boxLeft, top, width } = boxElement.getBoundingClientRect();

            return {
                top: top - bodyTop + offsetBox.bottom + offsetBox.top + height,
                left: boxLeft + width - DROPDOWN_WIDTH,
            };
        },
    });

    const focus = createDropdownFocusController({ iframe, popover, anchor });

    const onOpen = withContext((ctx) => {
        /** If session is locked - the dropdown will try to gain focus.
         * In order to avoid detecting this as a FRAME_BLURRED event, we
         * need to temporarily flag the re-focus state. (see `PinUnlock.tsx`) */
        const status = ctx?.getState()?.status;
        if (status && clientSessionLocked(status)) focus.onWillFocus();

        const target = anchor.current;

        if (target?.type === 'frame') {
            const { formId, fieldId, fieldFrameId } = target;
            void sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.INLINE_DROPDOWN_OPENED,
                    payload: {
                        type: 'request',
                        fieldFrameId,
                        formId,
                        fieldId,
                    },
                })
            );
        }
    });

    const onClose = (options: IFrameCloseOptions) => {
        const target = anchor.current;

        switch (target?.type) {
            case 'field': {
                onFieldDropdownClose(target.field, options.refocus ?? false);
                break;
            }

            case 'frame': {
                const { formId, fieldId, fieldFrameId } = target;
                void sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.INLINE_DROPDOWN_CLOSED,
                        payload: {
                            type: 'request',
                            refocus: options.refocus ?? false,
                            fieldFrameId,
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

    const onDestroy = () => {
        anchor.current = null;
        listeners.removeAll();
        focus.disconnect();
    };

    /* if the dropdown is opened while the field is being animated
     * we must update its position until the position stabilizes */
    const updatePosition = () =>
        animatePositionChange({
            onAnimate: noop,
            get: () => iframe.getPosition(),
            set: () => iframe.updatePosition(),
        });

    iframe.subscribe((evt) => {
        switch (evt.type) {
            case 'open':
                return onOpen();
            case 'close':
                return onClose(evt.options);
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
            if (!target || target.type === 'frame') return;

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
            if (!target || target.type === 'frame') return;

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
        async ({ payload }) => {
            const target = anchor.current;
            if (!target || target.type === 'frame') return;

            await target.field.autofill(payload.email);
            target.field.focus({ preventAction: true });
            void target.field.getFormHandle()?.tracker?.processForm({ submit: false, partial: true });
        },
        { userAction: true }
    );

    iframe.registerMessageHandler(
        InlinePortMessageType.AUTOFILL_IDENTITY,
        withContext(async (ctx, { payload }) => {
            const target = anchor.current;
            if (!target || target.type === 'frame') return;

            await ctx?.service.autofill.autofillIdentity(target.field, payload);
            target.field.focus({ preventAction: true });
        }),
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

        open: (request) => {
            iframe
                .open(request.action, async () => {
                    const payload = await prepareDropdownAction(request).catch(noop);

                    if (!payload) {
                        anchor.current = null;
                        return false;
                    }

                    anchor.current =
                        request.type === 'field'
                            ? { type: 'field', field: request.field }
                            : {
                                  type: 'frame',
                                  frameId: request.frameId,
                                  fieldFrameId: request.fieldFrameId,
                                  frame: request.frame,
                                  fieldId: request.fieldId,
                                  formId: request.formId,
                              };

                    iframe.sendPortMessage({
                        type: InlinePortMessageType.DROPDOWN_ACTION,
                        payload,
                    });

                    if (request.type === 'field') updatePosition();
                    if (request.type === 'frame') iframe.setPosition(request.coords);

                    return true;
                })
                .catch(noop);
        },

        sendMessage: iframe.sendPortMessage,
        subscribe: iframe.subscribe,
    };

    return dropdown;
};
