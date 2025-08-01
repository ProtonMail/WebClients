import { withContext } from 'proton-pass-extension/app/content/context/context';
import { type FieldHandle, type FormHandle, IFramePortMessageType } from 'proton-pass-extension/app/content/types';
import { actionPrevented, actionTrap, withActionTrap } from 'proton-pass-extension/app/content/utils/action-trap';
import { createAutofill } from 'proton-pass-extension/app/content/utils/autofill';
import { isActiveElement } from 'proton-pass-extension/app/content/utils/nodes';

import { FieldType, FormType } from '@proton/pass/fathom';
import { clientSessionLocked } from '@proton/pass/lib/client';
import { findBoundingInputElement } from '@proton/pass/utils/dom/input';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import throttle from '@proton/utils/throttle';

import { createFieldIconHandle } from './icon';

type CreateFieldHandlesOptions = {
    element: HTMLInputElement;
    formType: FormType;
    fieldType: FieldType;
    zIndex: number;
    getFormHandle: () => FormHandle;
};

/* on input focus : close the dropdown only if the current target
 * does not match the dropdown's current field : this maybe the case
 * when changing focus with the dropdown open */
const onFocusField = (field: FieldHandle): ((evt?: FocusEvent) => void) =>
    withContext((ctx) => {
        const { action, element } = field;
        if (!(ctx && action)) return;

        requestAnimationFrame(async () => {
            if (actionPrevented(element)) return;

            const { formType } = field.getFormHandle();
            const login = formType === FormType.LOGIN;
            const count = login ? ((await ctx?.service.autofill.getCredentialsCount()) ?? 0) : 0;

            field.attachIcon({ count });

            const dropdown = ctx?.service.iframe.dropdown;
            const attachedField = dropdown?.getCurrentField();
            const current = attachedField?.element;
            const opened = dropdown?.getState().visible;
            const locked = clientSessionLocked(ctx.getState().status);

            const shouldClose = opened && !isActiveElement(current);
            const shouldOpen = ctx?.getState().authorized && (!opened || shouldClose);

            /** If the session is locked on focus and the dropdown is opened: force
             * close it. Some websites capture input focus too aggressively */
            if (shouldClose || locked) dropdown?.close();
            if (shouldOpen) {
                ctx?.service.iframe.attachDropdown(field.getFormHandle().element)?.open({
                    action: action.type,
                    autofocused: true,
                    field,
                });
            }
        });
    });

const onBlurField = (field: FieldHandle): ((evt?: FocusEvent) => void) =>
    withContext((ctx, _evt) => {
        if (!actionPrevented(field.element)) {
            const dropdown = ctx?.service.iframe.dropdown;
            const visible = dropdown?.getState().visible;
            const attachedTo = dropdown?.getCurrentField();
            if (!(attachedTo === field && visible)) field.detachIcon();
        }
    });

/* on input change : close the dropdown if it was visible
 * and update the field's handle tracked value */
const onInputField = (field: FieldHandle): ((evt: Event) => void) => {
    const syncAutofillFilter = throttle(
        withContext<(startsWith: string) => void>((ctx, startsWith) => {
            ctx?.service.iframe.dropdown?.sendMessage({
                type: IFramePortMessageType.AUTOFILL_FILTER,
                payload: { startsWith },
            });
        }),
        250,
        { trailing: true }
    );

    return withContext((ctx) => {
        const dropdown = ctx?.service.iframe.dropdown;
        const { action, element } = field;
        const { value } = field.element;

        if (dropdown && dropdown.getState().visible) {
            if (!actionPrevented(element) && !action?.filterable) dropdown.close();
            else if (action?.filterable) syncAutofillFilter(value);
        }

        field.setValue(value);
    });
};

/* when the type attribute of a field changes : detach it from
 * the tracked form and re-trigger the detection */
const onFieldAttributeChange = (field: FieldHandle): MutationCallback =>
    withContext<MutationCallback>((ctx, mutations) => {
        if ([FieldType.PASSWORD_CURRENT, FieldType.PASSWORD_NEW].includes(field.fieldType)) return;

        mutations.forEach((mutation) => {
            const target = mutation.target as HTMLInputElement;
            if (mutation.type === 'attributes' && mutation.oldValue !== target.type) {
                field.getFormHandle().detachField(mutation.target as HTMLInputElement);
                void ctx?.service.formManager.detect({ reason: 'FieldTypeChange' });
            }
        });
    });

/* trigger the submit handler on keydown enter */
const onKeyDownField =
    (onSubmit: () => void) =>
    ({ key }: KeyboardEvent) =>
        key === 'Enter' && onSubmit();

export const createFieldHandles = ({
    element,
    fieldType,
    zIndex,
    getFormHandle,
}: CreateFieldHandlesOptions): FieldHandle => {
    const listeners = createListenerStore();

    const field: FieldHandle = {
        fieldType,
        element,
        boxElement: findBoundingInputElement(element),
        icon: null,
        action: null,
        value: element.value,
        autofilled: null,
        tracked: false,
        zIndex,
        getFormHandle,
        getBoxElement: (options) => {
            if (options?.reflow) field.boxElement = findBoundingInputElement(element);
            return field.boxElement;
        },
        setValue: (value) => {
            field.autofilled = null;
            return (field.value = value);
        },
        setAction: (action) => (field.action = action),

        /* if the field is already focused we need to re-dispatch the event on the input
         * element to trigger initial dropdown autofocus. Calling `el.focus()` will not
         * re-dispatch the focus event if it is already the document's active element.
         * In certain cases, we may want to re-focus the element without triggering the
         * attached action effect : as there is no way to attach extra data to a focus event,
         * so we rely on adding custom properties on the field element itself */
        focus(options) {
            const isFocusedField = isActiveElement(field.element);
            if (options?.preventAction) actionTrap(field.element);
            field.element.focus();

            if (isFocusedField) {
                const focusEvent = new FocusEvent('focus', {
                    bubbles: true,
                    cancelable: true,
                    relatedTarget: null,
                });

                return field.element.dispatchEvent(focusEvent);
            }
        },

        autofill: (value, options) => {
            withActionTrap(element, createAutofill(element))(value, options);
            field.autofilled = options?.type ?? field.fieldType;
        },

        /** Attaches icon to field with safeguard to detach from other fields.
         * Note: Ideally handled by dropdown/field event lifecycle. */
        attachIcon: withContext((ctx, { count }) => {
            if (!ctx) return;

            if (!field.icon) {
                ctx.service.formManager
                    .getTrackedForms()
                    .forEach((form) => form.getFields().forEach((field) => field.detachIcon()));
            }

            field.icon = field.icon ?? createFieldIconHandle({ field, elements: ctx.elements });
            field.icon.setCount(count);

            return field.icon;
        }),

        detachIcon() {
            field.icon?.detach();
            field.icon = null;
        },

        attach({ onChange, onSubmit }) {
            field.tracked = true;
            listeners.removeAll();
            listeners.addListener(field.element, 'blur', onBlurField(field));
            listeners.addListener(field.element, 'focus', onFocusField(field));
            listeners.addListener(field.element, 'input', pipe(onInputField(field), onChange));
            listeners.addListener(field.element, 'keydown', pipe(onKeyDownField(onSubmit), onChange));
            listeners.addResizeObserver(field.element, () => field.icon?.reposition(false));
            listeners.addObserver(field.element, onFieldAttributeChange(field), {
                attributeFilter: ['type'],
                attributeOldValue: true,
            });
        },

        detach: () => {
            field.tracked = false;
            field.detachIcon();
            listeners.removeAll();
        },
    };

    return field;
};
