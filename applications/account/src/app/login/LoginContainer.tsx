import { useEffect, useRef, useState } from 'react';

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
import { AuthActionResponse, AuthCacheResult, AuthStep } from '@proton/components/containers/login/interface';
import {
    handleFido2,
    handleLogin,
    handleSetupPassword,
    handleTotp,
    handleUnlock,
} from '@proton/components/containers/login/loginActions';
import { revoke } from '@proton/shared/lib/api/auth';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import getIsProtonMailDomain from '@proton/shared/lib/browser/getIsProtonMailDomain';
import { APPS, APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Layout from '../public/Layout';
import Main from '../public/Main';
import Text from '../public/Text';
import LoginForm from './LoginForm';
import LoginSupportDropdown from './LoginSupportDropdown';
import SetPasswordForm from './SetPasswordForm';
import TwoFactorStep from './TwoFactorStep';
import UnlockForm from './UnlockForm';

interface Props {
    onLogin: OnLoginCallback;
    toAppName?: string;
    toApp?: APP_NAMES;
    showContinueTo?: boolean;
    onBack?: () => void;
    hasRemember?: boolean;
    hasActiveSessions?: boolean;
    setupVPN: boolean;
}

const LoginContainer = ({
    onLogin,
    onBack,
    toAppName,
    toApp,
    showContinueTo,
    setupVPN,
    hasRemember = true,
    hasActiveSessions = false,
}: Props) => {
    const { APP_NAME } = useConfig();
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

    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    const cacheRef = useRef<AuthCacheResult | undefined>(undefined);
    const previousUsernameRef = useRef('');
    const [step, setStep] = useState(AuthStep.LOGIN);

    useEffect(() => {
        // Preparing login improvements
        void silentApi(queryAvailableDomains('login'));
        return () => {
            cacheRef.current = undefined;
        };
    }, []);

    useEffect(() => {
        const isProtonMailDomain = getIsProtonMailDomain();
        if (isProtonMailDomain) {
            window.location.replace('https://account.proton.me');
        }
    }, []);

    const handleCancel = () => {
        previousUsernameRef.current = cacheRef.current?.username ?? '';
        cacheRef.current = undefined;
        setStep(AuthStep.LOGIN);
    };

    const handleResult = (result: AuthActionResponse) => {
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
        if (step === AuthStep.SETUP) {
            return async () => {
                await cache?.authApi(revoke()).catch(noop);
                handleCancel();
            };
        }
        return handleCancel;
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
                            defaultUsername={previousUsernameRef.current}
                            hasRemember={hasRemember}
                            hasActiveSessions={hasActiveSessions}
                            trustedDeviceRecoveryFeature={trustedDeviceRecoveryFeature}
                            onSubmit={async ({ username, password, payload, persistent }) => {
                                return handleLogin({
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
                                })
                                    .then(handleResult)
                                    .catch((e) => {
                                        handleError(e);
                                        handleCancel();
                                    });
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
                            onSubmit={(data) => {
                                if (data.type === 'code') {
                                    return handleTotp({
                                        cache,
                                        totp: data.payload,
                                    })
                                        .then(handleResult)
                                        .catch((e) => {
                                            handleError(e);
                                            // Cancel on any error except totp retry
                                            if (e.name !== 'TOTPError') {
                                                handleCancel();
                                            }
                                        });
                                }
                                if (data.type === 'fido2') {
                                    return handleFido2({ cache, payload: data.payload })
                                        .then(handleResult)
                                        .catch((e) => {
                                            handleError(e);
                                            handleCancel();
                                        });
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
                            onSubmit={(clearKeyPassword) => {
                                return handleUnlock({
                                    cache,
                                    clearKeyPassword,
                                    isOnePasswordMode: false,
                                })
                                    .then(handleResult)
                                    .catch((e) => {
                                        handleError(e);
                                        // Cancel on any error except retry
                                        if (e.name !== 'PasswordError') {
                                            handleCancel();
                                        }
                                    });
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
                            onSubmit={(newPassword) => {
                                return handleSetupPassword({
                                    cache,
                                    newPassword,
                                })
                                    .then(handleResult)
                                    .catch((e) => {
                                        handleError(e);
                                        handleCancel();
                                    });
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
