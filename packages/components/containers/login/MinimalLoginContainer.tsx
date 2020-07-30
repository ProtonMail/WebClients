import React, { FormEvent } from 'react';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import { useLoading, LinkButton, PrimaryButton, useNotifications, useModals, Label } from '../../index';

import { getErrorText } from './helper';
import AbuseModal from './AbuseModal';
import useLogin, { FORM, Props as UseLoginProps } from './useLogin';
import LoginPasswordInput from './LoginPasswordInput';
import LoginUsernameInput from './LoginUsernameInput';
import LoginTotpInput from './LoginTotpInput';
import LoginUnlockInput from './LoginUnlockInput';

interface Props extends UseLoginProps {
    needHelp?: React.ReactNode;
}

const MinimalLoginContainer = ({ onLogin, ignoreUnlock = false, needHelp }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const {
        state,
        handleLogin,
        handleTotp,
        handleUnlock,
        handleCancel,
        setUsername,
        setPassword,
        setKeyPassword,
        setTotp,
    } = useLogin({ onLogin, ignoreUnlock });

    const [loading, withLoading] = useLoading();

    const { form, username, password, totp, keyPassword } = state;

    if (form === FORM.LOGIN) {
        const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            withLoading(
                handleLogin().catch((e) => {
                    if (e.data && e.data.Code === API_CUSTOM_ERROR_CODES.AUTH_ACCOUNT_DISABLED) {
                        createModal(<AbuseModal />);
                    }
                })
            );
        };
        return (
            <form name="loginForm" onSubmit={handleSubmit}>
                <Label className="sr-only" htmlFor="login">{c('Label').t`Email or Username`}</Label>
                <div className="mb1">
                    <LoginUsernameInput id="login" username={username} setUsername={loading ? noop : setUsername} />
                </div>
                <Label className="sr-only" htmlFor="password">{c('Label').t`Password`}</Label>
                <div className="mb1">
                    <LoginPasswordInput password={password} setPassword={loading ? noop : setPassword} id="password" />
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
            withLoading(handleTotp());
        };
        return (
            <form name="totpForm" onSubmit={handleSubmit}>
                <Label htmlFor="twoFa">{c('Label').t`Two-factor code`}</Label>
                <div className="mb1">
                    <LoginTotpInput totp={totp} setTotp={loading ? noop : setTotp} id="twoFa" />
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

            withLoading(
                handleUnlock(keyPassword).catch((e) => {
                    // In case of any other error than password error, automatically cancel here to allow the user to retry.
                    if (e.name !== 'PasswordError') {
                        return handleCancel();
                    }
                    createNotification({ type: 'error', text: getErrorText(e) });
                })
            );
        };
        return (
            <form name="unlockForm" onSubmit={handleSubmit}>
                <Label htmlFor="password">{c('Label').t`Mailbox password`}</Label>
                <div className="mb1">
                    <LoginUnlockInput
                        password={keyPassword}
                        setPassword={loading ? noop : setKeyPassword}
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

    throw new Error('Unsupported form');
};

export default MinimalLoginContainer;
