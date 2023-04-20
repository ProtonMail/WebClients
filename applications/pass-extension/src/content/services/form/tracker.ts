import { parse } from 'tldts';

import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { fathom } from '@proton/pass/fathom';
import { WorkerMessageType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array';
import { parseFormAction } from '@proton/pass/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener';
import { logger } from '@proton/pass/utils/logger';

import { DETECTED_FORM_ID_ATTR, EMAIL_PROVIDERS } from '../../constants';
import CSContext from '../../context';
import { getAllFields } from '../../handles/form';
import { DropdownAction, type FormHandles, type FormTracker, FormType } from '../../types';

const { isVisible } = fathom.utils;

export const createFormTracker = (form: FormHandles): FormTracker => {
    logger.debug(`[FormTracker]: Tracking form [${form.formType}:${form.id}]`);
    const context = { isSubmitting: false };

    form.element.setAttribute(DETECTED_FORM_ID_ATTR, form.id);

    const listeners = createListenerStore();

    const submitBtn = first(form.fields.submit);
    const username = first(form.fields.username);
    const password = first(form.fields.password);

    const getFormData = (): { username?: string; password?: string } => {
        return {
            username: username?.value,
            password: password?.value,
        };
    };

    const onSubmitHandler = async () => {
        CSContext.get().iframes.dropdown.close();
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
                        data: {
                            username,
                            password,
                        },
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
    };

    /**
     * Icon injection depends on form type :
     * - LOGIN : match first visible element of interest
     *   in order to support multi-step forms for autofill
     * - REGISTER : match first username & password fields
     *   for auto-suggestion action
     */
    const injectFieldIcon = (form: FormHandles): void => {
        getAllFields(form).forEach((field) => field.detachIcon());

        switch (form.formType) {
            case FormType.LOGIN: {
                const targets = [form.fields.username, form.fields.password]
                    .flat()
                    .filter(({ element }) => isVisible(element));
                first(targets)?.attachIcon(DropdownAction.AUTOFILL);
                break;
            }

            case FormType.REGISTER: {
                /**
                 * Avoid prompting for alias auto-suggestion
                 * when we match an excluded email provider
                 */
                const exclude = EMAIL_PROVIDERS.includes(parse(window.location.hostname)?.domain ?? '');
                first(exclude ? [] : form.fields.username)?.attachIcon(DropdownAction.AUTOSUGGEST_ALIAS);
                first(form.fields.password)?.attachIcon(DropdownAction.AUTOSUGGEST_PASSWORD);
                break;
            }
        }
    };

    const attach = () => {
        username?.attachListeners(onSubmitHandler);
        password?.attachListeners(onSubmitHandler);
        listeners.addListener(form.element, 'submit', onSubmitHandler);
        listeners.addListener(submitBtn?.element, 'click', onSubmitHandler);
        injectFieldIcon(form);
    };

    const detach = () => {
        listeners.removeAll();
        getAllFields(form).forEach((field) => {
            field.detachListeners();
            field.detachIcon();
        });
    };

    return { attach, detach };
};
