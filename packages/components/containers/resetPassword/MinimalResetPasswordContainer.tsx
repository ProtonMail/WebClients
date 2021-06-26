import React, { useRef, useState } from 'react';
import { c } from 'ttag';
import { Link } from 'react-router-dom';
import { APPS } from '@proton/shared/lib/constants';
import { confirmPasswordValidator, passwordLengthValidator } from '@proton/shared/lib/helpers/formValidators';

import { Alert, Href, Label, PasswordInput, ConfirmModal, PrimaryButton } from '../../components';
import { GenericError } from '../error';

import { useConfig, useLoading, useModals } from '../../hooks';
import useResetPassword, { STEPS } from './useResetPassword';
import ResetUsernameInput from './ResetUsernameInput';
import ResetPasswordEmailInput from './ResetPasswordEmailInput';
import ResetTokenInput from './ResetTokenInput';
import ResetDangerInput from './ResetDangerInput';
import { OnLoginCallback } from '../app';

interface Props {
    onLogin: OnLoginCallback;
}

const MinimalResetPasswordContainer = ({ onLogin }: Props) => {
    const { state, dangerWord, handleRequest, handleValidateResetToken, handleDanger, handleNewPassword, setters } =
        useResetPassword({ onLogin });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, withLoading] = useLoading();

    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const hasModal = useRef<boolean>(false);

    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;

    const { step, username, email, danger, token } = state;

    const passwordError = passwordLengthValidator(password);
    const confirmPasswordError =
        passwordLengthValidator(confirmPassword) || confirmPasswordValidator(password, confirmPassword);

    if (step === STEPS.REQUEST_RESET_TOKEN) {
        const handleSubmit = async () => {
            await new Promise<void>((resolve, reject) => {
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
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (hasModal.current) {
                        return;
                    }
                    hasModal.current = true;
                    withLoading(
                        handleSubmit()
                            .then(() => {
                                hasModal.current = false;
                            })
                            .catch(() => {
                                hasModal.current = false;
                            })
                    );
                }}
            >
                <Alert
                    learnMore={
                        isVPN
                            ? 'https://protonvpn.com/support/reset-protonvpn-account-password/'
                            : 'https://protonmail.com/support/knowledge-base/set-forgot-password-options/'
                    }
                >{c('Info').t`We will send a reset code to your recovery email to reset your password.`}</Alert>
                <Label htmlFor="username" className="sr-only">
                    {c('Label').t`Username`}
                </Label>
                <div className="mb1">
                    <ResetUsernameInput id="username" value={username} setValue={setters.username} />
                </div>
                <Label htmlFor="email" className="sr-only">
                    {c('Label').t`Email`}
                </Label>
                <div className="mb1">
                    <ResetPasswordEmailInput id="email" value={email} setValue={setters.email} />
                </div>
                <div className="flex flex-nowrap flex-justify-space-between mb1">
                    <Link to="/login">{c('Link').t`Back to login`}</Link>
                    <PrimaryButton loading={loading} type="submit">{c('Action').t`Get a new password`}</PrimaryButton>
                </div>
            </form>
        );
    }

    if (step === STEPS.VALIDATE_RESET_TOKEN) {
        return (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    withLoading(handleValidateResetToken());
                }}
            >
                <Alert>{c('Info')
                    .t`We've sent a reset code to your recovery email, valid for one hour or until you request a new code. Enter it below to continue.`}</Alert>
                <Label htmlFor="reset-token" className="sr-only">
                    {c('Label').t`Token`}
                </Label>
                <div className="mb1">
                    <ResetTokenInput id="reset-token" value={token} setValue={setters.token} />
                </div>
                <Alert type="warning">{c('Info')
                    .t`IMPORTANT: Do not close or navigate away from this page. You will need to enter the reset code into the field below once you receive it.`}</Alert>
                <div className="text-right mb1">
                    <PrimaryButton loading={loading} type="submit">{c('Action').t`Reset password`}</PrimaryButton>
                </div>
            </form>
        );
    }

    if (step === STEPS.DANGER_VERIFICATION) {
        const hereLink = <Href key="0" url="https://mail.protonmail.com/login">{c('Link').t`here`}</Href>;
        return (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    withLoading(handleDanger());
                }}
            >
                <Alert
                    type="warning"
                    learnMore="https://protonmail.com/support/knowledge-base/updating-your-login-password/"
                >{c('Info')
                    .jt`Resetting your password will reset your encryption keys for all Proton related services (Mail and VPN). You will be unable to read your existing messages. If you know your ProtonMail credentials, do NOT reset. You can log in with them ${hereLink}.`}</Alert>
                <Alert type="warning">{c('Info').t`ALL YOUR DATA WILL BE LOST!`}</Alert>
                <Label htmlFor="danger" className="sr-only">
                    {c('Label').t`Danger`}
                </Label>
                <div className="mb1">
                    <ResetDangerInput value={danger} setValue={setters.danger} dangerWord={dangerWord} id="danger" />
                </div>
                {isVPN ? null : (
                    <Alert learnMore="https://protonmail.com/support/knowledge-base/restoring-encrypted-mailbox/">{c(
                        'Info'
                    ).t`If you remember your old password later, you can recover your existing messages.`}</Alert>
                )}
                <div className="text-right mb1">
                    <PrimaryButton type="submit">{c('Action').t`Reset my password`}</PrimaryButton>
                </div>
            </form>
        );
    }

    if (step === STEPS.NEW_PASSWORD) {
        return (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (passwordError || confirmPasswordError) {
                        return;
                    }
                    withLoading(handleNewPassword(password));
                }}
            >
                <Alert type="warning">{c('Info').t`Keep this password safe, it cannot be recovered.`}</Alert>
                <Label htmlFor="new-password" className="sr-only">
                    {c('Label').t`New password`}
                </Label>
                <div className="mb1">
                    <PasswordInput
                        id="new-password"
                        autoFocus
                        value={password}
                        error={passwordError}
                        placeholder={c('Placeholder').t`Choose a new password`}
                        onChange={({ target }) => setPassword(target.value)}
                        required
                    />
                </div>
                <Label htmlFor="confirm-password" className="sr-only">
                    {c('Label').t`Confirm password`}
                </Label>
                <div className="mb1">
                    <PasswordInput
                        id="confirm-password"
                        value={confirmPassword}
                        placeholder={c('Password').t`Confirm new password`}
                        onChange={({ target }) => setConfirmPassword(target.value)}
                        error={confirmPasswordError}
                        required
                    />
                </div>
                <Alert type="warning">{c('Info')
                    .t`Do NOT forget this password. If you forget it, you will not be able to login or decrypt your messages.`}</Alert>
                <div className="text-right mb1">
                    <PrimaryButton loading={loading} type="submit">{c('Action').t`Submit`}</PrimaryButton>
                </div>
            </form>
        );
    }

    if (step === STEPS.ERROR || step === STEPS.NO_RECOVERY_METHODS) {
        return <GenericError />;
    }

    throw new Error('Unknown step');
};

export default MinimalResetPasswordContainer;
