import { useCallback, useMemo, useRef, useState } from 'react';
import * as H from 'history';
import { Redirect, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import { OnLoginCallbackArguments, ProtonLoginCallback } from '@proton/components/containers/app/interface';
import { LocalSessionResponse } from '@proton/shared/lib/authentication/interface';
import { produceFork, produceOAuthFork } from '@proton/shared/lib/authentication/sessionForking';
import {
    APPS,
    APPS_CONFIGURATION,
    CLIENT_TYPES,
    isSSOMode,
    REQUIRES_INTERNAL_EMAIL_ADDRESS,
    SSO_PATHS,
    UNPAID_STATE,
} from '@proton/shared/lib/constants';
import { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { FeaturesProvider, ModalsChildren, SSOForkProducer, Unauthenticated, useApi } from '@proton/components';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { getAppHref, getInvoicesPathname } from '@proton/shared/lib/apps/helper';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { DEFAULT_APP, getAppFromPathname, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { UserType } from '@proton/shared/lib/interfaces';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { getOAuthLastAccess, OAuthLastAccess } from '@proton/shared/lib/api/oauth';

import { ActiveSessionData, ProduceForkData, SSOType } from '@proton/components/containers/app/SSOForkProducer';
import AccountPublicApp from './AccountPublicApp';
import EmailUnsubscribeContainer from '../public/EmailUnsubscribeContainer';
import SwitchAccountContainer from '../public/SwitchAccountContainer';
import OAuthConfirmForkContainer from '../public/OAuthConfirmForkContainer';
import SignupContainer from '../signup/SignupContainer';
import ResetPasswordContainer from '../reset/ResetPasswordContainer';
import ForgotUsernameContainer from '../public/ForgotUsernameContainer';
import LoginContainer from '../login/LoginContainer';
import SignupInviteContainer from '../signup/SignupInviteContainer';
import ValidateRecoveryEmailContainer from '../public/ValidateRecoveryEmailContainer';
import { SERVICES, SERVICES_KEYS } from '../signup/interfaces';
import { getToAppName } from '../public/helper';

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
    const location = useLocation<{ from?: H.Location }>();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);
    const api = useApi();
    const [forkState, setForkState] = useState<ActiveSessionData>();
    const [confirmForkData, setConfirmForkState] = useState<Extract<ProduceForkData, { type: SSOType.OAuth }>>();
    const [activeSessions, setActiveSessions] = useState<LocalSessionResponse[]>();
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

    // Require internal setup if an app is specified
    const maybeShouldSetupInternalAddress =
        maybePreAppIntent && REQUIRES_INTERNAL_EMAIL_ADDRESS.includes(maybePreAppIntent);

    const handleProduceFork = async (data: ProduceForkData) => {
        if (data.type === SSOType.Proton) {
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

        const { keyPassword, UID, User, LocalID, persistent, appIntent: maybeFlowAppIntent } = args;
        const toApp = maybeFlowAppIntent?.app || maybePreAppIntent || DEFAULT_APP;

        // Handle special case going for internal vpn on account settings.
        const localRedirect =
            maybeLocalRedirect ||
            (toApp === APPS.PROTONVPN_SETTINGS ? getLocalRedirect(APPS_CONFIGURATION[toApp].settingsSlug) : undefined);

        const shouldSetupInternalAddress = REQUIRES_INTERNAL_EMAIL_ADDRESS.includes(toApp);

        // Upon login, if user is delinquent, the fork is aborted and the user is redirected to invoices
        if (User.Delinquent >= UNPAID_STATE.DELINQUENT) {
            return onLogin({
                ...args,
                path: `${getSlugFromApp(toApp)}${getInvoicesPathname(toApp)}`,
            });
        }

        if (forkState?.type === SSOType.OAuth) {
            await handleProduceFork({ type: SSOType.OAuth, payload: { ...forkState.payload, UID } });
            return;
        }

        // If the user signed up and there is an active fork, purposefully ignore it so that it
        // triggers a page load with the query parameters
        if (forkState?.type === SSOType.Proton && args.flow !== 'signup') {
            await produceFork({ api, UID, keyPassword, ...forkState.payload, persistent });
            return;
        }

        // Special case for external users to redirect to VPN until more apps are supported
        if (User.Type === UserType.EXTERNAL && !shouldSetupInternalAddress) {
            return onLogin({
                ...args,
                path: `${getSlugFromApp(APPS.PROTONVPN_SETTINGS)}`,
            });
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

    const handleSignOutAll = () => {
        setActiveSessions([]);
        setHasBackToSwitch(false);
        history.push('/login');
    };

    const handleSignOut = (updatedActiveSessions?: LocalSessionResponse[]) => {
        if (updatedActiveSessions?.length === 0) {
            handleSignOutAll();
            return;
        }
        setActiveSessions(updatedActiveSessions);
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
                <Route path="*">
                    <AccountPublicApp
                        location={location}
                        locales={locales}
                        onLogin={handleLogin}
                        onActiveSessions={handleActiveSessions}
                    >
                        <FeaturesProvider>
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
                                                onSignOutAll={handleSignOutAll}
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
                                                toAppName={toAppName}
                                                showContinueTo={!!toOAuthName}
                                                shouldSetupInternalAddress={maybeShouldSetupInternalAddress}
                                                onLogin={handleLogin}
                                                onBack={hasBackToSwitch ? () => history.push('/switch') : undefined}
                                            />
                                        </Route>
                                        <Redirect to={SSO_PATHS.LOGIN} />
                                    </Switch>
                                </Unauthenticated>
                            </ForceRefreshContext.Provider>
                        </FeaturesProvider>
                    </AccountPublicApp>
                </Route>
            </Switch>
        </>
    );
};

export default PublicApp;
