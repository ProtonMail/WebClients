import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { useActorRef, useSelector } from '@xstate/react';

import type { DeferredMnemonicData } from '@proton/account/recovery/recoveryKit/generateDeferredMnemonicData';
import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import { useSilentApi } from '@proton/app-context/useSilentApi';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import type { OnChargeable } from '@proton/payments-hooks/react-extensions/usePaymentFacade';
import {
    type PaymentsContextOptimisticType,
    usePaymentOptimistic,
} from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import type { ExtendedTokenPayment, TokenPayment } from '@proton/payments/core/interface';
import { isV5PaymentToken } from '@proton/payments/core/type-guards';
import { v5PaymentTokenToLegacyPaymentToken } from '@proton/payments/core/utils';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type {
    GetActiveSessionsResult,
    ResumedSessionResult,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { ReferralData } from '@proton/shared/lib/interfaces/referral';

import type { OnLoginCallback, OnLoginCallbackResult } from '../../authSession';
import { useGetAccountKTActivation } from '../../hooks/useGetAccountKTActivation';
import type { AccountData, SignupHumanVerification, SignupInviteParameters, SignupType } from '../../signup/interfaces';
import { sendSignupLoadTelemetry } from '../../signup/signupTelemetry';
import {
    type SignupPaymentsDataConfig,
    type SignupServices,
    createSignupActions,
    createSignupActors,
    createSignupReporting,
} from '../state-machine/signupActors';
import { createSignupOperations } from '../state-machine/signupOperations';
import { signupStateMachine } from '../state-machine/signupStateMachine';
import { AccountFormDataContextProvider, useAccountFormDataContext } from './accountData/AccountFormDataContext';
import type { SignupContextSubscriptionData } from './helpers/handleSetupUser';

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
    loading: { init: boolean };
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

    paymentsDataConfig?: SignupPaymentsDataConfig;

    onLogin: (session: ResumedSessionResult) => Promise<OnLoginCallbackResult | void>;

    /**
     * Configuration for the account form (username/email and password input form)
     */
    accountFormDataConfig: AccountFormDataConfig;

    unverifiedReferralData?: ReferralData;
    onReferralCheckError?: () => void;

    hvMode?: SignupHumanVerification;

    invite?: SignupInviteParameters;
}

const getSubscriptionDataFromChargeableCallback = (
    options: Parameters<SignupContextType['submitPaymentData']>[0],
    {
        chargeablePaymentParameters,
        sourceType,
        source,
        paymentProcessorType,
    }: Parameters<SignupContextType['submitPaymentData']>[1]
): SignupContextSubscriptionData => {
    const legacyTokenPayment: TokenPayment | undefined = isV5PaymentToken(chargeablePaymentParameters)
        ? v5PaymentTokenToLegacyPaymentToken(chargeablePaymentParameters).Payment
        : undefined;

    const extendedTokenPayment: ExtendedTokenPayment = {
        ...legacyTokenPayment,
        paymentMethodType: sourceType,
        paymentMethodValue: source,
        paymentProcessorType,
    };

    return {
        ...options,
        paymentToken: extendedTokenPayment,
    };
};

const InnerSignupContextProvider = (props: SignupContextProviderProps) => {
    const { app, children, flowId, accountFormDataConfig, loginUrl } = props;
    const { APP_NAME } = useConfig();
    const api = useApi();
    const silentApi = useSilentApi();
    const getKtActivation = useGetAccountKTActivation();
    const notifyError = useNotifyErrorHandler();
    const paymentsContext = usePaymentOptimistic();
    // Tracks that *this* provider finished initializing the payments context.
    const [paymentsInitialized, setPaymentsInitialized] = useState(false);

    const services: SignupServices = {
        app,
        flowId,
        build: APP_NAME,
        api,
        silentApi,
        paymentsDataConfig: props.paymentsDataConfig,
        unverifiedReferralData: props.unverifiedReferralData,
        hvMode: props.hvMode,
        invite: props.invite,
        payments: paymentsContext,
        // Set with the payments context's own state, so the page renders both together
        onPaymentsInitialized: () => setPaymentsInitialized(true),
        getKtActivation,
        onPreSubmit: props.onPreSubmit,
        onStartAuth: props.onStartAuth,
        onLogin: props.onLogin,
        onReferralCheckError: props.onReferralCheckError,
    };
    // useActorRef swaps in each render's implementations, so the actors see the latest props
    const actorRef = useActorRef(
        signupStateMachine.provide({
            actors: createSignupActors(services),
            actions: createSignupActions(services),
        })
    );
    const [operations] = useState(() => createSignupOperations(actorRef));

    const initializing = useSelector(actorRef, (snapshot) => snapshot.matches('initializing'));
    const failed = useSelector(actorRef, (snapshot) => snapshot.matches('failed'));
    const domains = useSelector(actorRef, (snapshot) => snapshot.context.domains);
    const domainsLoaded = useSelector(actorRef, (snapshot) => snapshot.context.domainsLoaded);
    const recoveryPhraseData = useSelector(actorRef, (snapshot) => snapshot.context.setupResult?.recoveryPhraseData);

    useEffect(() => {
        const subscription = actorRef.on('error', ({ error }) => notifyError(error));
        return () => subscription.unsubscribe();
    }, [actorRef, notifyError]);

    useEffect(() => {
        if (!paymentsInitialized) {
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
            isTrial: paymentsContext.isTrial,
            initialBillingAddress: paymentsContext.billingAddress,
        });
    }, [paymentsInitialized]);

    if (failed) {
        return <StandardErrorPage />;
    }

    const value: SignupContextType = {
        ...operations,
        app,
        domains,
        submitAccountData: (accountData) => actorRef.send({ type: 'account.submitted', accountData }),
        submitPaymentData: (options, data) =>
            actorRef.send({
                type: 'payment.submitted',
                subscriptionData: getSubscriptionDataFromChargeableCallback(options, data),
            }),
        flowId,
        loading: { init: initializing },
        loginUrl,
        recoveryPhraseData,
        captureSignupSentryMessage: createSignupReporting({ flowId }).captureMessage,
    };

    return (
        <AccountFormDataContextProvider
            defaultEmail={accountFormDataConfig.defaultEmail}
            availableSignupTypes={accountFormDataConfig.availableSignupTypes}
            domains={domains}
            domainsLoaded={domainsLoaded}
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
