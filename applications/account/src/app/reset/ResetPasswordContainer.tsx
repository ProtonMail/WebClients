import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button, ButtonLike, CircleLoader, Href } from '@proton/atoms';
import {
    FeatureCode,
    GenericError,
    OnLoginCallback,
    useApi,
    useConfig,
    useErrorHandler,
    useFeature,
    useLocalState,
    useMyCountry,
    useNotifications,
    useResetSelfAudit,
    useSearchParamsEffect,
} from '@proton/components';
import { startUnAuthFlow } from '@proton/components/containers/api/unAuthenticatedApi';
import useKTActivation from '@proton/components/containers/keyTransparency/useKTActivation';
import {
    ResetActionResponse,
    ResetCacheResult,
    STEPS,
    ValidateResetTokenResponse,
} from '@proton/components/containers/resetPassword/interface';
import {
    handleNewPassword,
    handleNewPasswordMnemonic,
    handleRequestRecoveryMethods,
    handleRequestToken,
    handleValidateResetToken,
} from '@proton/components/containers/resetPassword/resetActions';
import { validateResetToken } from '@proton/shared/lib/api/reset';
import { APPS, APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';
import { decodeAutomaticResetParams } from '@proton/shared/lib/helpers/encoding';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import LoginSupportDropdown from '../login/LoginSupportDropdown';
import SetPasswordForm from '../login/SetPasswordForm';
import Content from '../public/Content';
import Header from '../public/Header';
import Layout from '../public/Layout';
import Main from '../public/Main';
import Text from '../public/Text';
import { defaultPersistentKey } from '../public/helper';
import { useFlowRef } from '../useFlowRef';
import { MetaTags, useMetaTags } from '../useMetaTags';
import RequestRecoveryForm from './RequestRecoveryForm';
import RequestResetTokenForm from './RequestResetTokenForm';
import ValidateResetTokenForm from './ValidateResetTokenForm';

interface Props {
    onLogin: OnLoginCallback;
    toApp: APP_NAMES | undefined;
    setupVPN: boolean;
    loginUrl: string;
    metaTags: MetaTags;
}

const ResetPasswordContainer = ({ metaTags, onLogin, setupVPN, loginUrl }: Props) => {
    const { APP_NAME } = useConfig();

    useMetaTags(metaTags);

    const history = useHistory();
    const location = useLocation();
    const cacheRef = useRef<ResetCacheResult | undefined>(undefined);
    const errorHandler = useErrorHandler();
    const [automaticVerification, setAutomaticVerification] = useState({ loading: false, username: '' });
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const { createNotification } = useNotifications();
    const [persistent] = useLocalState(false, defaultPersistentKey);
    const originalTrustedDeviceRecoveryFeature = useFeature<boolean>(FeatureCode.TrustedDeviceRecovery);
    const trustedDeviceRecoveryFeature =
        APP_NAME === APPS.PROTONVPN_SETTINGS
            ? {
                  loading: false,
                  feature: { Value: false },
              }
            : originalTrustedDeviceRecoveryFeature;
    const hasTrustedDeviceRecovery = !!trustedDeviceRecoveryFeature.feature?.Value;
    const ktActivation = useKTActivation();
    const resetSelfAudit = useResetSelfAudit();

    const [defaultCountry] = useMyCountry();

    const createFlow = useFlowRef();

    const handleBack = () => {
        history.push(loginUrl);
    };

    const [step, setStep] = useState(STEPS.REQUEST_RECOVERY_METHODS);

    const handleCancel = () => {
        createFlow.reset();
        const { username, persistent } = cacheRef.current || {};
        cacheRef.current = undefined;
        cacheRef.current = {
            setupVPN,
            appName: APP_NAME,
            persistent: persistent ?? true,
            username: username ?? '',
            type: 'internal',
            Methods: [],
            hasTrustedDeviceRecovery,
            ktActivation,
            resetSelfAudit,
        };
        setStep(STEPS.REQUEST_RECOVERY_METHODS);
    };

    const handleResult = (result: ResetActionResponse) => {
        createFlow.reset();
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
        setStep((step) => {
            if (step === STEPS.NEW_PASSWORD) {
                return STEPS.ERROR;
            }

            if (step === STEPS.LOADING) {
                return STEPS.REQUEST_RECOVERY_METHODS;
            }

            return step;
        });
    };

    useEffect(() => {
        startUnAuthFlow().catch(noop);
    }, []);

    /**
     * Recovery phrase automatic password reset
     */
    useEffect(() => {
        const hash = location.hash.slice(1);
        if (!hash) {
            return;
        }
        history.replace({ ...location, hash: '' });

        let params;
        try {
            params = decodeAutomaticResetParams(hash);
        } catch (error) {
            handleError(error);
        }

        if (!params) {
            return;
        }

        const { username, value } = params;
        if (!username || !value) {
            return;
        }

        const run = async () => {
            try {
                setStep(STEPS.LOADING);

                cacheRef.current = {
                    setupVPN,
                    appName: APP_NAME,
                    persistent: persistent ?? true,
                    username: username ?? '',
                    Methods: [],
                    type: 'internal',
                    hasTrustedDeviceRecovery,
                    ktActivation,
                    resetSelfAudit,
                };

                const validateFlow = createFlow();
                await startUnAuthFlow();
                const result = await handleRequestToken({
                    cache: cacheRef.current,
                    value,
                    method: 'mnemonic',
                    username,
                    api: silentApi,
                });
                if (validateFlow()) {
                    await handleResult(result);
                }
            } catch (e) {
                handleError(e);
            }
        };

        void run();
    }, []);

    useSearchParamsEffect(
        (params) => {
            if (trustedDeviceRecoveryFeature.loading) {
                return;
            }

            const username = params.get('username');
            const token = params.get('token');

            /**
             * Automatic token validation reset
             */
            if (username && token) {
                const run = async () => {
                    try {
                        setAutomaticVerification({ username, loading: true });

                        const validateFlow = createFlow();
                        await startUnAuthFlow();
                        const resetResponse = await silentApi<ValidateResetTokenResponse>(
                            validateResetToken(username, token)
                        );
                        const result = await handleValidateResetToken({
                            resetResponse,
                            cache: {
                                setupVPN,
                                appName: APP_NAME,
                                username,
                                type: 'internal',
                                Methods: [],
                                persistent,
                                hasTrustedDeviceRecovery,
                                ktActivation,
                                resetSelfAudit,
                            },
                            token,
                        });
                        if (validateFlow()) {
                            await handleResult(result);
                        }
                    } catch (e) {
                        handleError(e);
                    } finally {
                        setAutomaticVerification({ username, loading: false });
                    }
                };
                void run();

                return new URLSearchParams();
            }

            /**
             * Automatic username filling
             */
            if (username) {
                setAutomaticVerification({ username, loading: false });
                return new URLSearchParams();
            }
        },
        [trustedDeviceRecoveryFeature.loading]
    );

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
            {step === STEPS.LOADING && (
                <>
                    <Header title={c('Title').t`Reset password`} />
                    <Content className="text-center">
                        <CircleLoader className="color-primary my-4" size="large" />
                    </Content>
                </>
            )}
            {step === STEPS.REQUEST_RECOVERY_METHODS && (
                <>
                    <Header title={c('Title').t`Reset password`} onBack={handleBackStep} />
                    <Content>
                        <Text>{c('Info').t`Enter your ${BRAND_NAME} Account email address or username.`}</Text>
                        {/* key to trigger a refresh so that it renders a default username */}
                        <RequestRecoveryForm
                            loginUrl={loginUrl}
                            key={automaticVerification.username}
                            loading={automaticVerification.loading}
                            defaultUsername={cache?.username || automaticVerification.username}
                            onSubmit={async (username) => {
                                try {
                                    const validateFlow = createFlow();
                                    await startUnAuthFlow();
                                    const result = await handleRequestRecoveryMethods({
                                        setupVPN,
                                        appName: APP_NAME,
                                        hasTrustedDeviceRecovery,
                                        ktActivation,
                                        username,
                                        persistent,
                                        api: silentApi,
                                        resetSelfAudit,
                                    });
                                    if (validateFlow()) {
                                        return await handleResult(result);
                                    }
                                } catch (e) {
                                    handleError(e);
                                }
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
                                href={getStaticURL('/support')}
                                target="_self"
                                fullWidth
                                className="mt-2"
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
                            loginUrl={loginUrl}
                            defaultCountry={defaultCountry}
                            defaultEmail={
                                cache.type === 'external' && cache.Methods.includes('login')
                                    ? cache.username
                                    : undefined
                            }
                            defaultMethod={cache.method}
                            defaultValue={cache.value}
                            methods={cache.Methods}
                            onSubmit={async ({ value, method }) => {
                                if (!cache) {
                                    throw new Error('Missing cache');
                                }
                                try {
                                    const validateFlow = createFlow();
                                    const result = await handleRequestToken({
                                        cache,
                                        value,
                                        method,
                                        username: cache.username,
                                        api: silentApi,
                                    });
                                    if (validateFlow()) {
                                        return await handleResult(result);
                                    }
                                } catch (e) {
                                    handleError(e);
                                }
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
                            recoveryMethods={cache.Methods}
                            value={cache.value}
                            username={cache.username}
                            onSubmit={async ({ resetResponse, token }) => {
                                try {
                                    const validateFlow = createFlow();
                                    const result = await handleValidateResetToken({ resetResponse, cache, token });
                                    if (validateFlow()) {
                                        return await handleResult(result);
                                    }
                                } catch (e) {
                                    handleError(e);
                                }
                            }}
                            onBack={() => {
                                setStep(
                                    cache.Methods?.includes('login')
                                        ? STEPS.REQUEST_RECOVERY_METHODS
                                        : STEPS.REQUEST_RESET_TOKEN
                                );
                            }}
                            onRequest={async () => {
                                if (!cache || !cache.method || !cache.value) {
                                    throw new Error('Missing dep');
                                }
                                try {
                                    const validateFlow = createFlow();
                                    const result = await handleRequestToken({
                                        cache,
                                        method: cache.method,
                                        value: cache.value,
                                        username: cache.username,
                                        api: silentApi,
                                    });
                                    if (validateFlow()) {
                                        return await handleResult(result);
                                    }
                                } catch (e) {
                                    handleError(e);
                                }
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
                                    try {
                                        const validateFlow = createFlow();
                                        const result = await handleNewPasswordMnemonic({
                                            password: newPassword,
                                            cache,
                                        });
                                        if (validateFlow()) {
                                            return await handleResult(result);
                                        }
                                    } catch (e) {
                                        handleError(e);
                                    }
                                }

                                try {
                                    const validateFlow = createFlow();
                                    const result = await handleNewPassword({
                                        password: newPassword,
                                        api: silentApi,
                                        cache,
                                    });
                                    if (validateFlow()) {
                                        return await handleResult(result);
                                    }
                                } catch (e) {
                                    handleError(e);
                                }
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
                        <Button color="norm" size="large" onClick={handleBack} fullWidth className="mt-6">
                            {c('Action').t`Return to sign in`}
                        </Button>
                        <ButtonLike
                            as={Href}
                            color="norm"
                            shape="ghost"
                            size="large"
                            href={getStaticURL('/support')}
                            target="_self"
                            fullWidth
                            className="mt-2"
                        >
                            {c('Action').t`Contact support`}
                        </ButtonLike>
                    </Content>
                </>
            )}
        </Main>
    );
    return (
        <Layout
            hasDecoration={step === STEPS.REQUEST_RECOVERY_METHODS}
            onBack={handleBackStep}
            bottomRight={<LoginSupportDropdown />}
        >
            {children}
        </Layout>
    );
};

export default ResetPasswordContainer;
