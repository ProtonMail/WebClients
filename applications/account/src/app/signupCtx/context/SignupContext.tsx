import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

import { useApi, useErrorHandler } from '@proton/components';
import type { OnChargeable } from '@proton/components/payments/client-extensions';
import metrics from '@proton/metrics/index';
import {
    type Cycle,
    type ExtendedTokenPayment,
    type PlanIDs,
    type TokenPayment,
    isTokenPayment,
    isV5PaymentToken,
    v5PaymentTokenToLegacyPaymentToken,
} from '@proton/payments';
import { type PaymentsContextOptimisticType, type PlanToCheck } from '@proton/payments/ui';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { type ProductParam } from '@proton/shared/lib/apps/product';
import { type ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { type APP_NAMES } from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Optional } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { AccountData, SignupType } from '../../signup/interfaces';
import { handleSetupOrg } from '../../signup/signupActions';
import { useGetAccountKTActivation } from '../../useGetAccountKTActivation';
import { AccountFormDataContextProvider, useAccountFormDataContext } from './accountData/AccountFormDataContext';
import { useSignupDomains } from './accountData/useSignupDomains';
import { getClientType } from './helpers/getClientType';
import { handleCreateUser } from './helpers/handleCreateUser';
import { type SubscriptionData2, handleSetupUser } from './helpers/handleSetupUser';

interface AccountFormDataConfig {
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
        subscriptionData: SubscriptionData2;
    };
}

export interface AvailablePlan {
    planIDs: PlanIDs;
    cycle: Cycle;
}

interface SetupUserOptions {
    /**
     * Will setup the organization if provided
     */
    orgName?: string;
}

interface SignupContextType {
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
     * Sets up the newly created user account
     */
    setupUser: (options?: SetupUserOptions) => Promise<void>;
    login: () => Promise<void>;
    flowId: string;
    loading: { init: boolean; submitting: boolean };
    loginUrl: string;
}

const SignupContext = createContext<SignupContextType | null>(null);

export interface BaseSignupContextProps {
    onPreSubmit?: () => Promise<void>;
    onStartAuth: () => Promise<void>;
    loginUrl: string;
    productParam: ProductParam;
}

interface SignupContextProviderProps extends BaseSignupContextProps {
    children: ReactNode;

    app: APP_NAMES;

    /**
     * Flow id. Unique to each flow.
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
    };

    /**
     * Defines the steps that will be shown once the account has been create
     */
    // accountSetupSteps?: AccountSetupSteps[];

    onLogin: (session: ResumedSessionResult) => void;

    /**
     * Configuration for the account form (username/email and password input form)
     */
    accountFormDataConfig: AccountFormDataConfig;
}

const getPaymentDataFromChargeableCallback = (
    options: Parameters<SignupContextType['submitPaymentData']>[0],
    {
        chargeablePaymentParameters,
        paymentsVersion,
        paymentProcessorType,
    }: Parameters<SignupContextType['submitPaymentData']>[1]
): SignupData['paymentData'] => {
    const legacyTokenPayment: TokenPayment | undefined = isV5PaymentToken(chargeablePaymentParameters)
        ? v5PaymentTokenToLegacyPaymentToken(chargeablePaymentParameters).Payment
        : undefined;

    const extendedTokenPayment: ExtendedTokenPayment = {
        ...legacyTokenPayment,
        paymentsVersion,
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
    productParam,
}: SignupContextProviderProps) => {
    const clientType = getClientType(app);
    const [loading, setLoading] = useState({ init: true, submitting: false });
    const setLoadingDiff = (data: Partial<typeof loading>) => setLoading((prev) => ({ ...prev, ...data }));
    const domainsData = useSignupDomains();

    const paymentsContext = usePaymentOptimistic();
    // const [humanVerificationData, setHumanVerificationData] = useState<HumanVerificationData | null>(null);
    const session = useRef<ResumedSessionResult>();
    const signupDataRef = useRef<SignupData>();

    const updateSignupData = (partial: Partial<SignupData>) => {
        signupDataRef.current = { ...signupDataRef.current, ...partial };
    };

    const getErrorMessage = (message: string) => `SignupContext flowId:${flowId} - ${message}`;

    const handleError = useErrorHandler();
    const api = useApi();
    const silentApi = getSilentApi(api);

    const getKtActivation = useGetAccountKTActivation();

    useEffect(() => {
        const initialise = async () => {
            const silentApi = getSilentApi(api);

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
                    onChargeable: async () => {},
                });
            };

            const initAccountData = async () => {
                await domainsData.init(silentApi);
            };

            await Promise.all([initAccountData(), initPayments()]);
        };

        initialise()
            .catch(noop)
            .finally(() => {
                setLoadingDiff({ init: false });
            });
    }, []);

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
        if (!accountData) {
            captureMessage(getErrorMessage('Missing accountData'));

            return;
        }
        const paymentToken =
            paymentData &&
            isTokenPayment(paymentData.subscriptionData.paymentToken) &&
            paymentData.subscriptionData.checkResult.AmountDue > 0
                ? paymentData.subscriptionData.paymentToken.Details.Token
                : undefined;

        try {
            // Ensure crypto worker has loaded
            await onPreSubmit?.();
            await onStartAuth();

            await handleCreateUser({
                accountData,
                paymentToken,
                api,
                clientType,
                productParam,
                humanVerificationResult: undefined,
                inviteData: undefined,
                referralData: undefined,
                invite: undefined,
            });
        } catch (error: any) {
            handleError(error);

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
        try {
            setLoadingDiff({ submitting: true });
            return await innerCreateUser(...args);
        } finally {
            setLoadingDiff({ submitting: false });
        }
    };

    const setupUser = async ({ orgName }: SetupUserOptions = {}) => {
        const { accountData, paymentData } = signupDataRef.current || {};

        if (!accountData) {
            captureMessage(getErrorMessage('Missing accountData'));
            return;
        }

        try {
            /**
             * Stop the metrics batching process. This prevents a race condition where
             * handleSetupUser sets an auth cookie before the metrics batch request
             */
            metrics.stopBatchingProcess();

            const signupActionResponse = await handleSetupUser({
                accountData,
                persistent,
                trusted,
                api: silentApi,
                keyTransparencyActivation: await getKtActivation(),

                subscriptionData: paymentData?.subscriptionData,
                productParam,
                referralData: undefined,
            });

            session.current = signupActionResponse.session;

            {
                const maybeSetupOrg = async () => {
                    if (orgName) {
                        await handleSetupOrg({
                            api,
                            user: signupActionResponse.user,
                            password: accountData.password,
                            keyPassword: signupActionResponse.keyPassword,
                            orgName,
                        });
                    }
                };
                await maybeSetupOrg().catch(noop);
            }

            /**
             * Batch process can now resume since the auth cookie will have been set
             */
            metrics.startBatchingProcess();
        } catch (error: any) {
            handleError(error);
            if (error?.config?.url?.endsWith?.('keys/setup')) {
                captureMessage(`Signup setup failure`);
            }
            metrics.startBatchingProcess();
        }
    };

    const login = async () => {
        if (!session.current) {
            captureMessage(getErrorMessage('Missing session'));
            return;
        }

        await onLogin(session.current);
    };

    const value: SignupContextType = {
        domains: domainsData.domains,
        login,
        submitAccountData: (accountData) => updateSignupData({ accountData }),
        submitPaymentData: (options, data) => {
            const paymentData = getPaymentDataFromChargeableCallback(options, data);
            updateSignupData({ paymentData });
        },
        createUser,
        setupUser,
        flowId,
        loading,
        loginUrl,
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
