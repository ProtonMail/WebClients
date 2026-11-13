import { fromPromise } from 'xstate';

import { shouldTraceError } from '@proton/components/hooks/useErrorHandler';
import metrics from '@proton/metrics/metricsInstance';
import { observeError } from '@proton/metrics/observeApiError';
import type { PaymentsContextOptimisticType } from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import { PLANS } from '@proton/payments/core/constants';
import type { Cycle, PlanIDs } from '@proton/payments/core/interface';
import type { PlanToCheck } from '@proton/payments/core/subscription/plan-to-check';
import { isTokenPayment } from '@proton/payments/core/type-guards';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import { getAllAddresses, updateAddress } from '@proton/shared/lib/api/addresses';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import {
    type ResumedSessionResult,
    extendPersistedSessionOfflineBypass,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';
import type { ReferralData } from '@proton/shared/lib/interfaces/referral';
import type { Optional } from '@proton/shared/lib/interfaces/utils';
import { SubscriptionMode } from '@proton/shared/lib/payments/subscription/constants';

import sendRecoveryPhrasePayloadHelper from '../../../private-app/containers/recoveryPhrase/sendRecoveryPhrasePayload';
import type { OnLoginCallbackResult } from '../../authSession';
import type { AccountData, SignupHumanVerification, SignupInviteParameters } from '../../signup/interfaces';
import { handleSetupOrg } from '../../signup/signupActions';
import {
    sendSignupAccountCreationTelemetry,
    sendSignupRecoveryPhraseSetTelemetry,
    sendSignupSubscriptionTelemetryEvent,
} from '../../signup/signupTelemetry';
import { getClientType } from '../context/helpers/getClientType';
import { handleCreateUser } from '../context/helpers/handleCreateUser';
import {
    type SignupContextSubscriptionData,
    handleSetupUser,
    handleSubscribeUser,
} from '../context/helpers/handleSetupUser';
import { validateReferrer } from '../helpers/validateReferrer';
import type { SignupEvent } from './signupStateMachine';

export interface AvailablePlan {
    planIDs: PlanIDs;
    cycle: Cycle;
}

export interface SignupPaymentsDataConfig {
    /**
     * Defines the plans that are available in this signup context.
     * This is needed to be able to pre fetch the plan information as early as possible.
     */
    availablePlans?: AvailablePlan[];
    /**
     * Initially selected plan
     */
    plan: Optional<PlanToCheck, 'currency'>;
    telemetryContext: PaymentTelemetryContext;
}

export type SetupUserResult = Awaited<ReturnType<typeof handleSetupUser>>;

/** What the actors take from the app: the page provides them again on each render. */
export interface SignupServices {
    app: APP_NAMES | 'generic';
    flowId: string;
    build: APP_NAMES;
    api: Api;
    silentApi: Api;
    paymentsDataConfig: SignupPaymentsDataConfig | undefined;
    unverifiedReferralData: ReferralData | undefined;
    hvMode: SignupHumanVerification | undefined;
    invite: SignupInviteParameters | undefined;
    payments: PaymentsContextOptimisticType;
    onPaymentsInitialized: () => void;
    getKtActivation: () => Promise<KeyTransparencyActivation>;
    onPreSubmit: (() => Promise<void>) | undefined;
    onStartAuth: () => Promise<void>;
    onLogin: (session: ResumedSessionResult) => Promise<OnLoginCallbackResult | void>;
    onReferralCheckError: (() => void) | undefined;
}

/**
 * Always persist new signups
 */
const persistent = true;

/**
 * Never trust new signups. This will prevent any trusted device data being stored on the device
 */
const trusted = false;

export const createSignupReporting = ({ flowId }: Pick<SignupServices, 'flowId'>) => {
    const tags = { signupFlowId: flowId };
    return {
        captureMessage: (message: string) => captureMessage(`SignupContext: ${message}`, { tags }),
        traceError: (error: unknown) => {
            if (shouldTraceError(error)) {
                traceError(error, { tags });
            }
        },
    };
};

const operationMetrics: Partial<Record<SignupEvent['type'], { increment: (labels: { status: 'failure' }) => void }>> = {
    'user.create': metrics.core_signup_ctx_createUser_total,
    'user.setup': metrics.core_signup_ctx_setupUser_total,
    'orgName.set': metrics.core_signup_ctx_setOrgName_total,
    'displayName.set': metrics.core_signup_ctx_setDisplayName_total,
};

export const createSignupActions = (services: SignupServices) => {
    const reporting = createSignupReporting(services);

    return {
        onReferralCheckError: () => services.onReferralCheckError?.(),
        reportInitialized: () => metrics.core_signup_ctx_initialization_total.increment({ status: 'success' }),
        reportInitializationError: (_: unknown, { error }: { error: unknown }) => {
            observeError(error, (status) => metrics.core_signup_ctx_initialization_total.increment({ status }));
            reporting.traceError(error);
        },
        reportInvalidStage: (
            // During the transition, the snapshot is still the state the operation came in
            { self }: { self: { getSnapshot: () => { value: unknown } } },
            { operation }: { operation: SignupEvent['type'] }
        ) => {
            reporting.captureMessage(`Invalid stage ${JSON.stringify(self.getSnapshot().value)} for ${operation}`);
            operationMetrics[operation]?.increment({ status: 'failure' });
        },
        reportMissingData: (
            _: unknown,
            { operation, message }: { operation: SignupEvent['type']; message: string }
        ) => {
            reporting.captureMessage(message);
            operationMetrics[operation]?.increment({ status: 'failure' });
        },
        reportErrorPage: () => metrics.core_signup_ctx_errorPage_total.increment({}),
    };
};

const getPaymentToken = (subscriptionData: SignupContextSubscriptionData | undefined) => {
    if (!subscriptionData || !isTokenPayment(subscriptionData.paymentToken)) {
        return undefined;
    }
    if (
        subscriptionData.checkResult.AmountDue > 0 ||
        subscriptionData.checkResult.SubscriptionMode === SubscriptionMode.Trial
    ) {
        return subscriptionData.paymentToken.Details.Token;
    }
};

export const createSignupActors = (services: SignupServices) => {
    const reporting = createSignupReporting(services);
    const { app, flowId, api, silentApi } = services;

    return {
        startAuth: fromPromise(() => services.onStartAuth()),
        loadDomains: fromPromise(async () => {
            const { Domains } = await silentApi<{ Domains: string[] }>(queryAvailableDomains('signup'));
            return Domains;
        }),
        /** The referrer, once the backend confirms it exists. */
        checkReferral: fromPromise(async () => {
            const { unverifiedReferralData } = services;
            if (!unverifiedReferralData) {
                return undefined;
            }
            await validateReferrer(silentApi, unverifiedReferralData.referralIdentifier);
            return unverifiedReferralData;
        }),
        initializePayments: fromPromise(async () => {
            const { paymentsDataConfig } = services;
            await services.payments.initialize({
                api: silentApi,
                paymentFlow: 'signup',
                planToCheck: paymentsDataConfig?.plan,
                paramCurrency: paymentsDataConfig?.plan?.currency,
                availablePlans: paymentsDataConfig?.availablePlans,
                telemetryContext: paymentsDataConfig?.telemetryContext ?? 'other',
                product: app,
                onChargeable: async () => {},
            });
            services.onPaymentsInitialized();
        }),
        createUser: fromPromise<
            void,
            { accountData: AccountData | undefined; subscriptionData: SignupContextSubscriptionData | undefined }
        >(async ({ input: { accountData, subscriptionData } }) => {
            if (!accountData) {
                throw new Error('Missing accountData');
            }
            try {
                // Ensure crypto worker has loaded
                await services.onPreSubmit?.();
                await services.onStartAuth();

                await handleCreateUser({
                    accountData,
                    paymentToken: getPaymentToken(subscriptionData),
                    api,
                    clientType: getClientType(app),
                    productParam: app,
                    humanVerificationResult: undefined,
                    inviteData: undefined,
                    invite: services.invite,
                    visitorId: undefined,
                    hvMode: services.hvMode,
                });

                metrics.core_signup_ctx_createUser_total.increment({ status: 'success' });
            } catch (error) {
                observeError(error, (status) => metrics.core_signup_ctx_createUser_total.increment({ status }));
                reporting.traceError(error);
                throw error;
            }
        }),
        setupUser: fromPromise<
            SetupUserResult,
            {
                accountData: AccountData | undefined;
                subscriptionData: SignupContextSubscriptionData | undefined;
                referralData: ReferralData | undefined;
            }
        >(async ({ input: { accountData, subscriptionData, referralData } }) => {
            if (!accountData) {
                throw new Error('Missing accountData');
            }
            const { payments } = services;
            try {
                /**
                 * Stop the metrics batching process. This prevents a race condition where
                 * handleSetupUser sets an auth cookie before the metrics batch request
                 */
                metrics.stopBatchingProcess();

                const planName = payments.selectedPlan.getPlanName();
                const setupResult = await handleSetupUser({
                    accountData,
                    persistent,
                    trusted,
                    api: silentApi,
                    keyTransparencyActivation: await services.getKtActivation(),
                    subscriptionData,
                    productParam: app,
                    traceSignupSentryError: reporting.traceError,
                    referralData,
                    referralRegistrationPlan:
                        planName === PLANS.FREE ? undefined : { name: planName, cycle: payments.selectedPlan.cycle },
                    build: services.build,
                    telemetryContext: payments.telemetryContext,
                });

                /**
                 * Batch process can now resume since the auth cookie will have been set
                 */
                metrics.startBatchingProcess();

                sendSignupAccountCreationTelemetry({
                    flowId,
                    productIntent: app,
                    planIDs: subscriptionData?.planIDs || {},
                    currency: subscriptionData?.currency,
                    cycle: subscriptionData?.cycle,
                    signupType: accountData.signupType,
                    amount: subscriptionData?.checkResult.Amount,
                });

                const { user, subscription } = setupResult;
                if (subscriptionData && subscription) {
                    sendSignupSubscriptionTelemetryEvent({
                        flowId,
                        planIDs: subscriptionData.planIDs,
                        currency: subscription.Currency,
                        cycle: subscription.Cycle,
                        userCreateTime: user.CreateTime,
                        invoiceID: subscription.InvoiceID,
                        coupon: subscription.CouponCode,
                        amount: subscription.Amount,
                    });
                }

                metrics.core_signup_ctx_setupUser_total.increment({ status: 'success' });

                return setupResult;
            } catch (error: any) {
                if (error?.config?.url?.endsWith?.('keys/setup')) {
                    reporting.captureMessage(`Signup setup failure`);
                } else {
                    reporting.traceError(error);
                }

                metrics.startBatchingProcess();

                observeError(error, (status) => metrics.core_signup_ctx_setupUser_total.increment({ status }));

                throw error;
            }
        }),
        /** Subscribes a user whose payment came after the setup. Before it, `setupUser` subscribes. */
        setupSubscription: fromPromise<
            void,
            { subscriptionData: SignupContextSubscriptionData | undefined; setupResult: SetupUserResult | undefined }
        >(async ({ input: { subscriptionData, setupResult } }) => {
            if (subscriptionData) {
                await handleSubscribeUser(api, subscriptionData, {
                    productParam: app,
                    build: services.build,
                    telemetryContext: services.payments.telemetryContext,
                    userCurrency: undefined,
                    subscription: undefined,
                });
            }

            if (setupResult) {
                await extendPersistedSessionOfflineBypass(setupResult.session.localID);
            }
        }),
        setOrgName: fromPromise<
            void,
            { orgName: string; accountData: AccountData | undefined; setupResult: SetupUserResult | undefined }
        >(async ({ input: { orgName, accountData, setupResult } }) => {
            if (!accountData || !setupResult) {
                throw new Error('Missing accountData or setup user data');
            }
            try {
                await handleSetupOrg({
                    api,
                    user: setupResult.user,
                    password: accountData.password,
                    keyPassword: setupResult.keyPassword,
                    orgName,
                });

                metrics.core_signup_ctx_setOrgName_total.increment({ status: 'success' });
            } catch (error) {
                observeError(error, (status) => metrics.core_signup_ctx_setOrgName_total.increment({ status }));
                reporting.traceError(error);
                throw error;
            }
        }),
        setDisplayName: fromPromise<void, { displayName: string }>(async ({ input: { displayName } }) => {
            const addresses = await getAllAddresses(api);
            const firstAddress = addresses[0];
            if (!firstAddress) {
                reporting.captureMessage('Missing first address');
                metrics.core_signup_ctx_setDisplayName_total.increment({ status: 'failure' });
                return;
            }

            try {
                await api(
                    updateAddress(firstAddress.ID, { DisplayName: displayName, Signature: firstAddress.Signature })
                );
                metrics.core_signup_ctx_setDisplayName_total.increment({ status: 'success' });
            } catch (error) {
                observeError(error, (status) => metrics.core_signup_ctx_setDisplayName_total.increment({ status }));
                reporting.traceError(error);
                throw error;
            }
        }),
        /** Stores the recovery phrase once the user has downloaded or copied it. */
        sendRecoveryPhrase: fromPromise<
            void,
            { accountData: AccountData | undefined; setupResult: SetupUserResult | undefined }
        >(async ({ input: { accountData, setupResult } }) => {
            if (!accountData || !setupResult?.recoveryPhraseData) {
                throw new Error('Missing accountData or recovery phrase data');
            }
            try {
                await sendRecoveryPhrasePayloadHelper({
                    api,
                    payload: setupResult.recoveryPhraseData.payload,
                    password: accountData.password,
                });

                sendSignupRecoveryPhraseSetTelemetry({ flowId, productIntent: app });

                metrics.core_signup_ctx_recoveryPhrasePayloadSent_total.increment({ status: 'success' });
            } catch (error) {
                reporting.traceError(error);
                observeError(error, (status) =>
                    metrics.core_signup_ctx_recoveryPhrasePayloadSent_total.increment({ status })
                );
                throw error;
            }
        }),
        login: fromPromise<OnLoginCallbackResult | void, { setupResult: SetupUserResult | undefined }>(
            async ({ input: { setupResult } }) => {
                if (!setupResult) {
                    throw new Error('Missing session');
                }
                try {
                    /**
                     * Ensure all metrics have been sent before login.
                     * Gracefully handle error, but report to sentry
                     */
                    await metrics.processAllRequests().catch(reporting.traceError);

                    const loginResult = await services.onLogin(setupResult.session);

                    /**
                     * TODO: [CP-10334]
                     * This is only sent if a redirect to the applications does not occur.
                     * ie for drive signup, the user is redirected to drive.proton.me and this metric is never sent
                     *
                     * For generic signup, we redirect to account.proton.me/apps, and so the metric is sent
                     */
                    metrics.core_signup_ctx_login_total.increment({ status: 'success' });

                    return loginResult;
                } catch (error) {
                    reporting.traceError(error);
                    observeError(error, (status) => metrics.core_signup_ctx_login_total.increment({ status }));
                    throw error;
                }
            }
        ),
    };
};

export type SignupActors = ReturnType<typeof createSignupActors>;
