import { useCallback, useMemo, useRef, useState } from 'react';
import { Redirect, Route, Switch, useHistory, useLocation } from 'react-router-dom';

import * as H from 'history';

import {
    ExperimentsProvider,
    FeaturesProvider,
    ModalsChildren,
    SSOForkProducer,
    Unauthenticated,
    useApi,
    useConfig,
} from '@proton/components';
import { ActiveSessionData, ProduceForkData, SSOType } from '@proton/components/containers/app/SSOForkProducer';
import { OnLoginCallbackArguments, ProtonLoginCallback } from '@proton/components/containers/app/interface';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import { pushForkSession } from '@proton/shared/lib/api/auth';
import { OAuthLastAccess, getOAuthLastAccess } from '@proton/shared/lib/api/oauth';
import { getAppHref, getClientID, getExtension, getInvoicesPathname } from '@proton/shared/lib/apps/helper';
import { DEFAULT_APP, getAppFromPathname, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { PushForkResponse } from '@proton/shared/lib/authentication/interface';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import {
    GetActiveSessionsResult,
    LocalSessionPersisted,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { produceFork, produceOAuthFork } from '@proton/shared/lib/authentication/sessionForking';
import {
    APPS,
    APPS_CONFIGURATION,
    CLIENT_TYPES,
    REQUIRES_INTERNAL_EMAIL_ADDRESS,
    SSO_PATHS,
    UNPAID_STATE,
    isSSOMode,
} from '@proton/shared/lib/constants';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { UserType } from '@proton/shared/lib/interfaces';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

import HandleLogout from '../containers/HandleLogout';
import LoginContainer from '../login/LoginContainer';
import AuthExtension from '../public/AuthExtension';
import EmailUnsubscribeContainer from '../public/EmailUnsubscribeContainer';
import ForgotUsernameContainer from '../public/ForgotUsernameContainer';
import OAuthConfirmForkContainer from '../public/OAuthConfirmForkContainer';
import SwitchAccountContainer from '../public/SwitchAccountContainer';
import ValidateRecoveryEmailContainer from '../public/ValidateRecoveryEmailContainer';
import { getToAppName } from '../public/helper';
import ResetPasswordContainer from '../reset/ResetPasswordContainer';
import SignupContainer from '../signup/SignupContainer';
import SignupInviteContainer from '../signup/SignupInviteContainer';
import { SERVICES, SERVICES_KEYS } from '../signup/interfaces';
import AccountPublicApp from './AccountPublicApp';

const getPathFromLocation = (location: H.Location) => {
    return [location.pathname, location.search, location.hash].join('');
};

export const getSearchParams = (search: string) => {
    const searchParams = new URLSearchParams(search);

    const maybeService = (searchParams.get('service') || searchParams.get('product')) as SERVICES_KEYS | undefined;
    const service = maybeService ? SERVICES[maybeService] : undefined;

    return { service };
};

const getLocalRedirect = (pathname?: string) => {
    if (!pathname) {
        return undefined;
    }
    const trimmedPathname = stripLeadingAndTrailingSlash(stripLocalBasenameFromPathname(pathname));
    if (!trimmedPathname) {
        return undefined;
    }
    // Special case to not add the slug...
    if (pathname.includes('/setup-internal-address')) {
        return {
            pathname,
            toApp: DEFAULT_APP,
        };
    }
    const toApp = getAppFromPathname(trimmedPathname);
    if (!toApp) {
        return {
            pathname: `${getSlugFromApp(DEFAULT_APP)}/${trimmedPathname}`,
            toApp: DEFAULT_APP,
        };
    }
    return {
        pathname,
        toApp,
    };
};

const UNAUTHENTICATED_ROUTES = {
    UNSUBSCRIBE: '/unsubscribe',
    VERIFY_EMAIL: '/verify-email',
};

interface Props {
    onLogin: ProtonLoginCallback;
    locales: TtagLocaleMap;
}

const PublicApp = ({ onLogin, locales }: Props) => {
    const history = useHistory();
    const config = useConfig();
    const location = useLocation<{ from?: H.Location }>();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);
    const api = useApi();
    const [forkState, setForkState] = useState<ActiveSessionData>();
    const [confirmForkData, setConfirmForkState] = useState<Extract<ProduceForkData, { type: SSOType.OAuth }>>();
    const [activeSessions, setActiveSessions] = useState<LocalSessionPersisted[]>();
    const ignoreAutoRef = useRef(false);
    const [hasBackToSwitch, setHasBackToSwitch] = useState(false);

    const { service: maybeQueryAppIntent } = useMemo(() => {
        return getSearchParams(location.search);
    }, []);

    const [maybeLocalRedirect] = useState(() => {
        const localLocation = [...Object.values(SSO_PATHS), ...Object.values(UNAUTHENTICATED_ROUTES)].includes(
            location.pathname
        )
            ? undefined
            : location;
        if (!localLocation) {
            return;
        }
        // If trying to access a non-public location from this app, set up a local redirect
        return getLocalRedirect(getPathFromLocation(localLocation));
    });

    // Either another app wants to fork, or a specific route is requested on this app
    const maybePreAppIntent =
        (forkState?.type === SSOType.Proton && forkState.payload?.app) ||
        maybeLocalRedirect?.toApp ||
        maybeQueryAppIntent;

    // Require internal setup if an app is specified. Otherwise, external accounts will get redirected to vpn (without having to setup an internal address)
    const shouldSetupInternalAddress = maybePreAppIntent
        ? REQUIRES_INTERNAL_EMAIL_ADDRESS.includes(maybePreAppIntent)
        : false;

    const handleProduceFork = async (data: ProduceForkData) => {
        if (data.type === SSOType.Proton) {
            const extension = getExtension(data.payload.app);

            if (extension) {
                const childClientID = getClientID(data.payload.app);
                const { Selector: selector } = await api<PushForkResponse>(
                    withUIDHeaders(
                        data.payload.UID,
                        pushForkSession({
                            ChildClientID: childClientID,
                            Independent: 0,
                        })
                    )
                );

                chrome.runtime.sendMessage(
                    extension.ID,
                    {
                        type: 'fork',
                        payload: {
                            selector,
                            keyPassword: data.payload.keyPassword,
                            persistent: data.payload.persistent,
                            trusted: data.payload.trusted,
                            state: data.payload.state,
                        },
                    },
                    (result) => {
                        if (chrome.runtime.lastError) {
                            history.replace('/auth-ext', { type: 'error', payload: chrome.runtime.lastError.message });
                            return;
                        }
                        if (result.type === 'success') {
                            history.replace('/auth-ext', { type: 'success', payload: result.payload });
                        } else {
                            history.replace('/auth-ext', { type: 'error', payload: result.payload });
                        }
                    }
                );
                return;
            }
            return produceFork({ api, ...data.payload });
        }

        if (data.type === SSOType.OAuth) {
            const {
                Access: { Accepted },
            } = await api<{ Access: OAuthLastAccess }>(
                withUIDHeaders(data.payload.UID, getOAuthLastAccess(data.payload.clientID))
            );
            if (Accepted) {
                return produceOAuthFork({ api, ...data.payload });
            }
            setConfirmForkState(data);
            history.replace(SSO_PATHS.OAUTH_CONFIRM_FORK);
        }
    };

    const setProtonMeOn = () =>
        new Promise<ProgressEvent<EventTarget>>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = resolve;
            xhr.onerror = reject;
            xhr.open('GET', `https://proton.me/on`);
            xhr.withCredentials = true;
            xhr.send();
        });

    const handleLogin = async (args: OnLoginCallbackArguments) => {
        if (!window.location.hostname.endsWith('protonmail.com')) {
            try {
                await setProtonMeOn();
            } catch (error) {}
        }

        const { keyPassword, UID, User: user, LocalID, persistent, trusted, appIntent: maybeFlowAppIntent } = args;
        const toAppIntent = maybeFlowAppIntent?.app || maybePreAppIntent;
        // Special case for external users to redirect to VPN until more apps are supported, when no app intent is provided.
        const toApp = toAppIntent || (user.Type === UserType.EXTERNAL ? APPS.PROTONVPN_SETTINGS : DEFAULT_APP);

        // Handle special case going for internal vpn on account settings.
        const localRedirect =
            maybeLocalRedirect ||
            (toApp === APPS.PROTONVPN_SETTINGS ? getLocalRedirect(APPS_CONFIGURATION[toApp].settingsSlug) : undefined);

        // Upon login, if user is delinquent, the fork is aborted and the user is redirected to invoices
        if (user.Delinquent >= UNPAID_STATE.DELINQUENT) {
            return onLogin({
                ...args,
                path: `${getSlugFromApp(toApp)}${getInvoicesPathname(config.APP_NAME)}`,
            });
        }

        // Fork early to extensions because they don't need to follow the signup logic
        if (forkState?.type === SSOType.Proton && getExtension(forkState.payload.app)) {
            await handleProduceFork({
                type: SSOType.Proton,
                payload: { ...forkState.payload, UID, keyPassword, persistent, trusted },
            });
            return;
        }

        if (forkState?.type === SSOType.OAuth) {
            await handleProduceFork({ type: SSOType.OAuth, payload: { ...forkState.payload, UID } });
            return;
        }

        // If the user signed up and there is an active fork, purposefully ignore it so that it
        // triggers a page load with the query parameters
        if (forkState?.type === SSOType.Proton && args.flow !== 'signup') {
            await handleProduceFork({
                type: SSOType.Proton,
                payload: { ...forkState.payload, UID, keyPassword, persistent, trusted },
            });
            return;
        }

        const url = (() => {
            let pathname;

            if (localRedirect) {
                if (args.flow === 'signup' && toApp === APPS.PROTONVPN_SETTINGS) {
                    pathname = `/${getSlugFromApp(APPS.PROTONVPN_SETTINGS)}/vpn-apps?prompt=true`;
                } else {
                    pathname = localRedirect.pathname || '';
                }
                return new URL(getAppHref(pathname, APPS.PROTONACCOUNT, LocalID));
            }

            if (toApp === APPS.PROTONMAIL) {
                pathname = '/inbox';
            } else {
                pathname = '/';
            }
            return new URL(getAppHref(pathname, toApp, LocalID));
        })();

        if (args.flow === 'signup') {
            url.searchParams.append('welcome', 'true');
            if (maybeFlowAppIntent?.ref !== undefined) {
                url.searchParams.append('ref', maybeFlowAppIntent.ref);
            }
        }

        if (url.hostname === window.location.hostname || !isSSOMode) {
            return onLogin({
                ...args,
                path: `${url.pathname}${url.search}${url.hash}`,
            });
        }

        return replaceUrl(url.toString());
    };

    const handleActiveSessionsFork = (newForkState: ActiveSessionData, { sessions }: GetActiveSessionsResult) => {
        ignoreAutoRef.current = true;

        setForkState(newForkState);
        setActiveSessions(sessions);

        history.replace(sessions.length >= 1 ? SSO_PATHS.SWITCH : '/login');
    };

    const handleInvalidFork = () => {
        ignoreAutoRef.current = true;
        history.replace('/login');
    };

    const handleActiveSessions = ({ session, sessions }: GetActiveSessionsResult) => {
        // Ignore the automatic login
        if (
            ignoreAutoRef.current ||
            // All SSO paths except login
            (Object.values(SSO_PATHS).includes(location.pathname as any) && location.pathname !== SSO_PATHS.LOGIN)
        ) {
            setActiveSessions(sessions);
            if (sessions.length >= 1) {
                setHasBackToSwitch(true);
            }
            if (!sessions.length && location.pathname === SSO_PATHS.SWITCH) {
                history.replace('/login');
            }
            return false;
        }
        if (!sessions.length) {
            setActiveSessions(sessions);
            return false;
        }
        if (session && sessions.length === 1) {
            void handleLogin(session);
            return true;
        }
        setActiveSessions(sessions);
        if (sessions.length >= 1) {
            setHasBackToSwitch(true);
        }
        history.replace(SSO_PATHS.SWITCH);
        return false;
    };

    const handleSignOut = (updatedActiveSessions?: LocalSessionPersisted[]) => {
        if (!updatedActiveSessions?.length) {
            setActiveSessions([]);
            setHasBackToSwitch(false);
            history.push('/login');
            return;
        }
        setActiveSessions(updatedActiveSessions || []);
    };

    const handleAddAccount = () => {
        history.push('/login');
    };

    const toOAuthName =
        forkState?.type === SSOType.OAuth
            ? forkState.payload.clientInfo.Name
            : confirmForkData?.payload.clientInfo.Name;
    const toInternalAppName = maybePreAppIntent && getToAppName(maybePreAppIntent);
    const toAppName = toOAuthName || toInternalAppName;

    return (
        <>
            <HandleLogout />
            <ModalsChildren />
            <Switch>
                <Route path={`${UNAUTHENTICATED_ROUTES.UNSUBSCRIBE}/:subscriptions`}>
                    <Unauthenticated>
                        <EmailUnsubscribeContainer />
                    </Unauthenticated>
                </Route>
                <Route path={UNAUTHENTICATED_ROUTES.VERIFY_EMAIL}>
                    <Unauthenticated>
                        <ValidateRecoveryEmailContainer />
                    </Unauthenticated>
                </Route>
                <Route path={SSO_PATHS.OAUTH_AUTHORIZE}>
                    <SSOForkProducer
                        type={SSOType.OAuth}
                        onProduceFork={handleProduceFork}
                        onInvalidFork={handleInvalidFork}
                        onActiveSessions={handleActiveSessionsFork}
                    />
                </Route>
                <Route path={SSO_PATHS.AUTHORIZE}>
                    <SSOForkProducer
                        type={SSOType.Proton}
                        onProduceFork={handleProduceFork}
                        onInvalidFork={handleInvalidFork}
                        onActiveSessions={handleActiveSessionsFork}
                    />
                </Route>
                <Route path={`${SSO_PATHS.INVITE}/:selector/:token`}>
                    <SignupInviteContainer
                        clientType={CLIENT_TYPES.MAIL}
                        onValid={(inviteData) =>
                            history.replace({
                                pathname: '/signup',
                                state: { invite: inviteData },
                            })
                        }
                        onInvalid={() => history.push('/signup')}
                    />
                </Route>
                <Route path="/auth-ext">
                    <AuthExtension />
                </Route>
                <Route path="*">
                    <FeaturesProvider>
                        <ExperimentsProvider>
                            <AccountPublicApp
                                location={location}
                                locales={locales}
                                onLogin={handleLogin}
                                onActiveSessions={handleActiveSessions}
                            >
                                <ForceRefreshContext.Provider value={refresh}>
                                    <Unauthenticated>
                                        <Switch location={location}>
                                            {confirmForkData && toAppName && (
                                                <Route path={SSO_PATHS.OAUTH_CONFIRM_FORK}>
                                                    <OAuthConfirmForkContainer
                                                        name={toAppName}
                                                        image={confirmForkData.payload.clientInfo.Logo}
                                                        onConfirm={() => {
                                                            return produceOAuthFork({
                                                                api,
                                                                ...confirmForkData.payload,
                                                            });
                                                        }}
                                                        onCancel={() => {
                                                            // Force a hard refresh to get active sessions to refresh when signing up
                                                            window.location.pathname = '/switch';
                                                        }}
                                                    />
                                                </Route>
                                            )}
                                            <Route path={SSO_PATHS.SWITCH}>
                                                <SwitchAccountContainer
                                                    activeSessions={activeSessions}
                                                    toAppName={toAppName}
                                                    onLogin={handleLogin}
                                                    onSignOut={handleSignOut}
                                                    onAddAccount={handleAddAccount}
                                                />
                                            </Route>
                                            <Route path={[SSO_PATHS.SIGNUP, SSO_PATHS.REFER]}>
                                                <SignupContainer
                                                    clientType={CLIENT_TYPES.MAIL}
                                                    toApp={maybePreAppIntent}
                                                    toAppName={toAppName}
                                                    onLogin={handleLogin}
                                                    onBack={hasBackToSwitch ? () => history.push('/login') : undefined}
                                                />
                                            </Route>
                                            <Route path={SSO_PATHS.RESET_PASSWORD}>
                                                <ResetPasswordContainer onLogin={handleLogin} />
                                            </Route>
                                            <Route path={SSO_PATHS.FORGOT_USERNAME}>
                                                <ForgotUsernameContainer />
                                            </Route>
                                            <Route path={SSO_PATHS.LOGIN}>
                                                <LoginContainer
                                                    hasActiveSessions={Boolean(activeSessions?.length)}
                                                    toAppName={toAppName}
                                                    showContinueTo={!!toOAuthName}
                                                    shouldSetupInternalAddress={shouldSetupInternalAddress}
                                                    onLogin={handleLogin}
                                                    onBack={hasBackToSwitch ? () => history.push('/switch') : undefined}
                                                />
                                            </Route>
                                            <Redirect to={SSO_PATHS.LOGIN} />
                                        </Switch>
                                    </Unauthenticated>
                                </ForceRefreshContext.Provider>
                            </AccountPublicApp>
                        </ExperimentsProvider>
                    </FeaturesProvider>
                </Route>
            </Switch>
        </>
    );
};

export default PublicApp;
