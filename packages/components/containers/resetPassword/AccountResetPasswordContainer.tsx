import React, { FunctionComponent, useRef } from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router-dom';

import {
    Alert,
    ConfirmModal,
    GenericError,
    Href,
    Label,
    OnLoginCallback,
    PasswordInput,
    PrimaryButton,
    useModals
} from '../../index';
import useResetPassword, { STEPS } from './useResetPassword';
import ResetUsernameInput from './ResetUsernameInput';
import ResetPasswordInput from './ResetPasswordInput';
import ResetTokenInput from './ResetTokenInput';
import ResetDangerInput from './ResetDangerInput';
import { Props as AccountPublicLayoutProps } from '../signup/AccountPublicLayout';
import BackButton from '../signup/BackButton';
import SignupLabelInputRow from '../signup/SignupLabelInputRow';
import SignupSubmitRow from '../signup/SignupSubmitRow';

interface Props {
    onLogin: OnLoginCallback;
    Layout: FunctionComponent<AccountPublicLayoutProps>;
}

const AccountResetPasswordContainer = ({ onLogin, Layout }: Props) => {
    const history = useHistory();
    const {
        loading,
        state,
        dangerWord,
        handleRequest,
        handleValidateResetToken,
        handleDanger,
        handleNewPassword,
        setUsername,
        setEmail,
        setPassword,
        setConfirmPassword,
        setToken,
        setDanger,
    } = useResetPassword({ onLogin });

    const { createModal } = useModals();
    const hasModal = useRef<boolean>(false);

    const { step, username, email, password, confirmPassword, danger, token } = state;

    const handleBack = () => {
        history.push('/login');
    };

    if (step === STEPS.REQUEST_RESET_TOKEN) {
        const handleSubmit = async () => {
            await new Promise((resolve, reject) => {
                createModal(
                    <ConfirmModal title={c('Title').t`Confirm reset password`} onConfirm={resolve} onClose={reject}>
                        <Alert type="warning">{c('Info')
                            .t`Resetting your password means your old password and the places it is saved will no longer work. Are you sure you want to reset your password?`}</Alert>
                    </ConfirmModal>
                );
            });
            return handleRequest();
        };
        return (
            <Layout title={c('Title').t`Reset password`} left={<BackButton onClick={handleBack} />}>
                <form
                    className="signup-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (hasModal.current) {
                            return;
                        }
                        hasModal.current = true;
                        handleSubmit()
                            .then(() => (hasModal.current = false))
                            .catch(() => (hasModal.current = false));
                    }}
                >
                    <SignupLabelInputRow
                        label={<Label htmlFor="username">{c('Label').t`Username`}</Label>}
                        input={<ResetUsernameInput id="username" value={username} setValue={setUsername} />}
                    />
                    <SignupLabelInputRow
                        label={<Label htmlFor="email">{c('Label').t`Recovery email`}</Label>}
                        input={<ResetPasswordInput id="email" value={email} setValue={setEmail} />}
                    />
                    <SignupSubmitRow>
                        <PrimaryButton
                            className="pm-button--large flex-item-noshrink onmobile-w100"
                            disabled={!username || !email}
                            loading={loading}
                            type="submit"
                        >{c('Action').t`Get a new password`}</PrimaryButton>
                    </SignupSubmitRow>
                </form>
            </Layout>
        );
    }

    if (step === STEPS.VALIDATE_RESET_TOKEN) {
        return (
            <Layout title={c('Title').t`Reset password`} left={<BackButton onClick={handleBack} />}>
                <form
                    className="signup-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleValidateResetToken();
                    }}
                >
                    <Alert>{c('Info')
                        .t`We've sent a reset code to your recovery email, valid for one hour or until you request a new code. Enter it below to continue.`}</Alert>
                    <Alert type="warning">{c('Info')
                        .t`IMPORTANT: Do not close or navigate away from this page. You will need to enter the reset code into the field below once you receive it.`}</Alert>
                    <SignupLabelInputRow
                        label={<Label htmlFor="reset-token">{c('Label').t`Reset code`}</Label>}
                        input={<ResetTokenInput id="reset-token" value={token} setValue={setToken} />}
                    />
                    <SignupSubmitRow>
                        <PrimaryButton
                            className="pm-button--large onmobile-w100"
                            disabled={!token}
                            loading={loading}
                            type="submit"
                        >{c('Action').t`Reset password`}</PrimaryButton>
                    </SignupSubmitRow>
                </form>
            </Layout>
        );
    }

    if (step === STEPS.DANGER_VERIFICATION) {
        const hereLink = <Href key="0" url="https://mail.protonmail.com/login">{c('Link').t`here`}</Href>;
        return (
            <Layout title={c('Title').t`Reset password`} left={<BackButton onClick={handleBack} />}>
                <form
                    className="signup-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleDanger();
                    }}
                >
                    <Alert
                        type="warning"
                        learnMore="https://protonmail.com/support/knowledge-base/updating-your-login-password/"
                    >{c('Info')
                        .jt`Resetting your password will reset your encryption keys for all Proton related services (Mail and VPN). You will be unable to read your existing messages. If you know your ProtonMail credentials, do NOT reset. You can log in with them ${hereLink}.`}</Alert>
                    <Alert type="warning">{c('Info').t`ALL YOUR DATA WILL BE LOST!`}</Alert>
                    <SignupLabelInputRow
                        label={<Label htmlFor="danger">{c('Label').t`Confirm reset`}</Label>}
                        input={
                            <ResetDangerInput id="danger" value={danger} setValue={setDanger} dangerWord={dangerWord} />
                        }
                    />
                    <Alert learnMore="https://protonmail.com/support/knowledge-base/restoring-encrypted-mailbox/">{c(
                        'Info'
                    ).t`If you remember your old password later, you can recover your existing messages.`}</Alert>
                    <SignupSubmitRow>
                        <PrimaryButton type="submit">{c('Action').t`Reset my password`}</PrimaryButton>
                    </SignupSubmitRow>
                </form>
            </Layout>
        );
    }

    if (step === STEPS.NEW_PASSWORD) {
        return (
            <Layout title={c('Title').t`Reset password`} left={<BackButton onClick={handleBack} />}>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleNewPassword();
                    }}
                >
                    <Alert type="warning">{c('Info').t`Keep this password safe, it cannot be recovered.`}</Alert>
                    <SignupLabelInputRow
                        label={<Label htmlFor="new-password">{c('Label').t`New password`}</Label>}
                        input={
                            <PasswordInput
                                id="new-password"
                                autoFocus
                                value={password}
                                placeholder={c('Placeholder').t`Choose a new password`}
                                onChange={({ target }) => setPassword(target.value)}
                                required
                            />
                        }
                    />
                    <SignupLabelInputRow
                        label={<Label htmlFor="confirm-password">{c('Label').t`Confirm password`}</Label>}
                        input={
                            <PasswordInput
                                id="confirm-password"
                                value={confirmPassword}
                                placeholder={c('Password').t`Confirm new password`}
                                onChange={({ target }) => setConfirmPassword(target.value)}
                                error={password !== confirmPassword ? c('Error').t`Passwords do not match` : undefined}
                                required
                            />
                        }
                    />
                    <Alert type="warning">{c('Info')
                        .t`Do NOT forget this password. If you forget it, you will not be able to login or decrypt your messages.`}</Alert>
                    <SignupSubmitRow>
                        <PrimaryButton
                            disabled={!password || password !== confirmPassword}
                            loading={loading}
                            type="submit"
                        >{c('Action').t`Submit`}</PrimaryButton>
                    </SignupSubmitRow>
                </form>
            </Layout>
        );
    }

    if (step === STEPS.ERROR) {
        return <GenericError />;
    }

    throw new Error('Unknown step');
};

export default AccountResetPasswordContainer;
