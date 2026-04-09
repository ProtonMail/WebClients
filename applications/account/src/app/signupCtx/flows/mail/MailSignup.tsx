import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { LoaderPage } from '@proton/components';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import { CYCLE } from '@proton/payments/core/constants';
import { APPS } from '@proton/shared/lib/constants';

import { usePrefetchGenerateRecoveryKit } from '../../../containers/recoveryPhrase/useRecoveryKitDownload';
import { SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider, useSignup } from '../../context/SignupContext';
import useMailSignupVariant from './hooks/useMailSignupVariant';
import DisplayNameStep from './steps/DisplayNameStep';
import RecoveryPhraseStep from './steps/RecoveryPhraseStep';
import AccountDetailsStep from './steps/accountDetails/AccountDetailsStep';

type Step = 'account-details' | 'recovery' | 'display-name' | 'creating-account';

const MailSignupInner = () => {
    const [step, setStep] = useState<Step>('account-details');

    const signup = useSignup();

    const notifyError = useNotifyErrorHandler();

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

            {step === 'creating-account' && <LoaderPage text={c('Info').t`Creating your account`} />}
        </>
    );
};

const MailSignup = (props: BaseSignupContextProps) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const variant = useMailSignupVariant();

    return (
        <SignupContextProvider
            {...props}
            app={APPS.PROTONMAIL}
            flowId={`mail-free-${variant}`}
            onLogin={async (session) => {
                await props.handleLogin({ data: session, flow: 'signup', appIntent: { app: APPS.PROTONMAIL } });
            }}
            paymentsDataConfig={{
                availablePlans: [],
                plan: {
                    planIDs: {},
                    currency: undefined,
                    cycle: CYCLE.YEARLY,
                    coupon: undefined,
                },
                telemetryContext: 'ctx-signup-mail',
            }}
            accountFormDataConfig={{
                defaultEmail: searchParams.get('email') || '',
                availableSignupTypes: new Set([SignupType.Proton]),
            }}
        >
            <MailSignupInner />
        </SignupContextProvider>
    );
};

export default MailSignup;
