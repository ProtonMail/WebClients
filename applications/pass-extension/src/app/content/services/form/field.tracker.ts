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

/* trigger the submit handler on keydown enter */
const handleOnEnter =
    (onSubmit: () => void) =>
    ({ key }: KeyboardEvent) =>
        key === 'Enter' && onSubmit();

export const createFieldTracker = (field: FieldHandle, formTracker?: FormTracker): FieldTracker => {
    const listeners = createListenerStore();
    const state: FieldTrackerState = { focusRequest: null };

    const onFocus = onNextTick(
        withContext<(evt: FocusEvent) => void>((ctx) => {
            if (state.focusRequest) cancelAnimationFrame(state.focusRequest);

            const { action } = field;
            if (!ctx || !action) return;

            if (field.actionPrevented) return;

            const req = requestAnimationFrame(() => {
                ctx.service.inline.icon.attach(field);

                /** NOTE: auto-open dropdown if field was not
                 * previously autofilled [to be determined] */
                if (!field.autofilled) {
                    ctx.service.inline.dropdown.open({
                        type: 'field',
                        action: action.type,
                        autofocused: true,
                        field,
                    });
                }
            });

            state.focusRequest = req;
        })
    );

    /** This should be called on next tick: `document.activeElement` isn't synchronously
     * updated during the blur event handler. Avoids detaching the icon if the blur event
     * was triggered because of the dropdown gaining focus when attached to this field.
     * Avoid triggering if field action is prevented during an autofill request. */
    const onBlur = onNextTick(
        withContext(async (ctx) => {
            if (!ctx || field.actionPrevented) return;
            if (state.focusRequest) cancelAnimationFrame(state.focusRequest);

            const { focused, attachedField, visible } = await ctx.service.inline.dropdown.getState();
            const dropdownFocused = visible && focused && field.matches(attachedField);
            const fieldBlurred = !(document.hasFocus() && isActiveElement(field.element));

            if (!dropdownFocused && fieldBlurred) {
                field.icon?.detach();
                ctx.service.inline.dropdown.close({ type: 'field', field });
            }
        })
    );

    /* on input change : close the dropdown if it was visible
     * and update the field's handle tracked value */
    const onInput = withContext<(evt: Event) => void>((ctx) => {
        const { action } = field;
        const { value } = field.element;

        if (!field.actionPrevented) {
            if (!action?.filterable) ctx?.service.inline.dropdown.close({ type: 'field', field });
            else syncAutofillFilter(value);
        }

        field.setValue(value);
    });

    /* when the type attribute of a field changes : detach it from
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
