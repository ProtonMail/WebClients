import { withContext } from 'proton-pass-extension/app/content/context/context';
import { DropdownAction, type FormHandle, NotificationAction } from 'proton-pass-extension/app/content/types';
import { sendTelemetryEvent } from 'proton-pass-extension/app/content/utils/telemetry';

import { FieldType, FormType, isIgnored } from '@proton/pass/fathom';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { passwordSave } from '@proton/pass/store/actions/creators/password';
import type { FormCredentials, MaybeNull, WorkerMessageResponse } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import type { AutofillResult } from '@proton/pass/types/worker/autofill';
import { first } from '@proton/pass/utils/array/first';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import noop from '@proton/utils/noop';

type AutofillState = { cache: MaybeNull<AutofillResult> };

export const createAutofillService = () => {
    const state: AutofillState = { cache: null };

    /* on autofill data change : update tracked login field counts &
     * trigger a dropdown sync in order to update the autofill data */
    const onAutofillChange = withContext((ctx) => {
        const dropdown = ctx?.service.iframe.dropdown;
        const trackedForms = ctx?.service.formManager.getTrackedForms();
        const loginForms = trackedForms?.filter((form) => form.formType === FormType.LOGIN);
        const count = state.cache?.items.length ?? 0;

        loginForms?.forEach((form) => form.getFields().forEach((field) => field.icon?.setCount(count)));

        if (dropdown) {
            const { visible, action } = dropdown.getState();
            if (visible && action === DropdownAction.AUTOFILL) void dropdown.sync();
        }
    });

    const sync = (data: MaybeNull<AutofillResult>): void => {
        state.cache = data;
        onAutofillChange();
    };

    const query = asyncLock(async (): Promise<WorkerMessageResponse<WorkerMessageType.AUTOFILL_QUERY>> => {
        if (state.cache) return state.cache;

        const result = await sendMessage.on(
            contentScriptMessage({
                type: WorkerMessageType.AUTOFILL_QUERY,
                payload: {},
            }),
            (response) =>
                response.type === 'success'
                    ? { items: response.items, needsUpgrade: response.needsUpgrade }
                    : { items: [], needsUpgrade: false }
        );

        sync(result);
        return result;
    });

    const autofillTelemetry = (type: '2fa' | 'login') => {
        const event = (() => {
            switch (type) {
                case 'login':
                    return createTelemetryEvent(TelemetryEventName.AutofillTriggered, {}, { location: 'source' });
                case '2fa':
                    return createTelemetryEvent(TelemetryEventName.TwoFAAutofill, {}, {});
            }
        })();

        sendTelemetryEvent(event);
    };

    const autofillLogin = (form: FormHandle, data: FormCredentials) => {
        first(form.getFieldsFor(FieldType.USERNAME) ?? [])?.autofill(data.username);
        first(form.getFieldsFor(FieldType.EMAIL) ?? [])?.autofill(data.username);
        form.getFieldsFor(FieldType.PASSWORD_CURRENT).forEach((field) => field.autofill(data.password));

        autofillTelemetry('login');
    };

    const autofillGeneratedPassword = withContext<(form: FormHandle, password: string) => void>(
        (ctx, form, password) => {
            if (!ctx) return;

            const { domain, subdomain, hostname } = ctx.getExtensionContext().url;
            form.getFieldsFor(FieldType.PASSWORD_NEW).forEach((field) => field.autofill(password));

            void sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.STORE_DISPATCH,
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

        autofillTelemetry('2fa');
    };

    /* The `AUTOFILL_OTP_CHECK` message handler will take care of parsing
     * the current tab's url & check for any tracked form submissions in order
     * to pick the correct login item from which to derive the OTP code */
    const reconciliate = withContext<() => Promise<boolean>>(async (ctx) => {
        query().catch(noop);

        const otpFieldDetected = ctx?.service.formManager
            .getTrackedForms()
            .some(
                (form) =>
                    !isIgnored(form.element) &&
                    form.formType === FormType.MFA &&
                    form.getFieldsFor(FieldType.OTP).length > 0
            );

        if (otpFieldDetected && ctx?.getFeatures().Autofill2FA) {
            const { subdomain, domain } = ctx?.getExtensionContext().url;

            return sendMessage.on(contentScriptMessage({ type: WorkerMessageType.AUTOFILL_OTP_CHECK }), (res) => {
                if (res.type === 'success' && res.shouldPrompt) {
                    ctx?.service.iframe.attachNotification()?.open({
                        action: NotificationAction.OTP,
                        item: { shareId: res.shareId, itemId: res.itemId },
                        hostname: subdomain ?? domain ?? '',
                    });
                    return true;
                }
                return false;
            });
        }

        return false;
    });

    return {
        autofillLogin,
        autofillGeneratedPassword,
        autofillOTP,
        getState: () => state.cache,
        reconciliate,
        reset: () => sync(null),
        sync,
    };
};

export type AutofillService = ReturnType<typeof createAutofillService>;
