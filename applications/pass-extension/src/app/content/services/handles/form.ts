import { withContext } from 'proton-pass-extension/app/content/context/context';
import { createFormTracker } from 'proton-pass-extension/app/content/services/form/tracker';
import type { DetectedField, DetectedForm, FormHandle } from 'proton-pass-extension/app/content/types';
import { hasUnprocessedFields } from 'proton-pass-extension/app/content/utils/nodes';

import { type FormType, isVisibleForm, removeClassifierFlags, removeProcessedFlag } from '@proton/pass/fathom';
import { getMaxZIndex } from '@proton/pass/utils/dom/zindex';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import debounce from '@proton/utils/debounce';

import { createFieldHandles } from './field';

export type FormHandlesProps = { zIndex: number };

export const createFormHandles = (options: DetectedForm): FormHandle => {
    const { form, formType, fields: detectedFields } = options;
    const listeners = createListenerStore();
    const zIndex = getMaxZIndex(form) + 5;

    const formHandle: FormHandle = {
        id: uniqueId(),
        element: form,
        formType: formType,
        fields: new Map(
            detectedFields.map(({ fieldType, field }) => [
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
            removeProcessedFlag(field);
        },

        shouldRemove: () => !document.body.contains(form) || !isVisibleForm(form),

        reconciliate: (formType: FormType, fields: DetectedField[]) => {
            formHandle.formType = formType;

            formHandle.getFields().forEach((field) => {
                const shouldDetach = !fields.some((incoming) => field.element === incoming.field);
                return shouldDetach && formHandle.detachField(field.element);
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

        detach: withContext((ctx) => {
            logger.info(`[FormHandles]: Detaching tracker for form [${formType}:${formHandle.id}]`);
            const dropdown = ctx?.service.iframe.dropdown;
            const dropdownField = dropdown?.getCurrentField() ?? null;

            listeners.removeAll();
            formHandle.tracker?.detach();
            formHandle.getFields().forEach((field) => {
                if (field === dropdownField) dropdown?.close();
                field.detach();
            });

            removeClassifierFlags(form, { preserveIgnored: true });
        }),
    };

    /**
     * Detection trigger & repositioning via Form Resize
     *
     * This handler is responsible for triggering the repositioning flow for
     * our injections when tooltips or error messages appear. Additionally, it
     * checks if the form's parent element has unprocessed fields. This detection
     * mechanism during a resize is particularly useful for "stacked" or "multi-
     * step" forms where multiple forms (or clusters of inputs) are overlayed on
     * top of each other. The purpose is to handle dynamic changes in form layouts
     * and stacked forms effectively without looking for unprocessed fields
     * on the full DOM as this may lead to too many detection triggers */
    const onFormResize = debounce(
        withContext((ctx) => {
            const fields = formHandle.getFields();
            fields.forEach((field) => field.icon?.reposition());

            if (options.form.parentElement === null || hasUnprocessedFields(options.form.parentElement)) {
                void ctx?.service.formManager.detect({ reason: 'NewFormFieldsOnResize' });
            }
        }),
        50
    );

    listeners.addResizeObserver(options.form, onFormResize);

    return formHandle;
};
