import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as H from 'history';
import { Redirect, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import ForceRefreshContext from 'react-components/containers/forceRefresh/context';
import { OnLoginCallbackArguments, ProtonLoginCallback } from 'react-components/containers/app/interface';
import { LocalSessionResponse } from 'proton-shared/lib/authentication/interface';
import { produceFork, ProduceForkParameters } from 'proton-shared/lib/authentication/sessionForking';
import { APPS, SSO_PATHS, UNPAID_STATE, isSSOMode, APPS_CONFIGURATION } from 'proton-shared/lib/constants';
import { FORK_TYPE } from 'proton-shared/lib/authentication/ForkInterface';
import { GetActiveSessionsResult } from 'proton-shared/lib/authentication/persistedSessionHelper';
import { stripLeadingAndTrailingSlash } from 'proton-shared/lib/helpers/string';
import { ModalsChildren, SSOForkProducer, useApi } from 'react-components';
import { stripLocalBasenameFromPathname } from 'proton-shared/lib/authentication/pathnameHelper';
import { getAppHref } from 'proton-shared/lib/apps/helper';
import { replaceUrl } from 'proton-shared/lib/helpers/browser';
import { DEFAULT_APP, getAppFromPathname, getSlugFromApp } from 'proton-shared/lib/apps/slugHelper';

import AccountPublicApp from './AccountPublicApp';
import EmailUnsubscribeContainer from '../public/EmailUnsubscribeContainer';
import SwitchAccountContainer, { getSearchParams as getSwitchSearchParams } from '../public/SwitchAccountContainer';
import SignupContainer, { getSearchParams as getSignupSearchParams } from '../signup/SignupContainer';
import ResetPasswordContainer from '../reset/ResetPasswordContainer';
import ForgotUsernameContainer from '../public/ForgotUsernameContainer';
import LoginContainer from '../login/LoginContainer';
import Layout from '../public/Layout';

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
    const [forkState, setForkState] = useState<ProduceForkParameters | undefined>();
    const [activeSessions, setActiveSessions] = useState<LocalSessionResponse[] | undefined>();
    const ignoreAutoRef = useRef(false);
    const [hasBackToSwitch, setHasBackToSwitch] = useState(false);

    const signupSearchParams = useMemo(() => {
        return location.pathname.includes(SSO_PATHS.SIGNUP)
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
            SSO_PATHS.SIGNUP,
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

    // Either another app wants to fork, or a specific route is requested on this app, or we just go to default
    const toApp = forkState?.app || localRedirect?.toApp || toTargetService || DEFAULT_APP;

    const handleLogin = async (args: OnLoginCallbackArguments) => {
        const { keyPassword, UID, User, LocalID } = args;
        // Upon login, if user is delinquent, the fork is aborted and the user is redirected to invoices
        if (User.Delinquent >= UNPAID_STATE.DELINQUENT) {
            return onLogin({
                ...args,
                path: `${getSlugFromApp(toApp)}/payment#invoices`,
            });
        }
        if (forkState) {
            const type = args.flow === 'signup' ? FORK_TYPE.SIGNUP : undefined;
            await produceFork({ api, UID, keyPassword, ...forkState, type });
            return;
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

    const handleActiveSessionsFork = (newForkState: ProduceForkParameters, { sessions }: GetActiveSessionsResult) => {
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
            [SSO_PATHS.SWITCH, SSO_PATHS.SIGNUP, SSO_PATHS.RESET_PASSWORD, SSO_PATHS.FORGOT_USERNAME].includes(
                location.pathname as any
            )
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
            handleLogin(session);
            return true;
        }
        setActiveSessions(sessions);
        if (sessions.length >= 1) {
            setHasBackToSwitch(true);
        }
        history.replace(SSO_PATHS.SWITCH);
        return false;
    };

    const handleSignOutAll = async () => {
        setActiveSessions([]);
        setHasBackToSwitch(false);
        history.push('/login');
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
                <Route path={SSO_PATHS.AUTHORIZE}>
                    <SSOForkProducer onInvalidFork={handleInvalidFork} onActiveSessions={handleActiveSessionsFork} />
                </Route>
                <Route path="*">
                    <AccountPublicApp
                        location={location}
                        locales={locales}
                        onLogin={handleLogin}
                        onActiveSessions={handleActiveSessions}
                    >
                        <ForceRefreshContext.Provider value={refresh}>
                            <Layout toApp={toApp}>
                                <Switch location={location}>
                                    <Route path={SSO_PATHS.SWITCH}>
                                        <SwitchAccountContainer
                                            activeSessions={activeSessions}
                                            toApp={toApp}
                                            onLogin={handleLogin}
                                            onSignOutAll={handleSignOutAll}
                                            onAddAccount={handleAddAccount}
                                        />
                                    </Route>
                                    <Route path={SSO_PATHS.SIGNUP}>
                                        <SignupContainer
                                            toApp={toApp}
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
                                            toApp={toApp}
                                            onLogin={handleLogin}
                                            onBack={hasBackToSwitch ? () => history.push('/switch') : undefined}
                                        />
                                    </Route>
                                    <Redirect to={SSO_PATHS.LOGIN} />
                                </Switch>
                            </Layout>
                        </ForceRefreshContext.Provider>
                    </AccountPublicApp>
                </Route>
            </Switch>
        </>
    );
};

export default PublicApp;
