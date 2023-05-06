import { fathom } from '@proton/pass/fathom/protonpass-fathom';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { findBoundingElement, isInputElement } from '@proton/pass/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener';
import noop from '@proton/utils/noop';

import { autofill } from '../../../shared/form';
import { withContext } from '../../context/context';
import type { FieldHandle, FormHandle } from '../../types';
import { DropdownAction, FormField, FormType } from '../../types';
import { createFieldIconHandle } from './icon';

const { isVisible } = fathom.utils;

type CreateFieldHandlesOptions<T extends FormType, V extends FormField> = {
    formType: T;
    fieldType: V;
    getFormHandle: () => FormHandle;
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
            autofill: isInput ? autofill(element) : noop,

            /* make sure the element is actually visible
             * as we may have detected a "hidden" field
             * in order to track it */
            attachIcon: withContext(({ getSettings, getState }, action) => {
                field.action = action;

                if (isVisible(field.element) && canProcessAction(action, getSettings())) {
                    const { status, loggedIn } = getState();
                    field.icon = field.icon ?? (isInput ? createFieldIconHandle({ field }) : null);
                    field.icon?.setStatus(status);
                    field.icon?.setAction(action);
                    if (!loggedIn) field.icon?.setCount(0);
                }
            }),

            detachIcon() {
                field.icon?.detach();
                field.icon = null;
            },

            sync: withContext(({ getSettings }) => {
                if (field.action === null) return;

                if (canProcessAction(field.action, getSettings())) return field.attachIcon(field.action);

                field.icon?.detach();
                field.icon = null;
            }),

            attachListeners: withContext(({ service: { iframe }, getSettings }, onSubmit) => {
                if (!isInput) return;

                const onFocus = () =>
                    requestAnimationFrame(() => {
                        iframe.dropdown?.close();
                        return (
                            getSettings().autofill.openOnFocus &&
                            field.action !== null &&
                            iframe.dropdown?.open({
                                action: field.action,
                                focus: true,
                                field,
                            })
                        );
                    });

                const onInput = () => {
                    if (iframe.dropdown?.getState().visible) iframe.dropdown?.close();
                    field.setValue(element.value);
                };

                const onKeyDown = ({ key }: KeyboardEvent) => key === 'Enter' && onSubmit();

                listeners.addListener(field.element, 'focus', onFocus);
                listeners.addListener(field.element, 'input', onInput);
                listeners.addListener(field.element, 'keydown', onKeyDown);

                return document.activeElement === field.element && onFocus();
            }),

            detachListeners: () => listeners.removeAll(),
        };

        return field;
    };
