import { useEffect, useState } from 'react';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';

import { useEligibleTrials } from '@proton/account/eligibleTrials/hooks';
import { usePrefetchGenerateRecoveryKit } from '@proton/account/recovery/recoveryKit/usePrefetchGenerateRecoveryKit';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { LoaderPage } from '@proton/components';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { useFlagsStatus } from '@proton/unleash/proxy';

import { SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider, useSignup } from '../../context/SignupContext';
import * as signupSearchParams from '../../helpers/signupSearchParams';
import DisplayNameStep from '../genericStart/steps/DisplayNameStep';
import ReferralPlans from './ReferralPlans';
import {
    REFERRAL_DEAFULT_CYCLE,
    REFERRAL_DEFAULT_PLAN,
    type SupportedReferralPlans,
    availableReferralPlans,
    doesPlanPrioritizeExternalSignup,
    getAppIntentFromReferralPlan,
    getReferralSelectedPlan,
} from './helpers/plans';
import PaymentStep from './steps/PaymentStep';
import RecoveryPhraseStep from './steps/RecoveryPhraseStep';
import AccountDetailsStep from './steps/accountDetails/AccountDetailsStep';

type Step = 'account-details' | 'payment' | 'recovery' | 'display-name' | 'creating-account';

const ReferralSignupInner = () => {
    const [step, setStep] = useState<Step>('account-details');

    const signup = useSignup();

    const notifyError = useNotifyErrorHandler();
    const payments = usePaymentOptimistic();
    const { eligibleTrials } = useEligibleTrials();

    /**
     * We have a recovery step in this flow, so let's prefetch the recovery kit
     */
    usePrefetchGenerateRecoveryKit();

    return (
        <>
            {step === 'account-details' && (
                <AccountDetailsStep
                    onSuccess={async () => {
                        if (eligibleTrials.creditCardRequiredPlans.includes(payments.selectedPlan.name)) {
                            setStep('payment');
                            return;
                        }

                        try {
                            await signup.createUser();
                            setStep('creating-account');

                            await signup.setupUser();
                            setStep('recovery');
                        } catch (error) {
                            notifyError(error);
                        }
                    }}
                />
            )}
            {step === 'payment' && (
                <PaymentStep
                    onBack={() => {
                        setStep('account-details');
                    }}
                    onPaymentTokenProcessed={async () => {
                        try {
                            await signup.createUser();
                            setStep('creating-account');

                            await signup.setupUser();

                            setStep('recovery');
                        } catch (error) {
                            notifyError(error);
                        }
                    }}
                />
            )}
            {step === 'recovery' && (
                <RecoveryPhraseStep
                    onContinue={async () => {
                        setStep('display-name');
                    }}
                />
            )}
            {step === 'display-name' && (
                <DisplayNameStep
                    onSubmit={async (displayName) => {
                        await signup.setDisplayName(displayName);

                        await signup.login();
                    }}
                />
            )}

            {step === 'creating-account' && <LoaderPage text="Creating your account" />}
        </>
    );
};

const ReferralSignupRouter = () => {
    const payments = usePaymentOptimistic();

    if (!payments.initializationStatus.triggered) {
        return null;
    }

    return (
        <Switch>
            <Route path={SSO_PATHS.REFERRAL_SIGNUP}>
                <ReferralSignupInner />
            </Route>
            <Route>
                <ReferralPlans />
            </Route>
        </Switch>
    );
};

const ReferralSignup = (props: BaseSignupContextProps) => {
    /**
     * Ensure redux has initialized referral info
     */
    useReferralInfo();

    const payments = usePaymentOptimistic();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const history = useHistory();

    const defaultEmail = searchParams.get('email') || undefined;

    const planParam = signupSearchParams.getPlan(searchParams) || REFERRAL_DEFAULT_PLAN;

    const { fetchEligibleTrials } = useEligibleTrials();

    const { flagsReady } = useFlagsStatus();

    /**
     * Fetch eligible trials from API when referral identifier is available
     */
    useEffect(() => {
        const referralIdentifier = signupSearchParams.getReferralIdentifier(searchParams);
        if (referralIdentifier) {
            void fetchEligibleTrials(referralIdentifier);
        }
    }, []);

    if (!flagsReady) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <CircleLoader size="large" />
            </div>
        );
    }

    return (
        <SignupContextProvider
            {...props}
            app="generic"
            flowId="referral-generic"
            onLogin={async (session) => {
                await props.handleLogin({
                    data: session,
                    flow: 'signup',
                    appIntent: getAppIntentFromReferralPlan(payments.selectedPlan.getPlanName()),
                });
            }}
            paymentsDataConfig={{
                availablePlans: availableReferralPlans,
                plan: {
                    cycle: REFERRAL_DEAFULT_CYCLE,
                    ...getReferralSelectedPlan(planParam as SupportedReferralPlans),
                },
                telemetryContext: 'ctx-signup-referral',
            }}
            accountFormDataConfig={{
                defaultEmail,
                availableSignupTypes:
                    doesPlanPrioritizeExternalSignup(payments.selectedPlan.name) || defaultEmail
                        ? new Set([SignupType.External, SignupType.Proton])
                        : new Set([SignupType.Proton, SignupType.External]),
            }}
            unverifiedReferralData={{
                referralIdentifier: signupSearchParams.getReferralIdentifier(searchParams) || '',
                referralID: signupSearchParams.getReferralID(searchParams),
            }}
            onReferralCheckError={() => {
                history.replace(SSO_PATHS.SIGNUP);
            }}
        >
            <ReferralSignupRouter />
        </SignupContextProvider>
    );
};

export default ReferralSignup;
