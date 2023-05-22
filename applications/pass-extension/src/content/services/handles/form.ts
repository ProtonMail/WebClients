import { getMaxZIndex, isInputElement } from '@proton/pass/utils/dom';
import { logger } from '@proton/pass/utils/logger';
import { objectMap } from '@proton/pass/utils/object';
import { uniqueId } from '@proton/pass/utils/string';

import { PROCESSED_INPUT_ATTR } from '../../constants';
import type { FormFields, FormHandle, FormType } from '../../types';
import { createFormTracker } from '../form/tracker';
import { createFieldHandles } from './field';

export type CreateFormHandlesOptions<T extends FormType> = {
    formType: T;
    form: HTMLFormElement;
    fields: FormFields;
};

export type FormHandlesProps = { zIndex: number };

export const createFormHandles = <T extends FormType = FormType>(options: CreateFormHandlesOptions<T>): FormHandle => {
    const { form, formType, fields: detectedFields } = options;

    const formHandle: FormHandle = {
        id: uniqueId(),
        element: form,
        formType: formType,
        props: { injections: { zIndex: getMaxZIndex(form) + 1 } },
        fields: objectMap(detectedFields)((fieldType, fieldEls) =>
            (fieldEls ?? []).map(
                createFieldHandles({
                    formType,
                    fieldType,
                    getFormHandle: () => formHandle,
                })
            )
        ) as FormHandle['fields'],
        getFieldsFor: (type) => formHandle.fields[type] ?? [],
        listFields: (predicate = () => true) => Object.values(formHandle.fields).flat().filter(predicate),
        shouldRemove: () => !document.body.contains(form),
        shouldUpdate: () =>
            !formHandle
                .listFields((field) => isInputElement(field.element))
                .every((field) => form.contains(field.element)),

        /* Form tracker is responsible for setting
         * up the submission handlers and the input
         * changes handler */
        attach() {
            logger.debug(`[FormHandles]: Attaching tracker for form [${formType}:${formHandle.id}]`);
            formHandle.tracker = formHandle.tracker ?? createFormTracker(formHandle);
            formHandle.tracker?.attach();
            formHandle.tracker?.autofocus();
        },

        detach() {
            logger.debug(`[FormHandles]: Detaching tracker for form [${formType}:${formHandle.id}]`);
            Array.from(form.querySelectorAll('input')).forEach((el) => el.removeAttribute(PROCESSED_INPUT_ATTR));
            formHandle.tracker?.detach();
        },
    };

    return formHandle;
};
