import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { LoaderPage } from '@proton/components';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import { CYCLE, PLANS, type PlanIDs } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { APPS } from '@proton/shared/lib/constants';

import { usePrefetchGenerateRecoveryKit } from '../../../containers/recoveryPhrase/useRecoveryKitDownload';
import { SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider, useSignup } from '../../context/SignupContext';
import getAvailablePlansWithCycles from '../../helpers/getAvailablePlansWithCycles';
import DisplayNameStep from './steps/DisplayNameStep';
import RecoveryPhraseStep from './steps/RecoveryPhraseStep';
import AccountDetailsStep from './steps/accountDetails/AccountDetailsStep';

const mailPlus: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.MAIL]: 1 },
};

export const availablePlans = getAvailablePlansWithCycles([mailPlus], [CYCLE.MONTHLY, CYCLE.YEARLY]);

type Step = 'account-details' | 'recovery' | 'display-name' | 'creating-account';

const GreenlandSignupInner = () => {
    const [step, setStep] = useState<Step>('account-details');

    const signup = useSignup();

    const { initializationStatus } = usePaymentOptimistic();

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

const GreenlandSignup = (props: BaseSignupContextProps) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    return (
        <SignupContextProvider
            {...props}
            app="generic"
            flowId="greenland"
            onLogin={async (session) => {
                await props.handleLogin({ data: session, flow: 'signup', appIntent: { app: APPS.PROTONMAIL } });
            }}
            paymentsDataConfig={{
                availablePlans,
                plan: {
                    planIDs: { [PLANS.MAIL]: 1 }, // Auto-select Mail Plus
                    currency: 'EUR',
                    cycle: CYCLE.YEARLY,
                    coupon: 'GREENLAND', // TODO: Add coupon code
                },
                telemetryContext: 'ctx-signup-greenland',
            }}
            accountFormDataConfig={{
                defaultEmail: searchParams.get('email') || '',
                availableSignupTypes: new Set([SignupType.Proton]),
            }}
        >
            <GreenlandSignupInner />
        </SignupContextProvider>
    );
};

export default GreenlandSignup;
