import React from 'react';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';

import { PrimaryButton } from '../../../components/button';
import SignupSubmitRow from '../../signup/SignupSubmitRow';
import { LoginModel } from '../interface';
import { LoginErrors, LoginSetters } from '../useLoginHelpers';
import { useLoading } from '../../../hooks';
import SignupLabelInputRow from '../../signup/SignupLabelInputRow';
import { Label } from '../../../components/label';
import LoginUnlockInput from '../LoginUnlockInput';

interface Props {
    state: LoginModel;
    setters: LoginSetters;
    errors: LoginErrors;
    onSubmit: () => Promise<void>;
}

const AccountUnlockForm = ({ onSubmit, state, setters, errors }: Props) => {
    const [loading, withLoading] = useLoading();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        withLoading(onSubmit());
    };

    return (
        <form name="unlockForm" className="signup-form" onSubmit={handleSubmit} method="post">
            <SignupLabelInputRow
                label={<Label htmlFor="password">{c('Label').t`Mailbox password`}</Label>}
                input={
                    <LoginUnlockInput
                        password={state.keyPassword}
                        error={errors.keyPassword}
                        setPassword={loading ? noop : setters.keyPassword}
                        id="password"
                    />
                }
            />
            <SignupSubmitRow>
                <PrimaryButton
                    type="submit"
                    size="large"
                    disabled={!state.keyPassword}
                    loading={loading}
                    data-cy-login="submit mailbox password"
                >
                    {c('Action').t`Unlock`}
                </PrimaryButton>
            </SignupSubmitRow>
        </form>
    );
};

export default AccountUnlockForm;
