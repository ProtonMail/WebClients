import { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ContentScriptContextFactoryOptions } from 'proton-pass-extension/app/content/context/factory';
import { autofillCCFields } from 'proton-pass-extension/app/content/services/autofill/autofill.cc';
import type { FrameMessageHandler } from 'proton-pass-extension/app/content/services/client/client.channel';
import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { FormHandle } from 'proton-pass-extension/app/content/services/form/form';
import { sendContentScriptTelemetry } from 'proton-pass-extension/app/content/utils/telemetry';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import type { AutofillRequest, AutofillResult } from 'proton-pass-extension/types/autofill';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { FieldType, FormType } from '@proton/pass/fathom/labels';
import { passwordSave } from '@proton/pass/store/actions/creators/password';
import type { AsyncCallback, FormCredentials, ItemContent, MaybeNull } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { first } from '@proton/pass/utils/array/first';
import { asyncLock, seq } from '@proton/pass/utils/fp/promises';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { nextTick, onNextTick } from '@proton/pass/utils/time/next-tick';
import { resolveSubdomain } from '@proton/pass/utils/url/utils';
import { omit } from '@proton/shared/lib/helpers/object';

import { autofillIdentityFields } from './autofill.identity';

type AutofillCounters = {
    /** Number of autofillable login credentials for the current
     * tab's URL. Null if not yet calculated or invalidated */
    credentials: MaybeNull<number>;
    /** Number of identity items available for autofill */
    identities: MaybeNull<number>;
    /** Number of CC items available for autofill */
    creditCards: MaybeNull<number>;
};

type AutofillState = {
    /** Ongoing autofill request potentially across multiple frames.
     * This allows trapping interactions during an autofill sequence
     * for UX purposes (field switching during autofill) and allowing
     * proper refocusing behaviour when sequence finishes. */
    processing: boolean;
};

/** Retrieves and caches the count of an autofill's state key.
 * Uses a cached value if available, otherwise queries the worker. */
const autofillCounter = (key: keyof AutofillCounters, state: AutofillCounters) =>
    asyncLock(
        async (): Promise<number> =>
            (state[key] =
                state[key] ??
                (await sendMessage.on(
                    contentScriptMessage({
                        type: (
                            {
                                credentials: WorkerMessageType.AUTOFILL_LOGIN_QUERY,
                                identities: WorkerMessageType.AUTOFILL_IDENTITY_QUERY,
                                creditCards: WorkerMessageType.AUTOFILL_CC_QUERY,
                            } as const
                        )[key],
                        payload: {},
                    }),
                    (res) => (res.type === 'success' ? res.items.length : 0)
                )))
    );

/** Duration in milliseconds to lock field interactivity after autofill completion.
 * Safari requires 250ms (vs 50ms default) to accommodate websites that apply custom
 * focus management patches specifically for Safari (e.g., Adyen payment provider),
 * preventing race conditions where focus-to-next-field logic interferes with autofill. */
const AUTOFILL_LOCK_TIME = BUILD_TARGET === 'safari' ? 250 : 50;

export const createAutofillService = ({ controller }: ContentScriptContextFactoryOptions) => {
    const state: AutofillState = { processing: false };

    const counters: AutofillCounters = {
        credentials: null,
        identities: null,
        creditCards: null,
    };

    const getCredentialsCount = autofillCounter('credentials', counters);
    const getIdentitiesCount = autofillCounter('identities', counters);
    const getCreditCardsCount = autofillCounter('creditCards', counters);

    /** Synchronizes login form fields with current credential count.
     * Resets credential and identity counts if forced or user logged out */
    const sync = withContext<(options?: { forceSync: boolean }) => Promise<void>>(async (ctx, options) => {
        if (!ctx) return;

        const authorized = ctx.getState().authorized;

        if (options?.forceSync || !authorized) {
            counters.credentials = null;
            counters.identities = null;
            counters.creditCards = null;
        }

        const trackedForms = ctx.service.formManager.getTrackedForms();
        const loginForms = trackedForms?.filter((form) => form.formType === FormType.LOGIN) ?? [];
        const identityFields = trackedForms?.some((form) => form.getFieldsFor(FieldType.IDENTITY).length > 0);
        const ccFields = trackedForms?.some((form) => form.getFieldsFor(FieldType.CREDIT_CARD).length > 0);

        trackedForms.forEach((form) => form.getFields().forEach((field) => field.icon?.sync()));

        if (loginForms && authorized) await getCredentialsCount();
        if (identityFields && authorized) await getIdentitiesCount();
        if (ccFields && authorized) await getCreditCardsCount();
    });

    /** Locks field interactivity during autofill to prevent "focus-to-next"
     * interference. Fields unlock themselves before filling (see field.ts). */
    const autofillSequence = <T extends AsyncCallback>(fn: T) =>
        withContext<(...args: Parameters<T>) => Promise<ReturnType<T>>>(async (ctx, ...args) => {
            const formManager = ctx?.service.formManager;
            const fields = formManager?.getTrackedFields();

            fields?.forEach((field) => field.interactivity.lock());
            state.processing = true;
            const res = await fn(...args);

            return new Promise(
                onNextTick((resolve) => {
                    state.processing = false;
                    fields?.forEach((field) => field.interactivity.unlock());
                    resolve(res);
                })
            );
        }) as T;

    const autofillLogin = autofillSequence(async (form: FormHandle, data: FormCredentials) => {
        await first(form.getFieldsFor(FieldType.USERNAME) ?? [])?.autofill(data.userIdentifier);
        await first(form.getFieldsFor(FieldType.EMAIL) ?? [])?.autofill(data.userIdentifier);
        for (const field of form.getFieldsFor(FieldType.PASSWORD_CURRENT)) await field.autofill(data.password);

        sendContentScriptTelemetry(TelemetryEventName.AutofillTriggered, {}, { location: 'source' });
    });

    const autofillPassword = autofillSequence(
        withContext<(form: FormHandle, password: string) => Promise<void>>(async (ctx, form, password) => {
            const url = ctx?.getExtensionContext()?.url;
            if (url) {
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
        })
    );

    const autofillEmail = autofillSequence((field: FieldHandle, data: string) => field.autofill(data));

    /** Autofills OTP fields in a form. Uses paste method for multiple fields,
     * individual autofill for single field. Includes fallback logic for paste
     * failures in multi-field scenarios. */
    const autofillOTP = autofillSequence(async (form: FormHandle, code: string) => {
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
    });

    /** Clears previously autofilled identity fields when called with a new identity item */
    const autofillIdentity = autofillSequence(async (selectedField: FieldHandle, data: ItemContent<'identity'>) => {
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
    });

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

    const executeAutofill = withContext<(payload: AutofillRequest<'fill'>) => Promise<AutofillResult>>(
        (ctx, payload) => {
            switch (payload.type) {
                case 'creditCard':
                    /** Origin check is enforced service-worker side. */
                    const ccFields = ctx?.service.formManager
                        .getTrackedForms()
                        .map((form) => form.getFieldsFor(FieldType.CREDIT_CARD));

                    return seq(ccFields ?? [], (fields) => autofillCCFields(fields, payload.data))
                        .then((autofilled) => ({ type: 'creditCard' as const, autofilled: autofilled.flat() }))
                        .catch(() => ({ type: 'creditCard' as const, autofilled: [] }));
            }
        }
    );

    /** Cross-frame autofill orchestration with interactivity management :
     * 1. 'start': Lock all fields to prevent focus stealing during async fill operations
     * 2. 'fill': Execute autofill (async, may span multiple frames)
     * 3. 'completed': Unlock target field for user interaction, re-lock others briefly */
    const onAutofillRequest: FrameMessageHandler<WorkerMessageType.AUTOFILL_SEQUENCE> = withContext(
        (ctx, { payload }, sendResponse) => {
            const formManager = ctx?.service.formManager;
            const fields = formManager?.getTrackedFields();

            switch (payload.status) {
                case 'start':
                    /** cross-frame autofill sequence starting:
                     * lock all tracked fields temporarily. */
                    fields?.forEach((field) => field.interactivity.lock());
                    state.processing = true;
                    break;

                case 'fill':
                    /** fill step: each field will unlock itself
                     * as part of its autofill call */
                    void executeAutofill(payload).then(sendResponse);
                    return true;

                case 'completed':
                    const { formId, fieldId } = payload.refocus;
                    const refocusable = formManager?.getFormById(formId)?.getFieldById(fieldId);

                    /** Re-lock tracked fields to prevent race conditions where cross-frame
                     * "focus next field" requests arrive after autofill completes (common on
                     * payment forms with address/card fields across iframes). */
                    fields?.forEach((field) => field.interactivity.lock(AUTOFILL_LOCK_TIME));

                    refocusable?.interactivity.unlock();
                    refocusable?.focus({ preventAction: true });

                    nextTick(() => (state.processing = false));

                    break;
            }
        }
    );

    controller.channel.register(WorkerMessageType.AUTOFILL_SEQUENCE, onAutofillRequest);

    return {
        get processing() {
            return state.processing;
        },

        autofillEmail,
        autofillIdentity,
        autofillLogin,
        autofillOTP,
        autofillPassword,
        evaluateOTP,
        getCredentialsCount,
        getCreditCardsCount,
        getIdentitiesCount,
        sync,
        destroy: () => {
            controller.channel.unregister(WorkerMessageType.AUTOFILL_SEQUENCE, onAutofillRequest);
        },
    };
};

export type AutofillService = ReturnType<typeof createAutofillService>;
