import { withContext } from 'proton-pass-extension/app/content/context/context';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';

import { FieldType } from '@proton/pass/fathom/labels';
import type { MaybeNull } from '@proton/pass/types';
import { isActiveElement } from '@proton/pass/utils/dom/active-element';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { onNextTick } from '@proton/pass/utils/time/next-tick';
import throttle from '@proton/utils/throttle';

import type { FieldHandle } from './field';
import type { FormTracker } from './form.tracker';

export type FieldTrackerState = { focusRequest: MaybeNull<number> };

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
    const state: FieldTrackerState = { focusRequest: null };

    /** Handles field focus: attaches icon and conditionally opens dropdown.
     * Uses requestAnimationFrame for DOM stability during focus transitions.
     * Only opens dropdown if field wasn't previously autofilled. */
    const onFocus = onNextTick(
        withContext<(evt: FocusEvent) => void>((ctx) => {
            if (state.focusRequest) cancelAnimationFrame(state.focusRequest);

            const { action } = field;
            if (!ctx || !action || field.actionPrevented) return;

            state.focusRequest = requestAnimationFrame(() => {
                ctx.service.inline.icon.attach(field);

                if (!field.autofilled) {
                    ctx.service.inline.dropdown.open({
                        type: 'field',
                        action: action.type,
                        autofocused: true,
                        field,
                    });
                }
            });
        })
    );

    /** Handles field blur with dropdown focus state coordination.
     * Uses `onNextTick` because `document.activeElement` updates asynchronously during blur.
     * Queries `dropdown.getState()` to determine if focus has moved to dropdown (preventing premature
     * cleanup). Only detaches icon and closes dropdown when both field and dropdown are unfocused.
     * Skips cleanup during `autofill.processing` to prevent interrupting autofill sequences. */
    const onBlur = onNextTick(
        withContext(async (ctx) => {
            if (state.focusRequest) cancelAnimationFrame(state.focusRequest);
            if (!ctx || field.actionPrevented) return;

            const { focused, attachedField, visible } = await ctx.service.inline.dropdown.getState();
            const dropdownFocused = visible && focused && field.matches(attachedField);
            const fieldBlurred = !(document.hasFocus() && isActiveElement(field.element));

            if (!dropdownFocused && fieldBlurred) {
                field.icon?.detach();
                ctx.service.inline.dropdown.close({ type: 'field', field });
            }
        })
    );

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
    listeners.addResizeObserver(field.element, () => field.icon?.reposition(false));
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
            if (state.focusRequest) cancelAnimationFrame(state.focusRequest);
        },
    };
};
