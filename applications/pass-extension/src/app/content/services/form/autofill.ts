import { withContext } from 'proton-pass-extension/app/content/context/context';
import { type FieldHandle, type FormHandle, NotificationAction } from 'proton-pass-extension/app/content/types';
import { sendTelemetryEvent } from 'proton-pass-extension/app/content/utils/telemetry';

import { FieldType, FormType, isIgnored } from '@proton/pass/fathom';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { passwordSave } from '@proton/pass/store/actions/creators/password';
import type { FormCredentials, ItemContent, MaybeNull } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { first } from '@proton/pass/utils/array/first';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { resolveDomain } from '@proton/pass/utils/url/utils';

import { autofillIdentityFields } from './autofill.identity';

type AutofillState = {
    /** Number of autofillable login credentials for the current
     * tab's URL. Null if not yet calculated or invalidated */
    credentialsCount: MaybeNull<number>;
    /** Number of identity items available for autofill */
    identitiesCount: MaybeNull<number>;
};

export const createAutofillService = () => {
    const state: AutofillState = { credentialsCount: null, identitiesCount: null };

    /** Retrieves and caches the count of login credentials for the
     * current tab's URL. Uses a cached value if available, otherwise
     * queries the worker for an updated count */
    const getCredentialsCount = asyncLock(
        async () =>
            (state.credentialsCount =
                state.credentialsCount ??
                (await sendMessage.on(
                    contentScriptMessage({
                        type: WorkerMessageType.AUTOFILL_LOGIN_QUERY,
                        payload: {},
                    }),
                    (res) => (res.type === 'success' ? res.items.length : 0)
                )))
    );

    const getIdentitiesCount = asyncLock(
        async () =>
            (state.identitiesCount =
                state.identitiesCount ??
                (await sendMessage.on(
                    contentScriptMessage({ type: WorkerMessageType.AUTOFILL_IDENTITY_QUERY }),
                    (res) => (res.type === 'success' ? res.items.length : 0)
                )))
    );

    /** Synchronizes login form fields with current credential count.
     * Resets credential and identity counts if forced or user logged out */
    const sync = withContext<(options?: { forceSync: boolean }) => Promise<void>>(async (ctx, options) => {
        const authorized = ctx?.getState().authorized ?? false;

        if (options?.forceSync || !authorized) {
            state.credentialsCount = null;
            state.identitiesCount = null;
        }

        const trackedForms = ctx?.service.formManager.getTrackedForms();
        const loginForms = trackedForms?.filter((form) => form.formType === FormType.LOGIN) ?? [];
        const identityFields = trackedForms?.some((form) => form.getFieldsFor(FieldType.IDENTITY).length > 0);

        if (loginForms.length) {
            const count = authorized ? await getCredentialsCount() : 0;
            loginForms?.forEach((form) => form.getFields().forEach((field) => field.icon?.setCount(count)));
        }

        if (identityFields && authorized) await getIdentitiesCount();
    });

    const telemetry = (type: '2fa' | 'login') => {
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
        first(form.getFieldsFor(FieldType.USERNAME) ?? [])?.autofill(data.userIdentifier);
        first(form.getFieldsFor(FieldType.EMAIL) ?? [])?.autofill(data.userIdentifier);
        form.getFieldsFor(FieldType.PASSWORD_CURRENT).forEach((field) => field.autofill(data.password));

        telemetry('login');
    };

    const autofillPassword = withContext<(form: FormHandle, password: string) => void>((ctx, form, password) => {
        const url = ctx?.getExtensionContext().url;
        if (!url) return;

        form.getFieldsFor(FieldType.PASSWORD_NEW).forEach((field) => field.autofill(password));

        void sendMessage(
            contentScriptMessage({
                type: WorkerMessageType.STORE_DISPATCH,
                payload: {
                    action: passwordSave({
                        id: uniqueId(),
                        value: password,
                        origin: resolveDomain(url),
                        createTime: getEpoch(),
                    }),
                },
            })
        );
    });

    /** Autofills OTP fields in a form. Uses paste method for multiple fields,
     * individual autofill for single field. Includes fallback logic for paste
     * failures in multi-field scenarios. */
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

        telemetry('2fa');
    };

    /** Clears previously autofilled identity fields when called with a new identity item */
    const autofillIdentity = (selectedField: FieldHandle, data: ItemContent<'identity'>) => {
        const fields = selectedField.getFormHandle().getFields();

        fields.forEach((field) => {
            if (
                field.autofilled &&
                field.fieldType === FieldType.IDENTITY &&
                field.sectionIndex === selectedField.sectionIndex
            ) {
                /** If an identity field in the same section was
                 * previously autofilled, clear the previous value. */
                field.autofill('');
                field.autofilled = null;
            }
        });

        autofillIdentityFields(fields, selectedField, data);
    };

    /** Checks for OTP fields in tracked forms and prompts for autofill
     * if eligible. Queries the service worker for matching items and opens
     * an `AutofillOTP` notification if appropriate.
     * Returns true if a prompt was shown, false otherwise. */
    const promptOTP = withContext<() => Promise<boolean>>(async (ctx) => {
        const otpFieldDetected = ctx?.service.formManager
            .getTrackedForms()
            .some((form) => !isIgnored(form.element) && form.getFieldsFor(FieldType.OTP).length > 0);

        if (!(otpFieldDetected && ctx?.getFeatures().Autofill2FA)) return false;

        return sendMessage.on(contentScriptMessage({ type: WorkerMessageType.AUTOFILL_OTP_CHECK }), (res) => {
            if (res.type === 'success' && res.shouldPrompt) {
                const url = ctx.getExtensionContext().url;
                const hostname = url ? resolveDomain(url) : null;
                if (!hostname) return false;

                ctx?.service.iframe.attachNotification()?.open({
                    action: NotificationAction.OTP,
                    item: { shareId: res.shareId, itemId: res.itemId },
                    hostname,
                });

                return true;
            }
            return false;
        });
    });

    return {
        autofillIdentity,
        autofillLogin,
        autofillOTP,
        autofillPassword,
        getCredentialsCount,
        getIdentitiesCount,
        promptOTP,
        sync,
    };
};

export type AutofillService = ReturnType<typeof createAutofillService>;
