import React, { FunctionComponent, useState, useRef } from 'react';
import { c } from 'ttag';
import { useHistory, Link } from 'react-router-dom';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { useModals } from '../../hooks';
import { Alert, ConfirmModal, Label, PasswordInput, PrimaryButton } from '../../components';
import { GenericError } from '../error';
import { OnLoginCallback } from '../app';
import useResetPassword, { STEPS } from './useResetPassword';
import ResetUsernameInput from './ResetUsernameInput';
import ResetPasswordEmailInput from './ResetPasswordEmailInput';
import ResetPasswordPhoneInput from './ResetPasswordPhoneInput';
import ResetTokenInput from './ResetTokenInput';
import { Props as AccountPublicLayoutProps } from '../signup/AccountPublicLayout';
import BackButton from '../signup/BackButton';
import SignupLabelInputRow from '../signup/SignupLabelInputRow';
import SignupSubmitRow from '../signup/SignupSubmitRow';
import Tabs from '../../components/tabs/Tabs';
import Href from '../../components/link/Href';
import InlineLinkButton from '../../components/button/InlineLinkButton';
import RequestNewCodeModal from '../api/humanVerification/RequestNewCodeModal';

interface Props {
    onLogin: OnLoginCallback;
    onBack?: () => void;
    Layout: FunctionComponent<AccountPublicLayoutProps>;
}

const AccountResetPasswordContainer = ({ onLogin, Layout, onBack }: Props) => {
    const history = useHistory();
    const {
        loading,
        state,
        handleRequestRecoveryMethods,
        handleRequest,
        handleValidateResetToken,
        handleNewPassword,
        gotoStep,
        setUsername,
        setEmail,
        setPhone,
        setPassword,
        setConfirmPassword,
        setToken,
    } = useResetPassword({ onLogin, initalStep: STEPS.REQUEST_RECOVERY_METHODS });
    const { createModal } = useModals();
    const hasModal = useRef<boolean>(false);
    const [tabIndex, setTabIndex] = useState(0);

    const { step, username, email, phone, password, confirmPassword, token, methods, error } = state;

    let handleBack = () => history.push('/login');

    if (step === STEPS.REQUEST_RECOVERY_METHODS) {
        return (
            <Layout
                title={c('Title').t`Enter Proton Account`}
                subtitle={c('Info').t`Enter the Proton Account that you would like to reset the password for.`}
                left={<BackButton onClick={onBack || handleBack} />}
            >
                <form
                    className="signup-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleRequestRecoveryMethods();
                    }}
                >
                    <SignupLabelInputRow
                        label={<Label htmlFor="username">{c('Label').t`Email or username`}</Label>}
                        input={
                            <ResetUsernameInput
                                id="username"
                                value={username}
                                setValue={setUsername}
                                placeholder={c('Label').t`Email or username`}
                            />
                        }
                    />
                    <SignupSubmitRow>
                        <PrimaryButton
                            className="pm-button--large flex-item-noshrink onmobile-w100"
                            disabled={!username}
                            loading={loading}
                            type="submit"
                        >{c('Action').t`Next`}</PrimaryButton>
                    </SignupSubmitRow>
                </form>
            </Layout>
        );
    }

    if (step === STEPS.NO_RECOVERY_METHODS) {
        return (
            <Layout
                title={c('Title').t`No recovery method`}
                subtitle={c('Info').t`Unfortunately there is no recovery method saved for this account.`}
                left={<BackButton onClick={handleBack} />}
            >
                <form className="signup-form">
                    <SignupSubmitRow>
                        <Href
                            className="mr2 nodecoration onmobile-aligncenter onmobile-p1 onmobile-mr0"
                            url="https://protonmail.com/support-form"
                            target="_self"
                        >{c('Action').t`Contact support`}</Href>
                        <Link
                            to="/login"
                            className="pm-button--primary pm-button--large flex-item-noshrink onmobile-w100 onmobile-aligncenter"
                        >{c('Action').t`Return to login`}</Link>
                    </SignupSubmitRow>
                </form>
            </Layout>
        );
    }

    if (step === STEPS.REQUEST_RESET_TOKEN) {
        handleBack = () => gotoStep(STEPS.REQUEST_RECOVERY_METHODS);
        const tabs = [
            (methods?.includes('email') || methods?.includes('login')) && {
                title: c('Recovery method').t`Email`,
                method: 'email',
                content: (
                    <SignupLabelInputRow
                        label={<Label htmlFor="email">{c('Label').t`Recovery email`}</Label>}
                        input={<ResetPasswordEmailInput value={email} setValue={setEmail} id="email" />}
                    />
                ),
            },
            methods?.includes('sms') && {
                title: c('Recovery method').t`Phone number`,
                method: 'sms',
                content: (
                    <SignupLabelInputRow
                        label={<Label htmlFor="phone">{c('Label').t`Recovery phone`}</Label>}
                        input={<ResetPasswordPhoneInput value={phone} setValue={setPhone} id="phone" />}
                    />
                ),
            },
        ].filter(isTruthy);
        const recoveryTitle =
            tabs[tabIndex].method === 'email'
                ? c('Title').t`Enter recovery email`
                : c('Title').t`Enter recovery phone number`;
        const recoveryMethodText =
            tabs[tabIndex].method === 'email' ? c('Recovery method').t`email` : c('Recovery method').t`phone number`;
        const handleChangeIndex = (newIndex: number) => {
            if (tabs[tabIndex].method === 'email') {
                setEmail('');
            }
            if (tabs[tabIndex].method === 'sms') {
                setPhone('');
            }
            setTabIndex(newIndex);
        };
        return (
            <Layout
                title={recoveryTitle}
                subtitle={c('Info').t`We will send a password reset code to your recovery ${recoveryMethodText}.`}
                left={<BackButton onClick={handleBack} />}
            >
                <form
                    className="signup-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleRequest();
                    }}
                >
                    {tabs.length === 1 ? (
                        tabs[0].content
                    ) : (
                        <Tabs tabs={tabs} value={tabIndex} onChange={handleChangeIndex} />
                    )}
                    <SignupSubmitRow>
                        <PrimaryButton
                            className="pm-button--large onmobile-w100"
                            disabled={!email && !phone}
                            loading={loading}
                            type="submit"
                        >{c('Action').t`Reset password`}</PrimaryButton>
                    </SignupSubmitRow>
                </form>
            </Layout>
        );
    }

    if (step === STEPS.VALIDATE_RESET_TOKEN) {
        const subTitle = email
            ? c('Info')
                  .t`Enter the recovery code that was sent to ${email}. If you don’t find the email in your inbox, please check your spam folder.`
            : c('Info').t`Enter the verification code that was sent to your phone number: ${phone}.`;
        handleBack = () =>
            gotoStep(methods?.includes('login') ? STEPS.REQUEST_RECOVERY_METHODS : STEPS.REQUEST_RESET_TOKEN);
        const handleSubmit = async () => {
            await new Promise((resolve, reject) => {
                createModal(
                    <ConfirmModal
                        title={c('Title').t`Confirm reset password`}
                        confirm={c('Action').t`Confirm password reset`}
                        onConfirm={resolve}
                        onClose={reject}
                    >
                        <div>
                            <p className="mt0">{c('Info')
                                .t`Resetting your password means that you will no longer be able to read your encrypted data unless you know your old password.`}</p>
                            <p className="mt0 mb0">{c('Info')
                                .t`If you know your password and would like to change it, please log into your account first and change your password after logging in.`}</p>
                        </div>
                    </ConfirmModal>
                );
            });
            await handleValidateResetToken(STEPS.NEW_PASSWORD);
        };
        return (
            <Layout
                title={c('Title').t`Enter recovery code`}
                subtitle={subTitle}
                left={<BackButton onClick={handleBack} />}
            >
                <form
                    className="signup-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (hasModal.current) {
                            return;
                        }
                        hasModal.current = true;
                        handleSubmit()
                            .then(() => {
                                hasModal.current = false;
                            })
                            .catch(() => {
                                hasModal.current = false;
                            });
                    }}
                >
                    <SignupLabelInputRow
                        label={<Label htmlFor="reset-token">{c('Label').t`Recovery code`}</Label>}
                        input={<ResetTokenInput id="reset-token" value={token} setValue={setToken} />}
                    />
                    {email || phone ? (
                        <InlineLinkButton
                            disabled={loading}
                            onClick={() =>
                                createModal(
                                    <RequestNewCodeModal
                                        onEdit={handleBack}
                                        onResend={handleRequest}
                                        email={email}
                                        phone={phone}
                                    />
                                )
                            }
                        >{c('Action').t`Did not receive a code?`}</InlineLinkButton>
                    ) : null}
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

    if (step === STEPS.NEW_PASSWORD) {
        handleBack = () => gotoStep(STEPS.VALIDATE_RESET_TOKEN);
        return (
            <Layout title={c('Title').t`Reset password`} left={<BackButton onClick={handleBack} />}>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleNewPassword();
                    }}
                >
                    <div className="flex flex-nowrap onmobile-flex-column mb1">
                        <SignupLabelInputRow
                            className="mr0-5 flex-item-fluid onmobile-mr0"
                            label={<Label htmlFor="new-password">{c('Label').t`Password`}</Label>}
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
                            className="ml0-5 flex-item-fluid onmobile-ml0"
                            label={<Label htmlFor="confirm-password">{c('Label').t`Confirm`}</Label>}
                            input={
                                <PasswordInput
                                    id="confirm-password"
                                    value={confirmPassword}
                                    placeholder={c('Password').t`Confirm new password`}
                                    onChange={({ target }) => setConfirmPassword(target.value)}
                                    error={
                                        password !== confirmPassword ? c('Error').t`Passwords do not match` : undefined
                                    }
                                    required
                                />
                            }
                        />
                    </div>
                    <SignupSubmitRow>
                        <PrimaryButton
                            className="pm-button--large onmobile-w100"
                            disabled={!password || password !== confirmPassword}
                            loading={loading}
                            type="submit"
                        >{c('Action').t`Change password`}</PrimaryButton>
                    </SignupSubmitRow>
                </form>
            </Layout>
        );
    }

    if (step === STEPS.ERROR) {
        if (error) {
            handleBack = () => gotoStep(STEPS.REQUEST_RECOVERY_METHODS);
            return (
                <Layout title={c('Title').t`Error`} left={<BackButton onClick={handleBack} />}>
                    <Alert type="error">{error}</Alert>
                    <SignupSubmitRow>
                        <Href
                            className="mr2 nodecoration onmobile-aligncenter onmobile-p1 onmobile-mr0"
                            url="https://protonmail.com/support-form"
                            target="_self"
                        >{c('Action').t`Contact support`}</Href>
                        <Link
                            to="/login"
                            className="pm-button--primary pm-button--large flex-item-noshrink onmobile-w100 onmobile-aligncenter"
                        >{c('Action').t`Return to login`}</Link>
                    </SignupSubmitRow>
                </Layout>
            );
        }
        return <GenericError />;
    }

    throw new Error('Unknown step');
};

export default AccountResetPasswordContainer;
