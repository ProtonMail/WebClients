import { FORM_TRACKER_CONFIG } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { FieldHandle, FormHandle, FormTracker } from 'proton-pass-extension/app/content/types';
import { DropdownAction, FieldInjectionRule } from 'proton-pass-extension/app/content/types';

import { FieldType, FormType } from '@proton/pass/fathom';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { parseFormAction } from '@proton/pass/utils/dom/form';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import lastItem from '@proton/utils/lastItem';

type FormTrackerState = { isSubmitting: boolean };

type FieldsForFormResults = WeakMap<
    FieldHandle,
    {
        action: MaybeNull<DropdownAction>;
        field: FieldHandle;
        attachIcon: boolean;
    }
>;

const canProcessAction = withContext<(action: DropdownAction) => boolean>(({ getFeatures }, action) => {
    const features = getFeatures();

    switch (action) {
        case DropdownAction.AUTOFILL:
            return features.Autofill;
        case DropdownAction.AUTOSUGGEST_ALIAS:
            return features.AutosuggestAlias;
        case DropdownAction.AUTOSUGGEST_PASSWORD:
            return features.AutosuggestPassword;
    }
});

export const createFormTracker = (form: FormHandle): FormTracker => {
    logger.debug(`[FormTracker] Tracking form [${form.formType}:${form.id}]`);

    const listeners = createListenerStore();
    const state: FormTrackerState = { isSubmitting: false };

    /* FIXME: should account for hidden fields - should also
     * account for different form types for more control */
    const getFormData = (): { username?: string; password?: string } => {
        const nonEmptyField = (field: FieldHandle) => !isEmptyString(field.value);

        /* in the case of username or email fields : we always consider the
         * first non-empty field as the final `username` candidate */
        const username = first(form.getFieldsFor(FieldType.USERNAME, nonEmptyField));
        const usernameHidden = first(form.getFieldsFor(FieldType.USERNAME_HIDDEN, nonEmptyField));
        const email = first(form.getFieldsFor(FieldType.EMAIL, nonEmptyField));

        /* in the case of passwords : we may be dealing with confirmation
         * cases and/or  temporary passwords being detected - as a heuristic :
         * always choose the last one.*/
        const passwordNew = lastItem(form.getFieldsFor(FieldType.PASSWORD_NEW, nonEmptyField));
        const passwordCurrent = lastItem(form.getFieldsFor(FieldType.PASSWORD_CURRENT, nonEmptyField));

        return {
            username: (username ?? email ?? usernameHidden)?.value,
            password: (passwordNew ?? passwordCurrent)?.value,
        };
    };

    const submit = async () => {
        /* Exit early when there is nothing to stage (eg. MFA and NOOP forms).
         * This check is done here instead of not binding the listener in the
         * first place because the `formType` can change for a particular form
         * (eg. rerendering in SPAs). */
        if ([FormType.MFA, FormType.NOOP].includes(form.formType)) return;

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
    };

    const onSubmitHandler = withContext(async ({ service: { iframe } }) => {
        iframe.dropdown?.close();
        await submit();
    });

    const getTrackableFields = (): FieldsForFormResults => {
        const results: FieldsForFormResults = new WeakMap();
        const status = { injections: new Map<FieldType, boolean>(), injected: false };

        FORM_TRACKER_CONFIG[form.formType].forEach(({ type, injection, action: fieldAction }) => {
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

                const action = fieldAction && canProcessAction(fieldAction) ? fieldAction : null;
                results.set(field, { field, action, attachIcon: action !== null && attachIcon });
            });
        });

        return results;
    };

    /* reconciliating the form trackers involves syncing
     * the form's trackable fields.*/
    const reconciliate = withContext<() => Promise<void>>(async ({ getState, service }) => {
        const { loggedIn } = getState();
        const fieldsToTrack = getTrackableFields();
        const autofillCount = service.autofill.getState()?.items.length ?? 0;

        form.getFields().forEach((field) => {
            const match = fieldsToTrack.get(field);
            if (match === undefined) return field.detach();

            field.setAction(match.action);

            /* if the field is not currently tracked, attach listeners */
            if (!field.tracked) field.attach(onSubmitHandler);
            if (!match.attachIcon) return field.detachIcon();

            const icon = field.attachIcon();
            icon.setCount(loggedIn && match.action === DropdownAction.AUTOFILL ? autofillCount : 0);
        });

        /* trigger auto-focus on current active field if value is empty:
         * This handles autofocused simple forms, and dynamic forms where
         * fields may be added incrementally  */
        form
            .getFields()
            .find((field) => field.element === document.activeElement && !field.value)
            ?.focus();
    });

    /* when detaching the form tracker : remove every listener
     * for both the current tracker and all fields*/
    const detach = () => {
        listeners.removeAll();
        form.getFields().forEach((field) => field.detach());
    };

    listeners.addListener(form.element, 'submit', onSubmitHandler);

    return { detach, reconciliate, submit };
};
