import { FORM_TRACKER_CONFIG } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type {
    FieldHandle,
    FormHandle,
    FormTracker,
    FormTrackerState,
    FormTrackerSyncOptions,
} from 'proton-pass-extension/app/content/types';
import { DropdownAction } from 'proton-pass-extension/app/content/types';
import { actionTrap } from 'proton-pass-extension/app/content/utils/action-trap';
import { stage, stash, validateFormCredentials } from 'proton-pass-extension/lib/utils/form-entry';

import { FieldType, kButtonSubmitSelector } from '@proton/pass/fathom';
import browser from '@proton/pass/lib/globals/browser';
import type { AutosaveFormEntry, FormCredentials, MaybeNull, WorkerMessageWithSender } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { parseFormAction } from '@proton/pass/utils/dom/form';
import { asyncQueue } from '@proton/pass/utils/fp/promises';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import lastItem from '@proton/utils/lastItem';
import noop from '@proton/utils/noop';

/** Idle timeout check after a submit: this timeout is used
 * to identify a failed submission when we cannot determine it
 * through request interception or by the form not being removed */
const IDLE_TIMEOUT = 5_000;

/** The minimum time allowed between a submit action and detaching
 * the form to consider it a valid submit. Otherwise, it's stashed */
const SUBMIT_DETACH_TIMEOUT = 250;

/** Timeout after which a submitted form is considered processed.
 * This prevents reconciliation when submission triggers DOM changes,
 * which might lead to premature stashing */
const SUBMIT_TIMEOUT = 1_000;

export const createFormTracker = (form: FormHandle): FormTracker => {
    const { tagName } = form.element;
    const listeners = createListenerStore();

    const state: FormTrackerState = {
        error: false,
        processing: false,
        submitted: false,
        detached: false,
    };

    logger.debug(`[FormTracker] Tracking form [${tagName}:${form.formType}:${form.id}]`);

    const clearIdleTimer = () => {
        clearTimeout(state.timerIdle);
        delete state.timerIdle;
    };

    const clearSubmitTimer = () => {
        clearTimeout(state.timerSubmit);
        delete state.timerSubmit;
    };

    const reset = () => {
        logger.debug(`[FormTracker] Resetting state [formId:${form.id}]`);
        clearIdleTimer();
        clearSubmitTimer();
        state.submitted = false;
        state.processing = false;
        state.error = false;
        delete state.submittedAt;
    };

    const canProcessAction = withContext<(action: DropdownAction) => boolean>((ctx, action) => {
        const features = ctx?.getFeatures();
        const settings = ctx?.getSettings();

        switch (action) {
            case DropdownAction.AUTOFILL_LOGIN:
                return features?.Autofill ?? false;
            case DropdownAction.AUTOFILL_IDENTITY:
                return (features?.Autofill && settings?.autofill.identity) ?? false;
            case DropdownAction.AUTOSUGGEST_ALIAS:
                return features?.AutosuggestAlias ?? false;
            case DropdownAction.AUTOSUGGEST_PASSWORD:
                return features?.AutosuggestPassword ?? false;
        }
    });

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
            userIdentifier: (username ?? email ?? usernameHidden)?.value ?? '',
            password: (passwordNew ?? passwordCurrent)?.value ?? '',
        };
    };

    /** Observes if a form is idle in which case we should
     * reconciliate the autosave service if we failed to infer
     * a form submission failure. We should also check for form
     * interaction */
    const observeIdle = (onIdle: () => void) => {
        clearIdleTimer();

        state.timerIdle = setTimeout(() => {
            clearIdleTimer();
            if (state.processing || form.busy || form.detached) return;
            logger.debug(`[FormTracker] Idle reconciliation [formId:${form.id}]`);
            onIdle();
        }, IDLE_TIMEOUT);
    };

    /* Exit when there is nothing to stage (eg. MFA and RECOVERY forms).
     * This check is done here instead of not binding the listener in the
     * first place because the `formType` can change for a particular form
     * (eg. re-rendering in SPAs). We validate the form credentials against
     * partial form data in order to support multi-step form staging. */
    const sync = asyncQueue(async (options: FormTrackerSyncOptions): Promise<MaybeNull<AutosaveFormEntry>> => {
        const data = options.data ?? getFormData();
        const valid = validateFormCredentials(data, { type: form.formType, partial: options.partial });
        if (options.reset) reset();

        if (state.interactionAt && !state.processing && valid) {
            logger.debug(`[FormTracker] Syncing submission [formId:${form.id}|submit:${options.submit}]`);

            const response = await stage({
                action: parseFormAction(form.element),
                data,
                reason: `FORM_TRACKER[submit=${options.submit}]`,
                submit: options.submit,
                type: form.formType,
                formId: form.id,
            });

            if (options.submit && !state.detached) {
                state.processing = true;
                state.submittedAt = Date.now();

                clearIdleTimer();
                clearSubmitTimer();

                state.timerSubmit = setTimeout(() => {
                    logger.debug(`[FormTracker] Submit timeout [formId:${form.id}]`);
                    delete state.timerSubmit;
                    state.processing = false;
                    state.submitted = true;
                    state.error = false;
                    observeIdle(() => sync({ submit: false, partial: true, reset: true }));
                }, SUBMIT_TIMEOUT);
            }

            return response.type === 'success' ? response.submission : null;
        }

        return null;
    });

    /** If we detect an interaction while there is an idle timer
     * ongoing: cancel it and sync the form submission to flag
     * it as non-submitted */
    const onChange = () => {
        state.interactionAt = Date.now();
        state.processing = false;

        if (state.timerIdle) {
            logger.debug(`[FormTracker] Detected interaction while idle [formId:${form.id}]`);
            void sync({ submit: false, partial: true, reset: true });
        }
    };

    const onSubmit = withContext(async (ctx) => {
        state.submittedAt = Date.now();
        state.interactionAt = Date.now();

        /** Certain websites (ie: login.live.com) will refocus input
         * fields on form submit. This could potentially result in
         * dropdown actions being triggered, so we create a trap */
        form.getFields().forEach(({ element }) => actionTrap(element));

        const dropdown = ctx?.service.iframe.dropdown;
        if (dropdown?.getState().visible) dropdown?.close();
        await sync({ partial: true, submit: true });
    });

    /** Reconciles form trackers by syncing trackable fields, attaching
     * listeners, and managing icons. Triggers autofill syncing and
     * handles auto-focus for empty active fields. Attaches listeners
     * only if a field is not currently tracked during reconciliation. */
    const reconciliate = withContext<() => void>((ctx) => {
        if (!ctx) return;

        form.getFields().forEach((field) => {
            const config = FORM_TRACKER_CONFIG[form.formType].find(({ type }) => type === field.fieldType);
            if (!config) return field.detach();

            const { action, filterable } = config;
            field.setAction(action && canProcessAction(action) ? { type: action, filterable } : null);
            if (!field.tracked) field.attach({ onChange, onSubmit });
        });

        /* Trigger focus on empty active field to open dropdown :
         * Handles autofocused simple forms and dynamically added fields.
         * Note: This doesn't trigger a real DOM focus event. */
        form
            .getFields()
            .find((field) => field.element === document.activeElement && !field.value)
            ?.focus();
    });

    const onTabMessage = async (message: WorkerMessageWithSender) => {
        if (message?.sender === 'background' && message.type === WorkerMessageType.FORM_STATUS) {
            const { formId, status } = message.payload;

            if (formId === form.id) {
                switch (status) {
                    case 'loading':
                        logger.debug(`[Autosave] Form loading detected [formId:${formId}]`);
                        state.processing = true;
                        state.submitted = false;
                        state.error = false;
                        clearSubmitTimer();
                        clearIdleTimer();
                        break;
                    case 'submitted':
                        logger.debug(`[Autosave] Form submit detected [formId:${formId}]`);
                        state.processing = false;
                        state.submitted = true;

                        if (state.error) {
                            void stash('XMLHTTP_ERROR');
                            reset();
                        } else observeIdle(() => sync({ submit: false, partial: true, reset: true }));

                        break;
                    case 'error':
                        logger.debug(`[Autosave] Form error detected [formId:${formId}]`);
                        state.error = true;
                        break;
                }
            }
        }
    };

    /** When detaching the form tracker: remove every listener
     * for both the current tracker and all fields. Try to infer whether
     * we should consider this detach as a valid form submit. Since we're
     * wrapping the submission inference in a `requestAnimationFrame` in order
     * to avoid conflicts with ongoing DOM removal animations, extract the
     * form data before the fields are detached */
    const detach = () => {
        const formEl = form.element;
        const fields = form.getFields();
        const data = getFormData();

        state.detached = true;
        state.processing = false;

        listeners.removeAll();
        clearIdleTimer();
        clearSubmitTimer();
        form.getFields().forEach((field) => field.detach());
        browser.runtime.onMessage.removeListener(onTabMessage);

        requestAnimationFrame(() => {
            /** * If the form was not interacted with, then detaching the tracker
             * should have no effect and avoid inferring a submission completely */
            if (!state.interactionAt || state.error) return;

            /** The form may have been detached because of a visibility change
             * rather than a complete DOM removal. In order to consider a detach as
             * an inferred submission, we need to ensure it wasn't discarded due to a
             * form being removed from the DOM prematurely - this can happen when
             * misdetecting a `cancel` button click as a submit event.*/
            const domAttached = document.contains(formEl) && fields.some(({ element }) => document.contains(element));
            const invalidSubmit = !state.submittedAt || Date.now() - state.submittedAt < SUBMIT_DETACH_TIMEOUT;
            const invalidate = !domAttached && invalidSubmit;

            if (!invalidate) sync({ submit: true, partial: true, data }).catch(noop);
        });
    };

    /** In certain cases we may only be able to infer submission from a
     * `beforeunload` event on a busy form. This can happen for websites
     * not following the HTML Form specification (ie: account.google.com) */
    listeners.addListener(window, 'beforeunload', () => form.busy && onSubmit());
    listeners.addListener(form.element, 'submit', onSubmit);
    browser.runtime.onMessage.addListener(onTabMessage);

    form.element
        .querySelectorAll<HTMLButtonElement>(kButtonSubmitSelector)
        .forEach((button) => listeners.addListener(button, 'click', onSubmit));

    return { detach, getState: () => state, reconciliate, reset, sync };
};
