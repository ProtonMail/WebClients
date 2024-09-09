import type { FieldType } from '@proton/pass/fathom';

export type AutofillOptions = {
    paste?: boolean;
    type?: FieldType;
};

const isFocused = (el: HTMLElement) => el === document.activeElement;
const dispatchEvents = (el: HTMLElement) => (events: Event[]) => events.forEach((event) => el.dispatchEvent(event));

/* Autofilling is based on chromium's autofill service
 * strategy - references can be found here :
 * https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/exported/web_form_control_element.cc;l=181-202;drc=64b271ee7f3527374c718fe24383e087405ce520
 *
 * Dispatched events need to bubble up as certain websites
 * attach their event listeners not directly on the input
 * elements (ie: account.google.com) */
export const createAutofill = (input: HTMLInputElement) => (data: string, options?: AutofillOptions) => {
    const dispatch = dispatchEvents(input);

    if (isFocused(input)) dispatch([new FocusEvent('focusin'), new FocusEvent('focus')]);
    else input.focus();

    if (options?.paste) {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', data);

        dispatch([
            new ClipboardEvent('paste', {
                bubbles: true,
                cancelable: true,
                clipboardData,
            }),
        ]);
    } else {
        input.value = data;

        dispatch([
            new KeyboardEvent('keydown', { bubbles: true }),
            /* `keypress` event for legacy websites support */
            new KeyboardEvent('keypress', { bubbles: true }),
            new KeyboardEvent('keyup', { bubbles: true }),
        ]);

        if (input.value !== data) input.value = data;

        dispatch([new Event('input', { bubbles: true }), new Event('change', { bubbles: true })]);
    }

    if (isFocused(input)) input.blur();
    else dispatch([new FocusEvent('focusout'), new FocusEvent('blur')]);
};
