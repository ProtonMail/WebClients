import React from 'react';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';

import { InlineLinkButton, PrimaryButton } from '../../../components/button';
import SignupSubmitRow from '../../signup/SignupSubmitRow';
import { LoginModel } from '../interface';
import { LoginSetters } from '../useLoginHelpers';
import { useLoading } from '../../../hooks';
import SignupLabelInputRow from '../../signup/SignupLabelInputRow';
import { Label } from '../../../components/label';
import LoginTotpInput from '../LoginTotpInput';
import LoginRecoveryCodeInput from '../LoginRecoveryCodeInput';

interface Props {
    state: LoginModel;
    setters: LoginSetters;
    onSubmit: () => Promise<void>;
}
const AccountTOTPForm = ({ onSubmit, state, setters }: Props) => {
    const [loading, withLoading] = useLoading();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        withLoading(onSubmit());
    };

    const totpForm = (
        <SignupLabelInputRow
            label={<Label htmlFor="twoFa">{c('Label').t`Two-factor authentication code`}</Label>}
            input={<LoginTotpInput totp={state.totp} setTotp={loading ? noop : setters.totp} id="twoFa" />}
        />
    );

    const recoveryForm = (
        <SignupLabelInputRow
            label={<Label htmlFor="twoFa">{c('Label').t`Recovery code`}</Label>}
            input={
                <LoginRecoveryCodeInput code={state.totp} setCode={loading ? noop : setters.totp} id="recoveryCode" />
            }
        />
    );

    return (
        <form name="totpForm" className="signup-form" onSubmit={handleSubmit} autoComplete="off">
            {state.isTotpRecovery ? recoveryForm : totpForm}
            <div className="mb1">
                <InlineLinkButton
                    onClick={() => {
                        setters.totp('');
                        setters.isTotpRecovery(!state.isTotpRecovery);
                    }}
                >
                    {state.isTotpRecovery
                        ? c('Action').t`Use two-factor authentication code`
                        : c('Action').t`Use recovery code`}
                </InlineLinkButton>
            </div>
            <SignupSubmitRow>
                <PrimaryButton
                    type="submit"
                    disabled={state.totp.length < 6}
                    className="pm-button--large"
                    loading={loading}
                    data-cy-login="submit TOTP"
                >
                    {c('Action').t`Authenticate`}
                </PrimaryButton>
            </SignupSubmitRow>
        </form>
    );
};

export default AccountTOTPForm;
