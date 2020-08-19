import React, { ChangeEvent, FormEvent } from 'react';
import { c } from 'ttag';

import { VerificationCodeInput, InlineLinkButton, Alert } from '../../components';
import { SignupModel, SignupErrors } from './interfaces';
import { PrimaryButton } from '../../components/button';
import SignupLabelInputRow from './SignupLabelInputRow';
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
        <form name="humanForm" onSubmit={onSubmit}>
            <Alert>{c('Info').t`For security reasons, please verify that your are not a robot.`}</Alert>
            <SignupLabelInputRow
                label={
                    <label htmlFor="verification-code">{c('Label')
                        .jt`Enter the verification code that was sent to ${destinationBold}. If you don't find the email in your inbox, please check your spam folder`}</label>
                }
                input={
                    <VerificationCodeInput
                        id="verification-code"
                        className="mb1"
                        value={model.verificationCode}
                        error={errors.verificationCode}
                        onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                            onChange({ ...model, verificationCode: target.value })
                        }
                        autoFocus
                        required
                    />
                }
            />
            <div className="mb1">
                <InlineLinkButton disabled={loading} onClick={onResend}>{c('Action')
                    .t`Did not receive the code?`}</InlineLinkButton>
            </div>
            <SignupSubmitRow>
                <PrimaryButton className="pm-button--large" type="submit" disabled={disableSubmit} loading={loading}>
                    {c('Action').t`Verify`}
                </PrimaryButton>
            </SignupSubmitRow>
        </form>
    );
};

export default SignupVerificationCodeForm;
