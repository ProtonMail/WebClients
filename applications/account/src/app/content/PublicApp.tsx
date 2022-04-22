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
    isSSOMode,
    REQUIRES_INTERNAL_EMAIL_ADDRESS,
    SSO_PATHS,
    UNPAID_STATE,
} from '@proton/shared/lib/constants';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { FeaturesProvider, ModalsChildren, SSOForkProducer, useApi, useClearPaidCookie } from '@proton/components';
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
import SwitchAccountContainer, { getSearchParams as getSwitchSearchParams } from '../public/SwitchAccountContainer';
import OAuthConfirmForkContainer from '../public/OAuthConfirmForkContainer';
import SignupContainer, { getSearchParams as getSignupSearchParams } from '../signup/SignupContainer';
import ResetPasswordContainer from '../reset/ResetPasswordContainer';
import ForgotUsernameContainer from '../public/ForgotUsernameContainer';
import LoginContainer from '../login/LoginContainer';
import Layout from '../public/Layout';
import SignupInviteContainer from '../signup/SignupInviteContainer';
import ValidateRecoveryEmailContainer from '../public/ValidateRecoveryEmailContainer';
import { getToAppName } from '../public/helper';

const getPathFromLocation = (location: H.Location) => {
    return [location.pathname, location.search, location.hash].join('');
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
    const [confirmForkData, setConfirmForkState] = useState<Extract<ProduceForkData, { type: SSOType.oauth }>>();
    const [activeSessions, setActiveSessions] = useState<LocalSessionResponse[]>();
    const ignoreAutoRef = useRef(false);
    const [hasBackToSwitch, setHasBackToSwitch] = useState(false);
    useClearPaidCookie();

    const signupSearchParams = useMemo(() => {
        return location.pathname.includes(SSO_PATHS.SIGNUP) || location.pathname.includes(SSO_PATHS.REFER)
            ? getSignupSearchParams(history.location.search)
            : undefined;
    }, []);

    const switchSearchParams = useMemo(() => {
        return location.pathname.includes(SSO_PATHS.SWITCH)
            ? getSwitchSearchParams(history.location.search)
            : undefined;
    }, []);

    const toTargetService = signupSearchParams?.service || switchSearchParams?.service;

    const [localRedirect] = useState(() => {
        // Handle special case going for internal vpn on account settings.
        if (toTargetService === APPS.PROTONVPN_SETTINGS) {
            return getLocalRedirect(APPS_CONFIGURATION[toTargetService].settingsSlug);
        }
        const localLocation = [
            SSO_PATHS.SWITCH,
            SSO_PATHS.LOGIN,
            SSO_PATHS.SIGNUP,
            SSO_PATHS.AUTHORIZE,
            SSO_PATHS.REFER,
            SSO_PATHS.FORGOT_USERNAME,
            SSO_PATHS.FORK,
            SSO_PATHS.RESET_PASSWORD,
            '/unsubscribe',
        ].includes(location.pathname)
            ? undefined
            : location;
        if (!localLocation) {
            return;
        }
        // If trying to access a non-public location from this app, set up a local redirect
        return getLocalRedirect(getPathFromLocation(localLocation));
    });

    // Either another app wants to fork, or a specific route is requested on this app
    const maybeTargetApp =
        (forkState?.type === SSOType.internal && forkState.payload?.app) || localRedirect?.toApp || toTargetService;
    // Require internal setup if an app is specified
    const shouldSetupInternalAddress = maybeTargetApp && REQUIRES_INTERNAL_EMAIL_ADDRESS.includes(maybeTargetApp);
    // Or just default
    const toApp = maybeTargetApp || DEFAULT_APP;
    const toOAuthName =
        forkState?.type === SSOType.oauth
            ? forkState.payload.clientInfo.Name
            : confirmForkData?.payload.clientInfo.Name;
    const toAppName = toOAuthName || getToAppName(toApp);

    const handleProduceFork = async (data: ProduceForkData) => {
        if (data.type === SSOType.internal) {
            return produceFork({ api, ...data.payload });
        }

        if (data.type === SSOType.oauth) {
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

    const handleLogin = async (args: OnLoginCallbackArguments) => {
        const { keyPassword, UID, User, LocalID, persistent } = args;
        // Upon login, if user is delinquent, the fork is aborted and the user is redirected to invoices
        if (User.Delinquent >= UNPAID_STATE.DELINQUENT) {
            return onLogin({
                ...args,
                path: `${getSlugFromApp(toApp)}${getInvoicesPathname(toApp)}`,
            });
        }
        if (forkState) {
            if (forkState.type === SSOType.oauth) {
                await handleProduceFork({ type: SSOType.oauth, payload: { ...forkState.payload, UID } });
                return;
            }
            if (forkState.type === SSOType.internal) {
                const type = args.flow === 'signup' ? FORK_TYPE.SIGNUP : undefined;
                await produceFork({ api, UID, keyPassword, ...forkState.payload, persistent, type });
                return;
            }
        }
        // Special case for external users to redirect to VPN until more apps are supported
        if (User.Type === UserType.EXTERNAL && !shouldSetupInternalAddress) {
            return onLogin({
                ...args,
                path: `${getSlugFromApp(APPS.PROTONVPN_SETTINGS)}`,
            });
        }
        if (localRedirect || !isSSOMode) {
            return onLogin({
                ...args,
                path: localRedirect?.pathname || '',
            });
        }
        const pathname = toApp === APPS.PROTONMAIL ? '/inbox' : '/';
        const search = args.flow === 'signup' ? '?welcome=true' : '';
        return replaceUrl(getAppHref(`${pathname}${search}`, toApp, LocalID));
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
            [
                SSO_PATHS.SWITCH,
                SSO_PATHS.SIGNUP,
                SSO_PATHS.REFER,
                SSO_PATHS.RESET_PASSWORD,
                SSO_PATHS.FORGOT_USERNAME,
                SSO_PATHS.INVITE,
                SSO_PATHS.OAUTH_CONFIRM_FORK,
            ].includes(location.pathname as any)
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

    return (
        <>
            <ModalsChildren />
            <Switch>
                <Route path="/unsubscribe/:subscriptions">
                    <EmailUnsubscribeContainer />
                </Route>
                <Route path="/verify-email">
                    <ValidateRecoveryEmailContainer />
                </Route>
                <Route path={SSO_PATHS.OAUTH_AUTHORIZE}>
                    <SSOForkProducer
                        type={SSOType.oauth}
                        onProduceFork={handleProduceFork}
                        onInvalidFork={handleInvalidFork}
                        onActiveSessions={handleActiveSessionsFork}
                    />
                </Route>
                <Route path={SSO_PATHS.AUTHORIZE}>
                    <SSOForkProducer
                        type={SSOType.internal}
                        onProduceFork={handleProduceFork}
                        onInvalidFork={handleInvalidFork}
                        onActiveSessions={handleActiveSessionsFork}
                    />
                </Route>
                <Route path={`${SSO_PATHS.INVITE}/:selector/:token`}>
                    <SignupInviteContainer
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
                                <Layout toApp={toApp}>
                                    <Switch location={location}>
                                        {confirmForkData && (
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
                                                        setForkState(undefined);
                                                        setConfirmForkState(undefined);
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
                                                toApp={toApp}
                                                toAppName={toAppName}
                                                onLogin={handleLogin}
                                                onBack={hasBackToSwitch ? () => history.push('/login') : undefined}
                                                signupParameters={signupSearchParams}
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
                                                shouldSetupInternalAddress={shouldSetupInternalAddress}
                                                onLogin={handleLogin}
                                                onBack={hasBackToSwitch ? () => history.push('/switch') : undefined}
                                            />
                                        </Route>
                                        <Redirect to={SSO_PATHS.LOGIN} />
                                    </Switch>
                                </Layout>
                            </ForceRefreshContext.Provider>
                        </FeaturesProvider>
                    </AccountPublicApp>
                </Route>
            </Switch>
        </>
    );
};

export default PublicApp;
