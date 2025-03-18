import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Redirect, Route, Switch, useHistory } from 'react-router-dom';

import type * as H from 'history';

import { createAuthentication, createUnleash, init, loadCrypto } from '@proton/account/bootstrap';
import type { OnLoginCallback, OnLoginCallbackResult } from '@proton/components';
import {
    ApiProvider,
    AuthenticationProvider,
    ErrorBoundary,
    ModalsChildren,
    NotificationsChildren,
    ProtonApp,
    StandardErrorPage,
    UnAuthenticated,
    UnauthenticatedApiProvider,
} from '@proton/components';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import { AuthType } from '@proton/components/containers/login/interface';
import PaymentSwitcher from '@proton/components/containers/payments/PaymentSwitcher';
import PublicAppSetup from '@proton/components/containers/publicAppSetup/PublicAppSetup';
import useApi from '@proton/components/hooks/useApi';
import { initMainHost } from '@proton/cross-storage/lib';
import useInstance from '@proton/hooks/useInstance';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getIsPassApp, getIsVPNApp, getToAppName } from '@proton/shared/lib/authentication/apps';
import {
    getEmailSessionForkSearchParameter,
    getLocalIDForkSearchParameter,
    produceOAuthFork,
} from '@proton/shared/lib/authentication/fork';
import { type ProduceForkData, SSOType } from '@proton/shared/lib/authentication/fork/interface';
import type { ActiveSession, GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getActiveSessions } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, CLIENT_TYPES, SSO_PATHS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { getHas2024OfferCoupon } from '@proton/shared/lib/helpers/subscription';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { FlagProvider } from '@proton/unleash';
import noop from '@proton/utils/noop';

import forgotUsernamePage from '../../pages/forgot-username';
import resetPasswordPage from '../../pages/reset-password';
import * as config from '../config';
import HandleLogout from '../containers/HandleLogout';
import locales from '../locales';
import LoginContainer, { type LoginContainerState } from '../login/LoginContainer';
import { getLoginMeta } from '../login/loginPagesJson';
import AppSwitcherContainer from '../public/AppSwitcherContainer';
import AuthExtension from '../public/AuthExtension';
import CallScheduledPage from '../public/CallScheduledPage';
import CloseTicketContainer from '../public/CloseTicketContainer';
import DisableAccountContainer from '../public/DisableAccountContainer';
import EmailForwardingContainer, { EmailForwardingRequest } from '../public/EmailForwardingContainer';
import EmailUnsubscribeContainer from '../public/EmailUnsubscribeContainer';
import ForgotUsernameContainer from '../public/ForgotUsernameContainer';
import GroupInviteContainer, { GroupInviteRequest } from '../public/GroupInviteContainer';
import GroupMembershipsContainer from '../public/GroupMembershipsContainer';
import InboxDesktopFreeTrialEnded from '../public/InboxDesktopFreeTrialEnded';
import JoinMagicLinkContainer from '../public/JoinMagicLinkContainer';
import OAuthConfirmForkContainer from '../public/OAuthConfirmForkContainer';
import OAuthPartnersContainer, { type OAuthPartnersCallbackState } from '../public/OAuthPartnersContainer';
import ReAuthContainer from '../public/ReAuthContainer';
import RemoveEmailContainer from '../public/RemoveEmailContainer';
import SwitchAccountContainer from '../public/SwitchAccountContainer';
import VerifyEmailContainer from '../public/VerifyEmailContainer';
import { readForkState } from '../public/persistedForkState';
import ResetPasswordContainer from '../reset/ResetPasswordContainer';
import SignupInviteContainer from '../signup/SignupInviteContainer';
import { type ProductParams, getProductParams, getThemeFromLocation } from '../signup/searchParams';
import { getSignupMeta } from '../signup/signupPagesJson';
import SingleSignupContainer from '../single-signup/SingleSignupContainer';
import { extendStore, setupStore } from '../store/public-store';
import { extraThunkArguments } from '../store/public-thunk';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import AccountEffect from './AccountAutoLogin';
import AccountLoaderPage from './AccountLoaderPage';
import AccountPublicApp from './AccountPublicApp';
import ExternalSSOConsumer from './ExternalSSOConsumer';
import SingleSignupSwitchContainer from './SingleSignupSwitchContainer';
import { getActiveSessionLoginResult } from './actions/getActiveSessionLoginResult';
import { getLoginResult } from './actions/getLoginResult';
import type { LoginLocationState, LoginResult } from './actions/interface';
import { handleOAuthFork } from './fork/handleOAuthFork';
import { handleProtonFork } from './fork/handleProtonFork';
import { UNAUTHENTICATED_ROUTES, getPaths, getPreAppIntent } from './helper';
import { getLocalRedirect } from './localRedirect';
import { addSession } from './session';

const bootstrapApp = () => {
    const api = createApi({ config, sendLocaleHeaders: true });
    const authentication = createAuthentication({ initialAuth: false });
    init({ config, authentication, locales });
    initMainHost();
    initElectronClassnames();
    initSafariFontFixClassnames();
    const unauthenticatedApi = createUnauthenticatedApi(api);
    const unleashClient = createUnleash({ api: unauthenticatedApi.apiCallback });
    extendStore({ config, api, authentication, unleashClient, unauthenticatedApi });
    const store = setupStore();
    return {
        authentication,
        store,
        api,
    };
};

export const getProductParamsFromLocation = (location: H.Location, searchParams: URLSearchParams): ProductParams => {
    const { product, productParam } = getProductParams(location.pathname, searchParams);
    return { product, productParam };
};

let cryptoWorkerPromise: Promise<void> | undefined;

const handlePreload = () => {
    if (!cryptoWorkerPromise) {
        cryptoWorkerPromise = loadCrypto({
            appName: APPS.PROTONACCOUNT,
        });
    }
};

let started = false;

const handleStartFlags = () => {
    if (!started) {
        const unleashClient = extraThunkArguments.unleashClient;
        if (unleashClient.isReady() || unleashClient.getError()) {
            return;
        }
        unleashClient.start().catch(noop);
        started = true;
    }
};

// Feature flags are not needed in these routes. That allows us to prevent creating an unauth session if only these routes would be requested.
const UnleashFlagStarter = ({ location }: { location: H.Location }) => {
    useEffect(() => {
        if (![SSO_PATHS.SWITCH].some((pathname) => pathname === location.pathname)) {
            handleStartFlags();
        }
    }, [location.pathname]);
    return null;
};

const handlePreSubmit = async () => {
    handlePreload();
    // The crypto worked must be loaded when signup/login/reset are performed
    await cryptoWorkerPromise;
};

const handleStartAuth = () => {
    return extraThunkArguments.unauthenticatedApi.startUnAuthFlow();
};

const completeResult: OnLoginCallbackResult = { state: 'complete' };
const inputResult: OnLoginCallbackResult = { state: 'input' };

const getClientType = (toApp: APP_NAMES | undefined) => {
    if (getIsVPNApp(toApp)) {
        return CLIENT_TYPES.VPN;
    }
    if (getIsPassApp(toApp)) {
        return CLIENT_TYPES.PASS;
    }
    return CLIENT_TYPES.MAIL;
};

const loginPaths = [
    SSO_PATHS.LOGIN,
    SSO_PATHS.MAIL_SIGN_IN,
    SSO_PATHS.CALENDAR_SIGN_IN,
    SSO_PATHS.DRIVE_SIGN_IN,
    SSO_PATHS.DOCS_SIGN_IN,
    SSO_PATHS.VPN_SIGN_IN,
    SSO_PATHS.PASS_SIGN_IN,
    SSO_PATHS.WALLET_SIGN_IN,
    SSO_PATHS.LUMO_SIGN_IN,
];

const ephemeralLoginPaths = [SSO_PATHS.APP_SWITCHER, SSO_PATHS.REAUTH];

// Optimistically calculate if the account switcher should be visible
const initialSessionsLength = getPersistedSessions().length;
const initialSessionsLengthBool = Boolean(initialSessionsLength);

const BasePublicApp = () => {
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);
    const history = useHistory();
    const location = useLocationWithoutLocale<{ from?: H.Location }>();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);
    const [forkState, setForkState] = useState<ProduceForkData | null>(readForkState);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>();
    const [maybeHasActiveSessions] = useState(initialSessionsLengthBool);
    const [locationState, setLocationState] = useState<null | LoginLocationState>(null);

    const searchParams = new URLSearchParams(location.search);

    const [
        {
            productParams: { product: maybeQueryAppIntent, productParam },
            initialSearchParams,
            maybeLocalRedirect,
        },
    ] = useState(() => {
        const productParams = getProductParamsFromLocation(location, searchParams);
        return {
            productParams,
            initialLocation: location,
            initialSearchParams: searchParams,
            maybeLocalRedirect: getLocalRedirect(location, productParams),
        };
    });

    const [hasInitialSessionBlockingLoading, setHasInitialSessionBlockingLoading] = useState(() => {
        return (
            maybeHasActiveSessions &&
            ((maybeLocalRedirect && maybeLocalRedirect.type !== 'prompt-login') ||
                location.pathname === '/' ||
                [...loginPaths, ...ephemeralLoginPaths].some((pathname) => location.pathname === pathname))
        );
    });

    const maybePreAppIntent = getPreAppIntent({
        forkState,
        localRedirect: maybeLocalRedirect,
        queryAppIntent: maybeQueryAppIntent,
    });
    const paths = getPaths({
        maybeLocalePrefix: location.localePrefix,
        forkState,
        app: maybePreAppIntent,
        productParam,
    });

    const handleLoginResult = async (result: LoginResult) => {
        if (result.type === 'done') {
            const url = result.payload.url;
            replaceUrl(url.toString());
            return completeResult;
        }
        setLocationState(result);
        if (result.location) {
            history.push(result.location);
        }
        const payload = result.payload;
        if (payload && 'session' in payload) {
            setActiveSessions((previousSessions) => {
                return addSession(previousSessions, payload.session);
            });
        }
        return inputResult;
    };

    const handleLogin: OnLoginCallback = async (session) => {
        const result = await getLoginResult({
            api: silentApi,
            session,
            localRedirect: maybeLocalRedirect,
            initialSearchParams,
            forkState,
            preAppIntent: maybePreAppIntent,
            paths,
        });
        return handleLoginResult(result);
    };

    const handleInvalidFork = () => {
        history.replace(paths.login);
    };

    const handleGetActiveSessions = async () => {
        const result = await getActiveSessions({
            api: silentApi,
            localID: getLocalIDForkSearchParameter(initialSearchParams),
            email: getEmailSessionForkSearchParameter(initialSearchParams),
        });
        setActiveSessions(result.sessions);
        return result;
    };

    const handleActiveSessions = async (
        sessionsResult: GetActiveSessionsResult,
        newForkState = forkState
    ): Promise<OnLoginCallbackResult> => {
        const maybePreAppIntent = getPreAppIntent({
            forkState: newForkState,
            localRedirect: maybeLocalRedirect,
            queryAppIntent: maybeQueryAppIntent,
        });
        const paths = getPaths({
            maybeLocalePrefix: location.localePrefix,
            forkState: newForkState,
            app: maybePreAppIntent,
            productParam,
        });
        const result = await getActiveSessionLoginResult({
            api: silentApi,
            sessionsResult,
            forkState: newForkState,
            localRedirect: maybeLocalRedirect,
            initialSearchParams,
            preAppIntent: maybePreAppIntent,
            paths,
        });
        setForkState(newForkState);
        setActiveSessions(sessionsResult.sessions);
        return handleLoginResult(result);
    };

    const handleAddAccount = () => {
        history.push(paths.login);
    };

    const toOAuthName = (() => {
        if (forkState?.type === SSOType.OAuth) {
            return forkState.payload.oauthData.clientInfo.Name;
        }
        if (locationState?.type === 'confirm-oauth') {
            return locationState.payload.data.payload.oauthData.clientInfo.Name;
        }
    })();

    const toInternalAppName = maybePreAppIntent && getToAppName(maybePreAppIntent);
    const toAppName = toOAuthName || toInternalAppName;
    const clientType = getClientType(maybePreAppIntent);
    const setupVPN = true; /* True until apps have been deployed to support key-less accounts*/

    const hasBFCoupon = getHas2024OfferCoupon(searchParams.get('coupon')?.toUpperCase());

    const theme = getThemeFromLocation(location, searchParams);
    const loader = theme ? (
        <UnAuthenticated theme={theme.themeType}>
            <AccountLoaderPage className={theme.className} isDarkBg={theme.isDarkBg} />
        </UnAuthenticated>
    ) : (
        <AccountLoaderPage />
    );

    const hasBackToSwitch = activeSessions === undefined ? maybeHasActiveSessions : activeSessions.length >= 1;

    return (
        <>
            <HandleLogout />
            <NotificationsChildren />
            <ModalsChildren />
            <Switch>
                <Route path={SSO_PATHS.OAUTH_AUTHORIZE}>
                    <AccountEffect
                        onEffect={async () => {
                            const result = await handleOAuthFork({ api: silentApi, paths });
                            if (result.type === 'invalid') {
                                handleInvalidFork();
                                return;
                            }
                            if (result.type === 'switch') {
                                await handleActiveSessions(result.payload.activeSessionsResult, result.payload.fork);
                                return;
                            }
                            await handleLoginResult(result.payload);
                            return;
                        }}
                    >
                        {loader}
                    </AccountEffect>
                </Route>
                <Route path={SSO_PATHS.AUTHORIZE}>
                    <AccountEffect
                        onEffect={async () => {
                            const result = await handleProtonFork({ api: silentApi, paths });
                            if (result.type === 'invalid') {
                                handleInvalidFork();
                                return;
                            }
                            if (result.type === 'switch') {
                                await handleActiveSessions(result.payload.activeSessionsResult, result.payload.fork);
                                return;
                            }
                            await handleLoginResult(result.payload);
                            return;
                        }}
                    >
                        {loader}
                    </AccountEffect>
                </Route>
                <Route path={[SSO_PATHS.EXTERNAL_SSO_LOGIN, SSO_PATHS.EXTERNAL_SSO_REAUTH]}>
                    <UnAuthenticated>
                        <ExternalSSOConsumer
                            onOAuthLogin={({ token, uid }) => {
                                const state: OAuthPartnersCallbackState = {
                                    type: 'callback',
                                    payload: {
                                        token,
                                        uid,
                                    },
                                };
                                const loginLocationState: LoginLocationState = {
                                    type: 'oauth-partners',
                                    payload: state,
                                    location: { pathname: SSO_PATHS.OAUTH_PARTNERS },
                                };
                                handleLoginResult(loginLocationState).catch(noop);
                            }}
                            onLogin={({ username, token, flow }) => {
                                const state: LoginContainerState = {
                                    authTypeData: {
                                        type: AuthType.ExternalSSO,
                                    },
                                    externalSSO: {
                                        token,
                                        flow,
                                    },
                                    username,
                                };
                                history.replace(SSO_PATHS.LOGIN, state);
                            }}
                        >
                            {loader}
                        </ExternalSSOConsumer>
                    </UnAuthenticated>
                </Route>
                <Route path={`${UNAUTHENTICATED_ROUTES.UNSUBSCRIBE}/:subscriptions?`}>
                    <UnAuthenticated>
                        <EmailUnsubscribeContainer />
                    </UnAuthenticated>
                </Route>
                <Route path={`${UNAUTHENTICATED_ROUTES.EMAIL_FORWARDING}/accept`}>
                    <UnAuthenticated>
                        <EmailForwardingContainer request={EmailForwardingRequest.Accept} />
                    </UnAuthenticated>
                </Route>
                <Route path={`${UNAUTHENTICATED_ROUTES.EMAIL_FORWARDING}/decline`}>
                    <UnAuthenticated>
                        <EmailForwardingContainer request={EmailForwardingRequest.Decline} />
                    </UnAuthenticated>
                </Route>
                <Route path={`${UNAUTHENTICATED_ROUTES.GROUP_INVITE}/accept`}>
                    <UnAuthenticated>
                        <GroupInviteContainer request={GroupInviteRequest.Accept} />
                    </UnAuthenticated>
                </Route>
                <Route path={`${UNAUTHENTICATED_ROUTES.GROUP_INVITE}/decline`}>
                    <UnAuthenticated>
                        <GroupInviteContainer request={GroupInviteRequest.Decline} />
                    </UnAuthenticated>
                </Route>
                <Route path={`${UNAUTHENTICATED_ROUTES.GROUP_INVITE}/manage`}>
                    <UnAuthenticated>
                        <GroupMembershipsContainer />
                    </UnAuthenticated>
                </Route>
                <Route path={UNAUTHENTICATED_ROUTES.CLOSE_TICKET}>
                    <UnAuthenticated>
                        <UnauthenticatedApiProvider unauthenticatedApi={extraThunkArguments.unauthenticatedApi}>
                            <CloseTicketContainer />
                        </UnauthenticatedApiProvider>
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
                        <DisableAccountContainer />
                    </UnAuthenticated>
                </Route>
                <Route path={UNAUTHENTICATED_ROUTES.TRIAL_ENDED}>
                    <UnAuthenticated>
                        <InboxDesktopFreeTrialEnded />
                    </UnAuthenticated>
                </Route>
                {locationState?.type === 'auth-ext' && (
                    <Route path="/auth-ext">
                        <AuthExtension state={locationState.payload} />
                    </Route>
                )}
                <Route path="/call-scheduled">
                    <UnAuthenticated>
                        <CallScheduledPage />
                    </UnAuthenticated>
                </Route>
                {hasInitialSessionBlockingLoading && (
                    <Route path="*">
                        <AccountEffect
                            onEffect={async () => {
                                const activeSessionsResult = await handleGetActiveSessions();
                                const result = await handleActiveSessions(activeSessionsResult, undefined);
                                setHasInitialSessionBlockingLoading(result === completeResult);
                            }}
                        >
                            {loader}
                        </AccountEffect>
                    </Route>
                )}
                <Route path="*">
                    <UnauthenticatedApiProvider unauthenticatedApi={extraThunkArguments.unauthenticatedApi}>
                        <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
                            <PaymentSwitcher>
                                <PublicAppSetup>
                                    <ForceRefreshContext.Provider value={refresh}>
                                        <AccountPublicApp
                                            pathLocale={location.fullLocale}
                                            location={location}
                                            locales={locales}
                                            onPreload={handlePreload}
                                            loader={loader}
                                        >
                                            <UnleashFlagStarter location={location} />
                                            <Switch location={location}>
                                                <Route path={SSO_PATHS.JOIN_MAGIC_LINK}>
                                                    <UnAuthenticated>
                                                        <JoinMagicLinkContainer
                                                            api={extraThunkArguments.api}
                                                            unauthenticatedApi={extraThunkArguments.unauthenticatedApi}
                                                            onPreload={handlePreload}
                                                            onPreSubmit={handlePreSubmit}
                                                            onLogin={handleLogin}
                                                            productParam={productParam}
                                                            toAppName={toAppName}
                                                            toApp={maybePreAppIntent}
                                                            onUsed={() => {
                                                                history.replace(
                                                                    (activeSessions || []).length >= 1
                                                                        ? SSO_PATHS.SWITCH
                                                                        : paths.login
                                                                );
                                                            }}
                                                        />
                                                    </UnAuthenticated>
                                                </Route>
                                                <Route path={SSO_PATHS.SWITCH}>
                                                    <UnAuthenticated>
                                                        <SwitchAccountContainer
                                                            api={extraThunkArguments.api}
                                                            metaTags={getLoginMeta(maybePreAppIntent)}
                                                            initialSessionsLength={initialSessionsLength}
                                                            onGetActiveSessions={handleGetActiveSessions}
                                                            activeSessions={activeSessions}
                                                            onActiveSessions={setActiveSessions}
                                                            toApp={maybePreAppIntent}
                                                            toAppName={toAppName}
                                                            onLogin={handleLogin}
                                                            onAddAccount={handleAddAccount}
                                                            onEmptySessions={() => {
                                                                history.replace(paths.login);
                                                            }}
                                                        />
                                                    </UnAuthenticated>
                                                </Route>
                                                <Route
                                                    path={[
                                                        SSO_PATHS.SIGNUP,
                                                        SSO_PATHS.REFER,
                                                        SSO_PATHS.TRIAL,
                                                        SSO_PATHS.BUSINESS_SIGNUP,
                                                        SSO_PATHS.CALENDAR_SIGNUP,
                                                        SSO_PATHS.CALENDAR_SIGNUP_B2B,
                                                        SSO_PATHS.MAIL_SIGNUP,
                                                        SSO_PATHS.MAIL_SIGNUP_B2B,
                                                        SSO_PATHS.DRIVE_SIGNUP,
                                                        SSO_PATHS.DRIVE_SIGNUP_B2B,
                                                        SSO_PATHS.DOCS_SIGNUP,
                                                        SSO_PATHS.PASS_SIGNUP,
                                                        SSO_PATHS.PASS_SIGNUP_B2B,
                                                        SSO_PATHS.WALLET_SIGNUP,
                                                        SSO_PATHS.LUMO_SIGNUP,
                                                        SSO_PATHS.PORKBUN_SIGNUP,
                                                        SSO_PATHS.PORKBUN_SIGN_IN,
                                                    ]}
                                                >
                                                    <SingleSignupSwitchContainer
                                                        initialSessionsLength={initialSessionsLengthBool}
                                                        hasBFCoupon={hasBFCoupon}
                                                        maybePreAppIntent={maybePreAppIntent}
                                                        initialSearchParams={initialSearchParams}
                                                        paths={paths}
                                                        metaTags={getSignupMeta(maybePreAppIntent)}
                                                        activeSessions={activeSessions}
                                                        onGetActiveSessions={handleGetActiveSessions}
                                                        productParam={productParam}
                                                        clientType={clientType}
                                                        toApp={maybePreAppIntent}
                                                        toAppName={toAppName}
                                                        searchParams={searchParams}
                                                        onLogin={handleLogin}
                                                        fork={!!forkState}
                                                        onBack={
                                                            hasBackToSwitch
                                                                ? () => history.push(paths.login)
                                                                : undefined
                                                        }
                                                        onPreSubmit={handlePreSubmit}
                                                        onStartAuth={handleStartAuth}
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
                                                        onPreSubmit={handlePreSubmit}
                                                        onStartAuth={handleStartAuth}
                                                    />
                                                </Route>
                                                <Route path={`${SSO_PATHS.INVITE}/:selector/:token`}>
                                                    <UnAuthenticated>
                                                        <SignupInviteContainer
                                                            loader={loader}
                                                            clientType={clientType}
                                                            onValid={(inviteData) =>
                                                                history.replace({
                                                                    pathname: paths.signup,
                                                                    search: '?mode=sps',
                                                                    state: { invite: inviteData },
                                                                })
                                                            }
                                                            onInvalid={() => history.push(paths.signup)}
                                                        />
                                                    </UnAuthenticated>
                                                </Route>
                                                <Route path={SSO_PATHS.RESET_PASSWORD}>
                                                    <UnAuthenticated>
                                                        <ResetPasswordContainer
                                                            metaTags={resetPasswordPage()}
                                                            toApp={maybePreAppIntent}
                                                            onLogin={handleLogin}
                                                            setupVPN={setupVPN}
                                                            loginUrl={paths.login}
                                                            productParam={productParam}
                                                            onPreSubmit={handlePreSubmit}
                                                            onStartAuth={handleStartAuth}
                                                        />
                                                    </UnAuthenticated>
                                                </Route>
                                                <Route path={SSO_PATHS.FORGOT_USERNAME}>
                                                    <UnAuthenticated>
                                                        <ForgotUsernameContainer
                                                            toApp={maybePreAppIntent}
                                                            metaTags={forgotUsernamePage()}
                                                            loginUrl={paths.login}
                                                            onStartAuth={handleStartAuth}
                                                        />
                                                    </UnAuthenticated>
                                                </Route>
                                                <Route path={loginPaths} exact>
                                                    <UnAuthenticated>
                                                        <LoginContainer
                                                            initialSearchParams={initialSearchParams}
                                                            metaTags={getLoginMeta(maybePreAppIntent)}
                                                            toAppName={toAppName}
                                                            toApp={maybePreAppIntent}
                                                            productParam={productParam}
                                                            showContinueTo={!!toOAuthName}
                                                            onLogin={handleLogin}
                                                            onBack={
                                                                hasBackToSwitch
                                                                    ? () => history.push(SSO_PATHS.SWITCH)
                                                                    : undefined
                                                            }
                                                            setupVPN={setupVPN}
                                                            paths={paths}
                                                            onPreSubmit={handlePreSubmit}
                                                            onStartAuth={handleStartAuth}
                                                        />
                                                    </UnAuthenticated>
                                                </Route>
                                                {locationState?.type === 'oauth-partners' && (
                                                    <Route path={SSO_PATHS.OAUTH_PARTNERS}>
                                                        <UnAuthenticated>
                                                            <OAuthPartnersContainer
                                                                loader={loader}
                                                                state={locationState.payload}
                                                                unauthenticatedApi={
                                                                    extraThunkArguments.unauthenticatedApi
                                                                }
                                                                onLogin={handleLogin}
                                                                toApp={maybePreAppIntent}
                                                                productParam={productParam}
                                                            />
                                                        </UnAuthenticated>
                                                    </Route>
                                                )}
                                                {locationState?.type === 'confirm-oauth' && (
                                                    <Route path={SSO_PATHS.OAUTH_CONFIRM_FORK}>
                                                        <UnAuthenticated>
                                                            <OAuthConfirmForkContainer
                                                                name={toAppName}
                                                                image={
                                                                    locationState.payload.data.payload.oauthData
                                                                        .clientInfo.Logo
                                                                }
                                                                onConfirm={async () => {
                                                                    if (locationState?.type !== 'confirm-oauth') {
                                                                        throw new Error('Missing state');
                                                                    }
                                                                    const url = await produceOAuthFork({
                                                                        api: normalApi,
                                                                        oauthData:
                                                                            locationState.payload.data.payload
                                                                                .oauthData,
                                                                        UID: locationState.payload.session.data.UID,
                                                                    });
                                                                    replaceUrl(url);
                                                                }}
                                                                onCancel={() => {
                                                                    // Force a hard refresh to get active sessions to refresh when signing up
                                                                    window.location.pathname = SSO_PATHS.SWITCH;
                                                                }}
                                                            />
                                                        </UnAuthenticated>
                                                    </Route>
                                                )}
                                                {locationState?.type === 'reauth' && (
                                                    <Route path={SSO_PATHS.REAUTH}>
                                                        <UnAuthenticated>
                                                            <ReAuthContainer
                                                                toApp={maybePreAppIntent}
                                                                onSwitch={() => {
                                                                    history.push(SSO_PATHS.SWITCH);
                                                                }}
                                                                paths={paths}
                                                                onLogin={handleLogin}
                                                                state={locationState.payload}
                                                                onPreSubmit={handlePreSubmit}
                                                            />
                                                        </UnAuthenticated>
                                                    </Route>
                                                )}
                                                {locationState?.type === 'app-switcher' && (
                                                    <Route path={SSO_PATHS.APP_SWITCHER}>
                                                        <UnAuthenticated>
                                                            <AppSwitcherContainer
                                                                onLogin={handleLogin}
                                                                onSwitch={() => {
                                                                    history.push(SSO_PATHS.SWITCH);
                                                                }}
                                                                state={locationState.payload}
                                                            />
                                                        </UnAuthenticated>
                                                    </Route>
                                                )}
                                                <Redirect
                                                    to={{
                                                        pathname: hasBackToSwitch ? SSO_PATHS.SWITCH : paths.login,
                                                        state: {
                                                            ...(typeof location.state === 'object'
                                                                ? location.state
                                                                : {}),
                                                            from: location,
                                                        },
                                                    }}
                                                />
                                            </Switch>
                                        </AccountPublicApp>
                                    </ForceRefreshContext.Provider>
                                </PublicAppSetup>
                            </PaymentSwitcher>
                        </FlagProvider>
                    </UnauthenticatedApiProvider>
                </Route>
            </Switch>
        </>
    );
};

const PublicApp = () => {
    const { store, authentication, api } = useInstance(bootstrapApp);

    return (
        <ProtonApp config={config}>
            <AuthenticationProvider store={authentication}>
                <BrowserRouter>
                    <ProtonStoreProvider store={store}>
                        <ApiProvider api={api}>
                            <ErrorBoundary big component={<StandardErrorPage big />}>
                                <BasePublicApp />
                            </ErrorBoundary>
                        </ApiProvider>
                    </ProtonStoreProvider>
                </BrowserRouter>
            </AuthenticationProvider>
        </ProtonApp>
    );
};

export default PublicApp;
