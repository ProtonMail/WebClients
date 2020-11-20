import React, { FunctionComponent, useState, useRef } from 'react';
import { c } from 'ttag';
import { useHistory, Link } from 'react-router-dom';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { BRAND_NAME } from 'proton-shared/lib/constants';

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
                title={c('Title').t`Reset password`}
                subtitle={c('Info')
                    .t`Enter the email address associated with your Proton Account or your account username.`}
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
                            <ResetUsernameInput id="username" value={username} setValue={setUsername} placeholder="" />
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
                        input={<ResetPasswordEmailInput value={email} setValue={setEmail} id="email" placeholder="" />}
                    />
                ),
            },
            methods?.includes('sms') && {
                title: c('Recovery method').t`Phone number`,
                method: 'sms',
                content: (
                    <SignupLabelInputRow
                        label={<Label htmlFor="phone">{c('Label').t`Recovery phone`}</Label>}
                        input={<ResetPasswordPhoneInput value={phone} setValue={setPhone} id="phone" placeholder="" />}
                    />
                ),
            },
        ].filter(isTruthy);

        const recoveryMethodText =
            tabs[tabIndex].method === 'email'
                ? c('Recovery method').t`email address`
                : c('Recovery method').t`phone number`;

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
                title={c('Title').t`Reset password`}
                subtitle={c('Info')
                    .t`Enter the recovery ${recoveryMethodText} associated with your ${BRAND_NAME} Account. We will send you a code to confirm the password reset.`}
                left={<BackButton onClick={handleBack} />}
            >
                <form
                    className="signup-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleRequest();
                    }}
                >
                    <Tabs tabs={tabs} value={tabIndex} onChange={handleChangeIndex} />
                    <SignupSubmitRow>
                        <PrimaryButton
                            className="pm-button--large onmobile-w100"
                            disabled={!email && !phone}
                            loading={loading}
                            type="submit"
                        >{c('Action').t`Send code`}</PrimaryButton>
                    </SignupSubmitRow>
                </form>
            </Layout>
        );
    }

    if (step === STEPS.VALIDATE_RESET_TOKEN) {
        const subTitle = email
            ? c('Info')
                  .t`Enter the code that was sent to ${email}. If you can't find the message in your inbox, please check your spam folder.`
            : c('Info').t`Enter the code sent to your phone number ${phone}.`;

        handleBack = () =>
            gotoStep(methods?.includes('login') ? STEPS.REQUEST_RECOVERY_METHODS : STEPS.REQUEST_RESET_TOKEN);

        const handleSubmit = async () => {
            await new Promise<void>((resolve, reject) => {
                const loseAllData = (
                    <span className="bold">{c('Info').t`lose access to all current encrypted data`}</span>
                );
                createModal(
                    <ConfirmModal
                        title={c('Title').t`Reset password`}
                        confirm={c('Action').t`Reset password`}
                        onConfirm={resolve}
                        onClose={reject}
                    >
                        <div>
                            <p className="mt0">{c('Info')
                                .jt`You will ${loseAllData} in your ${BRAND_NAME} Account. To restore it, you will need to enter your old password.`}</p>
                            <p className="mt0">{c('Info')
                                .t`This will also disable any 2-Factor Authentication method associated with this account.`}</p>
                            <p className="mt0 mb0">{c('Info').t`Continue anyway?`}</p>
                        </div>
                    </ConfirmModal>
                );
            });
            await handleValidateResetToken(STEPS.NEW_PASSWORD);
        };
        return (
            <Layout title={c('Title').t`Reset password`} subtitle={subTitle} left={<BackButton onClick={handleBack} />}>
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
                        label={<Label htmlFor="reset-token">{c('Label').t`Code`}</Label>}
                        input={<ResetTokenInput id="reset-token" value={token} setValue={setToken} placeholder="" />}
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
                        >{c('Action').t`Didn't receive a code?`}</InlineLinkButton>
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
