import { editableFieldSelector } from '@proton/pass/fathom';
import type { FormType } from '@proton/pass/types';
import { getMaxZIndex } from '@proton/pass/utils/dom';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string';

import type { DetectedField, FormHandle } from '../../types';
import { elementProcessable, setElementProcessable, setElementProcessed } from '../../utils/flags';
import { createFormTracker } from '../form/tracker';
import { createFieldHandles } from './field';

export type CreateFormHandlesOptions = {
    formType: FormType;
    form: HTMLFormElement;
    fields: DetectedField[];
};

export type FormHandlesProps = { zIndex: number };

export const createFormHandles = (options: CreateFormHandlesOptions): FormHandle => {
    const { form, formType, fields: detectedFields } = options;
    setElementProcessed(form);

    const formHandle: FormHandle = {
        id: uniqueId(),
        element: form,
        formType: formType,
        props: { injections: { zIndex: getMaxZIndex(form) + 1 } },
        fields: new Map(
            detectedFields.map(({ fieldType, field }) => [
                field,
                createFieldHandles({
                    element: field,
                    formType,
                    fieldType,
                    getFormHandle: () => formHandle,
                }),
            ])
        ),
        getFieldsFor: (type, predicate) => {
            const fields = Array.from(formHandle.fields.values());
            return fields.filter((field) => field.fieldType === type && (predicate?.(field) ?? true));
        },

        getFields: (predicate) => {
            const fields = Array.from(formHandle.fields.values());
            return predicate ? fields.filter(predicate) : fields;
        },

        detachField: (field: HTMLInputElement) => {
            formHandle.fields.get(field)?.detach();
            formHandle.fields.delete(field);
        },

        shouldRemove: () => !document.body.contains(form),

        reconciliate: (fields: DetectedField[]) => {
            /* flag each visible & editable fields as processed to
             * avoid re-triggering the detection unnecessarily */
            Array.from(form.querySelectorAll<HTMLInputElement>(editableFieldSelector))
                .filter(elementProcessable)
                .forEach(setElementProcessed);

            /* detach removed fields */
            formHandle.getFields().forEach((field) => {
                if (!form.contains(field.element)) formHandle.detachField(field.element);
            });

            /* attach incoming new fields */
            fields.forEach(({ field, fieldType }) => {
                if (formHandle.fields.get(field) === undefined) {
                    formHandle.fields.set(
                        field,
                        createFieldHandles({
                            element: field,
                            formType,
                            fieldType,
                            getFormHandle: () => formHandle,
                        })
                    );
                }
            });
        },

        /* Form tracker is responsible for setting
         * up the submission handlers and the input
         * changes handler */
        attach() {
            logger.debug(`[FormHandles]: Attaching tracker for form [${formType}:${formHandle.id}]`);
            formHandle.tracker = formHandle.tracker ?? createFormTracker(formHandle);
            formHandle.tracker.reconciliate();
        },

        detach() {
            logger.debug(`[FormHandles]: Detaching tracker for form [${formType}:${formHandle.id}]`);
            setElementProcessable(form);
            Array.from(form.querySelectorAll('input')).forEach(setElementProcessable);
            formHandle.tracker?.detach();
        },
    };

    return formHandle;
};
