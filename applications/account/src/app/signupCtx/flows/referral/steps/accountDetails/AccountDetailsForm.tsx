import { useState } from 'react';

import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { SkeletonLoader } from '@proton/components';
import { IcShield2CheckFilled } from '@proton/icons/icons/IcShield2CheckFilled';
import { PLANS } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { SignupType } from '../../../../../signup/interfaces';
import { usePasswordInputInline } from '../../../../containers/password/usePasswordInput';
import useEmailInput from '../../../../containers/username/useEmailInput';
import { useSignup } from '../../../../context/SignupContext';
import clubic from '../../assets/images/clubic.svg';
import pcmag from '../../assets/images/pcmag.svg';
import wired from '../../assets/images/wired.svg';
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
    const [referralInfo, loadingReferralInfo] = useReferralInfo();

    const [submitting, setSubmitting] = useState(false);

    const payments = usePaymentOptimistic();
    const { selectedPlan } = payments;

    const isPaidPlan = selectedPlan.name !== PLANS.FREE;

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

    const headline = isPaidPlan
        ? c('Signup').t`Try ${BRAND_NAME} for 14 days free`
        : c('Signup').t`Sign up to get everything ${BRAND_NAME} has to offer`;

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
            <h1 className="font-arizona text-semibold text-8xl lh120">
                {step === 'email' ? headline : c('Signup').t`Set your password`}
            </h1>

            {isPaidPlan && (
                <div className="mt-0 mb-6">
                    {loadingReferralInfo ? (
                        <SkeletonLoader width="70%" height="1.4rem" />
                    ) : (
                        <p className="m-0 text-lg">
                            {c('Signup')
                                .t`And get ${referralInfo.uiData.refereeRewardAmount} in credits, if you subscribe.`}
                        </p>
                    )}
                </div>
            )}

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
                <div className="grid grid-cols-3 gap-2 mt-8 lg:mt-12 mb-4 lg:mb-0">
                    <img src={pcmag} alt="" className="max-w-full mx-auto" width={65} height={70} />
                    <img src={wired} alt="" className="max-w-full mx-auto" width={81} height={70} />
                    <img src={clubic} alt="" className="max-w-full mx-auto" width={68} height={70} />
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
