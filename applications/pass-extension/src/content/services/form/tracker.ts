import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { fathom } from '@proton/pass/fathom';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array';
import { parseFormAction } from '@proton/pass/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener';
import { logger } from '@proton/pass/utils/logger';
import { parseUrl } from '@proton/pass/utils/url';

import { DETECTED_FORM_ID_ATTR, EMAIL_PROVIDERS } from '../../constants';
import { withContext } from '../../context/context';
import type { FieldHandle, FormHandle, FormTracker } from '../../types';
import { DropdownAction, FormField, FormType } from '../../types';

const { isVisible } = fathom.utils;

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

type FormTrackerState = { isSubmitting: boolean };
type FieldsForFormResults = WeakMap<
    FieldHandle,
    {
        action: MaybeNull<DropdownAction>;
        field: FieldHandle;
        attachIcon: boolean;
    }
>;

export const createFormTracker = (form: FormHandle): FormTracker => {
    logger.debug(`[FormTracker]: Tracking form [${form.formType}:${form.id}]`);

    const listeners = createListenerStore();
    const state: FormTrackerState = { isSubmitting: false };

    form.element.setAttribute(DETECTED_FORM_ID_ATTR, form.id);

    /* FIXME: should account for hidden fields */
    const getFormData = (): { username?: string; password?: string } => ({
        username: first(form.getFieldsFor(FormField.USERNAME))?.value,
        password: first(form.getFieldsFor(FormField.PASSWORD))?.value,
    });

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

    /* Icon injection depends on form type :
     * - LOGIN : match first visible element of interest
     *   in order to support multi-step forms for autofill
     * - REGISTER : match first username & password fields
     *   for auto-suggestion action */
    const getTrackableFields = (settings: ProxiedSettings): FieldsForFormResults => {
        const results: FieldsForFormResults = new WeakMap();

        const username = first(form.getFieldsFor(FormField.USERNAME));
        const password = first(form.getFieldsFor(FormField.PASSWORD));

        switch (form.formType) {
            case FormType.LOGIN: {
                const action = withAction(DropdownAction.AUTOFILL, settings);

                if (username) {
                    results.set(username, {
                        action,
                        field: username,
                        attachIcon: action !== null && isVisible(username.element),
                    });
                }

                if (password) {
                    const usernameAttached = Boolean(username && results.get(username)?.attachIcon);
                    results.set(password, {
                        action: withAction(DropdownAction.AUTOFILL, settings),
                        field: password,
                        attachIcon: action !== null && !usernameAttached && isVisible(password.element),
                    });
                }
                break;
            }

            case FormType.REGISTER: {
                const exclude = EMAIL_PROVIDERS.includes(parseUrl(window.location.hostname)?.domain ?? '');

                if (!exclude && username) {
                    results.set(username, {
                        action: withAction(DropdownAction.AUTOSUGGEST_ALIAS, settings),
                        field: username,
                        attachIcon: isVisible(username.element),
                    });
                }

                if (password) {
                    results.set(password, {
                        action: withAction(DropdownAction.AUTOSUGGEST_PASSWORD, settings),
                        field: password,
                        attachIcon: isVisible(password.element),
                    });
                }
                break;
            }
        }

        return results;
    };

    const attach = withContext(({ getSettings, getState }) => {
        const { loggedIn, status } = getState();
        const settings = getSettings();
        const fieldsToTrack = getTrackableFields(settings);

        form.listFields().forEach((field) => {
            const match = fieldsToTrack.get(field);

            if (match === undefined) {
                field.detachListeners();
                field.detachIcon();
                return;
            }

            field.setAction(match.action);

            if (match.attachIcon) {
                const icon = field.attachIcon();
                icon.setStatus(status);
                if (!loggedIn) icon.setCount(0);
            } else field.detachIcon();

            match.field.attachListeners(onSubmitHandler);
        });

        /* setup listener for form submission */
        const submitBtn = first(form.getFieldsFor(FormField.SUBMIT));
        listeners.addListener(form.element, 'submit', onSubmitHandler);
        listeners.addListener(submitBtn?.element, 'click', onSubmitHandler);
    });

    /* when detaching the form tracker : remove every listener
     * for both the current tracker and all fields*/
    const detach = () => {
        listeners.removeAll();

        form.listFields().forEach((field) => {
            field.detachIcon();
            field.detachListeners();
        });
    };

    const autofocus = () => {
        form.listFields().forEach((field) => {
            /* if the field is already focused by the browser we need
             * to re-dispatch the event on the input element */
            if (field.element === document.activeElement) {
                const focusEvent = new FocusEvent('focus', { bubbles: true, cancelable: true, relatedTarget: null });
                field.element.dispatchEvent(focusEvent);
            }
        });
    };

    return { attach, detach, autofocus };
};
