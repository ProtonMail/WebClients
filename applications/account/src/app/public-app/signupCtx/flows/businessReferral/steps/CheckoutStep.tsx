import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';

import { useSignup } from '../../../context/SignupContext';
import CheckoutForm from '../components/checkout/CheckoutForm';
import { useValidateReferrer } from '../helpers/useValidateReferrer';

type Step = 'checkout' | 'creating-account' | 'error';

const CheckoutStep = () => {
    const [step, setStep] = useState<Step>('checkout');
    const signup = useSignup();
    const notifyError = useNotifyErrorHandler();
    const isUserSetup = useRef(false);

    const login = async () => {
        try {
            setStep('creating-account');
            await signup.login();
        } catch (error) {
            notifyError(error);
            setStep('error');
        }
    };

    // Landing here directly (e.g. redirected back from the business-referral marketing page)
    // skips the picker, which is normally what validates the referral code — re-run that same
    // check here so an invalid/expired code doesn't silently reach checkout.
    useValidateReferrer({ optional: true });

    return (
        <>
            {step === 'checkout' && (
                <CheckoutForm
                    onPaymentTokenProcessed={async (company) => {
                        try {
                            await signup.createUser();
                        } catch (error) {
                            notifyError(error);
                            return;
                        }

                        setStep('creating-account');

                        try {
                            await signup.setupUser();
                            isUserSetup.current = true;
                        } catch (error) {
                            notifyError(error);
                            setStep('error');
                            return;
                        }

                        // The org name can be set later, it shouldn't prevent the user from logging in
                        if (company) {
                            try {
                                await signup.setOrgName(company);
                            } catch (error) {
                                notifyError(error);
                            }
                        }

                        await login();
                    }}
                />
            )}

            {step === 'creating-account' && <LoaderPage text={c('Signup').t`Creating your account`} />}

            {step === 'error' && (
                <div className="text-center p-8">
                    <h1 className="text-2xl text-bold mb-4">{c('Signup').t`Something went wrong`}</h1>
                    {isUserSetup.current ? (
                        <>
                            <p className="mb-4">{c('Signup')
                                .t`Your account has been created, but we couldn't sign you in.`}</p>
                            <Button color="norm" onClick={login}>
                                {c('Action').t`Try again`}
                            </Button>
                        </>
                    ) : (
                        <p>{c('Signup').t`We couldn't finish setting up your account. Please contact support.`}</p>
                    )}
                </div>
            )}
        </>
    );
};

export default CheckoutStep;
