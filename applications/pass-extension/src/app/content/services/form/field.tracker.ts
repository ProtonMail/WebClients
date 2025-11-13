import { withContext } from 'proton-pass-extension/app/content/context/context';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';

import { FieldType } from '@proton/pass/fathom/labels';
import type { MaybeNull } from '@proton/pass/types';
import { createRAFController } from '@proton/pass/utils/dom/raf';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { onNextTick } from '@proton/pass/utils/time/next-tick';
import throttle from '@proton/utils/throttle';

import type { FieldHandle } from './field';
import type { FormTracker } from './form.tracker';

export interface FieldTracker {
    detach: () => void;
}

export type FieldTrackerState = {
    focused: boolean;
    focusTimeout: MaybeNull<NodeJS.Timeout>;
};

const FIELD_TIMEOUT = 250;

/** Sends `AUTOFILL_FILTER` message to dropdown for real-time item filtering.
 * 250ms throttle with trailing edge prevents excessive messaging during typing. */
const syncAutofillFilter = throttle(
    withContext<(startsWith: string) => void>((ctx, startsWith) => {
        ctx?.service.inline.dropdown.sendMessage({
            type: InlinePortMessageType.AUTOFILL_FILTER,
            payload: { startsWith },
        });
    }),
    FIELD_TIMEOUT,
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
    const state: FieldTrackerState = { focused: false, focusTimeout: null };

    const onBlur = withContext<(evt: Event) => void>((ctx) => {
        if (!state.focused) return;
        else if (state.focusTimeout) clearTimeout(state.focusTimeout);

        raf.cancel();
        state.focused = false;

        raf.request(
            onNextTick(async (req) => {
                field.element.blur();
                if (field.actionPrevented || req.cancelled) return;

                const active = await field.isActive();
                if (req.cancelled || active) return;

                field.icon?.detach();
                ctx?.service.inline.dropdown.close({ type: 'field', field });
            })
        );
    });

    const onFocus = withContext<(evt: Event) => void>((ctx, evt) => {
        if (state.focused) return;

        raf.cancel();
        state.focused = true;

        const { action } = field;
        if (!action) return;

        raf.request(() => {
            if (field.actionPrevented) return;
            if (state.focusTimeout) clearTimeout(state.focusTimeout);

            ctx?.service.inline.icon.attach(field);
            ctx?.service.inline.dropdown.toggle({
                type: 'field',
                action: action.type,
                autofocused: true,
                autofilled: field.autofilled !== null,
                field,
            });

            /** Browsers may dequeue blur/focusout events when rapid focus
             * switches between frames/shadowRoots. In such cases, we try to
             * detect such dequeues to avoid missing blur clean-ups. */
            state.focusTimeout = setTimeout(async () => {
                if (state.focused && !(await field.isActive())) {
                    logger.debug(`[FieldTracker] Browser "blur" dequeue detected`);
                    onBlur(evt);
                }
            }, FIELD_TIMEOUT);
        });
    });

    /** Handles input changes: closes dropdown for non-filterable fields or updates filter.
     * Non-filterable fields: closes dropdown immediately (user typing manually).
     * Filterable fields: sends filter updates to update dropdown results */
    const onInput = withContext<(evt: Event) => void>((ctx) => {
        const { action } = field;
        const { value } = field.element;

        field.setValue(value);

        if (field.actionPrevented) return;
        else if (!action?.filterable) ctx?.service.inline.dropdown.close({ type: 'field', field });
        else syncAutofillFilter(value);
    });

    /* When the type attribute of a field changes : detach it from
     * the tracked form and re-trigger the detection */
    const onAttributeChange: MutationCallback = withContext<MutationCallback>((ctx, mutations) => {
        if ([FieldType.PASSWORD_CURRENT, FieldType.PASSWORD_NEW].includes(field.fieldType)) return;

        mutations.forEach((mutation) => {
            const target = mutation.target as HTMLInputElement;
            if (mutation.type === 'attributes' && mutation.oldValue !== target.type) {
                field.getFormHandle().detachField(mutation.target as HTMLInputElement);
                void ctx?.service.formManager.detect({ reason: 'FieldTypeChange' });
            }
        });
    });

    listeners.addListener(field.element, 'focus', onFocus);
    listeners.addListener(field.element, 'focusin', onFocus);
    listeners.addListener(field.element, 'blur', onBlur);
    listeners.addListener(field.element, 'focusout', onBlur);
    listeners.addListener(field.element, 'input', onInput);
    listeners.addListener(field.element, 'mousedown', onFocus);
    listeners.addObserver(field.element, onAttributeChange, { attributeFilter: ['type'], attributeOldValue: true });

    if (formTracker) {
        const { onFieldChange, onFormSubmit } = formTracker;
        listeners.addListener(field.element, 'input', onFieldChange);
        listeners.addListener(field.element, 'keydown', pipe(handleOnEnter(onFormSubmit), onFieldChange));
    }

    return {
        detach: () => {
            if (state.focusTimeout) clearTimeout(state.focusTimeout);
            listeners.removeAll();
            raf.cancel();
        },
    };
};
