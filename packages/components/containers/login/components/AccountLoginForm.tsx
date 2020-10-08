import { c } from 'ttag';
import React from 'react';
import { noop } from 'proton-shared/lib/helpers/function';

import AccountSupportDropdown from '../../heading/AccountSupportDropdown';
import SignupSubmitRow from '../../signup/SignupSubmitRow';
import { PrimaryButton, Label } from '../../../components';
import SignupLabelInputRow from '../../signup/SignupLabelInputRow';
import LoginUsernameInput from '../LoginUsernameInput';
import LoginPasswordInput from '../LoginPasswordInput';
import { LoginModel } from '../interface';
import { LoginSetters } from '../useLoginHelpers';
import { useLoading } from '../../../hooks';

interface Props {
    state: LoginModel;
    setters: LoginSetters;
    onSubmit: () => Promise<void>;
}
const AccountLoginForm = ({ onSubmit, state, setters }: Props) => {
    const [loading, withLoading] = useLoading();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        withLoading(onSubmit());
    };

    return (
        <form name="loginForm" className="signup-form" onSubmit={handleSubmit}>
            <SignupLabelInputRow
                label={<Label htmlFor="login">{c('Label').t`Email or Username`}</Label>}
                input={
                    <LoginUsernameInput
                        id="login"
                        username={state.username}
                        setUsername={loading ? noop : setters.username}
                    />
                }
            />
            <SignupLabelInputRow
                label={<Label htmlFor="password">{c('Label').t`Password`}</Label>}
                input={
                    <LoginPasswordInput
                        id="password"
                        password={state.password}
                        setPassword={loading ? noop : setters.password}
                    />
                }
            />
            <div className="mb1">
                <AccountSupportDropdown noCaret className="link">
                    {c('Action').t`Need help?`}
                </AccountSupportDropdown>
            </div>
            <SignupSubmitRow>
                <PrimaryButton type="submit" className="pm-button--large" loading={loading} data-cy-login="submit">
                    {c('Action').t`Sign in`}
                </PrimaryButton>
            </SignupSubmitRow>
        </form>
    );
};

export default AccountLoginForm;
