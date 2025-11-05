import { withContext } from 'proton-pass-extension/app/content/context/context';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';

import { FieldType } from '@proton/pass/fathom/labels';
import { isActiveElement } from '@proton/pass/utils/dom/active-element';
import { createRAFController } from '@proton/pass/utils/dom/raf';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { onNextTick } from '@proton/pass/utils/time/next-tick';
import throttle from '@proton/utils/throttle';

import type { FieldHandle } from './field';
import type { FormTracker } from './form.tracker';

export interface FieldTracker {
    detach: () => void;
}

/** Sends `AUTOFILL_FILTER` message to dropdown for real-time item filtering.
 * 250ms throttle with trailing edge prevents excessive messaging during typing. */
const syncAutofillFilter = throttle(
    withContext<(startsWith: string) => void>((ctx, startsWith) => {
        ctx?.service.inline.dropdown.sendMessage({
            type: InlinePortMessageType.AUTOFILL_FILTER,
            payload: { startsWith },
        });
    }),
    250,
    { trailing: true }
);

/* Trigger the submit handler on keydown enter */
const handleOnEnter =
    (onSubmit: () => void) =>
    ({ key }: KeyboardEvent) =>
        key === 'Enter' && onSubmit();

export const createFieldTracker = (field: FieldHandle, formTracker?: FormTracker): FieldTracker => {
    const listeners = createListenerStore();
    const raf = createRAFController();

    /** Handles field focus: attaches icon and conditionally opens dropdown.
     * Uses requestAnimationFrame for DOM stability during focus transitions.
     * Only opens dropdown if field wasn't previously autofilled. */
    const onFocus = withContext<(evt: FocusEvent) => void>((ctx) => {
        raf.cancel();
        const { action } = field;
        if (!ctx || !action || field.actionPrevented) return;

        raf.request(() => {
            ctx.service.inline.icon.attach(field);
            ctx.service.inline.dropdown.toggle({
                type: 'field',
                action: action.type,
                autofocused: true,
                autofilled: field.autofilled !== null,
                field,
            });
        });
    });

    /** Handles field blur with dropdown focus state coordination.
     * Uses `onNextTick` because `document.activeElement` updates asynchronously during blur.
     * Queries `dropdown.getState()` to determine if focus has moved to dropdown (preventing premature
     * cleanup). Only detaches icon and closes dropdown when both field and dropdown are unfocused.
     * Skips cleanup during `autofill.processing` to prevent interrupting autofill sequences. */
    const onBlur = withContext((ctx) => {
        raf.cancel();
        if (!ctx || field.actionPrevented) return;

        raf.request(
            onNextTick(async (handle: number) => {
                const { focused, attachedField, visible } = await ctx.service.inline.dropdown.getState();
                const dropdownFocused = visible && focused && field.matches(attachedField);
                const fieldBlurred = !isActiveElement(field.element);

                if (handle !== raf.handle) return;

                if (!dropdownFocused && fieldBlurred) {
                    field.icon?.detach();
                    ctx.service.inline.dropdown.close({ type: 'field', field });
                }
            })
        );
    });

    /** Handles input changes: closes dropdown for non-filterable fields or updates filter.
     * Non-filterable fields: closes dropdown immediately (user typing manually).
     * Filterable fields: sends filter updates to update dropdown results */
    const onInput = withContext<(evt: Event) => void>((ctx) => {
        const { action } = field;
        const { value } = field.element;

        if (!field.actionPrevented) {
            if (!action?.filterable) ctx?.service.inline.dropdown.close({ type: 'field', field });
            else syncAutofillFilter(value);
        }

        field.setValue(value);
    });

    /* When the type attribute of a field changes : detach it from
     * the tracked form and re-trigger the detection */
    const onFieldAttributeChange: MutationCallback = withContext<MutationCallback>((ctx, mutations) => {
        if ([FieldType.PASSWORD_CURRENT, FieldType.PASSWORD_NEW].includes(field.fieldType)) return;

        mutations.forEach((mutation) => {
            const target = mutation.target as HTMLInputElement;
            if (mutation.type === 'attributes' && mutation.oldValue !== target.type) {
                field.getFormHandle().detachField(mutation.target as HTMLInputElement);
                void ctx?.service.formManager.detect({ reason: 'FieldTypeChange' });
            }
        });
    });

    listeners.addListener(field.element, 'blur', onBlur);
    listeners.addListener(field.element, 'focus', onFocus);
    listeners.addListener(field.element, 'input', onInput);
    listeners.addObserver(field.element, onFieldAttributeChange, {
        attributeFilter: ['type'],
        attributeOldValue: true,
    });

    if (formTracker) {
        const { onFieldChange, onFormSubmit } = formTracker;
        listeners.addListener(field.element, 'input', onFieldChange);
        listeners.addListener(field.element, 'keydown', pipe(handleOnEnter(onFormSubmit), onFieldChange));
    }

    return {
        detach: () => {
            listeners.removeAll();
            raf.cancel();
        },
    };
};
