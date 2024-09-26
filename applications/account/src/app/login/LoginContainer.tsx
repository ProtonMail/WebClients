import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import type { OnLoginCallback } from '@proton/components';
import {
    AbuseModal,
    useApi,
    useConfig,
    useErrorHandler,
    useIsInboxElectronApp,
    useKTActivation,
} from '@proton/components';
import ElectronBlockedContainer from '@proton/components/containers/app/ElectronBlockedContainer';
import useVerifyOutboundPublicKeys from '@proton/components/containers/keyTransparency/useVerifyOutboundPublicKeys';
import type {
    AuthActionResponse,
    AuthCacheResult,
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
import { getIsVPNApp } from '@proton/shared/lib/authentication/apps';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { isElectronPass } from '@proton/shared/lib/helpers/desktop';

import type { Paths } from '../content/helper';
import Content from '../public/Content';
import Header from '../public/Header';
import Layout from '../public/Layout';
import Main from '../public/Main';
import PublicHelpLink from '../public/PublicHelpLink';
import Text from '../public/Text';
import { getContinueToString } from '../public/helper';
import { useFlowRef } from '../useFlowRef';
import type { MetaTags } from '../useMetaTags';
import { useMetaTags } from '../useMetaTags';
import type { LoginFormRef } from './LoginForm';
import LoginForm from './LoginForm';
import SetPasswordForm from './SetPasswordForm';
import Testflight from './Testflight';
import TwoFactorStep from './TwoFactorStep';
import UnlockForm from './UnlockForm';

interface RenderProps {
    title: string;
    subTitle?: string;
    onBack?: () => void;
    content: ReactNode;
}

interface Props {
    defaultUsername?: string;
    initialSearchParams?: URLSearchParams;
    onLogin: OnLoginCallback;
    toAppName?: string;
    toApp?: APP_NAMES;
    showContinueTo?: boolean;
    onBack?: () => void;
    hasRemember?: boolean;
    setupVPN: boolean;
    paths: Paths;
    productParam: ProductParam;
    modal?: boolean;
    metaTags: MetaTags | null;
    render?: (renderProps: RenderProps) => ReactNode;
    testflight?: 'vpn';
    externalRedirect?: string;
}

const defaultRender = (data: RenderProps) => {
    return (
        <>
            <Header onBack={data.onBack} title={data.title} subTitle={data.subTitle} />
            <Content>{data.content}</Content>
        </>
    );
};

const getDefaultUsername = (searchParams?: URLSearchParams) => {
    if (!searchParams) {
        return;
    }
    return searchParams.get('username') || searchParams.get('email');
};

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
    hasRemember = true,
    paths,
    modal,
    render = defaultRender,
    testflight,
    externalRedirect,
}: Props) => {
    const { state } = useLocation<
        | {
              username?: string;
              authType?: AuthType;
              externalSSO?: {
                  token?: string;
                  flow?: ExternalSSOFlow;
              };
          }
        | undefined
    >();
    const { APP_NAME } = useConfig();
    const [authType, setAuthType] = useState<AuthType>(state?.authType || AuthType.SRP);
    const { isElectronDisabled } = useIsInboxElectronApp();
    const loginFormRef = useRef<LoginFormRef>();
    const searchParams = new URLSearchParams(location.search);
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();

    useMetaTags(metaTags);

    const errorHandler = useErrorHandler();
    const [abuseModal, setAbuseModal] = useState<{ apiErrorMessage?: string } | undefined>(undefined);
    const ktActivation = useKTActivation();

    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    const cacheRef = useRef<AuthCacheResult | undefined>(undefined);
    const previousUsernameRef = useRef(
        state?.username ||
            defaultUsername ||
            getDefaultUsername(searchParams) ||
            getDefaultUsername(initialSearchParams) ||
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
        if (authType === AuthType.ExternalSSO) {
            return {
                title: c('Title').t`Sign in to your organization`,
                subTitle: continueTo,
            };
        }
        const title = c('Title').t`Sign in`;
        const subTitle = continueTo || c('Info').t`Enter your ${BRAND_NAME} Account details.`;
        return {
            title,
            subTitle,
        };
    })();

    if (isElectronDisabled) {
        return <ElectronBlockedContainer />;
    }

    const children = (
        <>
            <AbuseModal
                message={abuseModal?.apiErrorMessage}
                open={!!abuseModal}
                onClose={() => setAbuseModal(undefined)}
            />

            {step === AuthStep.LOGIN && (
                <>
                    {render({
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
                                    loginFormRef={loginFormRef}
                                    api={silentApi}
                                    modal={modal || isElectronPass}
                                    appName={APP_NAME}
                                    externalSSO={{
                                        enabled: APP_NAME === APPS.PROTONACCOUNT && getIsVPNApp(toApp),
                                        options: state?.externalSSO,
                                    }}
                                    signInText={showContinueTo ? `Continue to ${toAppName}` : undefined}
                                    productParam={productParam}
                                    paths={paths}
                                    defaultUsername={previousUsernameRef.current}
                                    hasRemember={hasRemember && !isElectronPass}
                                    authType={authType}
                                    externalRedirect={externalRedirect}
                                    onChangeAuthType={(authType) => {
                                        setAuthType(authType);
                                    }}
                                    onSubmit={async (data) => {
                                        try {
                                            const validateFlow = createFlow();
                                            const result = await handleNextLogin({
                                                api: silentApi,
                                                appName: APP_NAME,
                                                toApp,
                                                ignoreUnlock: data.authType === AuthType.ExternalSSO,
                                                setupVPN,
                                                ktActivation,
                                                verifyOutboundPublicKeys,
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
                    })}
                </>
            )}
            {step === AuthStep.TWO_FA && cache && (
                <>
                    {render({
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
            {step === AuthStep.NEW_PASSWORD && cache && (
                <>
                    {render({
                        title: c('Title').t`Set new password`,
                        onBack: handleBackStep,
                        content: (
                            <>
                                <Text>
                                    {c('Info')
                                        .t`This will replace your temporary password. You will use it to access your ${BRAND_NAME} Account in the future.`}
                                </Text>
                                <SetPasswordForm
                                    onSubmit={async (newPassword) => {
                                        try {
                                            const validateFlow = createFlow();
                                            const result = await handleSetupPassword({
                                                cache,
                                                newPassword,
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

    if (modal) {
        return children;
    }

    if (isElectronPass) {
        return (
            <Layout toApp={toApp}>
                <Main>{children}</Main>
            </Layout>
        );
    }

    return (
        <Layout
            toApp={toApp}
            hasWelcome
            onBack={handleBackStep}
            hasDecoration={step === AuthStep.LOGIN}
            bottomRight={<PublicHelpLink />}
        >
            <Main>{children}</Main>
        </Layout>
    );
};
export default LoginContainer;
