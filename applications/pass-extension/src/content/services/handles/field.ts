import type { FormType } from '@proton/pass/fathom';
import { FieldType } from '@proton/pass/fathom';
import { findBoundingInputElement } from '@proton/pass/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener';

import { createAutofill } from '../../../shared/form';
import { withContext } from '../../context/context';
import type { FieldHandle, FormHandle, HTMLElementWithActionTrap } from '../../types';
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
    withContext(({ service: { iframe }, getSettings, getState }, evt) => {
        const { action, element } = field;

        const inputEl = element as HTMLElementWithActionTrap;
        if (inputEl.preventAction) return delete inputEl.preventAction;
        if (!action) return;

        requestAnimationFrame(() => {
            const target = evt?.target;

            const current = iframe.dropdown?.getCurrentField()?.element;
            const opened = iframe.dropdown?.getState().visible;

            const shouldClose = opened && current !== target;
            const shouldOpen = getState().loggedIn && (!opened || shouldClose) && getSettings().autofill.openOnFocus;

            if (shouldClose) iframe.dropdown?.close();
            if (shouldOpen) {
                iframe.attachDropdown();
                iframe.dropdown?.open({
                    action,
                    autofocused: true,
                    field,
                });
            }
        });
    });

/* on input change : close the dropdown if it was visible
 * and update the field's handle tracked value */
const onInputField = (field: FieldHandle): (() => void) =>
    withContext(({ service: { iframe } }) => {
        if (iframe.dropdown?.getState().visible) iframe.dropdown?.close();
        field.setValue((field.element as HTMLInputElement).value);
    });

/* when the type attribute of a field changes : detach it from
 * the tracked form and re-trigger the detection */
const onFieldAttributeChange = (field: FieldHandle): MutationCallback =>
    withContext<MutationCallback>(({ service: { formManager } }, mutations) => {
        if ([FieldType.PASSWORD_CURRENT, FieldType.PASSWORD_NEW].includes(field.fieldType)) return;

        mutations.forEach((mutation) => {
            const target = mutation.target as HTMLInputElement;
            if (mutation.type === 'attributes' && mutation.oldValue !== target.type) {
                field.getFormHandle().detachField(mutation.target as HTMLInputElement);
                void formManager.detect({ reason: 'FieldTypeChange' });
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
    formType,
    fieldType,
    zIndex,
    getFormHandle,
}: CreateFieldHandlesOptions): FieldHandle => {
    const listeners = createListenerStore();
    let boxElement = findBoundingInputElement(element);

    const field: FieldHandle = {
        formType,
        fieldType,
        element,
        boxElement,
        icon: null,
        action: null,
        value: element.value,
        tracked: false,
        zIndex,
        getFormHandle,
        getBoxElement: (options) =>
            options?.revalidate ? (boxElement = findBoundingInputElement(element)) : boxElement,
        setValue: (value) => (field.value = value),
        setAction: (action) => (field.action = action),

        /* if the field is already focused we need to re-dispatch the event on the input
         * element to trigger initial dropdown autofocus. Calling `el.focus()` will not
         * re-dispatch the focus event if it is already the document's active element.
         * In certain cases, we may want to re-focus the element without triggering the
         * attached action effect : as there is no way to attach extra data to a focus event,
         * so we rely on adding custom properties on the field element itself */
        focus(options) {
            const isFocusedField = document.activeElement === field.element;
            (field.element as HTMLElementWithActionTrap).preventAction = options?.preventAction;
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

        autofill: createAutofill(element),

        /* if an icon is already attached recycle it */
        attachIcon: () => (field.icon = field.icon ?? createFieldIconHandle({ field })),

        detachIcon() {
            field.icon?.detach();
            field.icon = null;
        },

        attach(onSubmit) {
            field.tracked = true;
            listeners.removeAll();
            listeners.addListener(field.element, 'focus', onFocusField(field));
            listeners.addListener(field.element, 'input', onInputField(field));
            listeners.addListener(field.element, 'keydown', onKeyDownField(onSubmit));
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
