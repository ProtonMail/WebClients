import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';

import { InlineLinkButton, PrimaryButton, Label } from '../../components';
import { useLoading, useModals, useNotifications } from '../../hooks';
import AccountSupportDropdown from '../heading/AccountSupportDropdown';
import AbuseModal from './AbuseModal';
import { Props as AccountPublicLayoutProps } from '../signup/AccountPublicLayout';
import BackButton from '../signup/BackButton';
import OneAccountIllustration from '../illustration/OneAccountIllustration';
import useLogin, { Props as UseLoginProps, FORM } from './useLogin';
import LoginUsernameInput from './LoginUsernameInput';
import LoginPasswordInput from './LoginPasswordInput';
import LoginTotpInput from './LoginTotpInput';
import LoginRecoveryCodeInput from './LoginRecoveryCodeInput';
import LoginUnlockInput from './LoginUnlockInput';
import SignupLabelInputRow from '../signup/SignupLabelInputRow';
import SignupSubmitRow from '../signup/SignupSubmitRow';

interface Props extends UseLoginProps {
    Layout: FunctionComponent<AccountPublicLayoutProps>;
    toAppName?: string;
}

const AccountLoginContainer = ({ onLogin, ignoreUnlock = false, Layout, toAppName }: Props) => {
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
        setIsTotpRecovery,
    } = useLogin({ onLogin, ignoreUnlock, generateKeys: true });

    const [loading, withLoading] = useLoading();

    const { form, username, password, isTotpRecovery, totp, keyPassword } = state;

    const catchHandler = (e: any) => {
        if (e.data?.Code === API_CUSTOM_ERROR_CODES.AUTH_ACCOUNT_DISABLED) {
            return createModal(<AbuseModal />);
        }
        if (e.name === 'TOTPError' || e.name === 'PasswordError') {
            return createNotification({ type: 'error', text: e.message });
        }
        createNotification({ type: 'error', text: getApiErrorMessage(e) || 'Unknown error' });
    };

    if (state.form === FORM.LOGIN) {
        const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            withLoading(handleLogin().catch(catchHandler));
        };

        const signupLink = (
            <Link key="signupLink" className="nodecoration" to="/signup">{c('Link').t`Create an account`}</Link>
        );

        const usernameInput = (
            <SignupLabelInputRow
                label={<Label htmlFor="login">{c('Label').t`Email or Username`}</Label>}
                input={<LoginUsernameInput id="login" username={username} setUsername={loading ? noop : setUsername} />}
            />
        );

        const passwordInput = (
            <SignupLabelInputRow
                label={<Label htmlFor="password">{c('Label').t`Password`}</Label>}
                input={
                    <LoginPasswordInput id="password" password={password} setPassword={loading ? noop : setPassword} />
                }
            />
        );

        return (
            <Layout
                title={c('Title').t`Sign in`}
                subtitle={toAppName ? c('Info').t`to continue to ${toAppName}` : undefined}
                aside={<OneAccountIllustration />}
                right={null}
            >
                <form name="loginForm" className="signup-form" onSubmit={handleSubmit}>
                    {usernameInput}
                    {passwordInput}
                    <div className="mb1">
                        <AccountSupportDropdown noCaret className="link">
                            {c('Action').t`Need help?`}
                        </AccountSupportDropdown>
                    </div>
                    <SignupSubmitRow>
                        <PrimaryButton
                            type="submit"
                            className="pm-button--large"
                            loading={loading}
                            data-cy-login="submit"
                        >
                            {c('Action').t`Sign in`}
                        </PrimaryButton>
                    </SignupSubmitRow>
                </form>
                <div className="mb2 alignright">{c('Info').jt`New to Proton? ${signupLink}`}</div>
            </Layout>
        );
    }

    if (form === FORM.TOTP) {
        const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            withLoading(handleTotp().catch(catchHandler));
        };

        const totpForm = (
            <SignupLabelInputRow
                label={<Label htmlFor="twoFa">{c('Label').t`Two-factor code`}</Label>}
                input={<LoginTotpInput totp={totp} setTotp={loading ? noop : setTotp} id="twoFa" />}
            />
        );

        const recoveryForm = (
            <SignupLabelInputRow
                label={<Label htmlFor="twoFa">{c('Label').t`Two-factor code`}</Label>}
                input={<LoginRecoveryCodeInput code={totp} setCode={loading ? noop : setTotp} id="recoveryCode" />}
            />
        );

        return (
            <Layout title={c('Title').t`Two-factor authentication`} left={<BackButton onClick={handleCancel} />}>
                <form name="totpForm" className="signup-form" onSubmit={handleSubmit} autoComplete="off">
                    {isTotpRecovery ? recoveryForm : totpForm}
                    <div className="mb1">
                        <InlineLinkButton
                            onClick={() => {
                                setTotp('');
                                setIsTotpRecovery(!isTotpRecovery);
                            }}
                        >
                            {isTotpRecovery ? c('Action').t`Use two-factor code` : c('Action').t`Use recovery code`}
                        </InlineLinkButton>
                    </div>
                    <SignupSubmitRow>
                        <PrimaryButton
                            type="submit"
                            disabled={totp.length < 6}
                            className="pm-button--large"
                            loading={loading}
                            data-cy-login="submit TOTP"
                        >
                            {c('Action').t`Authenticate`}
                        </PrimaryButton>
                    </SignupSubmitRow>
                </form>
            </Layout>
        );
    }

    if (form === FORM.UNLOCK) {
        const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            withLoading(handleUnlock().catch(catchHandler));
        };

        const unlockInput = (
            <SignupLabelInputRow
                label={<Label htmlFor="password" className="mr1">{c('Label').t`Mailbox password`}</Label>}
                input={
                    <LoginUnlockInput
                        password={keyPassword}
                        setPassword={loading ? noop : setKeyPassword}
                        id="password"
                    />
                }
            />
        );

        return (
            <Layout title={c('Title').t`Unlock your mailbox`} left={<BackButton onClick={handleCancel} />}>
                <form name="unlockForm" className="signup-form" onSubmit={handleSubmit}>
                    {unlockInput}
                    <SignupSubmitRow>
                        <PrimaryButton
                            type="submit"
                            className="pm-button--large"
                            disabled={!keyPassword}
                            loading={loading}
                            data-cy-login="submit mailbox password"
                        >
                            {c('Action').t`Unlock`}
                        </PrimaryButton>
                    </SignupSubmitRow>
                </form>
            </Layout>
        );
    }

    if (form === FORM.U2F) {
        throw new Error('U2F not implemented');
    }

    throw new Error('Unsupported form');
};

export default AccountLoginContainer;
