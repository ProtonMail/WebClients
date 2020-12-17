import React, { FormEvent } from 'react';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import { useLoading, useNotifications, useModals, useApi, useErrorHandler } from '../../hooks';
import { LinkButton, PrimaryButton, Label } from '../../components';

import AbuseModal from './AbuseModal';
import useLogin, { Props as UseLoginProps } from './useLogin';
import LoginPasswordInput from './LoginPasswordInput';
import LoginUsernameInput from './LoginUsernameInput';
import LoginTotpInput from './LoginTotpInput';
import LoginUnlockInput from './LoginUnlockInput';
import { FORM } from './interface';

interface Props extends Omit<UseLoginProps, 'api'> {
    needHelp?: React.ReactNode;
}

const MinimalLoginContainer = ({ onLogin, ignoreUnlock = false, needHelp }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();

    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();

    const { state, setters, handleLogin, handleTotp, handleUnlock, handleCancel } = useLogin({
        onLogin,
        ignoreUnlock,
        api: silentApi,
    });

    const [loading, withLoading] = useLoading();

    const { form, username, password, totp, keyPassword } = state;

    const catchHandler = (e: any) => {
        if (e.data?.Code === API_CUSTOM_ERROR_CODES.AUTH_ACCOUNT_DISABLED) {
            return createModal(<AbuseModal />);
        }
        if (e.name === 'TOTPError' || e.name === 'PasswordError') {
            return createNotification({ type: 'error', text: e.message });
        }
        errorHandler(e);
    };

    if (form === FORM.LOGIN) {
        const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            withLoading(handleLogin().catch(catchHandler));
        };
        return (
            <form name="loginForm" onSubmit={handleSubmit}>
                <Label htmlFor="login">{c('Label').t`Username or ProtonMail address`}</Label>
                <div className="mb1">
                    <LoginUsernameInput
                        id="login"
                        title={c('Title').t`Enter your username or ProtonMail email address`}
                        username={username}
                        setUsername={loading ? noop : setters.username}
                    />
                </div>
                <Label htmlFor="password">{c('Label').t`Password`}</Label>
                <div className="mb1">
                    <LoginPasswordInput
                        password={password}
                        setPassword={loading ? noop : setters.password}
                        id="password"
                        title={c('Title').t`Enter your password`}
                    />
                </div>
                <div className="flex flex-spacebetween">
                    {needHelp}
                    <PrimaryButton type="submit" loading={loading} data-cy-login="submit">
                        {c('Action').t`Log in`}
                    </PrimaryButton>
                </div>
            </form>
        );
    }

    const cancelButton = (
        <LinkButton type="reset" disabled={loading} onClick={handleCancel}>
            {c('Action').t`Cancel`}
        </LinkButton>
    );

    if (form === FORM.TOTP) {
        const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            withLoading(handleTotp().catch(catchHandler));
        };
        return (
            <form name="totpForm" onSubmit={handleSubmit}>
                <Label htmlFor="twoFa">{c('Label').t`Two-factor authentication code`}</Label>
                <div className="mb1">
                    <LoginTotpInput totp={totp} setTotp={loading ? noop : setters.totp} id="twoFa" />
                </div>
                <div className="flex flex-spacebetween">
                    {cancelButton}
                    <PrimaryButton
                        type="submit"
                        disabled={totp.length < 6}
                        loading={loading}
                        data-cy-login="submit TOTP"
                    >
                        {c('Action').t`Submit`}
                    </PrimaryButton>
                </div>
            </form>
        );
    }

    if (form === FORM.UNLOCK) {
        const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            withLoading(handleUnlock().catch(catchHandler));
        };
        return (
            <form name="unlockForm" onSubmit={handleSubmit}>
                <Label htmlFor="password">{c('Label').t`Mailbox password`}</Label>
                <div className="mb1">
                    <LoginUnlockInput
                        password={keyPassword}
                        setPassword={loading ? noop : setters.keyPassword}
                        id="password"
                    />
                </div>
                <div className="flex flex-spacebetween">
                    {cancelButton}
                    <PrimaryButton type="submit" loading={loading} data-cy-login="submit mailbox password">
                        {c('Action').t`Submit`}
                    </PrimaryButton>
                </div>
            </form>
        );
    }

    if (form === FORM.U2F) {
        return <>U2F not implemented</>;
    }

    if (form === FORM.NEW_PASSWORD) {
        return <>Setting new password not implemented</>;
    }

    throw new Error('Unsupported form');
};

export default MinimalLoginContainer;
