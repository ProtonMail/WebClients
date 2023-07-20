import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { FieldType, FormType } from '@proton/pass/fathom';
import { passwordSave } from '@proton/pass/store/actions/creators/pw-history';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import type { WorkerMessageResponse } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { first } from '@proton/pass/utils/array';
import { uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time';

import { withContext } from '../../context/context';
import { type FormHandle, NotificationAction } from '../../types';

export const createAutofillService = () => {
    const setAutofillCount: (count: number) => void = withContext(({ service: { formManager } }, count): void => {
        const loginForms = formManager.getTrackedForms().filter((form) => form.formType === FormType.LOGIN);
        loginForms.forEach((form) => form.getFields().forEach((field) => field.icon?.setCount(count)));
    });

    const getAutofillCandidates = withContext<() => Promise<WorkerMessageResponse<WorkerMessageType.AUTOFILL_QUERY>>>(
        async ({ mainFrame }) => {
            const result = await sendMessage.on(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOFILL_QUERY,
                    payload: { mainFrame },
                }),
                (response) =>
                    response.type === 'success'
                        ? { items: response.items, needsUpgrade: response.needsUpgrade }
                        : { items: [], needsUpgrade: false }
            );

            /* FIXME: sync autofill candidates if dropdown is opened */
            setAutofillCount(result.items.length);

            return result;
        }
    );

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
        first(form.getFieldsFor(FieldType.USERNAME) ?? [])?.autofill(data.username);
        first(form.getFieldsFor(FieldType.EMAIL) ?? [])?.autofill(data.username);
        form.getFieldsFor(FieldType.PASSWORD_CURRENT).forEach((field) => field.autofill(data.password));

        autofillTelemetry();
    };

    const autofillGeneratedPassword = withContext<(form: FormHandle, password: string) => void>(
        ({ getExtensionContext }, form, password) => {
            const { domain, subdomain, hostname } = getExtensionContext().url;

            form.getFieldsFor(FieldType.PASSWORD_NEW).forEach((field) => field.autofill(password));

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
        const otps = form.getFieldsFor(FieldType.OTP);
        if (otps.length === 0) return;

        if (otps.length === 1) otps[0].autofill(code, { paste: false });
        if (otps.length > 1) {
            /* for FF : sanity check in case the paste failed */
            otps[0].autofill(code, { paste: true });
            otps.forEach((otp, i) => {
                const token = code?.[i] ?? '';
                if (!otp.element.value || otp.element.value !== token) otp.autofill(code?.[i] ?? '');
            });
        }

        autofillTelemetry();
    };

    /* The `AUTOFILL_OTP_CHECK` message handler will take care of parsing
     * the current tab's url & check for any tracked form submissions in order
     * to pick the correct login item from which to derive the OTP code */
    const reconciliate = withContext<() => Promise<boolean>>(async ({ service }) => {
        void getAutofillCandidates();

        const otpFieldDetected = service.formManager
            .getTrackedForms()
            .some((form) => form.formType === FormType.MFA && form.getFieldsFor(FieldType.OTP).length > 0);

        if (otpFieldDetected) {
            return sendMessage.on(contentScriptMessage({ type: WorkerMessageType.AUTOFILL_OTP_CHECK }), (res) => {
                if (res.type === 'success' && res.shouldPrompt) {
                    service.iframe.attachNotification();
                    service.iframe.notification?.open({
                        action: NotificationAction.AUTOFILL_OTP_PROMPT,
                        item: { shareId: res.shareId, itemId: res.itemId },
                    });
                    return true;
                }
                return false;
            });
        }

        return false;
    });

    return {
        reconciliate,
        setAutofillCount,
        getAutofillCandidates,
        autofillLogin,
        autofillGeneratedPassword,
        autofillOTP,
    };
};

export type AutofillService = ReturnType<typeof createAutofillService>;
