import { FORM_TRACKER_CONFIG } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { FieldHandle, FormHandle, FormTracker, FormTrackerState } from 'proton-pass-extension/app/content/types';
import { DropdownAction, FieldInjectionRule } from 'proton-pass-extension/app/content/types';
import { actionTrap } from 'proton-pass-extension/app/content/utils/action-trap';
import { validateFormCredentials } from 'proton-pass-extension/lib/utils/form-entry';

import { FieldType, kButtonSubmitSelector } from '@proton/pass/fathom';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import type { AutosaveFormEntry, FormCredentials, MaybeNull } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { parseFormAction } from '@proton/pass/utils/dom/form';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import lastItem from '@proton/utils/lastItem';

type FieldsForFormResults = WeakMap<
    FieldHandle,
    {
        action: MaybeNull<DropdownAction>;
        field: FieldHandle;
        attachIcon: boolean;
    }
>;

/** Heuristic duration after which we reset the internal `isSubmitting` flag. */
const SUBMITTING_RESET_TIMEOUT = 500;

const canProcessAction = withContext<(action: DropdownAction) => boolean>((ctx, action) => {
    const features = ctx?.getFeatures();

    switch (action) {
        case DropdownAction.AUTOFILL:
            return features?.Autofill ?? false;
        case DropdownAction.AUTOSUGGEST_ALIAS:
            return features?.AutosuggestAlias ?? false;
        case DropdownAction.AUTOSUGGEST_PASSWORD:
            return features?.AutosuggestPassword ?? false;
    }
});

export const createFormTracker = (form: FormHandle): FormTracker => {
    logger.debug(`[FormTracker] Tracking form [${form.formType}:${form.id}]`);

    const listeners = createListenerStore();
    const state: FormTrackerState = { isSubmitting: false };

    /** Resolves form data for autosaving purposes, prioritizing usernames over
     * hidden usernames and email fields. Additionally, prioritizes new passwords
     * over current passwords to detect changes */
    const getFormData = (): FormCredentials => {
        const nonEmptyField = (field: FieldHandle) => !isEmptyString(field.value);

        /* Determine the username based on priority: username > hidden username > email */
        const username = first(form.getFieldsFor(FieldType.USERNAME, nonEmptyField));
        const usernameHidden = first(form.getFieldsFor(FieldType.USERNAME_HIDDEN, nonEmptyField));
        const email = first(form.getFieldsFor(FieldType.EMAIL, nonEmptyField));

        /* Determine the password based on priority: new password > current password.
         * We may be dealing with confirmation fields and/or temporary passwords being
         * detected - as a heuristic : always pick the last one. */
        const passwordNew = lastItem(form.getFieldsFor(FieldType.PASSWORD_NEW, nonEmptyField));
        const passwordCurrent = lastItem(form.getFieldsFor(FieldType.PASSWORD_CURRENT, nonEmptyField));

        return {
            username: (username ?? email ?? usernameHidden)?.value ?? '',
            password: (passwordNew ?? passwordCurrent)?.value ?? '',
        };
    };

    /* Exit when there is nothing to stage (eg. MFA and RECOVERY forms).
     * This check is done here instead of not binding the listener in the
     * first place because the `formType` can change for a particular form
     * (eg. re-rendering in SPAs). We validate the form credentials against
     * partial form data in order to support multi-step form staging. */
    const submit = async (): Promise<MaybeNull<AutosaveFormEntry>> => {
        const data = getFormData();
        const valid = validateFormCredentials(data, { type: form.formType, partial: true });

        if (!state.isSubmitting && valid) {
            state.isSubmitting = true;
            const response = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.FORM_ENTRY_STAGE,
                    payload: {
                        type: form.formType,
                        reason: 'FORM_SUBMIT_HANDLER',
                        action: parseFormAction(form.element),
                        data,
                    },
                })
            );

            /* FIXME: Handle intercepted xmlhttprequests failures here */
            setTimeout(() => (state.isSubmitting = false), SUBMITTING_RESET_TIMEOUT);
            return response.type === 'success' ? response.submission : null;
        }

        return null;
    };

    const onSubmitHandler = withContext(async (ctx) => {
        /** Certain websites (ie: login.live.com) will refocus input
         * fields on form submit. This could potentially result in
         * dropdown actions being triggered, so we create a trap */
        form.getFields().forEach(({ element }) => actionTrap(element));

        const dropdown = ctx?.service.iframe.dropdown;
        if (dropdown?.getState().visible) dropdown?.close();

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

    /** Reconciliating the form trackers involves syncing the form's trackable fields.*/
    const reconciliate = withContext<() => Promise<void>>(async (ctx) => {
        if (!ctx) return;

        const { loggedIn } = ctx.getState();
        const fieldsToTrack = getTrackableFields();
        const autofillCount = ctx.service.autofill.getState()?.items.length ?? 0;

        form.getFields().forEach((field) => {
            const match = fieldsToTrack.get(field);
            if (match === undefined) return field.detach();

            field.setAction(match.action);

            /* if the field is not currently tracked, attach listeners */
            if (!field.tracked) field.attach(onSubmitHandler);
            if (!match.attachIcon) return field.detachIcon();

            const icon = field.attachIcon();
            icon?.setCount(loggedIn && match.action === DropdownAction.AUTOFILL ? autofillCount : 0);
        });

        /* trigger auto-focus on current active field if value is empty:
         * This handles autofocused simple forms, and dynamic forms where
         * fields may be added incrementally  */
        form
            .getFields()
            .find((field) => field.element === document.activeElement && !field.value)
            ?.focus();
    });

    /** When detaching the form tracker : remove every listener
     * for both the current tracker and all fields */
    const detach = () => {
        listeners.removeAll();
        form.getFields().forEach((field) => field.detach());
    };

    listeners.addListener(form.element, 'submit', onSubmitHandler);
    form.element.querySelectorAll<HTMLButtonElement>(kButtonSubmitSelector).forEach((button) => {
        listeners.addListener(button, 'click', onSubmitHandler);
    });

    return {
        detach,
        getState: () => state,
        reconciliate,
        submit,
    };
};
