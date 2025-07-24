import { useState } from 'react';

import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms';
import { IcShield2CheckFilled } from '@proton/icons';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { SignupType } from '../../../../../signup/interfaces';
import { usePasswordInputInline } from '../../../../accountDetailsInputs/password/usePasswordInput';
import useEmailInput from '../../../../accountDetailsInputs/username/useEmailInput';
import Terms from '../../../../components/Terms';
import { useSignup } from '../../../../context/SignupContext';
import digitaltrends from '../../assets/images/digitaltrends.svg';
import pcmag from '../../assets/images/pcmag.svg';
import techradar from '../../assets/images/techradar.svg';

type Step = 'email' | 'password';

const SwitchSignupType = () => {
    const signup = useSignup();

    const { availableSignupTypes, selectedSignupType, focusEmail } = signup.accountForm;

    if (availableSignupTypes.size <= 1) {
        return null;
    }

    const handleSwitchType = (signupType: SignupType) => {
        // Reset verification parameters if email is changed
        signup.accountForm.setSignupType(signupType);
        focusEmail(signupType);
    };

    const externalButton = (
        <InlineLinkButton
            key="external-account-switch"
            onClick={() => handleSwitchType(SignupType.Proton)}
            className="color-norm"
        >
            {c('Signup').t`get a secure ${MAIL_APP_NAME} address.`}
        </InlineLinkButton>
    );

    const internalButton = (
        <InlineLinkButton
            key="internal-account-switch"
            onClick={() => handleSwitchType(SignupType.External)}
            className="color-norm"
        >
            {c('Signup').t`use your own email.`}
        </InlineLinkButton>
    );

    return (
        <p className="mt-4 mb-6 mr-auto">
            {selectedSignupType === SignupType.External
                ? // translator: "Use your email, or get a secure Proton Mail address."
                  c('Signup').jt`Use your email, or ${externalButton}`
                : // translator: "Get a secure Proton Mail address, or use your own email."
                  c('Signup').jt`Get a secure ${MAIL_APP_NAME} address, or ${internalButton}`}
        </p>
    );
};

const AccountDetailsForm = ({ onSuccess }: { onSuccess: () => Promise<void> }) => {
    const [step, setStep] = useState<Step>('email');
    const signup = useSignup();
    const [submitting, setSubmitting] = useState(false);

    const handleRequestSubmit = () => {
        signup.accountForm.refs.form.current?.requestSubmit();
    };
    const { emailInput, loadingChallenge } = useEmailInput({
        autoFocus: step === 'email',
        onSubmit: handleRequestSubmit,
        loading: submitting,
        bigger: true,
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
            <h1 className="font-arizona text-semibold text-8xl">
                {step === 'email' ? c('Signup').t`Sign up, protect your files` : c('Signup').t`Set your password`}
            </h1>
            <SwitchSignupType />

            {emailInput}

            {step === 'password' && <div className="fade-in-up">{passwordInputs}</div>}

            <Button
                {...(() => {
                    if (submitting) {
                        return { loading: true };
                    }
                    if (loadingChallenge) {
                        return {
                            disabled: true,

                            noDisabledStyles: true,
                        };
                    }
                })()}
                loading={submitting}
                disabled={loadingChallenge}
                noDisabledStyles={
                    // Avoid layout shift
                    loadingChallenge
                }
                size="large"
                color="norm"
                type="submit"
                fullWidth
                pill
                className="mt-2 py-4 text-semibold"
            >
                {step === 'email' ? c('Action').t`Continue` : c('Action').t`Get started`}
            </Button>

            <div className="text-center mt-4">
                <span className="color-success">
                    <IcShield2CheckFilled className="align-text-bottom mr-1" />
                    <span>{c('Info').t`End-to-end encrypted`}</span>
                </span>
            </div>

            {step === 'email' && (
                <div className="grid grid-cols-3 mt-8 lg:mt-12">
                    <img src={techradar} alt="" className="w-full" width={144} height={78} />
                    <img src={pcmag} alt="" className="w-full" width={144} height={78} />
                    <img src={digitaltrends} alt="" className="w-full" width={144} height={78} />
                </div>
            )}

            <footer className={clsx('mt-8', step === 'email' && 'visibility-hidden')}>
                <Terms className="mt-4" />
            </footer>
        </form>
    );
};

export default AccountDetailsForm;
