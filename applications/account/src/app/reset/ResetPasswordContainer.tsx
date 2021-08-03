import React, { useRef, useState } from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router-dom';

import {
    Button,
    ButtonLike,
    FeatureCode,
    GenericError,
    Href,
    OnLoginCallback,
    useApi,
    useErrorHandler,
    useFeature,
    useMyLocation,
    useNotifications,
} from '@proton/components';
import {
    handleNewPassword,
    handleRequestRecoveryMethods,
    handleRequestToken,
    handleValidateResetToken,
} from '@proton/components/containers/resetPassword/resetActions';
import { ResetActionResponse, ResetCacheResult, STEPS } from '@proton/components/containers/resetPassword/interface';

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
    const keyMigrationFeature = useFeature(FeatureCode.KeyMigration);
    const cacheRef = useRef<ResetCacheResult | undefined>(undefined);
    const errorHandler = useErrorHandler();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const { createNotification } = useNotifications();

    const [myLocation] = useMyLocation();
    const defaultCountry = myLocation?.Country?.toUpperCase();

    const handleBack = () => {
        history.push('/login');
    };

    const [step, setStep] = useState(STEPS.REQUEST_RECOVERY_METHODS);

    const handleCancel = () => {
        const username = cacheRef.current?.username ?? '';
        cacheRef.current = undefined;
        cacheRef.current = {
            username,
            Methods: [],
        };
        setStep(STEPS.REQUEST_RECOVERY_METHODS);
    };

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
        <Main>
            {step === STEPS.REQUEST_RECOVERY_METHODS && (
                <>
                    <Header title={c('Title').t`Reset password`} left={<BackButton onClick={onBack || handleBack} />} />
                    <Content>
                        <div className="mb1-75">{c('Info')
                            .t`Enter the email address associated with your Proton Account or your account username.`}</div>
                        <RequestRecoveryForm
                            defaultUsername={cache?.username}
                            onSubmit={(username) => {
                                return handleRequestRecoveryMethods({
                                    username,
                                    api: silentApi,
                                })
                                    .then(handleResult)
                                    .catch(handleError);
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
            {step === STEPS.REQUEST_RESET_TOKEN && cache && (
                <>
                    <Header title={c('Title').t`Reset password`} left={<BackButton onClick={handleCancel} />} />
                    <Content>
                        <RequestResetTokenForm
                            defaultCountry={defaultCountry}
                            defaultMethod={cache.method}
                            defaultValue={cache.value}
                            methods={cache.Methods}
                            onSubmit={({ value, method }) => {
                                if (!cache) {
                                    throw new Error('Missing cache');
                                }
                                return handleRequestToken({
                                    cache,
                                    value,
                                    method,
                                    username: cache.username,
                                    api: silentApi,
                                })
                                    .then(handleResult)
                                    .catch(handleError);
                            }}
                        />
                    </Content>
                </>
            )}
            {step === STEPS.VALIDATE_RESET_TOKEN && cache?.method && cache?.value && (
                <>
                    <Header
                        title={c('Title').t`Reset password`}
                        left={
                            <BackButton
                                onClick={() => {
                                    setStep(
                                        cache.Methods?.includes('login')
                                            ? STEPS.REQUEST_RECOVERY_METHODS
                                            : STEPS.REQUEST_RESET_TOKEN
                                    );
                                }}
                            />
                        }
                    />
                    <Content>
                        <ValidateResetTokenForm
                            method={cache.method}
                            value={cache.value}
                            onSubmit={(token) => {
                                return handleValidateResetToken({ api: silentApi, cache, token })
                                    .then(handleResult)
                                    .catch(handleError);
                            }}
                            onBack={() => {
                                setStep(
                                    cache.Methods?.includes('login')
                                        ? STEPS.REQUEST_RECOVERY_METHODS
                                        : STEPS.REQUEST_RESET_TOKEN
                                );
                            }}
                            onRequest={() => {
                                if (!cache || !cache.method || !cache.value) {
                                    throw new Error('Missing dep');
                                }
                                return handleRequestToken({
                                    cache,
                                    method: cache.method,
                                    value: cache.value,
                                    username: cache.username,
                                    api: silentApi,
                                })
                                    .then(handleResult)
                                    .catch(handleError);
                            }}
                        />
                    </Content>
                </>
            )}
            {step === STEPS.NEW_PASSWORD && cache && (
                <>
                    <Header title={c('Title').t`Reset password`} left={<BackButton onClick={handleCancel} />} />
                    <Content>
                        <SetPasswordForm
                            onSubmit={async (newPassword: string) => {
                                createNotification({
                                    text: c('Info')
                                        .t`This can take a few seconds or a few minutes depending on your device.`,
                                    type: 'info',
                                });
                                const keyMigrationFeatureValue = await keyMigrationFeature
                                    .get<number>()
                                    .then(({ Value }) => Value)
                                    .catch(() => 0);
                                return handleNewPassword({
                                    password: newPassword,
                                    api: silentApi,
                                    cache,
                                    keyMigrationFeatureValue,
                                })
                                    .then(handleResult)
                                    .catch(handleError);
                            }}
                        />
                    </Content>
                </>
            )}
            {step === STEPS.ERROR && (
                <>
                    <Header title={c('Title').t`Error`} left={<BackButton onClick={handleCancel} />} />
                    <Content>
                        <GenericError />
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
