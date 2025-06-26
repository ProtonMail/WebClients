import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { LoaderPage } from '@proton/components';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import { CYCLE } from '@proton/payments';

import { SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider, useSignup } from '../../context/SignupContext';
import DisplayNameStep from './steps/DisplayNameStep';
import AccountDetailsStep from './steps/accountDetails/AccountDetailsStep';

type Step = 'account-details' | 'display-name' | 'creating-account';

const GenericStartSignupInner = () => {
    const [step, setStep] = useState<Step>('account-details');

    const signup = useSignup();

    const notifyError = useNotifyErrorHandler();

    return (
        <>
            {step === 'account-details' && (
                <AccountDetailsStep
                    onSuccess={async () => {
                        try {
                            await signup.createUser();
                            setStep('creating-account');

                            await signup.setupUser();

                            setStep('display-name');
                        } catch (error) {
                            notifyError(error);
                        }
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

const GenericStartSignup = (props: BaseSignupContextProps) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    return (
        <SignupContextProvider
            {...props}
            app="generic"
            flowId="generic"
            onLogin={(session) => {
                return props.onLogin({ data: session, flow: 'signup', appIntent: undefined });
            }}
            paymentsDataConfig={{
                availablePlans: [],
                plan: {
                    planIDs: {}, // free only - empty planIDs means free plan
                    currency: undefined,
                    cycle: CYCLE.YEARLY, // free plans still need a cycle value
                    coupon: undefined,
                },
            }}
            accountFormDataConfig={{
                defaultEmail: searchParams.get('email') || '',
                availableSignupTypes: new Set([SignupType.Proton, SignupType.External]),
            }}
        >
            <GenericStartSignupInner />
        </SignupContextProvider>
    );
};

export default GenericStartSignup;
