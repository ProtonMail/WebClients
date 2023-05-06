import { parse } from 'tldts';

import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { fathom } from '@proton/pass/fathom';
import { WorkerMessageType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array';
import { parseFormAction } from '@proton/pass/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener';
import { logger } from '@proton/pass/utils/logger';

import { DETECTED_FORM_ID_ATTR, EMAIL_PROVIDERS } from '../../constants';
import { withContext } from '../../context/context';
import { DropdownAction, FormField, type FormHandle, type FormTracker, FormType } from '../../types';

const { isVisible } = fathom.utils;

export const createFormTracker = (form: FormHandle): FormTracker => {
    logger.debug(`[FormTracker]: Tracking form [${form.formType}:${form.id}]`);
    const context = { isSubmitting: false };

    form.element.setAttribute(DETECTED_FORM_ID_ATTR, form.id);

    const listeners = createListenerStore();

    const submitBtn = first(form.getFieldsFor(FormField.SUBMIT));
    const username = first(form.getFieldsFor(FormField.USERNAME));
    const password = first(form.getFieldsFor(FormField.PASSWORD));

    const getFormData = (): { username?: string; password?: string } => {
        return {
            username: username?.value,
            password: password?.value,
        };
    };

    const onSubmitHandler = withContext(async ({ service: { iframe } }) => {
        iframe.dropdown?.close();

        const { username, password } = getFormData();

        if (!context.isSubmitting && username !== undefined) {
            context.isSubmitting = true;
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

            /**
             * TODO: attach a short-lived mutation observer to
             * detect if the form is still there in order to
             * stash the submission if we can infer a failure
             *
             * TODO: for SPA forms we should also handle the
             * xmlhttprequests intercepted failures here
             */
            setTimeout(() => (context.isSubmitting = false), 500);
        }
    });

    /* Icon injection depends on form type :
     * - LOGIN : match first visible element of interest
     *   in order to support multi-step forms for autofill
     * - REGISTER : match first username & password fields
     *   for auto-suggestion action */
    const setFieldActions = (form: FormHandle): void => {
        form.listFields().forEach((field) => field.detachIcon());

        switch (form.formType) {
            case FormType.LOGIN: {
                const targets = [username, password].filter((field) => field && isVisible(field.element));
                targets.forEach((field) => field?.setAction(DropdownAction.AUTOFILL));
                first(targets)?.attachIcon();

                break;
            }

            case FormType.REGISTER: {
                /* Avoid prompting for alias auto-suggestion
                 * when we match an excluded email provider */
                const exclude = EMAIL_PROVIDERS.includes(parse(window.location.hostname)?.domain ?? '');

                if (!exclude) {
                    username?.setAction(DropdownAction.AUTOSUGGEST_ALIAS);
                    username?.attachIcon();
                }

                password?.setAction(DropdownAction.AUTOSUGGEST_PASSWORD);
                password?.attachIcon();

                break;
            }
        }
    };

    const attach = () => {
        setFieldActions(form);
        username?.attachListeners(onSubmitHandler);
        password?.attachListeners(onSubmitHandler);
        listeners.addListener(form.element, 'submit', onSubmitHandler);
        listeners.addListener(submitBtn?.element, 'click', onSubmitHandler);
    };

    const detach = () => {
        listeners.removeAll();
        form.listFields().forEach((field) => {
            field.detachListeners();
            field.detachIcon();
        });
    };

    return { attach, detach };
};
