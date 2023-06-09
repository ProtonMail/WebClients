import type { FormType } from '@proton/pass/types';
import { FormField } from '@proton/pass/types';
import { getMaxZIndex } from '@proton/pass/utils/dom';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string';

import type { DetectedField, DetectedForm, FormHandle } from '../../types';
import { setFieldProcessable, setFormProcessable } from '../../utils/nodes';
import { createFormTracker } from '../form/tracker';
import { createFieldHandles } from './field';

export type FormHandlesProps = { zIndex: number };

export const createFormHandles = (options: DetectedForm): FormHandle => {
    const { form, formType, fields: detectedFields } = options;
    const zIndex = getMaxZIndex(form) + 1;

    const formHandle: FormHandle = {
        id: uniqueId(),
        element: form,
        formType: formType,
        fields: new Map(
            detectedFields
                .filter(({ fieldType }) => fieldType !== FormField.NOOP)
                .map(({ fieldType, field }) => [
                    field,
                    createFieldHandles({
                        element: field,
                        formType,
                        fieldType,
                        zIndex,
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
            setFieldProcessable(field);
        },

        shouldRemove: () => !document.body.contains(form),

        reconciliate: (formType: FormType, fields: DetectedField[]) => {
            formHandle.formType = formType;
            /* detach removed fields */
            formHandle.getFields().forEach((field) => {
                if (!form.contains(field.element)) formHandle.detachField(field.element);
            });

            /* attach incoming new fields */
            fields.forEach(({ field, fieldType }) => {
                if (formHandle.fields.get(field) === undefined && fieldType !== FormField.NOOP) {
                    formHandle.fields.set(
                        field,
                        createFieldHandles({
                            element: field,
                            formType,
                            fieldType,
                            zIndex,
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
            formHandle.tracker = formHandle.tracker ?? createFormTracker(formHandle);
            formHandle.tracker.reconciliate();
        },

        detach() {
            logger.debug(`[FormHandles]: Detaching tracker for form [${formType}:${formHandle.id}]`);
            setFormProcessable(form);
            Array.from(form.querySelectorAll('input')).forEach(setFieldProcessable);
            formHandle.tracker?.detach();
        },
    };

    return formHandle;
};
