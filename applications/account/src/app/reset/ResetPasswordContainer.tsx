import React from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router-dom';

import { Button, ButtonLike, GenericError, Href, OnLoginCallback, useMyLocation } from 'react-components';
import useResetPassword, { STEPS } from 'react-components/containers/resetPassword/useResetPassword';
import BackButton from '../public/BackButton';
import Main from '../public/Main';
import Header from '../public/Header';
import Content from '../public/Content';
import LoginSupportDropdown from '../login/LoginSupportDropdown';
import Footer from '../public/Footer';
import RequestRecoveryForm from './RequestRecoveryForm';
import RequestResetTokenForm from './RequestResetTokenForm';
import ValidateResetTokenForm from './ValidateResetTokenForm';
import SetPasswordForm from '../login/SetPasswordForm';

interface Props {
    onLogin: OnLoginCallback;
    onBack?: () => void;
}

const ResetPasswordContainer = ({ onLogin, onBack }: Props) => {
    const history = useHistory();
    const {
        state,
        setters,
        reset,
        handleRequestRecoveryMethods,
        handleRequest,
        handleValidateResetToken,
        handleNewPassword,
        gotoStep,
    } = useResetPassword({ onLogin, initialStep: STEPS.REQUEST_RECOVERY_METHODS });

    const [myLocation] = useMyLocation();
    const defaultCountry = myLocation?.Country?.toUpperCase();

    const { step, methods, error } = state;

    const handleBack = () => {
        history.push('/login');
    };

    return (
        <Main>
            {step === STEPS.REQUEST_RECOVERY_METHODS && (
                <>
                    <Header title={c('Title').t`Reset password`} left={<BackButton onClick={onBack || handleBack} />} />
                    <Content>
                        <div className="mb1-75">{c('Info')
                            .t`Enter the email address associated with your Proton Account or your account username.`}</div>
                        <RequestRecoveryForm
                            state={state}
                            setters={setters}
                            onSubmit={() => {
                                return handleRequestRecoveryMethods();
                            }}
                        />
                    </Content>
                </>
            )}
            {step === STEPS.NO_RECOVERY_METHODS && (
                <>
                    <Header title={c('Title').t`No recovery method`} left={<BackButton onClick={handleBack} />} />
                    <Content>
                        <form>
                            <div className="mb1-75">{c('Info')
                                .t`Unfortunately there is no recovery method saved for this account.`}</div>
                            <Button color="norm" size="large" onClick={handleBack} fullWidth>{c('Action')
                                .t`Return to login`}</Button>
                            <ButtonLike
                                as={Href}
                                shape="ghost"
                                color="norm"
                                size="large"
                                url="https://protonmail.com/support-form"
                                target="_self"
                                fullWidth
                                className="mt0-5"
                            >{c('Action').t`Contact support`}</ButtonLike>
                        </form>
                    </Content>
                </>
            )}
            {step === STEPS.REQUEST_RESET_TOKEN && (
                <>
                    <Header title={c('Title').t`Reset password`} left={<BackButton onClick={reset} />} />
                    <Content>
                        <RequestResetTokenForm
                            defaultCountry={defaultCountry}
                            onSubmit={() => {
                                return handleRequest();
                            }}
                            state={state}
                            setters={setters}
                        />
                    </Content>
                </>
            )}
            {step === STEPS.VALIDATE_RESET_TOKEN && (
                <>
                    <Header
                        title={c('Title').t`Reset password`}
                        left={
                            <BackButton
                                onClick={() => {
                                    gotoStep(
                                        methods?.includes('login')
                                            ? STEPS.REQUEST_RECOVERY_METHODS
                                            : STEPS.REQUEST_RESET_TOKEN
                                    );
                                }}
                            />
                        }
                    />
                    <Content>
                        <ValidateResetTokenForm
                            onSubmit={() => {
                                return handleValidateResetToken(STEPS.NEW_PASSWORD);
                            }}
                            state={state}
                            setters={setters}
                            onBack={() => {
                                gotoStep(
                                    methods?.includes('login')
                                        ? STEPS.REQUEST_RECOVERY_METHODS
                                        : STEPS.REQUEST_RESET_TOKEN
                                );
                            }}
                            onRequest={handleRequest}
                        />
                    </Content>
                </>
            )}
            {step === STEPS.NEW_PASSWORD && (
                <>
                    <Header title={c('Title').t`Reset password`} left={<BackButton onClick={reset} />} />
                    <Content>
                        <SetPasswordForm
                            onSubmit={(newPassword: string) => {
                                return handleNewPassword(newPassword);
                            }}
                        />
                    </Content>
                </>
            )}
            {step === STEPS.ERROR && (
                <>
                    <Header
                        title={c('Title').t`Error`}
                        left={
                            <BackButton
                                onClick={() => {
                                    gotoStep(STEPS.REQUEST_RECOVERY_METHODS);
                                }}
                            />
                        }
                    />
                    <Content>
                        {(error && <div>{error}</div>) || <GenericError />}
                        <Button color="norm" size="large" onClick={handleBack} fullWidth className="mt1-75">{c('Action')
                            .t`Return to login`}</Button>
                        <ButtonLike
                            as={Href}
                            color="norm"
                            shape="ghost"
                            size="large"
                            url="https://protonmail.com/support-form"
                            target="_self"
                            fullWidth
                            className="mt0-5"
                        >{c('Action').t`Contact support`}</ButtonLike>
                    </Content>
                </>
            )}
            <Footer>
                <LoginSupportDropdown />
            </Footer>
        </Main>
    );
};

export default ResetPasswordContainer;
