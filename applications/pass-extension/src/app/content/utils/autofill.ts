import type { FieldType } from '@proton/pass/fathom';
import { seq } from '@proton/pass/utils/fp/promises';
import noop from '@proton/utils/noop';

export type AutofillOptions = {
    paste?: boolean;
    type?: FieldType;
};

const isFocused = (el: HTMLElement) => el === document.activeElement;

/** Dispatch events asynchronously in sequence to handle timing-sensitive websites.
 * Some sites require time gaps between events to properly handle them, and using
 * promises provides these gaps via the microtask queue, better mimicking natural
 * user interactions where events don't fire instantaneously. */
const dispatchEvents =
    (el: HTMLElement) =>
    async (events: Event[]): Promise<void> => {
        await seq(events, async (event) => el.dispatchEvent(event)).catch(noop);
    };

/* Autofilling is based on chromium's autofill service
 * strategy - references can be found here :
 * https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/exported/web_form_control_element.cc;l=181-202;drc=64b271ee7f3527374c718fe24383e087405ce520
 *
 * Dispatched events need to bubble up as certain websites
 * attach their event listeners not directly on the input
 * elements (ie: account.google.com) */
export const createAutofill = (input: HTMLInputElement) => async (data: string, options?: AutofillOptions) => {
    const dispatch = dispatchEvents(input);

    if (typeof input?.click === 'function') input.click();
    if (isFocused(input)) await dispatch([new FocusEvent('focusin'), new FocusEvent('focus')]);
    else input.focus();

    if (options?.paste) {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', data);

        await dispatch([
            new ClipboardEvent('paste', {
                bubbles: true,
                cancelable: true,
                clipboardData,
            }),
        ]);
    } else {
        input.value = data;

        await dispatch([
            new KeyboardEvent('keydown', { bubbles: true }),
            /* `keypress` event for legacy websites support */
            new KeyboardEvent('keypress', { bubbles: true }),
            new KeyboardEvent('keyup', { bubbles: true }),
        ]);

        if (input.value !== data) input.value = data;

        await dispatch([new Event('input', { bubbles: true }), new Event('change', { bubbles: true })]);
    }

    if (isFocused(input)) input.blur();
    else await dispatch([new FocusEvent('focusout'), new FocusEvent('blur')]);
};
