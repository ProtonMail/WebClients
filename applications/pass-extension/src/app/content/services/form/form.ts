import { FORM_TRACKER_CONFIG, NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { resolveIdentitySections } from 'proton-pass-extension/app/content/services/autofill/autofill.identity.sections';
import type { DetectedField, DetectedForm } from 'proton-pass-extension/app/content/services/form/detector';
import type { FormTracker } from 'proton-pass-extension/app/content/services/form/form.tracker';
import { createFormTracker } from 'proton-pass-extension/app/content/services/form/form.tracker';
import { actionTrap } from 'proton-pass-extension/app/content/utils/action-trap';
import { canAutosave } from 'proton-pass-extension/app/content/utils/autosave';
import { hasProcessableFields, isActiveElement } from 'proton-pass-extension/app/content/utils/nodes';

import {
    FieldType,
    type FormType,
    buttonSelector,
    isIgnored,
    isVisibleForm,
    removeClassifierFlags,
    shadowPiercingContains,
} from '@proton/pass/fathom';
import type { Maybe } from '@proton/pass/types';
import { isElementBusy, isParentBusy } from '@proton/pass/utils/dom/form';
import { findScrollableParent } from '@proton/pass/utils/dom/scroll';
import { getMaxZIndex } from '@proton/pass/utils/dom/zindex';
import { prop } from '@proton/pass/utils/fp/lens';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import debounce from '@proton/utils/debounce';

import type { FieldElement, FieldHandle } from './field';
import { createFieldHandles } from './field';

export type FormHandlesProps = { zIndex: number };

export interface FormHandle {
    busy: boolean;
    canAutosave: boolean;
    detached: boolean;
    element: HTMLElement;
    fields: Map<FieldElement, FieldHandle>;
    formType: FormType;
    formId: string;
    tracker?: FormTracker;
    detach: () => void;
    detachField: (field: FieldElement) => void;
    getFieldById: (fieldId: string) => Maybe<FieldHandle>;
    getFields: (predicate?: (handle: FieldHandle) => boolean) => FieldHandle[];
    getFieldsFor: (type: FieldType, predicate?: (handle: FieldHandle) => boolean) => FieldHandle[];
    otp: boolean;
    reconciliate: (type: FormType, fields: DetectedField[]) => void;
}

export const createFormHandles = (options: DetectedForm): FormHandle => {
    const { form, formType, fields: detectedFields } = options;
    const listeners = createListenerStore();
    const zIndex = getMaxZIndex(options.fields.map(prop('field'))) + 5;
    const scrollRef = findScrollableParent(form);

    const formHandle: FormHandle = {
        formId: uniqueId(8),
        canAutosave: canAutosave(options.form),
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
            return !shadowPiercingContains(document.body, form) || !isVisibleForm(form, { skipCache: true });
        },

        get otp() {
            return !isIgnored(formHandle.element) && formHandle.getFieldsFor(FieldType.OTP).length > 0;
        },

        getFieldsFor: (type, predicate) => {
            const fields = Array.from(formHandle.fields.values());
            return fields.filter((field) => field.fieldType === type && (predicate?.(field) ?? true));
        },

        getFieldById: (fieldId) => {
            return formHandle.getFields().find((field) => field.fieldId === fieldId);
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
        detachField: withContext((ctx, element) => {
            const field = formHandle.fields.get(element);

            actionTrap(element);
            field?.detach();
            formHandle.fields.delete(element);
            removeClassifierFlags(element, { preserveIgnored: false });

            ctx?.service.inline.dropdown.close(field ? { type: 'field', field } : undefined);
        }),

        reconciliate: withContext((ctx, formType, fields) => {
            /** Attach the form tracker only to the top frame.
             * FIXME: supporting cross-frame autosave */
            if (ctx?.mainFrame && !formHandle.tracker) {
                formHandle.tracker = createFormTracker(formHandle);
                formHandle.tracker.attach();
            }

            let didChange = formType !== formHandle.formType;
            let hasIdentityFields: boolean = false;

            formHandle.formType = formType;
            formHandle.canAutosave = canAutosave(options.form);

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
            const nextFields = new Map<FieldElement, FieldHandle>();

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

            /** Set up the relevant field actions based on `FORM_TRACKER_CONFIG`.
             * If no config is found for the detected field: detach as we're most
             * likely not interested in this specific detected field. */
            nextFields.forEach((field) => {
                const config = FORM_TRACKER_CONFIG[formType].find(({ type }) => type === field.fieldType);
                if (!config) return field.detach();

                const { action, filterable } = config;
                field.setAction(action ? { type: action, filterable } : null);
                field.attach(formHandle.tracker);

                /* Trigger focus on empty active field to open dropdown :
                 * Handles autofocused simple forms and dynamically added fields.
                 * Note: This doesn't trigger a real DOM focus event. */
                if (isActiveElement(field.element) && !field.value) field.focus();
            });
        }),

        detach: withContext((ctx) => {
            logger.debug(`[FormHandles]: Detaching tracker for form [${formType}:${formHandle.formId}]`);
            listeners.removeAll();

            /** If an OTP inline notification had been triggered
             * because of this form, close it when detaching */
            if (formHandle.otp) ctx?.service.inline.notification.close(NotificationAction.OTP);

            formHandle.tracker?.detach();

            formHandle.getFields().forEach((field) => {
                /** FIXME(@ecandon) we should probably emit only one close even */
                ctx?.service.inline.dropdown.close({ type: 'field', field });
                field.detach();
            });

            removeClassifierFlags(form, {
                preserveIgnored: true,
                fields: formHandle.getFields().map(prop('element')),
            });
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
