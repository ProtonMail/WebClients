import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { LoaderPage } from '@proton/components';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import type { PlanIDs } from '@proton/payments';
import { CYCLE, PLANS, hasFreePlanIDs } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { APPS } from '@proton/shared/lib/constants';

import { usePrefetchGenerateRecoveryKit } from '../../../containers/recoveryPhrase/useRecoveryKitDownload';
import { SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider, useSignup } from '../../context/SignupContext';
import getAvailablePlansWithCycles from '../../helpers/getAvailablePlansWithCycles';
import * as signupSearchParams from '../../helpers/signupSearchParams';
import DisplayNameStep from './steps/DisplayNameStep';
import PaymentStep from './steps/PaymentStep';
import RecoveryPhraseStep from './steps/RecoveryPhraseStep';
import AccountDetailsStep from './steps/accountDetails/AccountDetailsStep';

type Step = 'account-details' | 'payment' | 'recovery' | 'display-name' | 'creating-account';

const MeetB2CPlanSignupInner = () => {
    const [step, setStep] = useState<Step>('account-details');

    const signup = useSignup();
    const { options, initializationStatus } = usePaymentOptimistic();

    const notifyError = useNotifyErrorHandler();

    /**
     * We have a recovery step in this flow, so let's prefetch the recovery kit
     */
    usePrefetchGenerateRecoveryKit();

    /**
     * Prevent content flashes where selected plan is initially the default before initialization occurs
     */
    if (!initializationStatus.triggered) {
        return null;
    }

    return (
        <>
            {step === 'account-details' && (
                <AccountDetailsStep
                    onSuccess={async () => {
                        const isFree = hasFreePlanIDs(options.planIDs);
                        if (isFree) {
                            try {
                                await signup.createUser();
                                setStep('creating-account');

                                await signup.setupUser();

                                setStep('recovery');
                            } catch (error) {
                                notifyError(error);
                            }
                        } else {
                            setStep('payment');
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

const meetB2C: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.MEET]: 1 },
};

export const availablePlans = getAvailablePlansWithCycles([meetB2C], [CYCLE.MONTHLY, CYCLE.YEARLY]);

const MeetB2CPlanSignup = (props: BaseSignupContextProps) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    return (
        <SignupContextProvider
            {...props}
            app={APPS.PROTONMEET}
            flowId="meet-b2c-plan"
            onLogin={async (session) => {
                await props.handleLogin({ data: session, flow: 'signup', appIntent: { app: APPS.PROTONMEET } });
            }}
            paymentsDataConfig={{
                availablePlans,
                plan: {
                    planIDs: {
                        [PLANS.MEET]: 1,
                    },
                    currency: signupSearchParams.getCurrency(searchParams),
                    cycle: signupSearchParams.getCycle(searchParams) || CYCLE.MONTHLY,
                    coupon: signupSearchParams.getCoupon(searchParams),
                },
                telemetryContext: 'ctx-signup-meet-b2c-plan',
            }}
            accountFormDataConfig={{
                defaultEmail: searchParams.get('email') || '',
                availableSignupTypes: new Set([SignupType.External, SignupType.Proton]),
            }}
        >
            <MeetB2CPlanSignupInner />
        </SignupContextProvider>
    );
};

export default MeetB2CPlanSignup;
