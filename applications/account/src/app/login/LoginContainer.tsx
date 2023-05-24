import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import {
    AbuseModal,
    FeatureCode,
    OnLoginCallback,
    useApi,
    useConfig,
    useErrorHandler,
    useFeature,
} from '@proton/components';
import { startUnAuthFlow } from '@proton/components/containers/api/unAuthenticatedApi';
import { KT_FF } from '@proton/components/containers/keyTransparency/ktStatus';
import { AuthActionResponse, AuthCacheResult, AuthStep } from '@proton/components/containers/login/interface';
import {
    handleFido2,
    handleLogin,
    handleSetupPassword,
    handleTotp,
    handleUnlock,
} from '@proton/components/containers/login/loginActions';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { APPS, APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Layout from '../public/Layout';
import Main from '../public/Main';
import Text from '../public/Text';
import { useFlowRef } from '../useFlowRef';
import { useMetaTags } from '../useMetaTags';
import LoginForm from './LoginForm';
import LoginSupportDropdown from './LoginSupportDropdown';
import SetPasswordForm from './SetPasswordForm';
import TwoFactorStep from './TwoFactorStep';
import UnlockForm from './UnlockForm';
import { getLoginMeta } from './loginPagesJson';

interface Props {
    onLogin: OnLoginCallback;
    toAppName?: string;
    toApp?: APP_NAMES;
    showContinueTo?: boolean;
    onBack?: () => void;
    hasRemember?: boolean;
    setupVPN: boolean;
    signupOptions?: Record<string, string | undefined>;
}

const LoginContainer = ({
    onLogin,
    onBack,
    toAppName,
    toApp,
    showContinueTo,
    setupVPN,
    hasRemember = true,
    signupOptions = {},
}: Props) => {
    const { state } = useLocation<{ username?: string } | undefined>();
    const { APP_NAME } = useConfig();

    useMetaTags(getLoginMeta(toApp, APP_NAME));

    const errorHandler = useErrorHandler();
    const [abuseModal, setAbuseModal] = useState<{ apiErrorMessage?: string } | undefined>(undefined);
    const originalTrustedDeviceRecoveryFeature = useFeature<boolean>(FeatureCode.TrustedDeviceRecovery);
    const trustedDeviceRecoveryFeature =
        APP_NAME === APPS.PROTONVPN_SETTINGS
            ? {
                  loading: false,
                  feature: { Value: false },
              }
            : originalTrustedDeviceRecoveryFeature;
    const hasTrustedDeviceRecovery = !!trustedDeviceRecoveryFeature.feature?.Value;
    const ktFeature = useFeature<KT_FF>(FeatureCode.KeyTransparencyWEB);

    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    const cacheRef = useRef<AuthCacheResult | undefined>(undefined);
    const previousUsernameRef = useRef(state?.username || '');
    const [step, setStep] = useState(AuthStep.LOGIN);

    const createFlow = useFlowRef();

    useEffect(() => {
        if (step === AuthStep.LOGIN) {
            // This handles the case for:
            // 1) Being on the unlock/2fa screen and hitting the back button
            // 2) Being on the unlock/2fa screen and hitting the browser back button e.g. ending up on signup and then
            // going back here
            // And preemptively starting it before user interaction
            startUnAuthFlow().catch(noop);
        }
    }, [step]);

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

    const handleResult = (result: AuthActionResponse) => {
        createFlow.reset();
        if (result.to === AuthStep.DONE) {
            return onLogin(result.session);
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
            return onBack;
        }
        return () => {
            handleCancel();
        };
    })();

    const children = (
        <Main>
            <AbuseModal
                message={abuseModal?.apiErrorMessage}
                open={!!abuseModal}
                onClose={() => setAbuseModal(undefined)}
            />
            {step === AuthStep.LOGIN && (
                <>
                    <Header
                        onBack={handleBackStep}
                        title={c('Title').t`Sign in`}
                        subTitle={
                            toAppName
                                ? c('Info').t`to continue to ${toAppName}`
                                : c('Info').t`Enter your ${BRAND_NAME} Account details.`
                        }
                    />
                    <Content>
                        <LoginForm
                            toApp={toApp}
                            signInText={showContinueTo ? `Continue to ${toAppName}` : undefined}
                            signupOptions={signupOptions}
                            defaultUsername={previousUsernameRef.current}
                            hasRemember={hasRemember}
                            trustedDeviceRecoveryFeature={trustedDeviceRecoveryFeature}
                            onSubmit={async ({ username, password, payload, persistent }) => {
                                try {
                                    const validateFlow = createFlow();
                                    await startUnAuthFlow();
                                    const result = await handleLogin({
                                        username,
                                        password,
                                        persistent,
                                        api: silentApi,
                                        hasTrustedDeviceRecovery,
                                        appName: APP_NAME,
                                        toApp,
                                        ignoreUnlock: false,
                                        payload,
                                        setupVPN,
                                        ktFeature: (await ktFeature.get())?.Value,
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
                    </Content>
                </>
            )}
            {step === AuthStep.TWO_FA && cache && (
                <>
                    <Header title={c('Title').t`Two-factor authentication`} onBack={handleBackStep} />
                    <Content>
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
                    </Content>
                </>
            )}
            {step === AuthStep.UNLOCK && cache && (
                <>
                    <Header title={c('Title').t`Unlock your mailbox`} onBack={handleBackStep} />
                    <Content>
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
                    </Content>
                </>
            )}
            {step === AuthStep.NEW_PASSWORD && cache && (
                <>
                    <Header title={c('Title').t`Set new password`} onBack={handleBackStep} />
                    <Content>
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
                    </Content>
                </>
            )}
        </Main>
    );

    return (
        <Layout
            hasWelcome
            onBack={handleBackStep}
            hasDecoration={step === AuthStep.LOGIN}
            bottomRight={<LoginSupportDropdown />}
        >
            {children}
        </Layout>
    );
};
export default LoginContainer;
