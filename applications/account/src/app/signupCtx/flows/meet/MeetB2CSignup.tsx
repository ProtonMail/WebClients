import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { LoaderPage } from '@proton/components';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import { CYCLE } from '@proton/payments';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { redirectTo } from '@proton/shared/lib/helpers/browser';
import { useFlag, useFlagsStatus } from '@proton/unleash';

import { usePrefetchGenerateRecoveryKit } from '../../../containers/recoveryPhrase/useRecoveryKitDownload';
import { SignupHVMode, SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider, useSignup } from '../../context/SignupContext';
import DisplayNameStep from './steps/DisplayNameStep';
import RecoveryPhraseStep from './steps/RecoveryPhraseStep';
import AccountDetailsStep from './steps/accountDetails/AccountDetailsStep';

type Step = 'account-details' | 'recovery' | 'display-name' | 'creating-account';

const MeetB2CSignupInner = () => {
    const [step, setStep] = useState<Step>('account-details');

    const signup = useSignup();

    const notifyError = useNotifyErrorHandler();

    /**
     * We have a recovery step in this flow, so let's prefetch the recovery kit
     */
    usePrefetchGenerateRecoveryKit();

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

const MeetB2CSignup = (props: BaseSignupContextProps) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const { flagsReady } = useFlagsStatus();
    const isMeetPlansEnabled = useFlag('MeetPlans');
    useEffect(() => {
        if (flagsReady && !isMeetPlansEnabled) {
            redirectTo(SSO_PATHS.SIGNUP);
        }
    }, [flagsReady, isMeetPlansEnabled]);

    return (
        <SignupContextProvider
            {...props}
            app={APPS.PROTONMEET}
            flowId="meet-b2c"
            hvMode={SignupHVMode.CRO}
            onLogin={async (session) => {
                await props.handleLogin({ data: session, flow: 'signup', appIntent: { app: APPS.PROTONMEET } });
            }}
            paymentsDataConfig={{
                availablePlans: [],
                plan: {
                    planIDs: {}, // free only - empty planIDs means free plan
                    currency: undefined,
                    cycle: CYCLE.YEARLY, // free plans still need a cycle value
                    coupon: undefined,
                },
                telemetryContext: 'ctx-signup-meet',
            }}
            accountFormDataConfig={{
                defaultEmail: searchParams.get('email') || '',
                availableSignupTypes: new Set([SignupType.Proton, SignupType.External]),
            }}
        >
            <MeetB2CSignupInner />
        </SignupContextProvider>
    );
};

export default MeetB2CSignup;
