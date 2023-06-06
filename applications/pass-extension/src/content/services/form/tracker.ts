import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { FormField, FormType, type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array';
import { parseFormAction } from '@proton/pass/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener';
import { logger } from '@proton/pass/utils/logger';
import { isEmptyString } from '@proton/pass/utils/string';
import debounce from '@proton/utils/debounce';
import lastItem from '@proton/utils/lastItem';

import { FORM_TRACKER_CONFIG } from '../../constants';
import { withContext } from '../../context/context';
import type { FieldHandle, FormHandle, FormTracker } from '../../types';
import { DropdownAction, FieldInjectionRule } from '../../types';

type FormTrackerState = { isSubmitting: boolean };

type FieldsForFormResults = WeakMap<
    FieldHandle,
    {
        action: MaybeNull<DropdownAction>;
        field: FieldHandle;
        attachIcon: boolean;
    }
>;

const canProcessAction = (action: DropdownAction, settings: ProxiedSettings): boolean => {
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

const withAction = (action: DropdownAction, settings: ProxiedSettings): MaybeNull<DropdownAction> =>
    canProcessAction(action, settings) ? action : null;

export const createFormTracker = (form: FormHandle): FormTracker => {
    logger.debug(`[FormTracker] Tracking form [${form.formType}:${form.id}]`);

    const listeners = createListenerStore();
    const state: FormTrackerState = { isSubmitting: false };

    /* when the type attribute of a field changes : detach it from
     * the tracked form and re-trigger the detection */
    const onFieldAttributeChange = withContext<MutationCallback>(
        ({ service: { formManager } }, mutations: MutationRecord[]) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && (mutation.target as HTMLElement).tagName === 'INPUT') {
                    form.detachField(mutation.target as HTMLInputElement);
                    void formManager.detect('FieldTypeChange');
                }
            });
        }
    );

    /* FIXME: should account for hidden fields - should also
     * account for different form types for more control */
    const getFormData = (): { username?: string; password?: string } => {
        const nonEmptyField = (field: FieldHandle) => !isEmptyString(field.value);

        /* in the case of username or email fields : we always consider the
         * first non-empty field as the final `username` candidate */
        const username = first(form.getFieldsFor(FormField.USERNAME, nonEmptyField));
        const usernameHidden = first(form.getFieldsFor(FormField.USERNAME_HIDDEN, nonEmptyField));
        const email = first(form.getFieldsFor(FormField.EMAIL, nonEmptyField));

        /* in the case of passwords : we may be dealing with confirmation
         * cases and/or  temporary passwords being detected - as a heuristic :
         * always choose the last one.*/
        const passwordNew = lastItem(form.getFieldsFor(FormField.PASSWORD_NEW, nonEmptyField));
        const passwordCurrent = lastItem(form.getFieldsFor(FormField.PASSWORD_CURRENT, nonEmptyField));

        return {
            username: (username ?? email ?? usernameHidden)?.value,
            password: (passwordNew ?? passwordCurrent)?.value,
        };
    };

    const onSubmitHandler = withContext(async ({ service: { iframe } }) => {
        iframe.dropdown?.close();

        const { username, password } = getFormData();

        if (!state.isSubmitting && username !== undefined) {
            state.isSubmitting = true;
            await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.FORM_ENTRY_STAGE,
                    payload: {
                        type: form.formType,
                        reason: 'FORM_SUBMIT_HANDLER',
                        action: parseFormAction(form.element),
                        data: { username, password },
                    },
                })
            );

            /* TODO: attach a short-lived mutation observer to
             * detect if the form is still there in order to
             * stash the submission if we can infer a failure
             * TODO: for SPA forms we should also handle the
             * xmlhttprequests intercepted failures here */
            setTimeout(() => (state.isSubmitting = false), 500);
        }
    });

    const getTrackableFields = (settings: ProxiedSettings): FieldsForFormResults => {
        const results: FieldsForFormResults = new WeakMap();
        const status = { injections: new Map<FormField, boolean>(), injected: false };

        FORM_TRACKER_CONFIG[form.formType].forEach(({ type, injection, action }) => {
            form.getFieldsFor(type).forEach((field) => {
                let attachIcon = false;

                switch (injection) {
                    case FieldInjectionRule.NEVER:
                        break;
                    case FieldInjectionRule.ALWAYS:
                        attachIcon = true;
                        break;
                    /* inject only if no previous injections */
                    case FieldInjectionRule.FIRST_OF_FORM:
                        attachIcon = !status.injected;
                        break;
                    /* inject only if no other field of type attached */
                    case FieldInjectionRule.FIRST_OF_TYPE:
                        attachIcon = !status.injections.get(type);
                        break;
                }

                status.injections.set(type, status.injections.get(type) || attachIcon);
                status.injected = status.injected || attachIcon;

                results.set(field, {
                    field,
                    action: action ? withAction(action, settings) : null,
                    attachIcon,
                });
            });
        });

        return results;
    };

    /* reconciliating the form trackers involves syncing
     * the form's trackable fields.*/
    const reconciliate = withContext(({ getSettings, getState }) => {
        const { loggedIn, status } = getState();
        const settings = getSettings();
        const fieldsToTrack = getTrackableFields(settings);

        form.getFields().forEach((field) => {
            const match = fieldsToTrack.get(field);
            if (match === undefined) return field.detach();

            field.setAction(match.action);

            /* if the field is not currently tracked, attach listeners */
            if (!field.tracked) field.attach(onSubmitHandler);
            if (!match.attachIcon) return field.detachIcon();

            const icon = field.attachIcon();
            icon.setStatus(status);
            if (!loggedIn) icon.setCount(0);
        });

        form.getFields()
            .find((field) => field.element === document.activeElement)
            ?.focus();
    });

    const onFormResize = () => {
        const fields = form.getFields();
        fields.forEach((field) => field.icon?.reposition());
    };

    /* when detaching the form tracker : remove every listener
     * for both the current tracker and all fields*/
    const detach = () => {
        listeners.removeAll();
        form.getFields().forEach((field) => field.detach());
    };

    listeners.addObserver(form.element, onFieldAttributeChange, {
        attributeFilter: ['type'],
        childList: true,
        subtree: true,
    });

    listeners.addResizeObserver(form.element, debounce(onFormResize, 50, { leading: true }));

    if (form.formType !== FormType.NOOP) listeners.addListener(form.element, 'submit', onSubmitHandler);

    return { detach, reconciliate };
};
