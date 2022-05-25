import { useRef, useState } from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router-dom';

import {
    Button,
    ButtonLike,
    GenericError,
    Href,
    OnLoginCallback,
    useApi,
    useErrorHandler,
    useLocalState,
    useMyLocation,
    useNotifications,
    useSearchParamsEffect,
} from '@proton/components';
import {
    handleNewPassword,
    handleNewPasswordMnemonic,
    handleRequestRecoveryMethods,
    handleRequestToken,
    handleValidateResetToken,
} from '@proton/components/containers/resetPassword/resetActions';
import { ResetActionResponse, ResetCacheResult, STEPS } from '@proton/components/containers/resetPassword/interface';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import Main from '../public/Main';
import Header from '../public/Header';
import Text from '../public/Text';
import Content from '../public/Content';
import LoginSupportDropdown from '../login/LoginSupportDropdown';
import Layout from '../public/Layout';
import { defaultPersistentKey } from '../public/helper';

import RequestRecoveryForm from './RequestRecoveryForm';
import RequestResetTokenForm from './RequestResetTokenForm';
import ValidateResetTokenForm from './ValidateResetTokenForm';
import SetPasswordForm from '../login/SetPasswordForm';

interface Props {
    onLogin: OnLoginCallback;
    hasGenerateKeys?: boolean;
}

const ResetPasswordContainer = ({ onLogin, hasGenerateKeys = true }: Props) => {
    const history = useHistory();
    const cacheRef = useRef<ResetCacheResult | undefined>(undefined);
    const errorHandler = useErrorHandler();
    const [automaticVerification, setAutomaticVerification] = useState({ loading: false, username: '' });
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const { createNotification } = useNotifications();
    const [persistent] = useLocalState(true, defaultPersistentKey);

    const [myLocation] = useMyLocation();
    const defaultCountry = myLocation?.Country?.toUpperCase();

    const handleBack = () => {
        history.push('/login');
    };

    const [step, setStep] = useState(STEPS.REQUEST_RECOVERY_METHODS);

    const handleCancel = () => {
        const { username, persistent } = cacheRef.current || {};
        cacheRef.current = undefined;
        cacheRef.current = {
            persistent: persistent ?? true,
            username: username ?? '',
            Methods: [],
            hasGenerateKeys,
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
                createNotification({ text: c('Info').t`Done! We sent a code to ${destination}.`, expiration: 5000 });
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

    useSearchParamsEffect((params) => {
        const username = params.get('username');
        const token = params.get('token');
        if (username && token) {
            setAutomaticVerification({ username, loading: true });

            handleValidateResetToken({
                cache: {
                    username,
                    Methods: [],
                    persistent,
                    hasGenerateKeys,
                },
                api: silentApi,
                token,
            })
                .then(handleResult)
                .catch(handleError)
                .finally(() => {
                    setAutomaticVerification({ username, loading: false });
                });

            return new URLSearchParams();
        }
    }, []);

    const cache = cacheRef.current;

    const handleBackStep = (() => {
        if (step === STEPS.REQUEST_RECOVERY_METHODS) {
            return handleBack;
        }
        if (step === STEPS.NO_RECOVERY_METHODS) {
            return handleBack;
        }
        if (step === STEPS.VALIDATE_RESET_TOKEN && cache) {
            return () => {
                setStep(cache.Methods?.includes('login') ? STEPS.REQUEST_RECOVERY_METHODS : STEPS.REQUEST_RESET_TOKEN);
            };
        }
        return handleCancel;
    })();

    const children = (
        <Main>
            {step === STEPS.REQUEST_RECOVERY_METHODS && (
                <>
                    <Header title={c('Title').t`Reset password`} onBack={handleBackStep} />
                    <Content>
                        <Text>{c('Info').t`Enter your ${BRAND_NAME} Account email address or username.`}</Text>
                        {/* key to trigger a refresh so that it renders a default username */}
                        <RequestRecoveryForm
                            key={automaticVerification.username}
                            loading={automaticVerification.loading}
                            defaultUsername={cache?.username || automaticVerification.username}
                            onSubmit={(username) => {
                                return handleRequestRecoveryMethods({
                                    hasGenerateKeys,
                                    username,
                                    persistent,
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
                    <Header title={c('Title').t`No recovery method`} onBack={handleBackStep} />
                    <Content>
                        <Text>{c('Info').t`Unfortunately there is no recovery method saved for this account.`}</Text>
                        <form>
                            <Button color="norm" size="large" onClick={handleBack} fullWidth>{c('Action')
                                .t`Return to sign in`}</Button>
                            <ButtonLike
                                as={Href}
                                shape="ghost"
                                color="norm"
                                size="large"
                                url={getStaticURL('/support')}
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
                    <Header title={c('Title').t`Reset password`} onBack={handleBackStep} />
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
                    <Header title={c('Title').t`Reset password`} onBack={handleBackStep} />
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
                    <Header title={c('Title').t`Reset password`} onBack={handleBackStep} />
                    <Content>
                        <SetPasswordForm
                            onSubmit={async (newPassword: string) => {
                                createNotification({
                                    text: c('Info')
                                        .t`This can take a few seconds or a few minutes depending on your device`,
                                    type: 'info',
                                });

                                if (cache?.method === 'mnemonic') {
                                    return handleNewPasswordMnemonic({
                                        password: newPassword,
                                        cache,
                                    })
                                        .then(handleResult)
                                        .catch(handleError);
                                }

                                return handleNewPassword({
                                    password: newPassword,
                                    api: silentApi,
                                    cache,
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
                    <Header title={c('Title').t`Error`} onBack={handleBackStep} />
                    <Content>
                        <GenericError />
                        <Button color="norm" size="large" onClick={handleBack} fullWidth className="mt1-75">{c('Action')
                            .t`Return to sign in`}</Button>
                        <ButtonLike
                            as={Href}
                            color="norm"
                            shape="ghost"
                            size="large"
                            url={getStaticURL('/support')}
                            target="_self"
                            fullWidth
                            className="mt0-5"
                        >{c('Action').t`Contact support`}</ButtonLike>
                    </Content>
                </>
            )}
        </Main>
    );
    return (
        <Layout
            hasDecoration={step === STEPS.REQUEST_RECOVERY_METHODS}
            hasBackButton={!!handleBackStep}
            bottomRight={<LoginSupportDropdown />}
        >
            {children}
        </Layout>
    );
};

export default ResetPasswordContainer;
