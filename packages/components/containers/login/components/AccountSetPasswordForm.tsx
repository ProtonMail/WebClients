import { c } from 'ttag';
import React, { ChangeEvent, useState } from 'react';

import SignupSubmitRow from '../../signup/SignupSubmitRow';
import { Label, PasswordInput, PrimaryButton } from '../../../components';
import SignupLabelInputRow from '../../signup/SignupLabelInputRow';
import { LoginModel } from '../interface';
import { LoginErrors, LoginSetters } from '../useLoginHelpers';
import { useLoading } from '../../../hooks';

interface Props {
    state: LoginModel;
    setters: LoginSetters;
    errors: LoginErrors;
    onSubmit: () => Promise<void>;
}
const AccountSetPasswordForm = ({ onSubmit, errors, state, setters }: Props) => {
    const [loading, withLoading] = useLoading();
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitted(true);
        if (errors.newPassword || errors.confirmNewPassword) {
            return;
        }
        withLoading(onSubmit());
    };

    const newPasswordInput = (
        <SignupLabelInputRow
            label={<Label htmlFor="login">{c('Label').t`New password`}</Label>}
            input={
                <PasswordInput
                    id="password"
                    name="password"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    value={state.newPassword}
                    onChange={({ target }: ChangeEvent<HTMLInputElement>) => setters.newPassword(target.value)}
                    error={errors.newPassword}
                    isSubmitted={isSubmitted}
                    required
                />
            }
        />
    );

    const confirmNewPasswordInput = (
        <SignupLabelInputRow
            label={<Label htmlFor="password-repeat">{c('Label').t`Confirm password`}</Label>}
            input={
                <PasswordInput
                    id="password-repeat"
                    name="password-repeat"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    value={state.confirmNewPassword}
                    onChange={({ target }: ChangeEvent<HTMLInputElement>) => setters.confirmNewPassword(target.value)}
                    error={errors.confirmNewPassword}
                    isSubmitted={isSubmitted}
                    required
                />
            }
        />
    );

    return (
        <form name="setPasswordForm" className="signup-form" onSubmit={handleSubmit} method="post">
            {newPasswordInput}
            {confirmNewPasswordInput}
            <SignupSubmitRow>
                <PrimaryButton type="submit" className="button--large" loading={loading} data-cy-login="submit">
                    {c('Action').t`Confirm`}
                </PrimaryButton>
            </SignupSubmitRow>
        </form>
    );
};

export default AccountSetPasswordForm;
