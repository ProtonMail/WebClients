import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { AbuseModal, OnLoginCallback, useApi, useErrorHandler } from '@proton/components';
import { AuthActionResponse, AuthCacheResult, AuthStep } from '@proton/components/containers/login/interface';
import {
    handleLogin,
    handleSetupInternalAddress,
    handleSetupPassword,
    handleTotp,
    handleUnlock,
} from '@proton/components/containers/login/loginActions';
import { revoke } from '@proton/shared/lib/api/auth';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Layout from '../public/Layout';
import Main from '../public/Main';
import Text from '../public/Text';
import GenerateInternalAddressStep from './GenerateInternalAddressStep';
import LoginForm from './LoginForm';
import LoginSupportDropdown from './LoginSupportDropdown';
import SetPasswordForm from './SetPasswordForm';
import TOTPForm from './TOTPForm';
import UnlockForm from './UnlockForm';

interface Props {
    onLogin: OnLoginCallback;
    shouldSetupInternalAddress?: boolean;
    toAppName?: string;
    showContinueTo?: boolean;
    onBack?: () => void;
    hasRemember?: boolean;
    hasGenerateKeys?: boolean;
    hasActiveSessions?: boolean;
}

const LoginContainer = ({
    onLogin,
    onBack,
    toAppName,
    showContinueTo,
    shouldSetupInternalAddress,
    hasRemember = true,
    hasGenerateKeys = true,
    hasActiveSessions = false,
}: Props) => {
    const errorHandler = useErrorHandler();
    const [abuseModal, setAbuseModal] = useState<{ apiErrorMessage?: string } | undefined>(undefined);

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
    const generateInternalAddress = cache?.internalAddressSetup;
    const externalEmailAddress = generateInternalAddress?.externalEmailAddress?.Email;

    const handleBackStep = (() => {
        if (step === AuthStep.LOGIN) {
            return onBack;
        }
        if (step === AuthStep.GENERATE_INTERNAL) {
            return () => {
                cache?.authApi(revoke()).catch(noop);
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
                            signInText={showContinueTo ? `Continue to ${toAppName}` : undefined}
                            defaultUsername={previousUsernameRef.current}
                            hasRemember={hasRemember}
                            hasActiveSessions={hasActiveSessions}
                            onSubmit={async ({ username, password, payload, persistent }) => {
                                return handleLogin({
                                    username,
                                    password,
                                    persistent,
                                    api: silentApi,
                                    hasGenerateKeys,
                                    ignoreUnlock: false,
                                    hasInternalAddressSetup: !!shouldSetupInternalAddress,
                                    payload,
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
                        <TOTPForm
                            onSubmit={(totp) =>
                                handleTotp({
                                    cache,
                                    totp,
                                })
                                    .then(handleResult)
                                    .catch((e) => {
                                        handleError(e);
                                        // Cancel on any error except totp retry
                                        if (e.name !== 'TOTPError') {
                                            handleCancel();
                                        }
                                    })
                            }
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
            {step === AuthStep.GENERATE_INTERNAL && generateInternalAddress && (
                <GenerateInternalAddressStep
                    api={cache?.authApi}
                    onBack={handleBackStep}
                    toAppName={toAppName || MAIL_APP_NAME}
                    availableDomains={generateInternalAddress.availableDomains}
                    externalEmailAddress={externalEmailAddress}
                    setup={generateInternalAddress.setup}
                    onSubmit={async (payload) => {
                        return handleSetupInternalAddress({
                            cache,
                            payload,
                        })
                            .then(handleResult)
                            .catch((e: any) => {
                                handleError(e);
                                handleCancel();
                            });
                    }}
                />
            )}
        </Main>
    );

    return (
        <Layout
            hasWelcome
            hasBackButton={!!handleBackStep}
            hasDecoration={step === AuthStep.LOGIN}
            bottomRight={<LoginSupportDropdown />}
        >
            {children}
        </Layout>
    );
};
export default LoginContainer;
