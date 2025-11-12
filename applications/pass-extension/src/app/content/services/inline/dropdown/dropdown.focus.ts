import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { InlineApp } from 'proton-pass-extension/app/content/services/inline/inline.app';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import type { PopoverController } from 'proton-pass-extension/app/content/services/inline/inline.popover';

import { isActiveElement } from '@proton/pass/utils/dom/active-element';
import { isHTMLElement } from '@proton/pass/utils/dom/predicates';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { nextTick, onNextTick } from '@proton/pass/utils/time/next-tick';

import type { DropdownAnchorRef, DropdownRequest } from './dropdown.app';

/** Debounce timeout for focus events to prevent rapid focus/blur cycles */
export const DROPDOWN_FOCUS_TIMEOUT = 50;

/** Grace period during focus acquisition to prevent premature dropdown closure.
 * Provides a timeout window during which blur events are ignored while attempting
 * to bypass focus-lock traps and acquire dropdown focus. Also serves as the maximum
 * time to wait when polling for successful blur operations on trapped elements. */
export const DROPDOWN_FOCUS_TRAP_TIMEOUT = 500;

export interface DropdownFocusController {
    focused: boolean;
    willFocus: boolean;
    disconnect: () => void;
}

type DropdownFocusManagerOptions = {
    iframe: InlineApp<DropdownRequest>;
    popover: PopoverController;
    anchor: DropdownAnchorRef;
};

type DropdownFocusManagerState = { willFocus: boolean; willFocusTimer?: NodeJS.Timeout };

/** Creates a focus controller to manage dropdown focus and bypass page-level focus
 * traps. Some websites use focus-lock libraries that aggressively redirect focus back
 * to form fields, preventing our dropdown from receiving keyboard input. This controller
 * implements a "blur-before-focus" strategy to break out of these traps. */
export const createDropdownFocusController = ({
    iframe,
    popover,
    anchor,
}: DropdownFocusManagerOptions): DropdownFocusController => {
    const state: DropdownFocusManagerState = { willFocus: false };

    const disconnect = () => {
        clearTimeout(state.willFocusTimer);
        delete state.willFocusTimer;
        state.willFocus = false;

        if (anchor.current?.type === 'field') anchor.current.field.interactivity.unlock();
    };

    const onWillFocus = () => {
        if (anchor.current?.type === 'field') anchor.current.field.preventAction();
        clearTimeout(state.willFocusTimer);
        state.willFocus = true;
        state.willFocusTimer = setTimeout(disconnect, DROPDOWN_FOCUS_TRAP_TIMEOUT);
    };

    /** Edge-case handling: if the dropdown has gained focused and the page
     * loses focus, then we should detach (field::blur event is insufficient
     * because it relies on the dropdown state) */
    const onWillBlur = onNextTick(() => {
        if (iframe.state.visible && !document.hasFocus()) {
            iframe.close();
        }
    });

    /** Releases focus from the currently focused element to bypass focus-lock traps.
     * Focus-lock libraries monitor focus changes and redirect focus back to trapped
     * elements. By blurring first, we leave no element for the trap to redirect to,
     * allowing our dropdown to successfully acquire focus. */
    const releaseFocus = (field?: FieldHandle): boolean => {
        if (!iframe.state.visible) return true;

        if (field && isActiveElement(field?.element)) {
            /** Lock all fields temporarily - prevents websites from focus
             * trapping or auto-focusing the next field during blur */
            const fields = field.getFormHandle().getFields();
            fields.forEach((formField) => formField.interactivity.lock(DROPDOWN_FOCUS_TIMEOUT));
            field?.element.blur();

            return false;
        }

        if (document.activeElement && isHTMLElement(document.activeElement)) {
            document.activeElement.blur();
        }

        return true;
    };

    /** Handles focus recovery when page focus-lock implementations interfere with dropdown focus.
     * Strategy: blur the anchor field and any active element to release the focus trap, then
     * request dropdown focus. The `willFocus` flag provides a grace period during which blur events
     * on the dropdown are ignored, preventing premature closing during the focus transition. */
    const onFocusRequest = asyncLock(async () => {
        onWillFocus();

        if (document.activeElement !== popover.root.customElement) {
            switch (anchor.current?.type) {
                case 'field':
                    const field = anchor.current.field;
                    return waitUntil(() => releaseFocus(field), 25, DROPDOWN_FOCUS_TRAP_TIMEOUT)
                        .then(() => iframe.sendPortMessage({ type: InlinePortMessageType.DROPDOWN_FOCUS }))
                        .catch(disconnect);

                case 'frame':
                    return nextTick(() => {
                        releaseFocus();
                        return iframe.sendPortMessage({ type: InlinePortMessageType.DROPDOWN_FOCUS });
                    });
            }
        }
    });

    iframe.registerMessageHandler(InlinePortMessageType.DROPDOWN_FOCUS_REQUEST, onFocusRequest);
    iframe.registerMessageHandler(InlinePortMessageType.DROPDOWN_FOCUSED, onWillFocus);
    iframe.registerMessageHandler(InlinePortMessageType.DROPDOWN_BLURRED, onWillBlur);

    return {
        get focused() {
            return isActiveElement(popover.root.customElement);
        },
        get willFocus() {
            return state.willFocus;
        },
        disconnect,
    };
};
