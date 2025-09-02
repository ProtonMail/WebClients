import { useState } from 'react';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';

import { LoaderPage } from '@proton/components';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import { usePaymentOptimistic, usePaymentsInner } from '@proton/payments/ui';
import { SSO_PATHS } from '@proton/shared/lib/constants';

import { usePrefetchGenerateRecoveryKit } from '../../../containers/recoveryPhrase/useRecoveryKitDownload';
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
    getAppIntentFromReferralPlan,
    getReferralSelectedPlan,
    plansRequiringPaymentToken,
} from './helpers/plans';
import PaymentStep from './steps/PaymentStep';
import RecoveryPhraseStep from './steps/RecoveryPhraseStep';
import AccountDetailsStep from './steps/accountDetails/AccountDetailsStep';

type Step = 'account-details' | 'payment' | 'recovery' | 'display-name' | 'creating-account';

const ReferralSignupInner = () => {
    const [step, setStep] = useState<Step>('account-details');
    const history = useHistory();

    const signup = useSignup();

    const notifyError = useNotifyErrorHandler();
    const payments = usePaymentOptimistic();

    /**
     * We have a recovery step in this flow, so let's prefetch the recovery kit
     */
    usePrefetchGenerateRecoveryKit();

    return (
        <>
            {step === 'account-details' && (
                <AccountDetailsStep
                    onBack={() => {
                        history.goBack();
                    }}
                    onSuccess={async () => {
                        if (plansRequiringPaymentToken.includes(payments.selectedPlan.name as SupportedReferralPlans)) {
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
            <Route path={SSO_PATHS.REFERAL_SIGNUP}>
                <ReferralSignupInner />
            </Route>
            <Route>
                <ReferralPlans />
            </Route>
        </Switch>
    );
};

const ReferralSignup = (props: BaseSignupContextProps) => {
    const payments = usePaymentsInner();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const history = useHistory();

    const defaultEmail = searchParams.get('email') || undefined;

    const planParam = signupSearchParams.getPlan(searchParams) || REFERRAL_DEFAULT_PLAN;

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
            }}
            accountFormDataConfig={{
                defaultEmail,
                availableSignupTypes: defaultEmail
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
