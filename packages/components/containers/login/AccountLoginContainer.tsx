import React, { FunctionComponent, useState } from 'react';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import { APP_NAMES, REQUIRES_INTERNAL_EMAIL_ADDRESS } from 'proton-shared/lib/constants';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { withUIDHeaders } from 'proton-shared/lib/fetch/headers';
import { queryAddresses } from 'proton-shared/lib/api/addresses';
import { getHasOnlyExternalAddresses } from 'proton-shared/lib/helpers/address';
import { revoke } from 'proton-shared/lib/api/auth';
import { removePersistedSession } from 'proton-shared/lib/authentication/persistedSessionStorage';

import { useApi, useModals, useNotifications, useErrorHandler } from '../../hooks';

import AbuseModal from './AbuseModal';
import { Props as AccountPublicLayoutProps } from '../signup/AccountPublicLayout';
import BackButton from '../signup/BackButton';
import OneAccountIllustration from '../illustration/OneAccountIllustration';
import { getToAppName } from '../signup/helpers/helper';
import { LoginFlows, OnLoginCallbackArguments } from '../app';
import useLogin, { Props as UseLoginProps } from './useLogin';
import AccountGenerateInternalAddressContainer from './AccountGenerateInternalAddressContainer';
import { FORM } from './interface';
import AccountLoginForm from './components/AccountLoginForm';
import AccountTOTPForm from './components/AccountTOTPForm';
import AccountUnlockForm from './components/AccountUnlockForm';
import AccountSetPasswordForm from './components/AccountSetPasswordForm';

interface InternalAddressGeneration {
    externalEmailAddress: Address;
    keyPassword: string;
    api: Api;
    onDone: () => Promise<void>;
    revoke: () => void;
}

interface Props extends Omit<UseLoginProps, 'api'> {
    Layout: FunctionComponent<AccountPublicLayoutProps>;
    toApp?: APP_NAMES;
    onBack?: () => void;
}

const AccountLoginContainer = ({ onLogin, onBack, ignoreUnlock = false, Layout, toApp }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [loginFlow] = useState<LoginFlows>(() => {
        const params = new URLSearchParams(window.location.search);
        const welcomeParam = params.get('welcome');
        if (welcomeParam === '1') {
            return 'welcome';
        }
        if (welcomeParam === '2') {
            return 'welcome-full';
        }
    });
    const errorHandler = useErrorHandler();

    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    const [generateInternalAddress, setGenerateInternalAddress] = useState<InternalAddressGeneration | undefined>();

    const handleDone = async (args: OnLoginCallbackArguments) => {
        const { UID, LocalID, keyPassword } = args;
        const uidApi = <T,>(config: any) => silentApi<T>(withUIDHeaders(UID, config));

        const argsWithWelcome = {
            ...args,
            flow: loginFlow,
        };

        if (toApp && REQUIRES_INTERNAL_EMAIL_ADDRESS.includes(toApp)) {
            // Since the address route is slow, and in order to make the external check more efficient, query for a smaller number of addresses
            // A user signed up with an external address should only have 1 address
            const { Addresses } = await uidApi<{ Addresses: Address[] }>(queryAddresses({ PageSize: 5, Page: 0 }));
            if (Addresses?.length && keyPassword && getHasOnlyExternalAddresses(Addresses)) {
                return setGenerateInternalAddress({
                    externalEmailAddress: Addresses[0],
                    keyPassword,
                    onDone: () => onLogin(argsWithWelcome),
                    revoke: () => {
                        // Since the session gets persisted, it has to be logged out if cancelling.
                        uidApi(revoke()).catch(noop);
                        if (LocalID !== undefined) {
                            removePersistedSession(LocalID);
                        }
                    },
                    api: uidApi,
                });
            }
        }

        return onLogin(argsWithWelcome);
    };

    const {
        state,
        errors,
        setters,
        handleLogin,
        handleTotp,
        handleUnlock,
        handleSetNewPassword,
        handleCancel,
    } = useLogin({ onLogin: handleDone, ignoreUnlock, hasGenerateKeys: true, api: silentApi });

    const catchHandler = (e: any) => {
        if (e.data?.Code === API_CUSTOM_ERROR_CODES.AUTH_ACCOUNT_DISABLED) {
            return createModal(<AbuseModal />);
        }
        if (e.name === 'TOTPError' || e.name === 'PasswordError') {
            return createNotification({ type: 'error', text: e.message });
        }
        errorHandler(e);
    };

    const toAppName = getToAppName(toApp);

    if (generateInternalAddress) {
        const handleBack = () => {
            generateInternalAddress?.revoke?.();
            handleCancel();
            setGenerateInternalAddress(undefined);
        };
        const externalEmailAddressValue = generateInternalAddress.externalEmailAddress.Email || '';
        return (
            <Layout
                title={c('Title').t`Create a ProtonMail address`}
                subtitle={c('Info')
                    .t`Your Proton Account is associated with ${externalEmailAddressValue}. To use ${toAppName}, please create an address.`}
                left={<BackButton onClick={handleBack} />}
            >
                <AccountGenerateInternalAddressContainer
                    onDone={generateInternalAddress.onDone}
                    api={generateInternalAddress.api}
                    keyPassword={generateInternalAddress.keyPassword}
                />
            </Layout>
        );
    }

    if (state.form === FORM.LOGIN) {
        const handleSubmit = () => {
            return handleLogin().catch(catchHandler);
        };

        const signupLink = <Link key="signupLink" to="/signup">{c('Link').t`Create an account`}</Link>;

        return (
            <Layout
                title={c('Title').t`Sign in`}
                subtitle={toAppName ? c('Info').t`to continue to ${toAppName}` : undefined}
                aside={<OneAccountIllustration />}
                right={null}
                left={onBack && <BackButton onClick={onBack} />}
            >
                <AccountLoginForm onSubmit={handleSubmit} state={state} setters={setters} />
                <div className="mb2 alignright">{c('Info').jt`New to Proton? ${signupLink}`}</div>
            </Layout>
        );
    }

    if (state.form === FORM.TOTP) {
        const handleSubmit = () => {
            return handleTotp().catch(catchHandler);
        };

        return (
            <Layout title={c('Title').t`Two-factor authentication`} left={<BackButton onClick={handleCancel} />}>
                <AccountTOTPForm state={state} setters={setters} onSubmit={handleSubmit} />
            </Layout>
        );
    }

    if (state.form === FORM.UNLOCK) {
        const handleSubmit = () => {
            return handleUnlock().catch(catchHandler);
        };

        return (
            <Layout title={c('Title').t`Unlock your mailbox`} left={<BackButton onClick={handleCancel} />}>
                <AccountUnlockForm state={state} setters={setters} onSubmit={handleSubmit} />
            </Layout>
        );
    }

    if (state.form === FORM.U2F) {
        throw new Error('U2F not implemented');
    }

    if (state.form === FORM.NEW_PASSWORD) {
        const handleSubmit = () => {
            return handleSetNewPassword().catch(catchHandler);
        };

        return (
            <Layout
                title={c('Title').t`Set new password`}
                subtitle={c('Info')
                    .t`This will replace your temporary password. You will use it to access your Proton account in the future.`}
                left={<BackButton onClick={handleCancel} />}
            >
                <AccountSetPasswordForm onSubmit={handleSubmit} state={state} setters={setters} errors={errors} />
            </Layout>
        );
    }

    throw new Error('Unsupported form');
};

export default AccountLoginContainer;
