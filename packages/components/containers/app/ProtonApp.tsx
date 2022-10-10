import { Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Router } from 'react-router';

import { History, createBrowserHistory as createHistory } from 'history';

import { ExperimentsProvider, FeaturesProvider } from '@proton/components/containers';
import useInstance from '@proton/hooks/useInstance';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { serializeLogoutURL } from '@proton/shared/lib/authentication/logout';
import {
    getBasename,
    getLocalIDFromPathname,
    stripLocalBasenameFromPathname,
} from '@proton/shared/lib/authentication/pathnameHelper';
import { getPersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { SSO_PATHS, isSSOMode } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import createCache, { Cache } from '@proton/shared/lib/helpers/cache';
import createListeners from '@proton/shared/lib/helpers/listeners';
import * as sentry from '@proton/shared/lib/helpers/sentry';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { ProtonConfig } from '@proton/shared/lib/interfaces';
import { AddressesModel } from '@proton/shared/lib/models';
import { STATUS } from '@proton/shared/lib/models/cache';
import { UserModel, formatUser } from '@proton/shared/lib/models/userModel';
import { getIsAuthorizedApp } from '@proton/shared/lib/sideApp/helpers';
import noop from '@proton/utils/noop';

import { Icons } from '../../components';
import { GlobalLoader, GlobalLoaderProvider } from '../../components/globalLoader';
import SpotlightProvider from '../../components/spotlight/Provider';
import { PreventLeaveProvider } from '../../hooks';
import { SideAppUrlProvider } from '../../hooks/useSideApp';
import StandardApiProvider from '../api/ApiProvider';
import SideAppApiProvider from '../api/SideAppApiProvider';
import AuthenticationProvider from '../authentication/Provider';
import CacheProvider from '../cache/Provider';
import CompatibilityCheck from '../compatibilityCheck/CompatibilityCheck';
import ConfigProvider from '../config/Provider';
import ModalsProvider from '../modals/Provider';
import NotificationsChildren from '../notifications/Children';
import NotificationsProvider from '../notifications/Provider';
import RightToLeftProvider from '../rightToLeft/Provider';
import ThemeProvider from '../themes/ThemeProvider';
import Signout from './Signout';
import clearKeyCache from './clearKeyCache';
import { OnLoginCallbackArguments } from './interface';
import { setTmpEventID } from './loadEventID';

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
    } catch (e: any) {
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
    clearDeviceRecoveryData?: boolean;
    consumerLogoutPromise?: Promise<void>;
    persistedSession?: PersistedSession;
}

interface Props {
    authentication: AuthenticationStore;
    config: ProtonConfig;
    children: ReactNode;
    hasInitialAuth?: boolean;
}

const ProtonApp = ({ authentication, config, children, hasInitialAuth }: Props) => {
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
            persistent,
            trusted,
            path,
        }: OnLoginCallbackArguments) => {
            authentication.setUID(newUID);
            authentication.setPassword(keyPassword);
            authentication.setPersistent(persistent);
            authentication.setTrusted(trusted);

            if (newLocalID !== undefined && isSSOMode) {
                authentication.setLocalID(newLocalID);
            }

            const oldCache = cacheRef.current;
            if (oldCache) {
                oldCache.clear();
                oldCache.clearListeners();
            }
            const cache = createCache<string, any>();

            cache.set(UserModel.key, {
                value: formatUser(User),
                status: STATUS.RESOLVED,
            });

            // If addresses was received from the login call, pre-set it directly.
            if (Addresses) {
                cache.set(AddressesModel.key, {
                    value: Addresses,
                    status: STATUS.RESOLVED,
                });
            }

            if (EventID !== undefined) {
                setTmpEventID(cache, EventID);
            }

            cacheRef.current = cache;
            pathRef.current = getPath(window.location.href, path);

            const authData = !isSSOMode
                ? {
                      UID: newUID,
                      localID: undefined,
                  }
                : { UID: newUID, localID: newLocalID };

            setAuthData({
                ...authData,
                history: createHistory({ basename: getBasename(authData.localID) }),
            });
        },
        []
    );

    const handleFinalizeLogout = useCallback(
        ({
            clearDeviceRecoveryData = false,
            persistedSession,
            type,
        }: {
            clearDeviceRecoveryData?: boolean;
            persistedSession?: PersistedSession;
            type?: 'soft';
        } = {}) => {
            authentication.setUID(undefined);
            authentication.setPassword(undefined);
            authentication.setPersistent(undefined);
            authentication.setLocalID(undefined);
            authentication.setTrusted(undefined);

            const oldCache = cacheRef.current;
            if (oldCache) {
                clearKeyCache(oldCache);
                oldCache.clear();
                oldCache.clearListeners();
            }

            cacheRef.current = createCache<string, any>();
            pathRef.current = '/';

            if (isSSOMode) {
                const url =
                    type === 'soft'
                        ? // Prevent clearing session data on soft logouts
                          serializeLogoutURL([], false)
                        : serializeLogoutURL(persistedSession ? [persistedSession] : [], clearDeviceRecoveryData);
                return replaceUrl(url.toString());
            }
            return replaceUrl(getBasename());
        },
        []
    );

    const logoutListener = useInstance(() => createListeners());

    const handleLogout = useCallback(
        ({ type, clearDeviceRecoveryData = false }: { type?: 'soft'; clearDeviceRecoveryData?: boolean } = {}) => {
            setAuthData((authData) => {
                // Nothing to logout
                if (!authData.UID) {
                    return authData;
                }

                const persistedSession = getPersistedSession(authentication.getLocalID());

                if (type === 'soft') {
                    handleFinalizeLogout({ persistedSession, clearDeviceRecoveryData, type });
                    return authData;
                }

                return {
                    ...authData,
                    consumerLogoutPromise: Promise.all(logoutListener.notify()).then(noop).catch(noop),
                    isLoggingOut: true,
                    clearDeviceRecoveryData,
                    persistedSession,
                };
            });
        },
        []
    );

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

    useEffect(() => {
        sentry.setUID(UID);
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

    const isIframe = window.self !== window.top;
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const isSideApp = isIframe && parentApp && getIsAuthorizedApp(parentApp);

    const ApiProvider = isSideApp ? SideAppApiProvider : StandardApiProvider;

    return (
        <ConfigProvider config={config}>
            <CompatibilityCheck>
                <Icons />
                <RightToLeftProvider>
                    <Fragment key={UID}>
                        <ThemeProvider>
                            <Router history={history}>
                                <PreventLeaveProvider>
                                    <SpotlightProvider>
                                        <NotificationsProvider>
                                            <ModalsProvider>
                                                <ApiProvider UID={UID} config={config} onLogout={handleLogout}>
                                                    <AuthenticationProvider store={authenticationValue}>
                                                        <CacheProvider cache={cacheRef.current}>
                                                            <FeaturesProvider>
                                                                <ExperimentsProvider>
                                                                    <GlobalLoaderProvider>
                                                                        <SideAppUrlProvider>
                                                                            <GlobalLoader />
                                                                            <NotificationsChildren />
                                                                            {(() => {
                                                                                if (isLoggingOut) {
                                                                                    return (
                                                                                        <Signout
                                                                                            onDone={() => {
                                                                                                handleFinalizeLogout({
                                                                                                    clearDeviceRecoveryData:
                                                                                                        authData.clearDeviceRecoveryData,
                                                                                                    persistedSession:
                                                                                                        authData.persistedSession,
                                                                                                });
                                                                                            }}
                                                                                            onLogout={() =>
                                                                                                consumerLogoutPromise
                                                                                            }
                                                                                        />
                                                                                    );
                                                                                }
                                                                                if (pathRef.current) {
                                                                                    return null;
                                                                                }
                                                                                return children;
                                                                            })()}
                                                                        </SideAppUrlProvider>
                                                                    </GlobalLoaderProvider>
                                                                </ExperimentsProvider>
                                                            </FeaturesProvider>
                                                        </CacheProvider>
                                                    </AuthenticationProvider>
                                                </ApiProvider>
                                            </ModalsProvider>
                                        </NotificationsProvider>
                                    </SpotlightProvider>
                                </PreventLeaveProvider>
                            </Router>
                        </ThemeProvider>
                    </Fragment>
                </RightToLeftProvider>
            </CompatibilityCheck>
        </ConfigProvider>
    );
};

export default ProtonApp;
