import React, { FormEvent } from 'react';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import { useLoading, LinkButton, PrimaryButton, useNotifications, useModals } from '../../index';

import PasswordForm from './PasswordForm';
import TOTPForm from './TOTPForm';
import UnlockForm from './UnlockForm';
import { getErrorText } from './helper';
import AbuseModal from './AbuseModal';
import useLogin, { FORM, Props as UseLoginProps } from './useLogin';

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
        setTotp
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
                <PasswordForm
                    username={username}
                    setUsername={loading ? noop : setUsername}
                    password={password}
                    setPassword={loading ? noop : setPassword}
                />
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
                <TOTPForm totp={totp} setTotp={loading ? noop : setTotp} />
                <div className="flex flex-spacebetween">
                    {cancelButton}
                    <PrimaryButton type="submit" loading={loading} data-cy-login="submit TOTP">
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
                    } else {
                        createNotification({ type: 'error', text: getErrorText(e) });
                    }
                })
            );
        };
        return (
            <form name="unlockForm" onSubmit={handleSubmit}>
                <UnlockForm password={keyPassword} setPassword={loading ? noop : setKeyPassword} />
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
        return <>{'U2F not implemented'}</>;
    }

    throw new Error('Unsupported form');
};

export default MinimalLoginContainer;
