import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Router } from 'react-router';
import { History, createBrowserHistory as createHistory } from 'history';
import createAuthentication from 'proton-shared/lib/authentication/createAuthenticationStore';
import createCache, { Cache } from 'proton-shared/lib/helpers/cache';
import { AddressesModel } from 'proton-shared/lib/models';
import { formatUser, UserModel } from 'proton-shared/lib/models/userModel';
import { STATUS } from 'proton-shared/lib/models/cache';
import createSecureSessionStorage from 'proton-shared/lib/authentication/createSecureSessionStorage';
import createSecureSessionStorage2 from 'proton-shared/lib/authentication/createSecureSessionStorage2';
import { isSSOMode, MAILBOX_PASSWORD_KEY, UID_KEY, SSO_PATHS, APPS } from 'proton-shared/lib/constants';
import { getPersistedSession } from 'proton-shared/lib/authentication/persistedSessionStorage';
import { noop } from 'proton-shared/lib/helpers/function';
import createListeners from 'proton-shared/lib/helpers/listeners';
import {
    getBasename,
    getLocalIDFromPathname,
    stripLocalBasenameFromPathname,
} from 'proton-shared/lib/authentication/pathnameHelper';
import { stripLeadingAndTrailingSlash } from 'proton-shared/lib/helpers/string';
import { ProtonConfig } from 'proton-shared/lib/interfaces';
import { replaceUrl } from 'proton-shared/lib/helpers/browser';
import { getAppHref } from 'proton-shared/lib/apps/helper';
import { requestFork } from 'proton-shared/lib/authentication/sessionForking';
import { FORK_TYPE } from 'proton-shared/lib/authentication/ForkInterface';

import { Icons } from '../../components';
import Signout from './Signout';
import CompatibilityCheck from '../compatibilityCheck/CompatibilityCheck';
import ConfigProvider from '../config/Provider';
import NotificationsProvider from '../notifications/Provider';
import ModalsProvider from '../modals/Provider';
import ApiProvider from '../api/ApiProvider';
import CacheProvider from '../cache/Provider';
import AuthenticationProvider from '../authentication/Provider';
import RightToLeftProvider from '../rightToLeft/Provider';
import { setTmpEventID } from './loadEventID';
import clearKeyCache from './clearKeyCache';
import { OnLoginCallbackArguments } from './interface';
import { useInstance, PreventLeaveProvider } from '../../hooks';
import { GlobalLoaderProvider, GlobalLoader } from '../../components/globalLoader';
import { WELCOME_FLAG_KEY } from '../../hooks/useWelcomeFlags';
import ThemeProvider from '../themes/ThemeProvider';

const getIsSSOPath = (pathname: string) => {
    const strippedPathname = `/${stripLeadingAndTrailingSlash(pathname)}`;
    return Object.values(SSO_PATHS).some((path) => strippedPathname.startsWith(path));
};

const getSafePath = (url: string) => {
    try {
        const { pathname, hash, search } = new URL(url, window.location.origin);
        if (getIsSSOPath(pathname)) {
            return '';
        }
        return `${stripLeadingAndTrailingSlash(stripLocalBasenameFromPathname(pathname))}${search}${hash}`;
    } catch (e) {
        return '';
    }
};

const getPath = (oldUrl: string, requestedPath?: string) => {
    return `/${getSafePath(requestedPath || '/') || getSafePath(oldUrl)}`;
};

const getInitialState = (oldUID?: string, oldLocalID?: number): { UID?: string; localID?: number } | undefined => {
    if (!isSSOMode) {
        return {
            UID: oldUID,
            localID: undefined,
        };
    }
    const { pathname } = window.location;
    if (getIsSSOPath(pathname)) {
        // Special routes which should never be logged in
        return;
    }
    const localID = getLocalIDFromPathname(pathname);
    if (localID === undefined || oldLocalID === undefined) {
        return;
    }
    const oldPersistedSession = getPersistedSession(oldLocalID);
    // Current session is active and actual
    if (oldPersistedSession?.UID === oldUID && localID === oldLocalID) {
        return {
            UID: oldUID,
            localID,
        };
    }
};

interface AuthState {
    UID?: string;
    localID?: number;
    history: History;
    isLoggingOut?: boolean;
    consumerLogoutPromise?: Promise<void>;
}

interface Props {
    config: ProtonConfig;
    children: React.ReactNode;
    hasInitialAuth?: boolean;
}

const ProtonApp = ({ config, children, hasInitialAuth }: Props) => {
    const authentication = useInstance(() => {
        if (isSSOMode) {
            return createAuthentication(createSecureSessionStorage2());
        }
        return createAuthentication(createSecureSessionStorage([MAILBOX_PASSWORD_KEY, UID_KEY]));
    });
    const pathRef = useRef<string | undefined>();
    const cacheRef = useRef<Cache<string, any>>();
    if (!cacheRef.current) {
        cacheRef.current = createCache<string, any>();
    }
    const [authData, setAuthData] = useState<AuthState>(() => {
        const state =
            hasInitialAuth === false
                ? undefined
                : getInitialState(authentication.getUID(), authentication.getLocalID());
        const history = createHistory({ basename: getBasename(state?.localID) });
        return {
            ...state,
            history,
        };
    });

    const handleLogin = useCallback(
        ({
            UID: newUID,
            EventID,
            keyPassword,
            User,
            Addresses,
            LocalID: newLocalID,
            path,
            flow,
        }: OnLoginCallbackArguments) => {
            authentication.setUID(newUID);
            authentication.setPassword(keyPassword);
            if (newLocalID !== undefined) {
                authentication.setLocalID(newLocalID);
            }

            const oldCache = cacheRef.current;
            if (oldCache) {
                oldCache.clear();
                oldCache.clearListeners();
            }
            const cache = createCache<string, any>();

            // If the user was received from the login call, pre-set it directly.
            if (User) {
                cache.set(UserModel.key, {
                    value: formatUser(User),
                    status: STATUS.RESOLVED,
                });
            }

            // If addresses was received from the login call, pre-set it directly.
            if (Addresses) {
                cache.set(AddressesModel.key, {
                    value: Addresses,
                    status: STATUS.RESOLVED,
                });
            }

            cache.set(WELCOME_FLAG_KEY, flow);

            if (EventID !== undefined) {
                setTmpEventID(cache, EventID);
            }

            cacheRef.current = cache;
            pathRef.current = getPath(window.location.href, path);

            setAuthData({
                UID: newUID,
                localID: newLocalID,
                history: createHistory({ basename: getBasename(newLocalID) }),
            });
        },
        []
    );

    const handleFinalizeLogout = useCallback(() => {
        authentication.setUID(undefined);
        authentication.setPassword(undefined);

        const oldCache = cacheRef.current;
        if (oldCache) {
            clearKeyCache(oldCache);
            oldCache.clear();
            oldCache.clearListeners();
        }

        cacheRef.current = createCache<string, any>();
        pathRef.current = '/';

        if (isSSOMode) {
            const { APP_NAME } = config;
            if (APP_NAME === APPS.PROTONACCOUNT) {
                return replaceUrl(getAppHref('/switch?flow=logout', APPS.PROTONACCOUNT));
            }
            return requestFork(APP_NAME, undefined, FORK_TYPE.SWITCH);
        }
        setAuthData({
            history: createHistory({ basename: getBasename() }),
        });
    }, []);

    const logoutListener = useInstance(() => createListeners());

    const handleLogout = useCallback((type?: 'soft') => {
        setAuthData((authData) => {
            // Nothing to logout
            if (!authData.UID) {
                return authData;
            }
            if (type === 'soft') {
                handleFinalizeLogout();
                return authData;
            }
            return {
                ...authData,
                consumerLogoutPromise: Promise.all(logoutListener.notify()).then(noop).catch(noop),
                isLoggingOut: true,
            };
        });
    }, []);

    const { UID, localID, history, isLoggingOut, consumerLogoutPromise } = authData;

    const authenticationValue = useMemo(() => {
        if (!UID) {
            return {
                login: handleLogin,
            };
        }
        return {
            UID,
            localID,
            ...authentication,
            logout: handleLogout,
            onLogout: logoutListener.subscribe,
        };
    }, [UID]);

    const [, setRerender] = useState<any>();
    useEffect(() => {
        if (pathRef.current !== undefined) {
            // This is to avoid a race condition where the path cannot be replaced imperatively in login or logout
            // because the context will re-render the public app and redirect to a wrong url
            // and while there is a redirect to consume the children are not rendered to avoid the default redirects triggering
            history.replace(pathRef.current);
            pathRef.current = undefined;
            setRerender({});
        }
    }, [pathRef.current, history]);

    useEffect(() => {
        document.querySelector('.app-root-loader')?.classList.add('hidden');
    }, []);

    return (
        <ConfigProvider config={config}>
            <CompatibilityCheck>
                <Icons />
                <RightToLeftProvider>
                    <React.Fragment key={UID}>
                        <ThemeProvider>
                            <Router history={history}>
                                <PreventLeaveProvider>
                                    <NotificationsProvider>
                                        <ModalsProvider>
                                            <ApiProvider UID={UID} config={config} onLogout={handleLogout}>
                                                <AuthenticationProvider store={authenticationValue}>
                                                    <CacheProvider cache={cacheRef.current}>
                                                        <GlobalLoaderProvider>
                                                            <GlobalLoader />
                                                            {(() => {
                                                                if (isLoggingOut) {
                                                                    return (
                                                                        <Signout
                                                                            onDone={handleFinalizeLogout}
                                                                            onLogout={() => consumerLogoutPromise}
                                                                        />
                                                                    );
                                                                }
                                                                if (pathRef.current) {
                                                                    return null;
                                                                }
                                                                return children;
                                                            })()}
                                                        </GlobalLoaderProvider>
                                                    </CacheProvider>
                                                </AuthenticationProvider>
                                            </ApiProvider>
                                        </ModalsProvider>
                                    </NotificationsProvider>
                                </PreventLeaveProvider>
                            </Router>
                        </ThemeProvider>
                    </React.Fragment>
                </RightToLeftProvider>
            </CompatibilityCheck>
        </ConfigProvider>
    );
};

export default ProtonApp;
