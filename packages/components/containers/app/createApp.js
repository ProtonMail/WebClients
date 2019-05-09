import React, { useRef, useState, Suspense } from 'react';
import { Icons, ConfigContext } from 'react-components';

import { MAILBOX_PASSWORD_KEY, UID_KEY } from 'proton-shared/lib/constants';
import createAuthenticationStore from 'proton-shared/lib/authenticationStore';
import createSecureSessionStorage from 'proton-shared/lib/secureSessionStorage';

import AuthenticatedApp from './AuthenticatedApp';
import UnauthenticatedApp from './UnAuthenticatedApp';
import createApi from './createApi';
import ErrorBoundary from './ErrorBoundary';

const SECURE_SESSION_STORAGE_KEYS = [MAILBOX_PASSWORD_KEY, UID_KEY];

const wrap = (child) => {
    return (
        <div className="App body mod--hidden content">
            <ErrorBoundary>
                <Suspense fallback={'Loading component dynamically'}>{child}</Suspense>
                <Icons />
            </ErrorBoundary>
        </div>
    );
};

export default (config, AuthenticatedSlot, UnAuthenticatedSlot) => {
    // TODO: locales?

    if (!config || !AuthenticatedSlot || !UnAuthenticatedSlot) {
        throw new Error('Config, AuthenticatedSlot and UnAuthenticatedSlot required');
    }

    const secureSessionStorage = createSecureSessionStorage(SECURE_SESSION_STORAGE_KEYS);
    const authenticationStore = createAuthenticationStore(secureSessionStorage);
    const initApi = createApi(config);

    return () => {
        const loginDataRef = useRef();
        const [authenticated, setAuthenticated] = useState(() => authenticationStore.hasSession());

        const handleLogin = ({ authResult, credentials, userResult }) => {
            const { UID } = authResult;
            const { keyPassword } = credentials;

            authenticationStore.setUID(UID);
            authenticationStore.setPassword(keyPassword);

            loginDataRef.current = {
                user: userResult,
                eventID: authResult.EventID
            };

            setAuthenticated(true);
        };

        const handleLogout = () => {
            authenticationStore.setUID();
            authenticationStore.setPassword();

            loginDataRef.current = undefined;

            setAuthenticated(false);
        };

        if (!authenticated) {
            return wrap(
                <ConfigContext.Provider value={config}>
                    <UnauthenticatedApp initApi={initApi}>
                        <UnAuthenticatedSlot onLogin={handleLogin} />
                    </UnauthenticatedApp>
                </ConfigContext.Provider>
            );
        }

        return wrap(
            <ConfigContext.Provider value={config}>
                <AuthenticatedApp
                    authenticationStore={authenticationStore}
                    initApi={initApi}
                    loginData={loginDataRef.current}
                    onLogout={handleLogout}
                >
                    <AuthenticatedSlot onLogout={handleLogout} />
                </AuthenticatedApp>
            </ConfigContext.Provider>
        );
    };
};
