import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcShield2CheckFilled } from '@proton/icons/icons/IcShield2CheckFilled';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import Terms from '../../../../components/Terms';
import { usePasswordInputInline } from '../../../../containers/password/usePasswordInput';
import useEmailInput from '../../../../containers/username/useEmailInput';
import { useSignup } from '../../../../context/SignupContext';
import cybernews from '../../assets/images/cybernews.svg';
import pcmag from '../../assets/images/pcmag.svg';
import slashdot from '../../assets/images/slashdot.svg';
import useMailSignupVariant, { MAIL_SIGNUP_VARIANTS } from '../../hooks/useMailSignupVariant';

type Step = 'email' | 'password';

const AccountDetailsForm = ({ onSuccess }: { onSuccess: () => Promise<void> }) => {
    const [step, setStep] = useState<Step>('email');
    const signup = useSignup();
    const [submitting, setSubmitting] = useState(false);
    const variant = useMailSignupVariant();

    const handleRequestSubmit = () => {
        signup.accountForm.refs.form.current?.requestSubmit();
    };
    const { emailInput, loadingChallenge } = useEmailInput({
        autoFocus: step === 'email',
        onSubmit: handleRequestSubmit,
        loading: submitting,
        bigger: true,
        usernameLabel: c('Signup label').t`Email address`,
    });
    const { passwordInputs } = usePasswordInputInline({
        autoFocus: step === 'password',
        loading: submitting,
        bigger: true,
    });

    const handleSubmit = async () => {
        if (step === 'email') {
            try {
                setSubmitting(true);
                if (await signup.accountForm.getIsValid({ passwords: false })) {
                    setStep('password');
                }
            } catch {
                // Ignore, not valid
            } finally {
                setSubmitting(false);
            }
        }

        if (step === 'password') {
            try {
                setSubmitting(true);
                const accountData = await signup.accountForm.getValidAccountData({ passwords: true });
                signup.submitAccountData(accountData);
                await onSuccess();
            } finally {
                setSubmitting(false);
            }
        }
    };

    return (
        <form
            ref={signup.accountForm.refs.form}
            name="accountForm"
            onSubmit={(e) => {
                e.preventDefault();
                if (submitting) {
                    return;
                }
                handleSubmit().catch(noop);
            }}
            method="post"
            autoComplete="off"
            noValidate
            className="w-full"
        >
            {variant === MAIL_SIGNUP_VARIANTS.A && (
                <h1 className="font-arizona lh120 text-5xl lg:text-7xl">
                    {step === 'email'
                        ? c('Signup').t`Sign up to get everything ${BRAND_NAME} has to offer`
                        : c('Signup').t`Set your password`}
                </h1>
            )}
            {(variant === MAIL_SIGNUP_VARIANTS.B || variant === MAIL_SIGNUP_VARIANTS.C) && (
                <h1 className="font-arizona lh120 text-5xl lg:text-7xl">
                    {step === 'email'
                        ? c('Signup').t`Keep your conversations private with ${MAIL_APP_NAME}`
                        : c('Signup').t`Set your password`}
                </h1>
            )}

            <p className="mt-4 mb-6 mr-auto">
                {c('Signup').t`Choose a secure ${MAIL_APP_NAME} address to get started`}
            </p>

            {emailInput}

            {step === 'password' && <div className="fade-in-up">{passwordInputs}</div>}

            <Button
                loading={submitting}
                disabled={loadingChallenge}
                noDisabledStyles={loadingChallenge}
                size="large"
                color="norm"
                type="submit"
                fullWidth
                pill
                className="mt-2 py-4 text-semibold"
            >
                {step === 'email' ? c('Action').t`Create free account now` : c('Action').t`Get started`}
            </Button>

            <div className="text-center mt-4">
                <span className="color-success">
                    <IcShield2CheckFilled className="align-text-bottom mr-1" />
                    <span>{c('Info').t`End-to-end encrypted`}</span>
                </span>
            </div>

            {step === 'email' && (
                <div className="grid grid-cols-3 gap-2 mt-8 lg:mt-12 mb-4 lg:mb-0">
                    <img src={cybernews} alt="" className="max-w-full mx-auto" width={113} height={70} />
                    <img src={pcmag} alt="" className="max-w-full mx-auto" width={66} height={70} />
                    <img src={slashdot} alt="" className="max-w-full mx-auto" width={74} height={70} />
                </div>
            )}

            {step === 'password' && (
                <footer className="mt-8">
                    <Terms />
                </footer>
            )}
        </form>
    );
};

export default AccountDetailsForm;
