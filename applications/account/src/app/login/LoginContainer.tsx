import React, { useEffect, useRef, useState } from 'react';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import { APP_NAMES, APPS, BRAND_NAME, REQUIRES_INTERNAL_EMAIL_ADDRESS } from 'proton-shared/lib/constants';
import { Address as tsAddress } from 'proton-shared/lib/interfaces';
import { withUIDHeaders } from 'proton-shared/lib/fetch/headers';
import { queryAddresses } from 'proton-shared/lib/api/addresses';
import { getHasOnlyExternalAddresses } from 'proton-shared/lib/helpers/address';
import { revoke } from 'proton-shared/lib/api/auth';
import { removePersistedSession } from 'proton-shared/lib/authentication/persistedSessionStorage';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { queryAvailableDomains } from 'proton-shared/lib/api/domains';
import { handleCreateInternalAddressAndKey } from 'proton-shared/lib/keys';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';

import {
    AbuseModal,
    OnLoginCallback,
    OnLoginCallbackArguments,
    useApi,
    useErrorHandler,
    useModals,
} from 'react-components';
import {
    handleLogin,
    handleSetupPassword,
    handleTotp,
    handleUnlock,
} from 'react-components/containers/login/loginActions';
import { AuthActionResponse, AuthCacheResult, AuthStep } from 'react-components/containers/login/interface';

import BackButton from '../public/BackButton';
import { getToAppName } from '../public/helper';
import LoginForm from './LoginForm';
import Header from '../public/Header';
import Content from '../public/Content';
import Footer from '../public/Footer';
import LoginSupportDropdown from './LoginSupportDropdown';
import TOTPForm from './TOTPForm';
import Main from '../public/Main';
import UnlockForm from './UnlockForm';
import SetPasswordForm from './SetPasswordForm';
import GenerateInternalAddressStep, { InternalAddressGeneration } from './GenerateInternalAddressStep';

interface Props {
    onLogin: OnLoginCallback;
    toApp?: APP_NAMES;
    onBack?: () => void;
}

const LoginContainer = ({ onLogin, onBack, toApp }: Props) => {
    const { createModal } = useModals();
    const errorHandler = useErrorHandler();

    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    const cacheRef = useRef<AuthCacheResult | undefined>(undefined);
    const previousUsernameRef = useRef('');
    const generateInternalAddressRef = useRef<InternalAddressGeneration | undefined>(undefined);
    const [step, setStep] = useState(AuthStep.LOGIN);

    useEffect(() => {
        // Preparing login improvements
        silentApi(queryAvailableDomains('login'));
        return () => {
            cacheRef.current = undefined;
            generateInternalAddressRef.current = undefined;
        };
    }, []);

    const handleDone = async (args: OnLoginCallbackArguments) => {
        const { UID } = args;
        const uidApi = <T,>(config: any) => silentApi<T>(withUIDHeaders(UID, config));

        if (toApp && REQUIRES_INTERNAL_EMAIL_ADDRESS.includes(toApp)) {
            const Addresses =
                args.Addresses ||
                (await uidApi<{ Addresses: tsAddress[] }>(queryAddresses()).then(({ Addresses }) => Addresses));
            const { keyPassword, LocalID } = args;
            if (Addresses?.length && keyPassword && getHasOnlyExternalAddresses(Addresses)) {
                const { Domains = [] } = await uidApi<{ Domains: string[] }>(queryAvailableDomains());
                generateInternalAddressRef.current = {
                    externalEmailAddress: Addresses[0],
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
                            removePersistedSession(LocalID);
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
            const apiErrorMessage = getApiErrorMessage(e);
            createModal(<AbuseModal message={apiErrorMessage} />);
        } else {
            errorHandler(e);
        }
    };

    const toAppName = getToAppName(toApp);
    const mailAppName = getAppName(APPS.PROTONMAIL);

    const cache = cacheRef.current;
    const generateInternalAddress = generateInternalAddressRef.current;
    const externalEmailAddress = generateInternalAddress?.externalEmailAddress?.Email || '';

    return (
        <Main>
            {step === AuthStep.LOGIN && (
                <>
                    <Header
                        title={c('Title').t`Sign in`}
                        subTitle={toAppName ? c('Info').t`to continue to ${toAppName}` : undefined}
                        left={onBack && <BackButton onClick={onBack} />}
                    />
                    <Content>
                        <LoginForm
                            defaultUsername={previousUsernameRef.current}
                            onSubmit={(username, password, payload) => {
                                return handleLogin({
                                    username,
                                    password,
                                    api: silentApi,
                                    hasGenerateKeys: true,
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
                    <Header
                        title={c('Title').t`Two-factor authentication`}
                        left={<BackButton onClick={handleCancel} />}
                    />
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
                    <Header title={c('Title').t`Unlock your mailbox`} left={<BackButton onClick={handleCancel} />} />
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
                    <Header title={c('Title').t`Set new password`} left={<BackButton onClick={handleCancel} />} />
                    <Content>
                        <div className="mb1-75">
                            {c('Info')
                                .t`This will replace your temporary password. You will use it to access your ${BRAND_NAME} Account in the future.`}
                        </div>
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
                    api={silentApi}
                    mailAppName={mailAppName}
                    toAppName={toAppName}
                    availableDomains={generateInternalAddress.availableDomains}
                    externalEmailAddress={externalEmailAddress}
                    onBack={() => {
                        generateInternalAddress.revoke?.();
                        handleCancel();
                    }}
                    onSubmit={async (payload) => {
                        try {
                            await handleCreateInternalAddressAndKey({
                                api: generateInternalAddress.api,
                                keyPassword: generateInternalAddress.keyPassword,
                                domain: payload.domain,
                                username: payload.username,
                            });
                            await generateInternalAddress.onDone();
                        } catch (e) {
                            handleError(e);
                            handleCancel();
                        }
                    }}
                />
            )}
            <Footer>
                <LoginSupportDropdown />
            </Footer>
        </Main>
    );
};
export default LoginContainer;
