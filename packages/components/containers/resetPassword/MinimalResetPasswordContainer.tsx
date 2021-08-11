import { useRef, useState } from 'react';
import { c } from 'ttag';
import { Link } from 'react-router-dom';
import { APPS } from '@proton/shared/lib/constants';
import { confirmPasswordValidator, passwordLengthValidator } from '@proton/shared/lib/helpers/formValidators';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

import { Alert, Href, Label, PasswordInput, ConfirmModal, PrimaryButton, Input } from '../../components';
import { GenericError } from '../error';

import { useApi, useConfig, useErrorHandler, useLoading, useModals, useNotifications } from '../../hooks';
import { OnLoginCallback } from '../app';
import { ResetActionResponse, ResetCacheResult, STEPS } from './interface';
import { handleNewPassword, handleRequestToken, handleValidateResetToken } from './resetActions';

const RequestResetTokenForm = ({
    onSubmit,
    isVPN,
}: {
    isVPN: boolean;
    onSubmit: ({ username, email }: { username: string; email: string }) => Promise<void>;
}) => {
    const hasModal = useRef(false);
    const [loading, withLoading] = useLoading();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const emailError = !validateEmailAddress(email) ? c('Error').t`Email address invalid` : '';
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (!username || emailError) {
                    return;
                }
                if (hasModal.current) {
                    return;
                }
                hasModal.current = true;
                withLoading(
                    onSubmit({ username, email })
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
                <Input
                    name="username"
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    id="username"
                    placeholder={c('Placeholder').t`Username`}
                    value={username}
                    onChange={({ target: { value } }) => setUsername(value)}
                    required
                />
            </div>
            <Label htmlFor="email" className="sr-only">
                {c('Label').t`Email`}
            </Label>
            <div className="mb1">
                <Input
                    type="email"
                    name="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                    id="email"
                    placeholder={c('Placeholder').t`Recovery email`}
                    value={email}
                    onChange={({ target: { value } }) => setEmail(value)}
                    error={emailError}
                    required
                />
            </div>
            <div className="flex flex-nowrap flex-justify-space-between mb1">
                <Link to="/login">{c('Link').t`Back to login`}</Link>
                <PrimaryButton loading={loading} type="submit">{c('Action').t`Get a new password`}</PrimaryButton>
            </div>
        </form>
    );
};

const ValidateTokenForm = ({ onSubmit }: { onSubmit: (token: string) => Promise<void> }) => {
    const [loading, withLoading] = useLoading();
    const [token, setToken] = useState('');
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (!token) {
                    return;
                }
                withLoading(onSubmit(token));
            }}
        >
            <Alert>{c('Info')
                .t`We've sent a reset code to your recovery email, valid for one hour or until you request a new code. Enter it below to continue.`}</Alert>
            <Label htmlFor="reset-token" className="sr-only">
                {c('Label').t`Token`}
            </Label>
            <div className="mb1">
                <Input
                    value={token}
                    onChange={({ target }) => setToken(target.value)}
                    name="resetToken"
                    id="reset-token"
                    placeholder={c('Placeholder').t`Reset code`}
                    autoFocus
                    required
                />
            </div>
            <Alert type="warning">{c('Info')
                .t`IMPORTANT: Do not close or navigate away from this page. You will need to enter the reset code into the field below once you receive it.`}</Alert>
            <div className="text-right mb1">
                <PrimaryButton loading={loading} type="submit">{c('Action').t`Reset password`}</PrimaryButton>
            </div>
        </form>
    );
};

const DangerForm = ({ onSubmit, isVPN }: { onSubmit: () => Promise<void>; isVPN: boolean }) => {
    const [danger, setDanger] = useState('');
    const [loading, withLoading] = useLoading();
    const dangerWord = 'DANGER';
    const hereLink = <Href key="0" url="https://mail.protonmail.com/login">{c('Link').t`here`}</Href>;
    const dangerError = danger.length > 0 && danger !== dangerWord ? c('Error').t`Please enter '${dangerWord}'` : '';
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (dangerError) {
                    return;
                }
                withLoading(onSubmit());
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
                <Input
                    id="danger"
                    placeholder={c('Placeholder').t`Enter the word '${dangerWord}' here`}
                    value={danger}
                    onChange={({ target }) => setDanger(target.value)}
                    error={dangerError}
                    required
                />
            </div>
            {isVPN ? null : (
                <Alert learnMore="https://protonmail.com/support/knowledge-base/restoring-encrypted-mailbox/">{c('Info')
                    .t`If you remember your old password later, you can recover your existing messages.`}</Alert>
            )}
            <div className="text-right mb1">
                <PrimaryButton type="submit" loading={loading}>{c('Action').t`Reset my password`}</PrimaryButton>
            </div>
        </form>
    );
};

const SetPasswordForm = ({ onSubmit }: { onSubmit: (password: string) => Promise<void> }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const passwordError = passwordLengthValidator(password);
    const confirmPasswordError =
        passwordLengthValidator(confirmPassword) || confirmPasswordValidator(password, confirmPassword);
    const [loading, withLoading] = useLoading();

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (passwordError || confirmPasswordError) {
                    return;
                }
                withLoading(onSubmit(password));
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
};

interface Props {
    onLogin: OnLoginCallback;
}

const MinimalResetPasswordContainer = ({ onLogin }: Props) => {
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const errorHandler = useErrorHandler();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const cacheRef = useRef<ResetCacheResult | undefined>(undefined);
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const [step, setStep] = useState(STEPS.REQUEST_RESET_TOKEN);
    const { createNotification } = useNotifications();

    const handleResult = (result: ResetActionResponse) => {
        if (result.to === STEPS.DONE) {
            return onLogin(result.session);
        }
        if (result.to === STEPS.NO_RECOVERY_METHODS) {
            setStep(result.to);
            return;
        }
        if (result.to === STEPS.VALIDATE_RESET_TOKEN) {
            const destination = result.cache.value;
            if (destination) {
                createNotification({ text: c('Info').t`Done! We sent a code to ${destination}`, expiration: 5000 });
            }
        }
        cacheRef.current = result.cache;
        setStep(result.to);
    };

    const handleError = (e: any) => {
        errorHandler(e);
        if (step === STEPS.NEW_PASSWORD) {
            setStep(STEPS.ERROR);
        }
    };
    const cache = cacheRef.current;

    return (
        <>
            {step === STEPS.REQUEST_RESET_TOKEN && (
                <RequestResetTokenForm
                    onSubmit={async ({ username, email }: { username: string; email: string }) => {
                        await new Promise<void>((resolve, reject) => {
                            createModal(
                                <ConfirmModal
                                    title={c('Title').t`Confirm reset password`}
                                    onConfirm={resolve}
                                    onClose={reject}
                                >
                                    <Alert type="warning">{c('Info')
                                        .t`Resetting your password means your old password and the places it is saved will no longer work. Are you sure you want to reset your password?`}</Alert>
                                </ConfirmModal>
                            );
                        });
                        return handleRequestToken({
                            cache: {
                                username,
                                Methods: [],
                            },
                            username,
                            value: email,
                            method: 'email',
                            api: silentApi,
                        })
                            .then(handleResult)
                            .catch(handleError);
                    }}
                    isVPN={isVPN}
                />
            )}
            {step === STEPS.VALIDATE_RESET_TOKEN && cache && (
                <ValidateTokenForm
                    onSubmit={(token) => {
                        return handleValidateResetToken({ api: silentApi, cache, token })
                            .then(handleResult)
                            .catch(handleError);
                    }}
                />
            )}
            {step === STEPS.DANGER_VERIFICATION && cache && (
                <DangerForm
                    onSubmit={async () => {
                        setStep(STEPS.NEW_PASSWORD);
                    }}
                    isVPN={isVPN}
                />
            )}
            {step === STEPS.NEW_PASSWORD && cache && (
                <SetPasswordForm
                    onSubmit={(newPassword) => {
                        createNotification({
                            text: c('Info').t`This can take a few seconds or a few minutes depending on your device`,
                            type: 'info',
                        });
                        return handleNewPassword({
                            password: newPassword,
                            api: silentApi,
                            cache,
                            keyMigrationFeatureValue: 0, // not supported on vpn
                        })
                            .then(handleResult)
                            .catch(handleError);
                    }}
                />
            )}
            {(step === STEPS.ERROR || step === STEPS.NO_RECOVERY_METHODS) && <GenericError />}
        </>
    );
};

export default MinimalResetPasswordContainer;
