import uniqid from 'uniqid';

import { getMaxZIndex, isInputElement } from '@proton/pass/utils/dom';
import { logger } from '@proton/pass/utils/logger';
import { objectMap } from '@proton/pass/utils/object';

import { PROCESSED_INPUT_ATTR } from '../constants';
import { createFormTracker } from '../services/form/tracker';
import { FormFields, FormHandles, FormType } from '../types';
import { createFieldHandles } from './field';

export const getAllFields = (form: FormHandles) => Object.values(form.fields).flat();
export const getAllInputFields = (form: FormHandles) =>
    getAllFields(form).filter((field) => isInputElement(field.element));

export type CreateFormHandlesOptions<T extends FormType> = {
    formType: T;
    form: HTMLFormElement;
    fields: FormFields<T>;
};

export type FormHandlesProps = {
    zIndex: number;
};

export const createFormHandles = <T extends FormType = FormType>(options: CreateFormHandlesOptions<T>): FormHandles => {
    const { form, formType, fields: detectedFields } = options;

    const formHandle: FormHandles = {
        id: uniqid(),
        element: form,
        formType: formType,
        props: { injections: { zIndex: getMaxZIndex(form) + 1 } },
        fields: objectMap(detectedFields)((fieldType, fieldEl) =>
            fieldEl.map(
                createFieldHandles({
                    formType,
                    fieldType,
                    getFormHandle: () => formHandle,
                })
            )
        ) as FormHandles['fields'],
        shouldRemove: () => !document.body.contains(form),
        shouldUpdate: () => !getAllInputFields(formHandle).every((field) => form.contains(field.element)),
        /**
         * Form tracker is responsible for setting
         * up the submission handlers and the input
         * changes handler.
         */
        attach: () => {
            logger.debug(`[FormHandles]: Attaching tracker for form [${formType}:${formHandle.id}]`);
            formHandle.tracker = formHandle.tracker ?? createFormTracker(formHandle);
            formHandle.tracker?.attach();
        },
        detach: () => {
            logger.debug(`[FormHandles]: Detaching tracker for form [${formType}:${formHandle.id}]`);
            Array.from(form.querySelectorAll('input')).forEach((el) => el.removeAttribute(PROCESSED_INPUT_ATTR));
            formHandle.tracker?.detach();
        },
    };

    return formHandle;
};
