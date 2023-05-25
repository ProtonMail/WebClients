/**
 * Autofilling is based on chromium's autofill service
 * strategy - references can be found here :
 * https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/exported/web_form_control_element.cc;l=181-202;drc=64b271ee7f3527374c718fe24383e087405ce520
 *
 * Dispatched events need to bubble up as certain websites
 * attach their event listeners not directly on the input
 * elements (ie: account.google.com)
 */
export const createAutofill = (input: HTMLInputElement) => (data: string) => {
    const focused = input === document.activeElement;
    input.value = data;

    const events = [
        !focused && new FocusEvent('focusin'),
        new KeyboardEvent('keydown', { bubbles: true }),
        new InputEvent('input', { data, bubbles: true }),
        new KeyboardEvent('keyup', { bubbles: true }),
        new KeyboardEvent('keypress', { bubbles: true }) /* support legacy websites */,
        !focused && new FocusEvent('blur'),
    ].filter(Boolean) as Event[];

    events.forEach((event) => input.dispatchEvent(event));
};
