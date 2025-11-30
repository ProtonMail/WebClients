import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ClientObserverEvent } from 'proton-pass-extension/app/content/services/client/client.observer';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';

import { FieldType } from '@proton/pass/fathom/labels';
import type { MaybeNull } from '@proton/pass/types';
import { isActiveElement } from '@proton/pass/utils/dom/active-element';
import { createRAFController } from '@proton/pass/utils/dom/raf';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { DOM_SETTLE_MS, onNextTick } from '@proton/pass/utils/time/next-tick';
import throttle from '@proton/utils/throttle';

import type { FieldHandle } from './field';
import type { FormTracker } from './form.tracker';

export interface FieldTracker {
    detach: () => void;
}

export type FieldTrackerState = {
    focused: boolean;
    timeout: MaybeNull<NodeJS.Timeout>;
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

export const createFieldTracker = withContext<(field: FieldHandle, formTracker?: FormTracker) => FieldTracker>(
    (ctx, field, formTracker): FieldTracker => {
        const listeners = createListenerStore();
        const raf = createRAFController();
        const state: FieldTrackerState = { focused: false, timeout: null };

        const onBlur = (_: Event) => {
            if (!state.focused) return;
            else if (state.timeout) clearTimeout(state.timeout);

            syncAutofillFilter.cancel();

            raf.cancel();
            state.focused = false;

            if (field.actionPrevented) return;

            raf.request(
                onNextTick(async (req) => {
                    if (field.actionPrevented || req.cancelled) return;

                    const active = await field.isActive();
                    if (req.cancelled || active) return;

                    field.icon?.detach();
                    ctx?.service.inline.dropdown.close({ type: 'field', field });
                })
            );
        };

        const onFocus = (evt: Event) => {
            if (state.focused) return;

            raf.cancel();
            state.focused = true;

            const { action } = field;
            if (!action || field.actionPrevented) return;

            raf.request(() => {
                if (field.actionPrevented) return;
                if (state.timeout) clearTimeout(state.timeout);

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
                state.timeout = setTimeout(async () => {
                    if (state.focused && !(await field.isActive())) {
                        logger.debug(`[FieldTracker] Browser "blur" dequeue detected`);
                        onBlur(evt);
                    }
                }, DOM_SETTLE_MS);
            });
        };

        /** Handles input changes: closes dropdown for non-filterable fields or updates filter.
         * Non-filterable fields: closes dropdown immediately (user typing manually).
         * Filterable fields: sends filter updates to update dropdown results */
        const onInput = (_: Event) => {
            const { action } = field;
            const elementValue = field.element.value;
            const trackedValue = field.value;

            /** Tooltips may appear when input value toggles from empty to
             * non-empty: schedule icon repositioning when this happens */
            const revalidate = (!trackedValue && elementValue) || (trackedValue && !elementValue);
            if (revalidate && !field.actionPrevented) {
                if (state.timeout) clearTimeout(state.timeout);
                state.timeout = setTimeout(() => field.icon?.reposition(), 150);
            }

            field.setValue(elementValue);

            if (field.actionPrevented) return;
            else if (!action?.filterable) ctx?.service.inline.dropdown.close({ type: 'field', field });
            else syncAutofillFilter(elementValue);
        };

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

        const onClientEvent = (data: ClientObserverEvent) => {
            if (data.type === 'event') {
                switch (data.event.type) {
                    case 'focus':
                        /** NOTE: on rapid switching between top/sub frames,
                         * browsers may dequeue events: when refocusing the
                         * current window: check if we should re-attach */
                        if (state.timeout) clearTimeout(state.timeout);
                        state.timeout = setTimeout(
                            () => isActiveElement(field.element) && onFocus(data.event),
                            DOM_SETTLE_MS
                        );
                        break;
                    case 'blur':
                        /** NOTE: in case a blur event on the field is missed */
                        if (state.focused) onBlur(data.event);
                        break;
                }
            }
        };

        listeners.addListener(field.element, 'focus', onFocus);
        listeners.addListener(field.element, 'focusin', onFocus);
        listeners.addListener(field.element, 'blur', onBlur);
        listeners.addListener(field.element, 'focusout', onBlur);
        listeners.addListener(field.element, 'input', onInput);
        listeners.addListener(field.element, 'mousedown', onFocus);
        listeners.addObserver(field.element, onAttributeChange, { attributeFilter: ['type'], attributeOldValue: true });

        if (ctx) listeners.addSubscriber(ctx.observer.subscribe(onClientEvent));

        if (formTracker) {
            const { onFieldChange, onFormSubmit } = formTracker;
            listeners.addListener(field.element, 'input', onFieldChange);
            listeners.addListener(field.element, 'keydown', pipe(handleOnEnter(onFormSubmit), onFieldChange));
        }

        return {
            detach: () => {
                if (state.timeout) clearTimeout(state.timeout);
                listeners.removeAll();
                raf.cancel();
            },
        };
    }
);
