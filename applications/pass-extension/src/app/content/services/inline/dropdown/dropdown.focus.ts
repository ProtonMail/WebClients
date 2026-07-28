import type { MaybeNull } from '@proton/pass/types/utils/index';
import { isActiveElement } from '@proton/pass/utils/dom/active-element';
import { isHTMLElement } from '@proton/pass/utils/dom/predicates';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { onNextTick } from '@proton/pass/utils/time/next-tick';
import { wait } from '@proton/shared/lib/helpers/promise';

import { contentScriptMessage, sendMessage } from '../../../../../lib/message/send-message';
import { WorkerMessageType } from '../../../../../types/messages';
import { kFocusTrapSelector } from '../../../constants.static';
import type { InlineApp } from '../inline.app';
import { InlinePortMessageType } from '../inline.messages';
import type { PopoverController } from '../inline.popover';
import type { InlineFrameTarget } from './dropdown.abstract';
import type { DropdownAnchor, DropdownAnchorRef, DropdownRequest } from './dropdown.app';

/** Debounce timeout for focus events to prevent rapid focus/blur cycles */
export const DROPDOWN_FOCUS_TIMEOUT = 50;

/** Grace period during focus acquisition to prevent premature dropdown closure.
 * Provides a timeout window during which blur events are ignored while attempting
 * to bypass focus-lock traps and acquire dropdown focus. Also serves as the maximum
 * time to wait when polling for successful blur operations on trapped elements. */
export const DROPDOWN_FOCUS_TRAP_TIMEOUT = 500;

/** Maximum time to wait for a programmatically opened dropdown to become visible
 * before giving up on moving keyboard focus into it (eg: the autofill shortcut,
 * where the open request and the focus request arrive as two separate messages). */
export const DROPDOWN_AUTOFOCUS_TIMEOUT = 1_000;

export interface DropdownFocusController {
    focused: boolean;
    willFocus: boolean;
    requestFocus: (trapField?: boolean) => Promise<void>;
    disconnect: () => void;
}

type DropdownFocusManagerOptions = {
    iframe: InlineApp<DropdownRequest>;
    popover: PopoverController;
    anchor: DropdownAnchorRef;
};

type DropdownFocusManagerState = { willFocus: boolean; willFocusTimer?: NodeJS.Timeout };

/** Checks if an element can receive keyboard focus and potentially trap it.
 * Interactive elements include form controls, links, and any element with
 * tabindex or contentEditable attributes. */
export const isFocusableElement = (el: MaybeNull<Element>): el is HTMLElement => {
    if (!el || !isHTMLElement(el)) return false;

    if (el.matches(kFocusTrapSelector)) return false;

    const tag = el.tagName.toLowerCase();
    const focusableTags = ['input', 'textarea', 'select', 'button', 'a'];
    return focusableTags.includes(tag) || el.hasAttribute('tabindex') || el.isContentEditable;
};

/** Determines if focus has been successfully released from interactive elements.
 * Returns true when `activeElement` is the document body, root element, or a
 * non-focusable element that cannot trap focus. This handles cross-browser
 * differences where Safari may not reset to body after blur(). */
const isFocusReleased = (): boolean => {
    const active = document.activeElement;
    return active === document.body || active === document.documentElement || !isFocusableElement(active);
};

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

    const hasFocus = () => document.activeElement === popover.root.customElement;

    /** In order to toggle interactivity in sub-frames, we rely on message
     * passing to the anchor's frameID (see `FormManager::onFrameFieldLock`) */
    const onFrameFieldLock = async (anchor: InlineFrameTarget, locked: boolean) =>
        sendMessage(
            contentScriptMessage({
                type: WorkerMessageType.FRAME_FIELD_LOCK,
                payload: { ...anchor, locked },
            })
        );

    const disconnect = () => {
        clearTimeout(state.willFocusTimer);
        delete state.willFocusTimer;
        state.willFocus = false;
    };

    /** @param trapField - arms the anchor field's action-trap for the duration of the focus
     * hand-off. Required whenever the field currently holds focus (dropdown-initiated
     * recovery) : blurring it to escape a focus-lock would otherwise re-trigger the field's
     * own autofocus dropdown. Pass `false` for programmatic requests where the field was
     * never focused (autofill keyboard shortcut) — trapping there swallows the field's next
     * genuine focus. NOTE: drilled rather than inferred from `document.activeElement` —
     * bypassing focus-traps is time-sensitive and `activeElement` may already be stale by
     * the time `onWillFocus` runs on a dropdown-initiated request. */
    const onWillFocus = (trapField: boolean = true) => {
        if (trapField && anchor.current?.type === 'field') anchor.current.field.preventAction();
        clearTimeout(state.willFocusTimer);
        state.willFocus = true;
        state.willFocusTimer = setTimeout(disconnect, DROPDOWN_FOCUS_TRAP_TIMEOUT);
    };

    /** Edge-case handling: if the dropdown has gained focused and the page
     * loses focus, then we should detach (field::blur event is insufficient
     * because it relies on the dropdown state) */
    const onWillBlur = onNextTick(() => {
        if (iframe.state.visible) iframe.close();
    });

    /** Releases focus from the currently focused element to bypass focus-lock traps.
     * Focus-lock libraries monitor focus changes and redirect focus back to trapped
     * elements. By blurring first, we leave no element for the trap to redirect to,
     * allowing our dropdown to successfully acquire focus. */
    const releaseFocus = async (anchor: MaybeNull<DropdownAnchor>): Promise<boolean> => {
        if (!iframe.state.visible) return true;
        if (hasFocus()) return true;

        switch (anchor?.type) {
            case 'field':
                if (!isActiveElement(anchor.field.element)) break;
                /** Lock all fields temporarily - prevents websites from focus
                 * trapping or auto-focusing the next field during blur */
                const fields = anchor.field.getFormHandle().getFields();
                fields.forEach((formField) => formField.interactivity.lock(DROPDOWN_FOCUS_TIMEOUT));
                anchor.field.element.blur();

                return false;

            case 'frame':
                const res = await onFrameFieldLock(anchor, true);
                if (res.type === 'success' && res.wasFocused) return false;
                break;
        }

        if (document.activeElement && isHTMLElement(document.activeElement)) document.activeElement.blur();

        await wait(1); // wait for `activeElement` to settle
        return isFocusReleased();
    };

    /** Handles focus recovery when page focus-lock implementations interfere with dropdown focus.
     * Strategy: blur the anchor field and any active element to release the focus trap, then
     * request dropdown focus. The `willFocus` flag provides a grace period during which blur events
     * on the dropdown are ignored, preventing premature closing during the focus transition.
     *
     * NOTE: the `asyncLock` is intentionally NOT keyed. Its purpose is to guarantee a single
     * in-flight focus-acquisition sequence; keying on `trapField` would let a trapping and a
     * non-trapping sequence race, each polling `releaseFocus` and each dispatching
     * `DROPDOWN_FOCUS`. First caller wins the flag, which is correct in practice : the
     * shortcut requests focus on a freshly opened dropdown (nothing in flight), while
     * recovery requests only fire after focus was gained and stolen back. */
    const onFocusRequest = asyncLock(async (trapField: boolean = true) => {
        onWillFocus(trapField);

        if (!hasFocus()) {
            return waitUntil(() => releaseFocus(anchor.current), 25, DROPDOWN_FOCUS_TRAP_TIMEOUT)
                .then(() => {
                    if (!iframe.state.visible) return disconnect();
                    /** Focus is acquired asynchronously after this dispatch. The
                     * `willFocus` grace period is left to expire via `willFocusTimer`,
                     * so the reported `DropdownApp::focused` state stays truthy across
                     * the handoff and a concurrent focus/blur handler reading it
                     * (`onFocusChangeFactory`) doesn't close the dropdown. */
                    iframe.sendPortMessage({ type: InlinePortMessageType.DROPDOWN_FOCUS });
                })
                .catch(disconnect);
        }
    });

    /** Registered handlers receive the port `InlineMessage` as their first argument : wrap
     * so a (truthy) message object can never be read as the `trapField` flag. */
    iframe.registerMessageHandler(InlinePortMessageType.DROPDOWN_FOCUS_REQUEST, () => onFocusRequest());
    iframe.registerMessageHandler(InlinePortMessageType.DROPDOWN_FOCUSED, () => onWillFocus());
    iframe.registerMessageHandler(InlinePortMessageType.DROPDOWN_BLURRED, onWillBlur);

    return {
        get focused() {
            return isActiveElement(popover.root.customElement);
        },
        get willFocus() {
            return state.willFocus;
        },
        requestFocus: onFocusRequest,
        disconnect,
    };
};
