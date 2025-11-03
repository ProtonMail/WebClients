import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import type { OnLoginCallback } from '@proton/components';
import { AbuseModal, Icon, useApi, useConfig, useErrorHandler, useIsInboxElectronApp } from '@proton/components';
import ElectronBlockedContainer from '@proton/components/containers/app/ElectronBlockedContainer';
import type {
    AuthActionResponse,
    AuthCacheResult,
    AuthTypeData,
    ExternalSSOFlow,
} from '@proton/components/containers/login/interface';
import { AuthStep, AuthType } from '@proton/components/containers/login/interface';
import {
    handleFido2,
    handleNextLogin,
    handleSetupPassword,
    handleTotp,
    handleUnlock,
} from '@proton/components/containers/login/loginActions';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getIsPassApp, getIsVPNApp } from '@proton/shared/lib/authentication/apps';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { isElectronApp, isElectronPass } from '@proton/shared/lib/helpers/desktop';

import type { Paths } from '../content/helper';
import Text from '../public/Text';
import { getContinueToString } from '../public/helper';
import PorkbunHeader from '../single-signup-v2/mail/PorkbunHeader';
import { useFlowRef } from '../useFlowRef';
import { useGetAccountKTActivation } from '../useGetAccountKTActivation';
import type { MetaTags } from '../useMetaTags';
import { useMetaTags } from '../useMetaTags';
import type { LoginFormRef } from './LoginForm';
import LoginForm from './LoginForm';
import { type Render, type RenderProps, defaultElectronPassLoginRender, defaultLoginRender } from './LoginRender';
import SetPasswordWithPolicyForm from './SetPasswordWithPolicyForm';
import Testflight from './Testflight';
import TwoFactorStep from './TwoFactorStep';
import UnlockForm from './UnlockForm';
import SSOLogin from './sso/SSOLogin';
import { useLoginTheme } from './useLoginTheme';

export enum RememberMode {
    VisibleDisabled = 0, // default
    Enable = 1,
    Hide = 2,
    HideEnable = 3,
}

export interface Props {
    defaultUsername?: string;
    initialSearchParams?: URLSearchParams;
    onLogin: OnLoginCallback;
    toAppName?: string;
    toApp?: APP_NAMES;
    showContinueTo?: boolean;
    onBack?: () => void;
    remember?: RememberMode;
    setupVPN: boolean;
    paths: Paths;
    productParam: ProductParam;
    modal?: boolean;
    metaTags: MetaTags | null;
    render?: Render;
    testflight?: 'vpn';
    externalRedirect?: string;
    onPreSubmit?: () => Promise<void>;
    onStartAuth: () => Promise<void>;
}

const getDefaultUsername = (searchParams?: URLSearchParams) => {
    if (!searchParams) {
        return;
    }
    return searchParams.get('username') || searchParams.get('email');
};

const defaultRender = isElectronPass ? defaultElectronPassLoginRender : defaultLoginRender;

export interface LoginContainerState {
    username?: string;
    authTypeData?: AuthTypeData;
    externalSSO?: {
        token?: string;
        flow?: ExternalSSOFlow;
    };
}

const LoginContainer = ({
    initialSearchParams,
    metaTags,
    defaultUsername,
    onLogin,
    onBack,
    toAppName,
    toApp,
    showContinueTo,
    productParam,
    setupVPN,
    remember = RememberMode.VisibleDisabled,
    paths,
    modal,
    render = defaultRender,
    testflight,
    externalRedirect,
    onPreSubmit,
    onStartAuth,
}: Props) => {
    const { state } = useLocation<LoginContainerState | undefined>();
    const { APP_NAME } = useConfig();
    const [authTypeData, setAuthTypeData] = useState<AuthTypeData>(() => {
        if (state?.authTypeData) {
            return state.authTypeData;
        }
        if (getIsVPNApp(toApp) || getIsPassApp(toApp)) {
            return { type: AuthType.Auto };
        }
        return { type: AuthType.Srp };
    });
    const { isElectronDisabled } = useIsInboxElectronApp();
    const loginFormRef = useRef<LoginFormRef>();
    const searchParams = new URLSearchParams(location.search);
    const isPorkbun = searchParams.get('partner') === 'porkbun';

    const rememberParam = searchParams.get('remember');
    const rememberConfig = (() => {
        if (isElectronApp) {
            return RememberMode.HideEnable;
        }
        if (rememberParam) {
            const numericValue = parseInt(rememberParam, 10);
            if (!isNaN(numericValue) && numericValue in RememberMode) {
                return numericValue as RememberMode;
            }
        }
        return remember;
    })();

    useMetaTags(metaTags);

    const errorHandler = useErrorHandler();
    const [abuseModal, setAbuseModal] = useState<{ apiErrorMessage?: string } | undefined>(undefined);
    const getKtActivation = useGetAccountKTActivation();

    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    const cacheRef = useRef<AuthCacheResult | undefined>(undefined);
    const previousUsernameRef = useRef(
        state?.username ??
            defaultUsername ??
            getDefaultUsername(searchParams) ??
            getDefaultUsername(initialSearchParams) ??
            ''
    );
    const [step, setStep] = useState(AuthStep.LOGIN);

    const createFlow = useFlowRef();

    useEffect(() => {
        // Preparing login improvements
        void silentApi(queryAvailableDomains('login'));
        return () => {
            cacheRef.current = undefined;
        };
    }, []);

    const handleCancel = () => {
        createFlow.reset();
        previousUsernameRef.current = cacheRef.current?.username ?? '';
        cacheRef.current = undefined;
        setStep(AuthStep.LOGIN);
    };

    const handleResult = async (result: AuthActionResponse) => {
        createFlow.reset();
        if (result.to === AuthStep.DONE) {
            await onLogin(result.session);
            return;
        }
        cacheRef.current = result.cache;
        setStep(result.to);
    };

    const handleError = (e: any) => {
        if (e.data?.Code === API_CUSTOM_ERROR_CODES.AUTH_ACCOUNT_DISABLED) {
            setAbuseModal({ apiErrorMessage: getApiErrorMessage(e) });
        } else {
            errorHandler(e);
        }
    };

    const cache = cacheRef.current;

    const handleBackStep = (() => {
        if (step === AuthStep.LOGIN) {
            if (authTypeData.type === AuthType.AutoSrp) {
                return () => {
                    setAuthTypeData({ type: AuthType.Auto });
                    loginFormRef.current?.reset();
                };
            }
            return onBack
                ? () => {
                      if (loginFormRef.current?.getIsLoading()) {
                          return;
                      }
                      onBack?.();
                  }
                : undefined;
        }
        return () => {
            handleCancel();
        };
    })();

    const titles = (() => {
        if (testflight === 'vpn') {
            const app = `${VPN_APP_NAME} iOS`;
            return {
                title: c('Title').t`Sign in to join the Beta program`,
                // translator: full sentence is: "Enter your Proton Account details to join the Proton VPN iOS Beta program"
                subTitle: c('Title').t`Enter your ${BRAND_NAME} Account details to join the ${app} Beta program`,
            };
        }
        const continueTo = toAppName ? getContinueToString(toAppName) : '';
        if (authTypeData.type === AuthType.ExternalSSO) {
            return {
                title: c('sso').t`Sign in to your organization`,
                subTitle: continueTo,
            };
        }
        if (authTypeData.type === AuthType.AutoSrp) {
            return {
                title: c('sso').t`Welcome`,
                subTitle: (
                    <button onClick={handleBackStep} type="button" className="max-w-full text-ellipsis">
                        <Icon name="user" /> {authTypeData.username}
                    </button>
                ),
            };
        }
        const title = c('Title').t`Sign in`;
        const subTitle = continueTo || c('Info').t`Enter your ${BRAND_NAME} Account details.`;
        return {
            title,
            subTitle,
        };
    })();

    const sharedProps: Pick<RenderProps, 'step' | 'toApp'> = {
        toApp,
        step,
    };

    useLoginTheme();

    if (isElectronDisabled) {
        return <ElectronBlockedContainer />;
    }

    const beforeMainLogin = isPorkbun ? (
        <div className="flex justify-center align-center mb-8">
            <PorkbunHeader />
        </div>
    ) : undefined;

    return (
        <>
            <AbuseModal
                message={abuseModal?.apiErrorMessage}
                open={!!abuseModal}
                onClose={() => setAbuseModal(undefined)}
            />

            {step === AuthStep.LOGIN && (
                <>
                    {render({
                        ...sharedProps,
                        title: titles.title,
                        subTitle: titles.subTitle,
                        onBack: handleBackStep,
                        content: (
                            <>
                                {testflight === 'vpn' ? (
                                    <>
                                        <Testflight className="mb-8" />
                                        <div className="mb-1" />
                                    </>
                                ) : null}
                                <LoginForm
                                    usernameReadOnly={isPorkbun}
                                    loginFormRef={loginFormRef}
                                    api={silentApi}
                                    modal={modal || isElectronPass}
                                    appName={APP_NAME}
                                    externalSSO={{
                                        enabled: true,
                                        options: state?.externalSSO,
                                    }}
                                    signInText={showContinueTo ? `Continue to ${toAppName}` : undefined}
                                    productParam={productParam}
                                    paths={paths}
                                    defaultUsername={previousUsernameRef.current}
                                    remember={rememberConfig}
                                    authTypeData={authTypeData}
                                    externalRedirect={externalRedirect}
                                    onChangeAuthTypeData={setAuthTypeData}
                                    onPreSubmit={onPreSubmit}
                                    onStartAuth={onStartAuth}
                                    onSubmit={async (data) => {
                                        try {
                                            const validateFlow = createFlow();
                                            const result = await handleNextLogin({
                                                api: silentApi,
                                                appName: APP_NAME,
                                                toApp,
                                                ignoreUnlock: false,
                                                setupVPN,
                                                ktActivation: await getKtActivation(),
                                                username: data.username,
                                                password: data.password,
                                                persistent: data.persistent,
                                                authType: data.authType,
                                                authResponse: data.authResponse,
                                                authVersion: data.authVersion,
                                                productParam,
                                            });
                                            if (validateFlow()) {
                                                return await handleResult(result);
                                            }
                                        } catch (e) {
                                            handleError(e);
                                            handleCancel();
                                        }
                                    }}
                                />
                            </>
                        ),
                        beforeMain: beforeMainLogin,
                    })}
                </>
            )}
            {step === AuthStep.TWO_FA && cache && (
                <>
                    {render({
                        ...sharedProps,
                        title: c('Title').t`Two-factor authentication`,
                        onBack: handleBackStep,
                        content: (
                            <TwoFactorStep
                                fido2={cache.authResponse?.['2FA']?.FIDO2}
                                authTypes={cache.authTypes}
                                onSubmit={async (data) => {
                                    if (data.type === 'code') {
                                        try {
                                            const validateFlow = createFlow();
                                            const result = await handleTotp({
                                                cache,
                                                totp: data.payload,
                                            });
                                            if (validateFlow()) {
                                                return await handleResult(result);
                                            }
                                        } catch (e: any) {
                                            handleError(e);
                                            // Cancel on any error except totp retry
                                            if (e.name !== 'TOTPError') {
                                                handleCancel();
                                            }
                                        }
                                    }

                                    if (data.type === 'fido2') {
                                        try {
                                            const validateFlow = createFlow();
                                            const result = await handleFido2({ cache, payload: data.payload });
                                            if (validateFlow()) {
                                                return await handleResult(result);
                                            }
                                        } catch (e: any) {
                                            handleError(e);
                                            handleCancel();
                                        }
                                    }

                                    throw new Error('Unknown type');
                                }}
                            />
                        ),
                    })}
                </>
            )}
            {step === AuthStep.UNLOCK && cache && (
                <>
                    {render({
                        ...sharedProps,
                        title: c('Title').t`Unlock your data`,
                        onBack: handleBackStep,
                        content: (
                            <UnlockForm
                                onSubmit={async (clearKeyPassword) => {
                                    try {
                                        const validateFlow = createFlow();
                                        const result = await handleUnlock({
                                            cache,
                                            clearKeyPassword,
                                            isOnePasswordMode: false,
                                        });
                                        if (validateFlow()) {
                                            return await handleResult(result);
                                        }
                                    } catch (e: any) {
                                        handleError(e);
                                        // Cancel on any error except retry
                                        if (e.name !== 'PasswordError') {
                                            handleCancel();
                                        }
                                    }
                                }}
                            />
                        ),
                    })}
                </>
            )}
            {step === AuthStep.SSO && cache && (
                <SSOLogin
                    toApp={toApp}
                    step={step}
                    render={render}
                    cache={cache}
                    createFlow={createFlow}
                    onBack={handleBackStep}
                    onError={handleError}
                    onCancel={handleCancel}
                    onResult={handleResult}
                />
            )}
            {step === AuthStep.NEW_PASSWORD && cache && (
                <>
                    {render({
                        ...sharedProps,
                        title: c('Title').t`Set new password`,
                        onBack: handleBackStep,
                        content: (
                            <>
                                <Text>
                                    {c('Info')
                                        .t`This will replace your temporary password. You will use it to access your ${BRAND_NAME} Account in the future.`}
                                </Text>
                                <SetPasswordWithPolicyForm
                                    passwordPolicies={cache.data.passwordPolicies ?? []}
                                    onSubmit={async ({ password }) => {
                                        try {
                                            const validateFlow = createFlow();
                                            const result = await handleSetupPassword({
                                                cache,
                                                newPassword: password,
                                            });
                                            if (validateFlow()) {
                                                return await handleResult(result);
                                            }
                                        } catch (e: any) {
                                            handleError(e);
                                            handleCancel();
                                        }
                                    }}
                                />
                            </>
                        ),
                    })}
                </>
            )}
        </>
    );
};
export default LoginContainer;
