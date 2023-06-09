import type { FormField, FormType } from '@proton/pass/types';
import { findBoundingInputElement } from '@proton/pass/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener';

import { createAutofill } from '../../../shared/form';
import { withContext } from '../../context/context';
import type { FieldHandle, FormHandle } from '../../types';
import { createFieldIconHandle } from './icon';

type CreateFieldHandlesOptions = {
    element: HTMLInputElement;
    formType: FormType;
    fieldType: FormField;
    zIndex: number;
    getFormHandle: () => FormHandle;
};

/* on input focus : close the dropdown only if the current target
 * does not match the dropdown's current field : this maybe the case
 * when changing focus with the dropdown open */
const onFocusField = (field: FieldHandle): ((evt?: FocusEvent) => void) =>
    withContext(({ service: { iframe }, getSettings, getState }, evt) => {
        const el = field.element as any;
        const preventDefault = el?.focusData ?? false;
        if (preventDefault) return delete el.focusData;

        requestAnimationFrame(() => {
            const target = evt?.target;

            const current = iframe.dropdown?.getCurrentField()?.element;
            const opened = iframe.dropdown?.getState().visible;
            const shouldClose = opened && current !== target;
            const canOpen = getState().loggedIn && (!opened || shouldClose) && getSettings().autofill.openOnFocus;

            if (shouldClose) iframe.dropdown?.close();

            return (
                canOpen &&
                field.action &&
                iframe.dropdown?.open({
                    action: field.action,
                    autofocused: true,
                    field,
                })
            );
        });
    });

/* on input change : close the dropdown if it was visible
 * and update the field's handle tracked value */
const onInputField = (field: FieldHandle): (() => void) =>
    withContext(({ service: { iframe } }) => {
        if (iframe.dropdown?.getState().visible) iframe.dropdown?.close();
        field.setValue((field.element as HTMLInputElement).value);
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
    const boxElement = findBoundingInputElement(element);

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
        getBoxElement: () => field.boxElement,
        setValue: (value) => (field.value = value),
        setAction: (action) => (field.action = action),

        /* if the field is already focused by the browser we need
         * to re-dispatch the event on the input element to trigger
         * initial dropdown autofocus. There is no way to attach
         * extra data to a focus event so we rely on adding custom
         * properties on the field element itself */
        focus(focusData) {
            (field.element as any).focusData = focusData;
            const isFocusedField = document.activeElement === field.element;
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
        },

        detach: () => {
            field.tracked = false;
            field.detachIcon();
            listeners.removeAll();
        },
    };

    return field;
};
