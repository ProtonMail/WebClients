import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { FormTracker } from 'proton-pass-extension/app/content/services/form/form.tracker';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import { actionPrevented } from 'proton-pass-extension/app/content/utils/action-trap';
import { isActiveElement } from 'proton-pass-extension/app/content/utils/nodes';

import { FieldType, FormType } from '@proton/pass/fathom/labels';
import { clientStatusResolved } from '@proton/pass/lib/client';
import type { MaybeNull } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { onNextTick } from '@proton/pass/utils/time/next-tick';
import throttle from '@proton/utils/throttle';

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

    const onFocus = withContext<(evt: FocusEvent) => void>(async (ctx) => {
        if (state.focusRequest) cancelAnimationFrame(state.focusRequest);

        const { action } = field;
        if (!ctx || !action) return;

        await ctx.service.inline.dropdown?.settled();
        if (actionPrevented(field.element)) return;

        const req = requestAnimationFrame(async () => {
            try {
                field.attachIcon();
                await waitUntil(() => clientStatusResolved(ctx.getState().status), 50);

                /** Sanity check if this is called multiple times while
                 * an underlying async request is under way */
                if (req !== state.focusRequest) return;

                const { formType } = field.getFormHandle();
                const { authorized, status } = ctx.getState();

                const login = formType === FormType.LOGIN;
                const count = authorized && login ? ((await ctx.service.autofill.getCredentialsCount()) ?? 0) : 0;
                field.icon?.setStatus(status);
                field.icon?.setCount(count);

                /** NOTE: auto-open dropdown if field was not
                 * previously autofilled [to be determined] */
                if (authorized && !field.autofilled) {
                    ctx.service.inline.dropdown.open({
                        type: 'field',
                        action: action.type,
                        autofocused: true,
                        field,
                    });
                }
            } catch {
            } finally {
                state.focusRequest = null;
            }
        });

        state.focusRequest = req;
    });

    /** This should be called on next tick: `document.activeElement` isn't synchronously
     * updated during the blur event handler. Avoids detaching the icon if the blur event
     * was triggered because of the dropdown gaining focus when attached to this field.
     * Avoid triggering if field action is prevented during an autofill request. */
    const onBlur = onNextTick(
        withContext(async (ctx) => {
            if (!ctx || actionPrevented(field.element)) return;

            const { focused, attachedField, visible } = await ctx.service.inline.dropdown.getState();
            const attached = visible && focused && field.matches(attachedField);
            const blurred = !(document.hasFocus() && isActiveElement(field.element));

            if (!attached && blurred) field.detachIcon();
        })
    );

    /* on input change : close the dropdown if it was visible
     * and update the field's handle tracked value */
    const onInput = withContext<(evt: Event) => void>((ctx) => {
        const { action, element } = field;
        const { value } = field.element;

        if (!actionPrevented(element)) {
            if (!action?.filterable) ctx?.service.inline.dropdown.close();
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
