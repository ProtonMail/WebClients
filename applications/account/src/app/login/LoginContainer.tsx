import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { APPS, BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { Address as tsAddress, UserType } from '@proton/shared/lib/interfaces';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { queryAddresses } from '@proton/shared/lib/api/addresses';
import { revoke } from '@proton/shared/lib/api/auth';
import { removePersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { handleCreateInternalAddressAndKey } from '@proton/shared/lib/keys';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import {
    AbuseModal,
    ButtonLike,
    OnLoginCallback,
    OnLoginCallbackArguments,
    useApi,
    useErrorHandler,
} from '@proton/components';
import {
    handleLogin,
    handleSetupPassword,
    handleTotp,
    handleUnlock,
} from '@proton/components/containers/login/loginActions';
import { AuthActionResponse, AuthCacheResult, AuthStep } from '@proton/components/containers/login/interface';

import LoginForm from './LoginForm';
import Header from '../public/Header';
import Content from '../public/Content';
import Text from '../public/Text';
import Layout from '../public/Layout';
import LoginSupportDropdown from './LoginSupportDropdown';
import TOTPForm from './TOTPForm';
import Main from '../public/Main';
import UnlockForm from './UnlockForm';
import SetPasswordForm from './SetPasswordForm';
import GenerateInternalAddressStep, { InternalAddressGeneration } from './GenerateInternalAddressStep';

interface Props {
    onLogin: OnLoginCallback;
    shouldSetupInternalAddress?: boolean;
    toAppName?: string;
    showContinueTo?: boolean;
    onBack?: () => void;
    hasRemember?: boolean;
    hasGenerateKeys?: boolean;
}

const LoginContainer = ({
    onLogin,
    onBack,
    toAppName,
    showContinueTo,
    shouldSetupInternalAddress,
    hasRemember = true,
    hasGenerateKeys = true,
}: Props) => {
    const errorHandler = useErrorHandler();
    const [abuseModal, setAbuseModal] = useState<{ apiErrorMessage?: string } | undefined>(undefined);

    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    const cacheRef = useRef<AuthCacheResult | undefined>(undefined);
    const previousUsernameRef = useRef('');
    const generateInternalAddressRef = useRef<InternalAddressGeneration | undefined>(undefined);
    const [step, setStep] = useState(AuthStep.LOGIN);

    useEffect(() => {
        // Preparing login improvements
        void silentApi(queryAvailableDomains('login'));
        return () => {
            cacheRef.current = undefined;
            generateInternalAddressRef.current = undefined;
        };
    }, []);

    const handleDone = async (args: OnLoginCallbackArguments) => {
        const { UID, User } = args;
        const uidApi = <T,>(config: any) => silentApi<T>(withUIDHeaders(UID, config));

        if (shouldSetupInternalAddress) {
            const Addresses =
                args.Addresses ||
                (await uidApi<{ Addresses: tsAddress[] }>(queryAddresses()).then(({ Addresses }) => Addresses));
            const { keyPassword, LocalID, UID } = args;
            if (keyPassword && User.Type === UserType.EXTERNAL) {
                const { Domains = [] } = await uidApi<{ Domains: string[] }>(queryAvailableDomains());
                generateInternalAddressRef.current = {
                    externalEmailAddress: Addresses?.[0],
                    availableDomains: Domains,
                    keyPassword,
                    onDone: () => {
                        // Remove addresses since a new one was created
                        const { Addresses, ...restAuthSession } = args;
                        return onLogin(restAuthSession);
                    },
                    revoke: () => {
                        // Since the session gets persisted, it has to be logged out if cancelling.
                        uidApi(revoke()).catch(noop);
                        if (LocalID !== undefined) {
                            removePersistedSession(LocalID, UID);
                        }
                    },
                    api: uidApi,
                };
                setStep(AuthStep.GENERATE_INTERNAL);
                return;
            }
        }
        return onLogin(args);
    };

    const handleCancel = () => {
        previousUsernameRef.current = cacheRef.current?.username ?? '';
        cacheRef.current = undefined;
        generateInternalAddressRef.current = undefined;
        setStep(AuthStep.LOGIN);
    };

    const handleResult = (result: AuthActionResponse) => {
        if (result.to === AuthStep.DONE) {
            return handleDone(result.session);
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

    const mailAppName = getAppName(APPS.PROTONMAIL);

    const cache = cacheRef.current;
    const generateInternalAddress = generateInternalAddressRef.current;
    const externalEmailAddress = generateInternalAddress?.externalEmailAddress?.Email;

    const handleBackStep = (() => {
        if (step === AuthStep.LOGIN) {
            return onBack;
        }
        if (step === AuthStep.GENERATE_INTERNAL) {
            return () => {
                generateInternalAddress?.revoke?.();
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
                            onSubmit={async ({ username, password, payload, persistent }) => {
                                return handleLogin({
                                    username,
                                    password,
                                    persistent,
                                    api: silentApi,
                                    hasGenerateKeys,
                                    ignoreUnlock: false,
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
            {step === AuthStep.TOTP && cache && (
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
                    onBack={handleBackStep}
                    api={silentApi}
                    mailAppName={mailAppName}
                    toAppName={toAppName || MAIL_APP_NAME}
                    availableDomains={generateInternalAddress.availableDomains}
                    externalEmailAddress={externalEmailAddress}
                    onSubmit={async (payload) => {
                        try {
                            await handleCreateInternalAddressAndKey({
                                api: generateInternalAddress.api,
                                keyPassword: generateInternalAddress.keyPassword,
                                domain: payload.domain,
                                username: payload.username,
                            });
                            await generateInternalAddress.onDone();
                        } catch (e: any) {
                            handleError(e);
                            handleCancel();
                        }
                    }}
                />
            )}
        </Main>
    );

    return (
        <Layout
            hasWelcome
            hasBackButton={!!handleBackStep}
            topRight={
                <ButtonLike
                    className="text-semibold text-ellipsis"
                    shape="outline"
                    color="norm"
                    pill
                    as={Link}
                    to="/signup"
                >
                    {c('Action').t`Create free account`}
                </ButtonLike>
            }
            hasDecoration={step === AuthStep.LOGIN}
            bottomRight={<LoginSupportDropdown />}
        >
            {children}
        </Layout>
    );
};
export default LoginContainer;
