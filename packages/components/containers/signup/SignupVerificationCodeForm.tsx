import React, { ChangeEvent, FormEvent } from 'react';
import { c } from 'ttag';

import { VerificationCodeInput, InlineLinkButton } from '../../components';
import { SignupModel, SignupErrors } from './interfaces';
import { PrimaryButton } from '../../components/button';
import SignupSubmitRow from './SignupSubmitRow';

interface Props {
    model: SignupModel;
    onChange: (model: SignupModel) => void;
    onResend: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    errors: SignupErrors;
    loading: boolean;
}

const SignupVerificationCodeForm = ({ model, onChange, onSubmit, onResend, errors, loading }: Props) => {
    const disableSubmit = !!errors.verificationCode;
    const destinationBold = <strong key="destination">{model.email}</strong>;
    return (
        <form name="humanForm" onSubmit={onSubmit} method="post">
            <div className="mb1">{c('Info').t`For security reasons, please verify that your are not a robot.`}</div>
            <div className="mb1">{c('Info')
                .jt`Enter the verification code that was sent to ${destinationBold}. If you don't find the email in your inbox, please check your spam folder.`}</div>

            <label className="label" htmlFor="verification-code">{c('Label').t`Verification code`}</label>
            <VerificationCodeInput
                id="verification-code"
                className="mb0-5"
                value={model.verificationCode}
                error={errors.verificationCode}
                onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                    onChange({ ...model, verificationCode: target.value })
                }
                autoFocus
                required
            />
            <div className="mb1">
                <InlineLinkButton disabled={loading} onClick={onResend}>{c('Action')
                    .t`Did not receive the code?`}</InlineLinkButton>
            </div>
            <SignupSubmitRow>
                <PrimaryButton className="button--large" type="submit" disabled={disableSubmit} loading={loading}>
                    {c('Action').t`Verify`}
                </PrimaryButton>
            </SignupSubmitRow>
        </form>
    );
};

export default SignupVerificationCodeForm;
