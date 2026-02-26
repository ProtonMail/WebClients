import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

import { type OnLoginCallback, StandardErrorPage, useApi, useConfig } from '@proton/components';
import { shouldTraceError, useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import type { OnChargeable } from '@proton/components/payments/client-extensions';
import metrics, { observeError } from '@proton/metrics/index';
import {
    type Cycle,
    type ExtendedTokenPayment,
    PLANS,
    type PlanIDs,
    SubscriptionMode,
    type TokenPayment,
    isTokenPayment,
    isV5PaymentToken,
    v5PaymentTokenToLegacyPaymentToken,
} from '@proton/payments';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import type { PaymentsContextOptimisticType, PlanToCheck } from '@proton/payments/ui';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { getAllAddresses, updateAddress } from '@proton/shared/lib/api/addresses';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    type ResumedSessionResult,
    extendPersistedSessionOfflineBypass,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';
import type { Optional, ReferralData } from '@proton/shared/lib/interfaces';
import type { Unwrap } from '@proton/shared/lib/interfaces/utils';
import noop from '@proton/utils/noop';

import sendRecoveryPhrasePayloadHelper from '../../containers/recoveryPhrase/sendRecoveryPhrasePayload';
import type { DeferredMnemonicData } from '../../containers/recoveryPhrase/types';
import type { AccountData, SignupType } from '../../signup/interfaces';
import { handleSetupOrg } from '../../signup/signupActions';
import {
    sendSignupAccountCreationTelemetry,
    sendSignupLoadTelemetry,
    sendSignupRecoveryPhraseSetTelemetry,
    sendSignupSubscriptionTelemetryEvent,
} from '../../signup/signupTelemetry';
import { useGetAccountKTActivation } from '../../useGetAccountKTActivation';
import { AccountFormDataContextProvider, useAccountFormDataContext } from './accountData/AccountFormDataContext';
import { InvalidReferrerError, useReferralData } from './accountData/useReferralData';
import { useSignupDomains } from './accountData/useSignupDomains';
import { getClientType } from './helpers/getClientType';
import { handleCreateUser } from './helpers/handleCreateUser';
import { type SignupContextSubscriptionData, handleSetupUser, handleSubscribeUser } from './helpers/handleSetupUser';

interface AccountFormDataConfig {
    /**
     * Set of available signup types.
     * Initial signup type will be the first signup type added to the set
     */
    availableSignupTypes: Set<SignupType>;
    /**
     * Optional default email to pre-populate the email input.
     * Will use @type {SignupType.External} if provided value is an external email format,
     * otherwise will @type {SignupType.Proton}.
     */
    defaultEmail?: string;
}

interface SignupData {
    accountData?: AccountData;
    paymentData?: {
        subscriptionData: SignupContextSubscriptionData;
    };
}

export interface AvailablePlan {
    planIDs: PlanIDs;
    cycle: Cycle;
}

interface SignupContextType {
    app: APP_NAMES | 'generic';
    domains: string[];
    /**
     * Sets the validated account data ready for the signup process.
     * Validated account data should be received through `signup.accountFormData.getAccountData();`
     */
    submitAccountData: (accountData: AccountData) => void;
    /**
     * Sets the validated payment data ready for the signup process.
     */
    submitPaymentData: (
        paymentData: PaymentsContextOptimisticType['options'],
        data: Parameters<OnChargeable>[1]
    ) => void;
    /**
     * Creates a new user account based on the provided account data
     */
    createUser: () => Promise<void>;
    /**
     * Sets up the newly created user account and creates the subscription
     */
    setupUser: () => Promise<void>;
    /**
     * Setup the subsciption when it has been made after `setupUser`
     * If subscription is done before `setupUser`, it will be done automatically
     */
    setupSubscription: () => Promise<void>;
    setOrgName: (orgName: string) => Promise<void>;
    setDisplayName: (displayName: string) => Promise<void>;
    login: () => Promise<void>;
    flowId: string;
    loading: { init: boolean; submitting: boolean };
    loginUrl: string;
    /**
     * Recovery phrase data generated during user setup
     */
    recoveryPhraseData?: DeferredMnemonicData;
    /**
     * Sends recovery phrase payload to backend when user downloads/copies recovery phrase
     */
    sendRecoveryPhrasePayload: () => Promise<void>;
    /**
     * Capture a message to sentry.
     * Includes relevant tags for the signup flow
     */
    captureSignupSentryMessage: (msg: string) => void;
}

const SignupContext = createContext<SignupContextType | null>(null);

export interface BaseSignupContextProps {
    onPreSubmit?: () => Promise<void>;
    onStartAuth: () => Promise<void>;
    onGetActiveSessions?: () => Promise<GetActiveSessionsResult>;
    handleLogin: OnLoginCallback;
    loginUrl: string;
    productParam: ProductParam;
}

interface SignupContextProviderProps extends Omit<BaseSignupContextProps, 'onLogin'> {
    children: ReactNode;

    app: APP_NAMES | 'generic';

    /**
     * Unique id for each defined flow.
     * Can be used to run different variants of a signup.
     * Used for telemetry and to debug issues when things go wrong
     */
    flowId: string;

    paymentsDataConfig?: {
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
    };

    /**
     * Defines the steps that will be shown once the account has been create
     */
    // accountSetupSteps?: AccountSetupSteps[];

    onLogin: (session: ResumedSessionResult) => Promise<void>;

    /**
     * Configuration for the account form (username/email and password input form)
     */
    accountFormDataConfig: AccountFormDataConfig;

    unverifiedReferralData?: ReferralData;
    onReferralCheckError?: () => void;
}

const getPaymentDataFromChargeableCallback = (
    options: Parameters<SignupContextType['submitPaymentData']>[0],
    {
        chargeablePaymentParameters,
        paymentsVersion,
        sourceType,
        source,
        paymentProcessorType,
    }: Parameters<SignupContextType['submitPaymentData']>[1]
): SignupData['paymentData'] => {
    const legacyTokenPayment: TokenPayment | undefined = isV5PaymentToken(chargeablePaymentParameters)
        ? v5PaymentTokenToLegacyPaymentToken(chargeablePaymentParameters).Payment
        : undefined;

    const extendedTokenPayment: ExtendedTokenPayment = {
        ...legacyTokenPayment,
        paymentsVersion,
        paymentMethodType: sourceType,
        paymentMethodValue: source,
        paymentProcessorType,
    };

    return {
        subscriptionData: {
            ...options,
            paymentToken: extendedTokenPayment,
        },
    };
};

/**
 * Always persist new signups
 */
const persistent = true;

/**
 * Never trust new signups. This will prevent any trusted device data being stored on the device
 */
const trusted = false;

const getSignupSentryTags = ({ flowId }: { flowId: string }) => ({
    signupFlowId: flowId,
});

export const InnerSignupContextProvider = ({
    app,
    children,
    onLogin,
    onPreSubmit,
    onStartAuth,
    flowId,
    paymentsDataConfig,
    accountFormDataConfig,
    loginUrl,
    unverifiedReferralData,
    onReferralCheckError,
}: SignupContextProviderProps) => {
    const { APP_NAME } = useConfig();
    const clientType = getClientType(app);
    const [loading, setLoading] = useState({ init: true, submitting: false });
    const setLoadingDiff = (data: Partial<typeof loading>) => setLoading((prev) => ({ ...prev, ...data }));
    const domainsData = useSignupDomains();
    const { referralData, initReferralData } = useReferralData();

    const paymentsContext = usePaymentOptimistic();
    const setupUserResponseRef = useRef<Unwrap<ReturnType<typeof handleSetupUser>>>();
    const signupDataRef = useRef<SignupData>();
    const [recoveryPhraseData, setRecoveryPhraseData] = useState<DeferredMnemonicData | undefined>();

    const updateSignupData = (partial: Partial<SignupData>) => {
        signupDataRef.current = { ...signupDataRef.current, ...partial };
    };

    /**
     * Poor mans state machine to track at which point in the flow we are at
     */
    const stageRef = useRef<'initial' | 'userCreated' | 'userSetup'>('initial');

    const [error, setError] = useState(false);

    const api = useApi();
    const silentApi = useSilentApi();

    const getKtActivation = useGetAccountKTActivation();

    const sentryTags = getSignupSentryTags({ flowId });

    const captureSentryMessage = (message: string) => captureMessage(`SignupContext: ${message}`, { tags: sentryTags });

    const traceSentryError = (error: any) => {
        if (!shouldTraceError(error)) {
            return;
        }
        traceError(error, { tags: sentryTags });
    };

    const notifyError = useNotifyErrorHandler();

    useEffect(() => {
        const initialize = async () => {
            /**
             * Ensure auth params have been set
             */
            await onStartAuth().catch(noop);

            const initPayments = async () => {
                await paymentsContext.initialize({
                    api: silentApi,
                    paymentFlow: 'signup',
                    planToCheck: paymentsDataConfig?.plan,
                    paramCurrency: paymentsDataConfig?.plan?.currency,
                    availablePlans: paymentsDataConfig?.availablePlans,
                    telemetryContext: paymentsDataConfig?.telemetryContext ?? 'other',
                    product: app,
                    onChargeable: async () => {},
                });
            };

            await Promise.all([
                domainsData.init(silentApi),
                unverifiedReferralData ? initReferralData({ unverifiedReferralData, api: silentApi }) : undefined,
                initPayments(),
            ]);
        };

        initialize()
            .then(() => {
                metrics.core_signup_ctx_initialization_total.increment({
                    status: 'success',
                });
            })
            .catch((error) => {
                if (error instanceof InvalidReferrerError) {
                    onReferralCheckError?.();
                    return;
                }
                notifyError(error);

                observeError(error, (status) =>
                    metrics.core_signup_ctx_initialization_total.increment({
                        status,
                    })
                );

                traceSentryError(error);
            })
            .finally(() => {
                setLoadingDiff({ init: false });
            });
    }, []);

    useEffect(() => {
        if (!paymentsContext.initialized) {
            return;
        }

        sendSignupLoadTelemetry({
            flowId,
            planIDs: paymentsContext.selectedPlan.planIDs,
            productIntent: app,
            currency: paymentsContext.selectedPlan.currency,
            cycle: paymentsContext.selectedPlan.cycle,
        });

        checkoutTelemetry.reportInitialization({
            context: paymentsContext.telemetryContext,
            userCurrency: undefined,
            subscription: undefined,
            selectedCurrency: paymentsContext.selectedPlan.currency,
            selectedPlanIDs: paymentsContext.selectedPlan.planIDs,
            selectedCycle: paymentsContext.selectedPlan.cycle,
            selectedCoupon: paymentsContext.checkResult.Coupon?.Code,
            selectedStep: null,
            build: APP_NAME,
            product: app,
        });
    }, [paymentsContext.initialized]);

    /**
     * Creates the user
     * To be called only when username and password has been submitted
     */
    const innerCreateUser: SignupContextType['createUser'] = async () => {
        /**
         * Enhancement idea:
         * We could we use an iterator here which yields at each step.
         * Then we can show loaders/animations for each step and avoid having mega long loaders.
         */
        const { accountData, paymentData } = signupDataRef.current || {};

        if (stageRef.current !== 'initial') {
            captureSentryMessage(`Invalid stage: ${stageRef.current}`);

            metrics.core_signup_ctx_createUser_total.increment({
                status: 'failure',
            });

            setError(true);
            return;
        }

        if (!accountData) {
            captureSentryMessage('Missing accountData');

            metrics.core_signup_ctx_createUser_total.increment({
                status: 'failure',
            });

            return;
        }

        const paymentToken = (() => {
            if (!paymentData) {
                return undefined;
            }

            if (!isTokenPayment(paymentData.subscriptionData.paymentToken)) {
                return undefined;
            }

            if (
                paymentData.subscriptionData.checkResult.AmountDue > 0 ||
                paymentData?.subscriptionData.checkResult.SubscriptionMode === SubscriptionMode.Trial
            ) {
                return paymentData.subscriptionData.paymentToken.Details.Token;
            }
        })();

        try {
            // Ensure crypto worker has loaded
            await onPreSubmit?.();
            await onStartAuth();

            await handleCreateUser({
                accountData,
                paymentToken,
                api,
                clientType,
                productParam: app,
                humanVerificationResult: undefined,
                inviteData: undefined,
                invite: undefined,
            });

            stageRef.current = 'userCreated';

            metrics.core_signup_ctx_createUser_total.increment({
                status: 'success',
            });
        } catch (error: any) {
            observeError(error, (status) =>
                metrics.core_signup_ctx_createUser_total.increment({
                    status,
                })
            );

            traceSentryError(error);

            /**
             * Error needs to be thrown to handle human verification modal close
             */
            throw error;
        }
    };

    const createUser: SignupContextType['createUser'] = async (...args) => {
        if (loading.init) {
            return;
        }
        setLoadingDiff({ submitting: true });

        await innerCreateUser(...args);

        setLoadingDiff({ submitting: false });
    };

    const setupUser = async () => {
        const { accountData, paymentData } = signupDataRef.current || {};

        if (stageRef.current !== 'userCreated') {
            captureSentryMessage(
                `Invalid stage: ${stageRef.current}. Expected createUser to have been completed successfully.`
            );

            metrics.core_signup_ctx_setupUser_total.increment({
                status: 'failure',
            });

            setError(true);
            return;
        }

        if (!accountData) {
            captureSentryMessage('Missing accountData');

            metrics.core_signup_ctx_setupUser_total.increment({
                status: 'failure',
            });

            return;
        }

        try {
            /**
             * Stop the metrics batching process. This prevents a race condition where
             * handleSetupUser sets an auth cookie before the metrics batch request
             */
            metrics.stopBatchingProcess();

            const referralRegistrationPlan = (() => {
                if (paymentsContext.selectedPlan.getPlanName() === PLANS.FREE) {
                    return;
                }

                return {
                    name: paymentsContext.selectedPlan.getPlanName(),
                    cycle: paymentsContext.selectedPlan.cycle,
                };
            })();

            const setupUserResponse = await handleSetupUser({
                accountData,
                persistent,
                trusted,
                api: silentApi,
                keyTransparencyActivation: await getKtActivation(),
                subscriptionData: paymentData?.subscriptionData,
                productParam: app,
                traceSignupSentryError: traceSentryError,
                referralData,
                referralRegistrationPlan,
                build: APP_NAME,
                telemetryContext: paymentsContext.telemetryContext,
            });

            setupUserResponseRef.current = setupUserResponse;
            setRecoveryPhraseData(setupUserResponse.recoveryPhraseData);

            stageRef.current = 'userSetup';

            /**
             * Batch process can now resume since the auth cookie will have been set
             */
            metrics.startBatchingProcess();

            sendSignupAccountCreationTelemetry({
                flowId,
                productIntent: app,
                planIDs: paymentData?.subscriptionData.planIDs || {},
                currency: paymentData?.subscriptionData.currency,
                cycle: paymentData?.subscriptionData.cycle,
                signupType: accountData.signupType,
                amount: paymentData?.subscriptionData.checkResult.Amount,
            });

            const { user, subscription } = setupUserResponse;
            if (paymentData?.subscriptionData && subscription) {
                sendSignupSubscriptionTelemetryEvent({
                    flowId,
                    planIDs: paymentData.subscriptionData.planIDs,
                    currency: subscription.Currency,
                    cycle: subscription.Cycle,
                    userCreateTime: user.CreateTime,
                    invoiceID: subscription.InvoiceID,
                    coupon: subscription.CouponCode,
                    amount: subscription.Amount,
                });
            }

            metrics.core_signup_ctx_setupUser_total.increment({
                status: 'success',
            });
        } catch (error: any) {
            if (error?.config?.url?.endsWith?.('keys/setup')) {
                captureSentryMessage(`Signup setup failure`);
            } else {
                traceSentryError(error);
            }

            metrics.startBatchingProcess();

            observeError(error, (status) =>
                metrics.core_signup_ctx_setupUser_total.increment({
                    status,
                })
            );

            throw error;
        }
    };

    const setupSubscription = async () => {
        const subscriptionData = signupDataRef.current?.paymentData?.subscriptionData;

        if (subscriptionData) {
            await handleSubscribeUser(api, subscriptionData, {
                productParam: app,
                build: APP_NAME,
                telemetryContext: paymentsContext.telemetryContext,
                userCurrency: undefined,
                subscription: undefined,
            });
        }

        if (setupUserResponseRef.current) {
            await extendPersistedSessionOfflineBypass(setupUserResponseRef.current.session.localID);
        }
    };

    const setOrgName = async (orgName: string) => {
        if (stageRef.current !== 'userSetup') {
            captureSentryMessage(
                `Invalid stage: ${stageRef.current}. Expected setupUser to have been completed successfully.`
            );

            metrics.core_signup_ctx_setOrgName_total.increment({
                status: 'failure',
            });

            setError(true);
            return;
        }

        const { accountData } = signupDataRef.current || {};
        const setupUserResponse = setupUserResponseRef.current;

        if (!accountData || !setupUserResponse) {
            captureSentryMessage('Missing accountData or setup user data');

            metrics.core_signup_ctx_setOrgName_total.increment({
                status: 'failure',
            });

            return;
        }

        const { password } = accountData;
        const { user, keyPassword } = setupUserResponse;

        try {
            await handleSetupOrg({
                api,
                user,
                password,
                keyPassword,
                orgName,
            });

            metrics.core_signup_ctx_setOrgName_total.increment({
                status: 'success',
            });
        } catch (error) {
            observeError(error, (status) =>
                metrics.core_signup_ctx_setOrgName_total.increment({
                    status,
                })
            );

            traceSentryError(error);

            throw error;
        }
    };

    const sendRecoveryPhrasePayload = async () => {
        if (stageRef.current !== 'userSetup') {
            captureSentryMessage(
                `Invalid stage: ${stageRef.current}. Expected setupUser to have been completed successfully.`
            );
            setError(true);
            return;
        }

        const { accountData } = signupDataRef.current || {};
        if (!accountData) {
            captureSentryMessage('Missing accountData');
            return;
        }

        if (!setupUserResponseRef.current?.recoveryPhraseData) {
            captureSentryMessage('Missing recovery phrase data');
            return;
        }

        const { payload } = setupUserResponseRef.current.recoveryPhraseData;
        const password = accountData.password;

        try {
            await sendRecoveryPhrasePayloadHelper({ api, payload, password });

            sendSignupRecoveryPhraseSetTelemetry({
                flowId,
                productIntent: app,
            });

            metrics.core_signup_ctx_recoveryPhrasePayloadSent_total.increment({
                status: 'success',
            });
        } catch (error) {
            traceSentryError(error);

            observeError(error, (status) =>
                metrics.core_signup_ctx_recoveryPhrasePayloadSent_total.increment({
                    status,
                })
            );

            throw error;
        }
    };

    const setDisplayName = async (displayName: string) => {
        if (stageRef.current !== 'userSetup') {
            captureSentryMessage(
                `Invalid stage: ${stageRef.current}. Expected setupUser to have been completed successfully.`
            );

            metrics.core_signup_ctx_setDisplayName_total.increment({
                status: 'failure',
            });

            setError(true);
            return;
        }

        const setupUserResponse = setupUserResponseRef.current;
        if (!setupUserResponse) {
            captureSentryMessage('Missing setup user data');

            metrics.core_signup_ctx_setDisplayName_total.increment({
                status: 'failure',
            });

            return;
        }

        const addresses = await getAllAddresses(api);
        const firstAddress = addresses[0];
        if (!firstAddress) {
            captureSentryMessage('Missing first address');
            metrics.core_signup_ctx_setDisplayName_total.increment({
                status: 'failure',
            });
            return;
        }

        try {
            await api(updateAddress(firstAddress.ID, { DisplayName: displayName, Signature: firstAddress.Signature }));
            metrics.core_signup_ctx_setDisplayName_total.increment({
                status: 'success',
            });
        } catch (error) {
            observeError(error, (status) =>
                metrics.core_signup_ctx_setDisplayName_total.increment({
                    status,
                })
            );

            traceSentryError(error);

            throw error;
        }
    };

    const login = async () => {
        if (stageRef.current !== 'userSetup') {
            captureSentryMessage(
                `Invalid stage: ${stageRef.current}. Expected setupUser to have been completed successfully.`
            );
            setError(true);
            return;
        }

        if (!setupUserResponseRef.current?.session) {
            captureSentryMessage('Missing session');
            return;
        }

        try {
            /**
             * Ensure all metrics have been sent before login
             */
            await metrics.processAllRequests().catch(
                /**
                 * Gracefully handle error, but report to sentry
                 */
                traceSentryError
            );

            await onLogin(setupUserResponseRef.current.session);

            /**
             * TODO: [CP-10334]
             * This is only sent if a redirect to the applications does not occur.
             * ie for drive signup, the user is redirected to drive.proton.me and this metric is never sent
             *
             * For generic signup, we redirect to account.proton.me/apps, and so the metric is sent
             */
            metrics.core_signup_ctx_login_total.increment({
                status: 'success',
            });
        } catch (error) {
            traceSentryError(error);

            observeError(error, (status) =>
                metrics.core_signup_ctx_login_total.increment({
                    status,
                })
            );

            throw error;
        }
    };

    if (error) {
        metrics.core_signup_ctx_errorPage_total.increment({});
        return <StandardErrorPage />;
    }

    const value: SignupContextType = {
        app,
        domains: domainsData.domains,
        login,
        submitAccountData: (accountData) => updateSignupData({ accountData }),
        submitPaymentData: (options, data) => {
            const paymentData = getPaymentDataFromChargeableCallback(options, data);
            updateSignupData({ paymentData });
        },
        createUser,
        setupUser,
        setupSubscription,
        setOrgName,
        setDisplayName,
        flowId,
        loading,
        loginUrl,
        recoveryPhraseData,
        sendRecoveryPhrasePayload,
        captureSignupSentryMessage: captureSentryMessage,
    };

    return (
        <AccountFormDataContextProvider
            defaultEmail={accountFormDataConfig.defaultEmail}
            availableSignupTypes={accountFormDataConfig.availableSignupTypes}
            domains={domainsData.domains}
        >
            <SignupContext.Provider value={value}>{children}</SignupContext.Provider>
        </AccountFormDataContextProvider>
    );
};

export const useSignup = () => {
    const signupContext = useContext(SignupContext);
    const accountFormDataContext = useAccountFormDataContext();

    if (!signupContext) {
        throw new Error('Expected to be within SignupContextProvider');
    }

    return {
        ...signupContext,
        /**
         * accountForm exposes functionality to the signup devs
         */
        accountForm: {
            getIsValid: accountFormDataContext.getIsValid,
            /**
             * Get the validated account data from the account details form.
             * The data can then be given to `submitAccountData`
             */
            getValidAccountData: accountFormDataContext.getValidAccountData,
            refs: {
                form: accountFormDataContext.refs.form,
            },
            selectedSignupType: accountFormDataContext.state.signupType,
            availableSignupTypes: accountFormDataContext.state.signupTypes,
            setSignupType: (signupType: SignupType) => accountFormDataContext.onValue.onDetailsDiff({ signupType }),
            focusEmail: accountFormDataContext.focusEmail,
        },
    };
};

export const SignupContextProvider = ({ children, ...props }: SignupContextProviderProps) => {
    return <InnerSignupContextProvider {...props}>{children}</InnerSignupContextProvider>;
};
