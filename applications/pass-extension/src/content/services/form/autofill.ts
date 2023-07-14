import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { passwordSave } from '@proton/pass/store/actions/creators/pw-history';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import type { WorkerMessageResponse } from '@proton/pass/types';
import { FormField, FormType, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { first } from '@proton/pass/utils/array';
import { uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time';

import { withContext } from '../../context/context';
import type { FormHandle } from '../../types';

export const createAutofillService = () => {
    const queryItems: () => Promise<WorkerMessageResponse<WorkerMessageType.AUTOFILL_QUERY>> = withContext(
        async ({ mainFrame }) =>
            sendMessage.on(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOFILL_QUERY,
                    payload: { mainFrame },
                }),
                (response) =>
                    response.type === 'success'
                        ? { items: response.items, needsUpgrade: response.needsUpgrade }
                        : { items: [], needsUpgrade: false }
            )
    );

    const setAutofillCount: (count: number) => void = withContext(({ service: { formManager } }, count): void => {
        const loginForms = formManager.getTrackedForms().filter((form) => form.formType === FormType.LOGIN);
        loginForms.forEach((form) => form.getFields().forEach((field) => field.icon?.setCount(count)));
    });

    const syncAutofillCandidates = async () => {
        /* FIXME: sync autofill candidates if dropdown is opened */
        const result = await queryItems();
        setAutofillCount(result.items.length);

        return result;
    };

    const autofillTelemetry = () => {
        void sendMessage(
            contentScriptMessage({
                type: WorkerMessageType.TELEMETRY_EVENT,
                payload: {
                    event: createTelemetryEvent(TelemetryEventName.AutofillTriggered, {}, { location: 'source' }),
                },
            })
        );
    };

    const autofillLogin = (form: FormHandle, data: { username: string; password: string }) => {
        first(form.getFieldsFor(FormField.USERNAME) ?? [])?.autofill(data.username);
        first(form.getFieldsFor(FormField.EMAIL) ?? [])?.autofill(data.username);
        form.getFieldsFor(FormField.PASSWORD_CURRENT).forEach((field) => field.autofill(data.password));

        autofillTelemetry();
    };

    const autofillGeneratedPassword = withContext<(form: FormHandle, password: string) => void>(
        ({ getExtensionContext }, form, password) => {
            const { domain, subdomain, hostname } = getExtensionContext().url;

            form.getFieldsFor(FormField.PASSWORD_NEW).forEach((field) => field.autofill(password));

            void sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.STORE_ACTION,
                    payload: {
                        action: passwordSave({
                            id: uniqueId(),
                            value: password,
                            origin: subdomain ?? domain ?? hostname,
                            createTime: getEpoch(),
                        }),
                    },
                })
            );
        }
    );

    /* if we have multiple OTP fields then we're dealing
     * with an OTP code field spread out into multiple text
     * inputs : in this case, prefer a "paste autofill" */
    const autofillOTP = (form: FormHandle, code: string) => {
        const otps = form.getFieldsFor(FormField.OTP);
        otps?.[0]?.autofill(code, { paste: otps.length > 1 });

        autofillTelemetry();
    };

    return {
        setAutofillCount,
        syncAutofillCandidates,
        autofillLogin,
        autofillOTP,
        autofillGeneratedPassword,
    };
};

export type AutofillService = ReturnType<typeof createAutofillService>;
