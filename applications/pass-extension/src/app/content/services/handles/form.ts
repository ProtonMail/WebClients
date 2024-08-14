import { withContext } from 'proton-pass-extension/app/content/context/context';
import { resolveIdentitySections } from 'proton-pass-extension/app/content/services/form/autofill.identity.sections';
import { createFormTracker } from 'proton-pass-extension/app/content/services/form/tracker';
import type { DetectedField, DetectedForm, FieldHandle, FormHandle } from 'proton-pass-extension/app/content/types';
import { actionTrap } from 'proton-pass-extension/app/content/utils/action-trap';
import { hasProcessableFields } from 'proton-pass-extension/app/content/utils/nodes';

import { FieldType, type FormType, buttonSelector, isVisibleForm, removeClassifierFlags } from '@proton/pass/fathom';
import { isElementBusy, isParentBusy } from '@proton/pass/utils/dom/form';
import { findScrollableParent } from '@proton/pass/utils/dom/scroll';
import { getMaxZIndex } from '@proton/pass/utils/dom/zindex';
import { prop } from '@proton/pass/utils/fp/lens';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import debounce from '@proton/utils/debounce';

import { createFieldHandles } from './field';

export type FormHandlesProps = { zIndex: number };

export const createFormHandles = (options: DetectedForm): FormHandle => {
    const { form, formType, fields: detectedFields } = options;
    const listeners = createListenerStore();
    const zIndex = getMaxZIndex(options.fields.map(prop('field'))) + 5;
    const scrollRef = findScrollableParent(form);

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

        get busy() {
            const btns = Array.from(form.querySelectorAll<HTMLElement>(buttonSelector));
            const busyFields = formHandle.getFields(({ element }) => isElementBusy(element));
            return isElementBusy(form) || btns.some(isElementBusy) || busyFields.length > 0 || isParentBusy(form);
        },

        get detached() {
            return !document.body.contains(form) || !isVisibleForm(form);
        },

        getFieldsFor: (type, predicate) => {
            const fields = Array.from(formHandle.fields.values());
            return fields.filter((field) => field.fieldType === type && (predicate?.(field) ?? true));
        },

        getFields: (predicate) => {
            const fields = Array.from(formHandle.fields.values());
            return predicate ? fields.filter(predicate) : fields;
        },

        /** Detach a field to prevent unwanted actions during attribute changes.
         * This is useful when a field's attributes are updated, like changing its `type`.
         * The page might automatically refocus such a field, but we want to avoid
         * triggering actions on it while it's in an intermediate state. This function
         * blocks actions, removes the field from tracking, and clears its flags. */
        detachField: withContext<(field: HTMLInputElement) => void>((ctx, field) => {
            actionTrap(field);
            formHandle.fields.get(field)?.detach();
            formHandle.fields.delete(field);
            removeClassifierFlags(field, { preserveIgnored: false });

            /* close dropdown if opened & attached to detaching field */
            const dropdownField = ctx?.service.iframe.dropdown?.getCurrentField()?.element;
            if (dropdownField === field) ctx?.service.iframe.dropdown?.close();
        }),

        reconciliate: (formType: FormType, fields: DetectedField[]) => {
            let didChange = formType !== formHandle.formType;
            let hasIdentityFields: boolean = false;

            formHandle.formType = formType;

            /* Detach fields that are no longer present */
            formHandle.getFields().forEach((field) => {
                const shouldDetach = !fields.some((incoming) => field.element === incoming.field);
                if (shouldDetach) {
                    didChange = true;
                    formHandle.detachField(field.element);
                }
            });

            /* Attach new incoming fields, if not already tracked
             * while maintaining the detected fields order */
            const currentFields = formHandle.fields;
            const nextFields = new Map<HTMLInputElement, FieldHandle>();

            fields.forEach(({ field, fieldType }) => {
                const currField = formHandle.fields.get(field);
                didChange = currField === undefined;
                hasIdentityFields = hasIdentityFields || fieldType === FieldType.IDENTITY;

                const handle =
                    currField ??
                    createFieldHandles({
                        element: field,
                        formType,
                        fieldType,
                        zIndex,
                        getFormHandle: () => formHandle,
                    });

                nextFields.set(handle.element, handle);
            });

            formHandle.fields = nextFields;
            currentFields.clear();

            if (hasIdentityFields) {
                /** resolve potential identity sections only if we have identity
                 * fields to process. Avoids unnecessary runs of section detection. */
                resolveIdentitySections(formHandle.getFields()).forEach((section, idx) => {
                    section.fields.forEach(({ field, type }) => {
                        field.sectionIndex = idx;
                        field.identityType = type;
                    });
                });
            }

            /** Reset form tracker state if fields were added or removed. Some
             * forms have appearing fields and may trigge multiple submissions.
             * As such, reset the loading/submitted state everytime a new field
             * appears/disappears (ie: github.com dynamic sign-up page) */
            if (didChange) formHandle.tracker?.reset();
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

    const repositionFields = (reflow: boolean) => {
        formHandle.getFields().forEach((field) => field.action && field.icon?.reposition(reflow));
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
            repositionFields(true);
            const formParent = options.form.parentElement;
            const triggerDetection = formParent === null || hasProcessableFields(formParent);
            if (triggerDetection) void ctx?.service.formManager.detect({ reason: 'NewFormFieldsOnResize' });
        }),
        50
    );

    listeners.addResizeObserver(options.form, onFormResize);
    listeners.addListener(scrollRef, 'scroll', () => repositionFields(false));

    return formHandle;
};
