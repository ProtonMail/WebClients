import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcShield2CheckFilled } from '@proton/icons/icons/IcShield2CheckFilled';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { MAIL_APP_NAME, MEET_APP_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import { SignupType } from '../../../../../signup/interfaces';
import { usePasswordInputInline } from '../../../../containers/password/usePasswordInput';
import useEmailInput from '../../../../containers/username/useEmailInput';
import { useSignup } from '../../../../context/SignupContext';
import trusted from '../../assets/images/trusted.png';
import Terms from '../../components/Terms';

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
            {c('Signup').t`use your current email.`}
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
            <h1 className="font-arizona lh120 text-5xl lg:text-7xl">
                {step === 'email' ? c('Signup: Meet').t`Sign up, meet privately` : c('Signup').t`Set your password`}
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
                {step === 'email' ? c('Signup: Meet').t`Start using ${MEET_APP_NAME} now` : c('Action').t`Get started`}
            </Button>

            <div className="text-center mt-4">
                <span className="color-success">
                    <IcShield2CheckFilled className="align-text-bottom mr-1" />
                    <span>{c('Info').t`End-to-end encrypted`}</span>
                </span>
            </div>

            {step === 'email' && (
                <>
                    <div className="flex gap-2 flex-nowrap items-center mt-8 mb-0">
                        <img src={trusted} alt="" className="shrink-0" width={126} height={52} />
                        <p className="m-0">
                            {getBoldFormattedText(
                                c('Signup: Meet').t`**Trusted by over 100 million** users and organizations`,
                                'md:block'
                            )}
                        </p>
                    </div>
                    <div className="mt-6">
                        <p className="color-weak m-0">
                            {c('Signup: Meet').t`Own a business?`}{' '}
                            <Href className="color-weak" href={getStaticURL('/business/meet/pricing')} target="_blank">
                                {c('Signup: Meet').t`Get ${PLAN_NAMES[PLANS.MEET_BUSINESS]}`}
                            </Href>
                        </p>
                    </div>
                </>
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
