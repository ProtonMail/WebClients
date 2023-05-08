import { findBoundingElement, isInputElement } from '@proton/pass/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener';
import noop from '@proton/utils/noop';

import { autofill } from '../../../shared/form';
import { withContext } from '../../context/context';
import type { FieldHandle, FormHandle } from '../../types';
import { FormField, FormType } from '../../types';
import { createFieldIconHandle } from './icon';

type CreateFieldHandlesOptions<T extends FormType, V extends FormField> = {
    formType: T;
    fieldType: V;
    getFormHandle: () => FormHandle;
};

/* on input focus : close the dropdown only if the current target
 * does not match the dropdown's current field : this maybe the case
 * when changing focus with the dropdown open */
const onFocusField = (field: FieldHandle): ((evt?: FocusEvent) => void) =>
    withContext(({ service: { iframe }, getSettings }, evt) => {
        requestAnimationFrame(() => {
            const target = evt?.target;
            const current = iframe.dropdown?.getCurrentField()?.element;
            if (current !== target) iframe.dropdown?.close();

            return (
                field.action &&
                getSettings().autofill.openOnFocus &&
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

export const createFieldHandles =
    <T extends FormType, V extends FormField>({
        formType,
        fieldType,
        getFormHandle,
    }: CreateFieldHandlesOptions<T, V>) =>
    (element: HTMLElement): FieldHandle => {
        /* Since we're creating "field handles" for elements
         * that may include submit buttons as well : make sure
         * we're dealing with an HTMLInputElement for autofilling
         * and icon injection*/
        const isInput = isInputElement(element);
        const listeners = createListenerStore();
        const boxElement = findBoundingElement(element);

        const field: FieldHandle = {
            formType,
            fieldType,
            element,
            boxElement,
            icon: null,
            action: null,
            value: isInput ? element.value ?? '' : '',
            getFormHandle,
            setValue: (value) => (field.value = value),
            setAction: (action) => (field.action = action),
            autofill: isInput ? autofill(element) : noop,
            attachIcon: () => (field.icon = field.icon ?? createFieldIconHandle({ field })),

            detachIcon() {
                field.icon?.detach();
                field.icon = null;
            },

            attachListeners(onSubmit) {
                field.detachListeners();
                listeners.addListener(field.element, 'focus', onFocusField(field));
                listeners.addListener(field.element, 'input', onInputField(field));
                listeners.addListener(field.element, 'keydown', onKeyDownField(onSubmit));

                return document.activeElement === field.element && onFocusField(field)();
            },

            detachListeners: () => listeners.removeAll(),
        };

        return field;
    };
