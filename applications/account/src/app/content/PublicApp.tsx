import { useCallback, useMemo, useRef, useState } from 'react';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';

import type { Location } from 'history';
import * as H from 'history';

import {
    ExperimentsProvider,
    FeaturesProvider,
    ModalsChildren,
    SSOForkProducer,
    UnAuthenticated,
    UnAuthenticatedApiProvider,
    useApi,
} from '@proton/components';
import { ActiveSessionData, ProduceForkData, SSOType } from '@proton/components/containers/app/SSOForkProducer';
import { OnLoginCallbackArguments, ProtonLoginCallback } from '@proton/components/containers/app/interface';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import { pushForkSession } from '@proton/shared/lib/api/auth';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { OAuthLastAccess, getOAuthLastAccess } from '@proton/shared/lib/api/oauth';
import { getAppHref, getClientID, getExtension, getInvoicesPathname } from '@proton/shared/lib/apps/helper';
import { DEFAULT_APP, getAppFromPathname, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { getIsPassApp, getIsVPNApp, getToApp, getToAppName } from '@proton/shared/lib/authentication/apps';
import { PushForkResponse } from '@proton/shared/lib/authentication/interface';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import {
    GetActiveSessionsResult,
    LocalSessionPersisted,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { produceExtensionFork, produceFork, produceOAuthFork } from '@proton/shared/lib/authentication/sessionForking';
import {
    APPS,
    CLIENT_TYPES,
    SETUP_ADDRESS_PATH,
    SSO_PATHS,
    UNPAID_STATE,
    isSSOMode,
} from '@proton/shared/lib/constants';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { getPathFromLocation, joinPaths } from '@proton/shared/lib/helpers/url';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { getEncryptedSetupBlob, getRequiresAddressSetup } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import forgotUsernamePage from '../../pages/forgot-username';
import resetPasswordPage from '../../pages/reset-password';
import HandleLogout from '../containers/HandleLogout';
import LoginContainer from '../login/LoginContainer';
import { getLoginMeta } from '../login/loginPagesJson';
import AuthExtension, { AuthExtensionState } from '../public/AuthExtension';
import EmailUnsubscribeContainer from '../public/EmailUnsubscribeContainer';
import ForgotUsernameContainer from '../public/ForgotUsernameContainer';
import OAuthConfirmForkContainer from '../public/OAuthConfirmForkContainer';
import RemoveEmailContainer from '../public/RemoveEmailContainer';
import SwitchAccountContainer from '../public/SwitchAccountContainer';
import VerifyEmailContainer from '../public/VerifyEmailContainer';
import ResetPasswordContainer from '../reset/ResetPasswordContainer';
import SignupContainer from '../signup/SignupContainer';
import SignupInviteContainer from '../signup/SignupInviteContainer';
import { getProductParams } from '../signup/searchParams';
import { getSignupMeta } from '../signup/signupPagesJson';
import SingleSignupContainerV2 from '../single-signup-v2/SingleSignupContainerV2';
import SingleSignupContainer from '../single-signup/SingleSignupContainer';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import AccountLoaderPage from './AccountLoaderPage';
import AccountPublicApp from './AccountPublicApp';
import { getPaths } from './helper';

export const getSearchParams = (location: Location) => {
    const searchParams = new URLSearchParams(location.search);
    const { product, productParam } = getProductParams(location.pathname, searchParams);
    return { product, productParam };
};

const getLocalRedirect = (path?: string) => {
    if (!path) {
        return undefined;
    }
    const trimmedPathname = stripLeadingAndTrailingSlash(stripLocalBasenameFromPathname(path));
    if (!trimmedPathname) {
        return undefined;
    }
    // Special case to not add the slug...
    if (path.includes(SETUP_ADDRESS_PATH)) {
        return {
            path,
            toApp: DEFAULT_APP,
        };
    }
    const toApp = getAppFromPathname(trimmedPathname);
    if (!toApp) {
        return {
            path,
            toApp: undefined,
        };
    }
    return {
        path,
        toApp,
    };
};

const SIGN_IN_ROUTES = [
    SSO_PATHS.LOGIN,
    SSO_PATHS.MAIL_SIGN_IN,
    SSO_PATHS.CALENDAR_SIGN_IN,
    SSO_PATHS.PASS_SIGN_IN,
    SSO_PATHS.VPN_SIGN_IN,
    SSO_PATHS.DRIVE_SIGN_IN,
];

// All SSO paths except login
const DISABLE_AUTO_SIGN_IN_ROUTES: string[] = Object.values(SSO_PATHS).filter(
    (path) => !SIGN_IN_ROUTES.includes(path as any)
);

const UNAUTHENTICATED_ROUTES = {
    UNSUBSCRIBE: '/unsubscribe',
    VERIFY_EMAIL: '/verify-email',
    REMOVE_EMAIL: '/remove-email',
    DISABLE_ACCOUNT: '/disable-account',
};

setMetricsEnabled(true);

interface Props {
    onLogin: ProtonLoginCallback;
    locales: TtagLocaleMap;
}

const PublicApp = ({ onLogin, locales }: Props) => {
    const history = useHistory();
    const location = useLocationWithoutLocale<{ from?: H.Location }>();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);
    const api = useApi();
    const [forkState, setForkState] = useState<ActiveSessionData>();
    const [confirmForkData, setConfirmForkState] = useState<Extract<ProduceForkData, { type: SSOType.OAuth }>>();
    const [activeSessions, setActiveSessions] = useState<LocalSessionPersisted[]>();
    const ignoreAutoRef = useRef(false);
    const [hasBackToSwitch, setHasBackToSwitch] = useState(false);

    const { product: maybeQueryAppIntent, productParam } = useMemo(() => {
        return getSearchParams(location);
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

    const getPreAppIntent = (forkState: ActiveSessionData | undefined) => {
        return (
            (forkState?.type === SSOType.Proton && forkState.payload?.app) ||
            maybeLocalRedirect?.toApp ||
            maybeQueryAppIntent
        );
    };

    // Either another app wants to fork, or a specific route is requested on this app
    const maybePreAppIntent = getPreAppIntent(forkState);
    const paths = getPaths(location.localePrefix, forkState, maybePreAppIntent, productParam);

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
                            Independent: data.payload.independent ? 1 : 0,
                        })
                    )
                );
                const result = await produceExtensionFork({
                    extension,
                    payload: {
                        selector,
                        keyPassword: data.payload.keyPassword,
                        persistent: data.payload.persistent,
                        trusted: data.payload.trusted,
                        state: data.payload.state,
                    },
                });

                const state: AuthExtensionState = { ...result, extension };
                history.replace('/auth-ext', state);
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

    const handleLogin = async (args: OnLoginCallbackArguments) => {
        const { loginPassword, keyPassword, UID, LocalID, User: user, persistent, trusted, appIntent } = args;

        const toApp = getToApp(appIntent?.app || maybePreAppIntent, user);

        // Handle special case going for internal vpn on account settings.
        const localRedirect = (() => {
            if (maybeLocalRedirect) {
                if (maybeLocalRedirect.toApp) {
                    return maybeLocalRedirect;
                }
                return {
                    path: joinPaths(getSlugFromApp(toApp), maybeLocalRedirect.path),
                    toApp: toApp,
                };
            }
            if ([APPS.PROTONVPN_SETTINGS, APPS.PROTONPASS].includes(toApp as any)) {
                return {
                    path: joinPaths(getSlugFromApp(toApp), '/'),
                    toApp: toApp,
                };
            }
        })();

        if (getRequiresAddressSetup(toApp, user) && !localRedirect?.path.includes(SETUP_ADDRESS_PATH)) {
            const blob = loginPassword
                ? await getEncryptedSetupBlob(getUIDApi(UID, api), loginPassword).catch(noop)
                : undefined;
            const params = new URLSearchParams();
            params.set('to', toApp);
            params.set('from', 'switch');
            const path = `${SETUP_ADDRESS_PATH}?${params.toString()}#${blob || ''}`;
            return onLogin({
                ...args,
                path,
            });
        }

        // Upon login, if user is delinquent, the fork is aborted and the user is redirected to invoices
        if (user.Delinquent >= UNPAID_STATE.DELINQUENT) {
            return onLogin({
                ...args,
                path: joinPaths(getSlugFromApp(toApp), getInvoicesPathname()),
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
            let path;

            if (localRedirect) {
                if (args.flow === 'signup' && toApp === APPS.PROTONVPN_SETTINGS) {
                    path = joinPaths(getSlugFromApp(APPS.PROTONVPN_SETTINGS), '/vpn-apps?prompt=true');
                } else if (args.flow === 'signup' && toApp === APPS.PROTONPASS) {
                    path = joinPaths(getSlugFromApp(APPS.PROTONPASS), '/download');
                } else {
                    path = localRedirect.path || '';
                }
                return new URL(getAppHref(path, APPS.PROTONACCOUNT, LocalID));
            }

            if (toApp === APPS.PROTONMAIL) {
                path = '/inbox';
            } else {
                path = '/';
            }
            return new URL(getAppHref(path, toApp, LocalID));
        })();

        if (args.flow === 'signup') {
            url.searchParams.append('welcome', 'true');
            if (appIntent?.ref !== undefined) {
                url.searchParams.append('ref', appIntent.ref);
            }
        }

        if (url.hostname === window.location.hostname || !isSSOMode) {
            return onLogin({
                ...args,
                path: getPathFromLocation(url),
            });
        }

        return replaceUrl(url.toString());
    };

    const handleActiveSessionsFork = (newForkState: ActiveSessionData, { sessions }: GetActiveSessionsResult) => {
        ignoreAutoRef.current = true;

        setForkState(newForkState);
        setActiveSessions(sessions);

        if (newForkState.type === SSOType.Proton && newForkState.payload.type === FORK_TYPE.SIGNUP) {
            const paths = getPaths(location.localePrefix, newForkState, getPreAppIntent(newForkState), productParam);
            history.replace(paths.signup);
            return;
        }

        history.replace(sessions.length >= 1 ? SSO_PATHS.SWITCH : paths.login);
    };

    const handleInvalidFork = () => {
        ignoreAutoRef.current = true;
        history.replace(paths.login);
    };

    const handleActiveSessions = ({ session, sessions }: GetActiveSessionsResult) => {
        // Ignore the automatic login
        if (ignoreAutoRef.current || DISABLE_AUTO_SIGN_IN_ROUTES.includes(location.pathname)) {
            setActiveSessions(sessions);
            if (sessions.length >= 1) {
                setHasBackToSwitch(true);
            }
            if (!sessions.length && location.pathname === SSO_PATHS.SWITCH) {
                // This is recalculated because the set locale might have changed
                const paths = getPaths(location.localePrefix, forkState, maybePreAppIntent, productParam);
                history.replace(paths.login);
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
            history.push(paths.login);
            return;
        }
        setActiveSessions(updatedActiveSessions || []);
    };

    const handleAddAccount = () => {
        history.push(paths.login);
    };

    const toOAuthName =
        forkState?.type === SSOType.OAuth
            ? forkState.payload.clientInfo.Name
            : confirmForkData?.payload.clientInfo.Name;
    const toInternalAppName = maybePreAppIntent && getToAppName(maybePreAppIntent);
    const toAppName = toOAuthName || toInternalAppName;

    const clientType = (() => {
        if (getIsVPNApp(maybePreAppIntent)) {
            return CLIENT_TYPES.VPN;
        }
        if (getIsPassApp(maybePreAppIntent)) {
            return CLIENT_TYPES.PASS;
        }
        return CLIENT_TYPES.MAIL;
    })();
    const setupVPN = true; /* True until apps have been deployed to support key-less accounts*/

    const loader = <AccountLoaderPage />;

    return (
        <>
            <HandleLogout />
            <ModalsChildren />
            <Switch>
                <Route path={`${UNAUTHENTICATED_ROUTES.UNSUBSCRIBE}/:subscriptions?`}>
                    <UnAuthenticated>
                        <EmailUnsubscribeContainer />
                    </UnAuthenticated>
                </Route>
                <Route path={UNAUTHENTICATED_ROUTES.VERIFY_EMAIL}>
                    <UnAuthenticated>
                        <VerifyEmailContainer
                            onSubscribe={(jwt) => {
                                history.replace({ pathname: `${UNAUTHENTICATED_ROUTES.UNSUBSCRIBE}`, hash: jwt });
                            }}
                        />
                    </UnAuthenticated>
                </Route>
                <Route path={UNAUTHENTICATED_ROUTES.REMOVE_EMAIL}>
                    <UnAuthenticated>
                        <RemoveEmailContainer />
                    </UnAuthenticated>
                </Route>
                <Route path={UNAUTHENTICATED_ROUTES.DISABLE_ACCOUNT}>
                    <UnAuthenticated>
                        <RemoveEmailContainer type="account-email" />
                    </UnAuthenticated>
                </Route>
                <Route path={SSO_PATHS.OAUTH_AUTHORIZE}>
                    <SSOForkProducer
                        type={SSOType.OAuth}
                        onProduceFork={handleProduceFork}
                        onInvalidFork={handleInvalidFork}
                        onActiveSessions={handleActiveSessionsFork}
                        loader={loader}
                    />
                </Route>
                <Route path={SSO_PATHS.AUTHORIZE}>
                    <SSOForkProducer
                        type={SSOType.Proton}
                        onProduceFork={handleProduceFork}
                        onInvalidFork={handleInvalidFork}
                        onActiveSessions={handleActiveSessionsFork}
                        loader={loader}
                    />
                </Route>
                <Route path="/auth-ext">
                    <AuthExtension />
                </Route>
                <Route path="*">
                    <AccountPublicApp
                        pathLocale={location.fullLocale}
                        location={location}
                        locales={locales}
                        onLogin={handleLogin}
                        onActiveSessions={handleActiveSessions}
                        loader={loader}
                    >
                        <UnAuthenticatedApiProvider loader={loader}>
                            <FeaturesProvider>
                                <ExperimentsProvider>
                                    <UnAuthenticated>
                                        <ForceRefreshContext.Provider value={refresh}>
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
                                                                window.location.pathname = SSO_PATHS.SWITCH;
                                                            }}
                                                        />
                                                    </Route>
                                                )}
                                                <Route path={SSO_PATHS.SWITCH}>
                                                    <SwitchAccountContainer
                                                        metaTags={getLoginMeta(maybePreAppIntent)}
                                                        activeSessions={activeSessions}
                                                        toApp={maybePreAppIntent}
                                                        toAppName={toAppName}
                                                        onLogin={handleLogin}
                                                        onSignOut={handleSignOut}
                                                        onAddAccount={handleAddAccount}
                                                    />
                                                </Route>
                                                <Route
                                                    path={[
                                                        SSO_PATHS.SIGNUP,
                                                        SSO_PATHS.REFER,
                                                        SSO_PATHS.TRIAL,
                                                        SSO_PATHS.BUSINESS_SIGNUP,
                                                        SSO_PATHS.CALENDAR_SIGNUP,
                                                        SSO_PATHS.MAIL_SIGNUP,
                                                        SSO_PATHS.DRIVE_SIGNUP,
                                                    ]}
                                                >
                                                    <SignupContainer
                                                        metaTags={getSignupMeta(maybePreAppIntent)}
                                                        loginUrl={paths.login}
                                                        productParam={productParam}
                                                        clientType={clientType}
                                                        toApp={maybePreAppIntent}
                                                        toAppName={toAppName}
                                                        onLogin={handleLogin}
                                                        onBack={
                                                            hasBackToSwitch
                                                                ? () => history.push(paths.login)
                                                                : undefined
                                                        }
                                                    />
                                                </Route>
                                                <Route path={SSO_PATHS.PASS_SIGNUP}>
                                                    <SingleSignupContainerV2
                                                        paths={paths}
                                                        metaTags={getSignupMeta(APPS.PROTONPASS)}
                                                        activeSessions={activeSessions}
                                                        loader={loader}
                                                        productParam={APPS.PROTONPASS}
                                                        clientType={CLIENT_TYPES.PASS}
                                                        toApp={APPS.PROTONPASS}
                                                        toAppName={getToAppName(APPS.PROTONPASS)}
                                                        onLogin={handleLogin}
                                                        fork={!!forkState}
                                                        onBack={
                                                            hasBackToSwitch
                                                                ? () => history.push(paths.login)
                                                                : undefined
                                                        }
                                                    />
                                                </Route>
                                                <Route path={[SSO_PATHS.VPN_SIGNUP, SSO_PATHS.VPN_PRICING]}>
                                                    <SingleSignupContainer
                                                        metaTags={getSignupMeta(APPS.PROTONVPN_SETTINGS)}
                                                        loader={loader}
                                                        productParam={APPS.PROTONVPN_SETTINGS}
                                                        clientType={CLIENT_TYPES.VPN}
                                                        toApp={APPS.PROTONVPN_SETTINGS}
                                                        toAppName={getToAppName(APPS.PROTONVPN_SETTINGS)}
                                                        onLogin={handleLogin}
                                                        onBack={
                                                            hasBackToSwitch
                                                                ? () => history.push(paths.login)
                                                                : undefined
                                                        }
                                                    />
                                                </Route>
                                                <Route path={`${SSO_PATHS.INVITE}/:selector/:token`}>
                                                    <SignupInviteContainer
                                                        loader={loader}
                                                        clientType={clientType}
                                                        onValid={(inviteData) =>
                                                            history.replace({
                                                                pathname: paths.signup,
                                                                state: { invite: inviteData },
                                                            })
                                                        }
                                                        onInvalid={() => history.push(paths.signup)}
                                                    />
                                                </Route>
                                                <Route path={SSO_PATHS.RESET_PASSWORD}>
                                                    <ResetPasswordContainer
                                                        metaTags={resetPasswordPage()}
                                                        toApp={maybePreAppIntent}
                                                        onLogin={handleLogin}
                                                        setupVPN={setupVPN}
                                                        loginUrl={paths.login}
                                                    />
                                                </Route>
                                                <Route path={SSO_PATHS.FORGOT_USERNAME}>
                                                    <ForgotUsernameContainer
                                                        metaTags={forgotUsernamePage()}
                                                        loginUrl={paths.login}
                                                    />
                                                </Route>
                                                <Route
                                                    path={[
                                                        SSO_PATHS.LOGIN,
                                                        SSO_PATHS.MAIL_SIGN_IN,
                                                        SSO_PATHS.CALENDAR_SIGN_IN,
                                                        SSO_PATHS.DRIVE_SIGN_IN,
                                                        SSO_PATHS.VPN_SIGN_IN,
                                                        SSO_PATHS.PASS_SIGN_IN,
                                                    ]}
                                                    exact
                                                >
                                                    <LoginContainer
                                                        metaTags={getLoginMeta(maybePreAppIntent)}
                                                        toAppName={toAppName}
                                                        toApp={maybePreAppIntent}
                                                        showContinueTo={!!toOAuthName}
                                                        onLogin={handleLogin}
                                                        onBack={
                                                            hasBackToSwitch
                                                                ? () => history.push(SSO_PATHS.SWITCH)
                                                                : undefined
                                                        }
                                                        setupVPN={setupVPN}
                                                        paths={paths}
                                                    />
                                                </Route>
                                                <Redirect
                                                    to={{
                                                        pathname: paths.login,
                                                        state: {
                                                            ...(typeof location.state === 'object'
                                                                ? location.state
                                                                : {}),
                                                            from: location,
                                                        },
                                                    }}
                                                />
                                            </Switch>
                                        </ForceRefreshContext.Provider>
                                    </UnAuthenticated>
                                </ExperimentsProvider>
                            </FeaturesProvider>
                        </UnAuthenticatedApiProvider>
                    </AccountPublicApp>
                </Route>
            </Switch>
        </>
    );
};

export default PublicApp;
