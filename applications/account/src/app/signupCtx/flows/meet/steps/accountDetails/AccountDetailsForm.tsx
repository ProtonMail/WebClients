import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { IcShield2CheckFilled } from '@proton/icons/icons/IcShield2CheckFilled';
import { BRAND_NAME, MAIL_APP_NAME, MEET_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { SignupType } from '../../../../../signup/interfaces';
import { usePasswordInputInline } from '../../../../containers/password/usePasswordInput';
import useEmailInput from '../../../../containers/username/useEmailInput';
import { useSignup } from '../../../../context/SignupContext';
import { MeetSignupIntent, getMeetSignupIntentFromSearchParams } from '../../helpers/path';

const getMeetAccountDetailsHeadline = (meetIntent: MeetSignupIntent | undefined) => {
    if (meetIntent === MeetSignupIntent.Room) {
        return c('Signup: Meet').t`Create your ${BRAND_NAME} account to create a room`;
    }
    if (meetIntent === MeetSignupIntent.Schedule) {
        return c('Signup: Meet').t`Create your ${BRAND_NAME} account and schedule meetings`;
    }
    return c('Signup: Meet').t`Create your ${BRAND_NAME} account for ${MEET_SHORT_APP_NAME}`;
};

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
        <InlineLinkButton key="external-account-switch" onClick={() => handleSwitchType(SignupType.Proton)}>
            {c('Signup').t`get a secure ${MAIL_APP_NAME} address.`}
        </InlineLinkButton>
    );

    const internalButton = (
        <InlineLinkButton key="internal-account-switch" onClick={() => handleSwitchType(SignupType.External)}>
            {c('Signup').t`use your current email.`}
        </InlineLinkButton>
    );

    return (
        <p className="mt-4 mb-3 mr-auto">
            {selectedSignupType === SignupType.External
                ? // translator: "Use your email, or get a secure Proton Mail address."
                  c('Signup').jt`Use your email, or ${externalButton}`
                : // translator: "Get a secure Proton Mail address, or use your own email."
                  c('Signup').jt`Get a secure ${MAIL_APP_NAME} address, or ${internalButton}`}
        </p>
    );
};

const AccountDetailsForm = ({ onSuccess }: { onSuccess: () => Promise<void> }) => {
    const location = useLocation();
    const signup = useSignup();
    const [submitting, setSubmitting] = useState(false);
    const meetIntent = getMeetSignupIntentFromSearchParams(new URLSearchParams(location.search));
    const { selectedSignupType } = signup.accountForm;

    const handleRequestSubmit = () => {
        signup.accountForm.refs.form.current?.requestSubmit();
    };
    const { emailInput, loadingChallenge } = useEmailInput({
        autoFocus: true,
        onSubmit: handleRequestSubmit,
        loading: submitting,
        inputClassName: 'meet-signup-variables meet-signup-input-wrapper pt-0.5',
        emailLabelHidden: true,
        usernameLabelHidden: true,
        placeholder: selectedSignupType === SignupType.External ? c('Signup label').t`Your email` : undefined,
    });
    const { passwordInputs } = usePasswordInputInline({
        loading: submitting,
        placeholder: c('Signup label').t`Your password`,
    });

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            await signup.accountForm.getIsValid({ passwords: false });
            const accountData = await signup.accountForm.getValidAccountData({ passwords: true });
            signup.submitAccountData(accountData);
            await onSuccess();
        } catch {
            // Ignore, not valid
        } finally {
            setSubmitting(false);
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
            <h1 className="font-arizona lh120 text-5xl lg:text-7xl text-center mb-8">
                {getMeetAccountDetailsHeadline(meetIntent)}
            </h1>

            <SwitchSignupType />

            {emailInput}

            <div className="meet-signup-input-wrapper">{passwordInputs}</div>

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
                className="mt-2 py-4 text-semibold meet-signup-cta"
            >
                {c('Action').t`Continue`}
            </Button>

            <div className="text-center mt-4">
                <span className="color-success">
                    <IcShield2CheckFilled className="align-text-bottom mr-1" />
                    <span>{c('Info').t`End-to-end encrypted`}</span>
                </span>
            </div>
        </form>
    );
};

export default AccountDetailsForm;
