import { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ContentScriptContextFactoryOptions } from 'proton-pass-extension/app/content/context/factory';
import { autofillCCFields } from 'proton-pass-extension/app/content/services/autofill/autofill.cc';
import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { FormHandle } from 'proton-pass-extension/app/content/services/form/form';
import type { FrameMessageHandler } from 'proton-pass-extension/app/content/utils/frame.message-broker';
import { sendContentScriptTelemetry } from 'proton-pass-extension/app/content/utils/telemetry';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { FieldType, FormType } from '@proton/pass/fathom/labels';
import { passwordSave } from '@proton/pass/store/actions/creators/password';
import type { FormCredentials, ItemContent, MaybeNull } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { first } from '@proton/pass/utils/array/first';
import { asyncLock, seq } from '@proton/pass/utils/fp/promises';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { resolveSubdomain } from '@proton/pass/utils/url/utils';
import { omit } from '@proton/shared/lib/helpers/object';
import noop from '@proton/utils/noop';

import { autofillIdentityFields } from './autofill.identity';

type AutofillState = {
    /** Number of autofillable login credentials for the current
     * tab's URL. Null if not yet calculated or invalidated */
    credentialsCount: MaybeNull<number>;
    /** Number of identity items available for autofill */
    identitiesCount: MaybeNull<number>;
    /** Number of CC items available for autofill */
    creditCardsCount: MaybeNull<number>;
};

/** Retrieves and caches the count of an autofill's state key.
 * Uses a cached value if available, otherwise queries the worker. */
const autofillStateCounter = (key: keyof AutofillState, state: AutofillState) =>
    asyncLock(
        async (): Promise<number> =>
            (state[key] =
                state[key] ??
                (await sendMessage.on(
                    contentScriptMessage({
                        type: (
                            {
                                credentialsCount: WorkerMessageType.AUTOFILL_LOGIN_QUERY,
                                identitiesCount: WorkerMessageType.AUTOFILL_IDENTITY_QUERY,
                                creditCardsCount: WorkerMessageType.AUTOFILL_CC_QUERY,
                            } as const
                        )[key],
                        payload: {},
                    }),
                    (res) => (res.type === 'success' ? res.items.length : 0)
                )))
    );

export const createAutofillService = ({ controller }: ContentScriptContextFactoryOptions) => {
    const state: AutofillState = {
        credentialsCount: null,
        identitiesCount: null,
        creditCardsCount: null,
    };

    const getCredentialsCount = autofillStateCounter('credentialsCount', state);
    const getIdentitiesCount = autofillStateCounter('identitiesCount', state);
    const getCreditCardsCount = autofillStateCounter('creditCardsCount', state);

    const autofillLogin = async (form: FormHandle, data: FormCredentials) => {
        await first(form.getFieldsFor(FieldType.USERNAME) ?? [])?.autofill(data.userIdentifier);
        await first(form.getFieldsFor(FieldType.EMAIL) ?? [])?.autofill(data.userIdentifier);
        for (const field of form.getFieldsFor(FieldType.PASSWORD_CURRENT)) await field.autofill(data.password);

        sendContentScriptTelemetry(TelemetryEventName.AutofillTriggered, {}, { location: 'source' });
    };

    const autofillPassword = withContext<(form: FormHandle, password: string) => Promise<void>>(
        async (ctx, form, password) => {
            const url = ctx?.getExtensionContext()?.url;
            if (!url) return;

            for (const field of form.getFieldsFor(FieldType.PASSWORD_NEW)) await field.autofill(password);

            void sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.STORE_DISPATCH,
                    payload: {
                        action: passwordSave({
                            id: uniqueId(),
                            value: password,
                            origin: resolveSubdomain(url),
                            createTime: getEpoch(),
                        }),
                    },
                })
            );
        }
    );

    /** Autofills OTP fields in a form. Uses paste method for multiple fields,
     * individual autofill for single field. Includes fallback logic for paste
     * failures in multi-field scenarios. */
    const autofillOTP = async (form: FormHandle, code: string) => {
        const fields = form.getFieldsFor(FieldType.OTP);
        if (fields.length === 0) return;

        if (fields.length === 1) await fields[0].autofill(code, { paste: false });
        if (fields.length > 1) {
            /* for FF : sanity check in case the paste failed */
            await fields[0].autofill(code, { paste: true });

            /** Map individual field handles to the corresponding char */
            const otpFields = fields.map((field, idx) => [field, code?.[idx] ?? ''] as const);

            for (const [field, value] of otpFields) {
                if (!field.element.value || field.element.value !== value) {
                    await field.autofill(value ?? '');
                }
            }
        }

        sendContentScriptTelemetry(TelemetryEventName.TwoFAAutofill, {}, {});
    };

    /** Clears previously autofilled identity fields when called with a new identity item */
    const autofillIdentity = async (selectedField: FieldHandle, data: ItemContent<'identity'>) => {
        const fields = selectedField.getFormHandle().getFields();

        for (const field of fields) {
            if (
                field.autofilled &&
                field.fieldType === FieldType.IDENTITY &&
                field.sectionIndex === selectedField.sectionIndex
            ) {
                /** If an identity field in the same section was
                 * previously autofilled, clear the previous value. */
                await field.autofill('');
                field.autofilled = null;
            }
        }

        await autofillIdentityFields(fields, selectedField, data);
    };

    /** Checks for OTP fields in tracked forms and prompts for autofill if eligible.
     * Queries the service worker for matching items and opens an `AutofillOTP`
     * notification if appropriate. Returns true if a prompt was shown, false otherwise. */
    const evaluateOTP = withContext<(forms: FormHandle[]) => Promise<boolean>>(async (ctx, forms) => {
        const enabled = Boolean(ctx?.getFeatures().Autofill2FA);
        const hasOTP = enabled && forms.some((form) => form.otp);

        return (
            hasOTP &&
            sendMessage.on(contentScriptMessage({ type: WorkerMessageType.AUTOFILL_OTP_CHECK }), (res) => {
                if (res.type === 'success' && res.shouldPrompt) {
                    ctx?.service.inline.notification.open({
                        action: NotificationAction.OTP,
                        item: omit(res, ['type', 'shouldPrompt']),
                    });
                    return true;
                }

                return false;
            })
        );
    });

    /** Synchronizes login form fields with current credential count.
     * Resets credential and identity counts if forced or user logged out */
    const sync = withContext<(options?: { forceSync: boolean }) => Promise<void>>(async (ctx, options) => {
        if (!ctx) return;

        const authorized = ctx.getState().authorized;

        if (options?.forceSync || !authorized) {
            state.credentialsCount = null;
            state.identitiesCount = null;
            state.creditCardsCount = null;
        }

        const trackedForms = ctx.service.formManager.getTrackedForms();
        const loginForms = trackedForms?.filter((form) => form.formType === FormType.LOGIN) ?? [];
        const identityFields = trackedForms?.some((form) => form.getFieldsFor(FieldType.IDENTITY).length > 0);
        const ccFields = trackedForms?.some((form) => form.getFieldsFor(FieldType.CREDIT_CARD).length > 0);

        const credentialsCount = loginForms.length && authorized ? await getCredentialsCount() : 0;

        trackedForms.forEach((form) => {
            form.getFields().forEach((field) => {
                field.icon?.setStatus(ctx.getState().status);
                if (form.formType === FormType.LOGIN) field.icon?.setCount(credentialsCount);
            });
        });

        if (identityFields && authorized) await getIdentitiesCount();
        if (ccFields && authorized) await getCreditCardsCount();
    });

    const onAutofillRequest: FrameMessageHandler<WorkerMessageType.AUTOFILL_REQUEST> = withContext(
        (ctx, { payload }) => {
            switch (payload.type) {
                case 'creditCard':
                    /** Origin check is enforced service-worker side. */
                    const ccFields = ctx?.service.formManager
                        .getTrackedForms()
                        .map((form) => form.getFieldsFor(FieldType.CREDIT_CARD));

                    if (ccFields) seq(ccFields, (fields) => autofillCCFields(fields, payload.data)).catch(noop);
            }
        }
    );

    const destroy = () => {
        controller.channel.unregister(WorkerMessageType.AUTOFILL_REQUEST, onAutofillRequest);
    };

    controller.channel.register(WorkerMessageType.AUTOFILL_REQUEST, onAutofillRequest);

    return {
        autofillIdentity,
        autofillLogin,
        autofillOTP,
        autofillPassword,
        evaluateOTP,
        getCredentialsCount,
        getCreditCardsCount,
        getIdentitiesCount,
        sync,
        destroy,
    };
};

export type AutofillService = ReturnType<typeof createAutofillService>;
