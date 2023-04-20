import { fathom } from '@proton/pass/fathom/protonpass-fathom';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { findBoundingElement, isInputElement } from '@proton/pass/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener';
import noop from '@proton/utils/noop';

import { autofill } from '../../shared/form';
import CSContext from '../context';
import type { FieldHandles, FormFieldTypeMap, FormHandles } from '../types';
import { DropdownAction, FormField, FormType } from '../types';
import { createFieldIconHandles } from './icon';

const { isVisible } = fathom.utils;

type CreateFieldHandlesOptions<T extends FormType, V extends FormField> = {
    formType: T;
    fieldType: V;
    getFormHandle: () => FormHandles;
};

export const canProcessAction = (action: DropdownAction, settings: ProxiedSettings): boolean => {
    switch (action) {
        case DropdownAction.AUTOFILL:
            return settings.autofill.inject;
        case DropdownAction.AUTOSUGGEST_ALIAS:
            return settings.autosuggest.email;
        case DropdownAction.AUTOSUGGEST_PASSWORD:
            return settings.autosuggest.password;
        default:
            return true;
    }
};

export const createFieldHandles =
    <T extends FormType, V extends FormField>({
        formType,
        fieldType,
        getFormHandle,
    }: CreateFieldHandlesOptions<T, V>) =>
    (element: FormFieldTypeMap[V]): FieldHandles => {
        /**
         * Since we're creating "field handles" for elements
         * that may include submit buttons as well : make sure
         * we're dealing with an HTMLInputElement for autofilling
         * and icon injection
         */
        const isInput = isInputElement(element);
        const listeners = createListenerStore();
        const boxElement = findBoundingElement(element);

        const field: FieldHandles = {
            formType,
            fieldType,
            element,
            boxElement,
            icon: null,
            value: element.value ?? '',
            getFormHandle,
            setValue: (value) => (field.value = value),
            autofill: isInput ? autofill(element) : noop,
            attachIcon: (action) => {
                /* make sure the element is actually visible
                 * as we may have detected a "hidden" field
                 * in order to track it */
                if (isVisible(field.element) && canProcessAction(action, CSContext.get().settings)) {
                    field.icon = isInput ? createFieldIconHandles({ field }) : null;
                    field.icon?.setOnClickAction(action);
                }
            },
            detachIcon: () => {
                field.icon?.detach();
                field.icon = null;
            },
            attachListeners: (onSubmit) => {
                const onFocus = () => {
                    const { iframes, settings } = CSContext.get();
                    iframes.dropdown.close(); /* dropdown might be open */

                    return (
                        settings.autofill.openOnFocus &&
                        iframes.dropdown.open({
                            action: DropdownAction.AUTOFILL,
                            focus: true,
                            field,
                        })
                    );
                };

                if (formType === FormType.LOGIN) {
                    if (document.activeElement === field.element) {
                        onFocus();
                    }

                    listeners.addListener(field.element, 'focus', onFocus);
                }

                listeners.addListener(field.element, 'input', () => {
                    const { dropdown } = CSContext.get().iframes;
                    if (dropdown.getState().visible) {
                        dropdown.close();
                    }

                    field.setValue(element.value);
                });

                listeners.addListener(field.element, 'keydown', (e) => {
                    const { key } = e as KeyboardEvent;
                    return key === 'Enter' && onSubmit();
                });
            },
            detachListeners: () => listeners.removeAll(),
        };

        return field;
    };
