import type { FieldElement } from 'proton-pass-extension/app/content/services/form/field';

import type { HTMLFieldElement } from '@proton/pass/fathom';
import type { FieldType } from '@proton/pass/fathom/labels';
import { isActiveElement } from '@proton/pass/utils/dom/active-element';
import { isInputElement, isSelectElement } from '@proton/pass/utils/dom/predicates';
import { seq } from '@proton/pass/utils/fp/promises';
import { safeAsyncCall } from '@proton/pass/utils/fp/safe-call';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

export type AutofillOptions = {
    /** If `true` will use a "paste-strategy" for
     * autofilling. Should be used as fallback if
     * standard autofilling strategy did not succeed */
    paste?: boolean;
    /** If `true` will by-pass focus acquiring/release
     * strategy during autofill sequence.  */
    noFocus?: boolean;
    /** `FieldType` of the field being autofilled */
    type?: FieldType;
    /** Autofilled item derived key */
    itemKey?: string;
};

type EventDispatcher = (events: Event[]) => Promise<void>;

/** Dispatch events asynchronously in sequence to handle timing-sensitive websites.
 * Some sites require time gaps between events to properly handle them, and using
 * promises provides these gaps via the microtask queue, better mimicking natural
 * user interactions where events don't fire instantaneously. */
const dispatchEvents =
    (el: HTMLFieldElement): EventDispatcher =>
    async (events) => {
        await seq(events, async (event) => el.dispatchEvent(event)).catch(noop);
    };

/** Waits for blur completion to ensure predictable event ordering across
 * multi-field autofill sequences and prevent browser event throttling.
 * Helps with refocusing behaviour on autofill sequence completion. */
const ensureBlurred = async (el: HTMLFieldElement): Promise<void> => {
    const controller = new AbortController();
    const { signal } = controller;

    return Promise.race([
        new Promise<void>((res) => el.addEventListener('blur', () => res(), { once: true, signal })),
        wait(250),
    ]).finally(() => controller.abort());
};

const acquireFocus = async (element: HTMLFieldElement, dispatch: EventDispatcher) => {
    if (isActiveElement(element)) await dispatch([new FocusEvent('focusin'), new FocusEvent('focus')]);
    else element.focus({ preventScroll: true });
};

const releaseFocus = async (element: HTMLFieldElement, dispatch: EventDispatcher) => {
    const release = ensureBlurred(element);

    if (isActiveElement(element)) element.blur();
    else await dispatch([new FocusEvent('focusout'), new FocusEvent('blur')]);

    await release;
};

const keyboardFill = async (input: HTMLInputElement, data: string, dispatch: EventDispatcher) => {
    input.value = data;

    await dispatch([
        new KeyboardEvent('keydown', { bubbles: true }),
        new KeyboardEvent('keypress', { bubbles: true }),
        new KeyboardEvent('keyup', { bubbles: true }),
    ]);

    /** Let any deferred handlers from keyboard events complete before continuing.
     * Some sites (eg: macys.com) use `setTimeout` to defer validation/formatting,
     * which can overwrite or reset the field if we proceed immediately. */
    await wait(0);

    if (input.value !== data) input.value = data;

    await dispatch([new Event('input', { bubbles: true }), new Event('change', { bubbles: true })]);
};

const pasteFill = async (data: string, dispatch: EventDispatcher) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', data);

    await dispatch([
        new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData,
        }),
    ]);
};

const selectFill = async (select: HTMLSelectElement, match: HTMLOptionElement, dispatch: EventDispatcher) => {
    Array.from(select.options).forEach((option) => (option.selected = false));
    match.selected = true;
    select.value = match.value;
    await dispatch([new Event('change', { bubbles: true })]);
};

/* Autofilling is based on chromium's autofill service
 * strategy - references can be found here :
 * https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/exported/web_form_control_element.cc;l=181-202;drc=64b271ee7f3527374c718fe24383e087405ce520
 *
 * Dispatched events need to bubble up as certain websites
 * attach their event listeners not directly on the input
 * elements (ie: account.google.com) */
const autofillInputElement = async (input: HTMLInputElement, data: string, options?: AutofillOptions) => {
    const dispatch = dispatchEvents(input);
    /** 1. acquire */
    if (typeof input?.click === 'function') input.click();
    if (!options?.noFocus) await acquireFocus(input, dispatch);
    /** 2. autofill */
    if (options?.paste) await pasteFill(data, dispatch);
    else await keyboardFill(input, data, dispatch);
    /** 3. release */
    if (!options?.noFocus) await releaseFocus(input, dispatch);
};

const autofillSelectElement = async (select: HTMLSelectElement, data: string) => {
    const dispatch = dispatchEvents(select);
    const options = Array.from(select.options);
    const match = options.find(({ value }) => value.trim().toLocaleLowerCase() === data.trim().toLocaleLowerCase());

    if (!match) return;

    await acquireFocus(select, dispatch);
    await selectFill(select, match, dispatch);
    await releaseFocus(select, dispatch);
};

export const createAutofill = (el: FieldElement) =>
    safeAsyncCall(async (data: string, options?: AutofillOptions) => {
        if (isInputElement(el)) return autofillInputElement(el, data, options);
        if (isSelectElement(el)) return autofillSelectElement(el, data);
    });
