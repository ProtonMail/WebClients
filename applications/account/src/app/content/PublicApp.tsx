import { type ReactNode, useCallback, useState } from 'react';
import { BrowserRouter, Redirect, Route, Switch, useHistory } from 'react-router-dom';

import type * as H from 'history';

import { createAuthentication, init, loadCrypto } from '@proton/account/bootstrap';
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
    UnAuthenticatedApiProvider,
    useAuthentication,
} from '@proton/components';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import type { AuthSession } from '@proton/components/containers/login/interface';
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
import type {
    GetActiveSessionsResult,
    LocalSessionPersisted,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getActiveSessions } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, CLIENT_TYPES, SSO_PATHS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { getHas2024OfferCoupon } from '@proton/shared/lib/helpers/subscription';
import { UnleashFlagProvider } from '@proton/unleash';

import forgotUsernamePage from '../../pages/forgot-username';
import resetPasswordPage from '../../pages/reset-password';
import * as config from '../config';
import HandleLogout from '../containers/HandleLogout';
import locales from '../locales';
import LoginContainer from '../login/LoginContainer';
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
import { PartnerLogin, PartnerSignup } from '../public/Partner/index';
import ReAuthContainer from '../public/ReAuthContainer';
import RemoveEmailContainer from '../public/RemoveEmailContainer';
import SwitchAccountContainer from '../public/SwitchAccountContainer';
import VerifyEmailContainer from '../public/VerifyEmailContainer';
import ResetPasswordContainer from '../reset/ResetPasswordContainer';
import SignupInviteContainer from '../signup/SignupInviteContainer';
import { getProductParams, getThemeFromLocation } from '../signup/searchParams';
import { getSignupMeta } from '../signup/signupPagesJson';
import SingleSignupContainer from '../single-signup/SingleSignupContainer';
import { extendStore, setupStore } from '../store/public-store';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import AccountEffect from './AccountAutoLogin';
import AccountLoaderPage from './AccountLoaderPage';
import AccountPublicApp from './AccountPublicApp';
import ExternalSSOConsumer from './ExternalSSOConsumer';
import SingleSignupSwitchContainer from './SingleSignupSwitchContainer';
import { getActiveSessionLoginResult } from './actions/getActiveSessionLoginResult';
import { getLoginResult } from './actions/getLoginResult';
import { getProduceForkLoginResult } from './actions/getProduceForkLoginResult';
import { handleRedirectLogin } from './actions/handleRedirectLogin';
import type { LoginLocationState, LoginResult } from './actions/interface';
import { handleOAuthFork } from './fork/handleOAuthFork';
import { handleProtonFork } from './fork/handleProtonFork';
import { type ProduceForkData, SSOType } from './fork/interface';
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
    extendStore({ config, api, authentication });
    const store = setupStore();
    return {
        authentication,
        store,
        api,
    };
};

export const getSearchParams = (location: H.Location, searchParams: URLSearchParams) => {
    const { product, productParam } = getProductParams(location.pathname, searchParams);
    return { product, productParam };
};

let cryptoWorkerPromise: Promise<void> | undefined;

const handlePreload = () => {
    if (!cryptoWorkerPromise) {
        cryptoWorkerPromise = loadCrypto({
            appName: APPS.PROTONACCOUNT,
            unleashClient: undefined,
        });
    }
};

const handlePreSubmit = async () => {
    handlePreload();
    // The crypto worked must be loaded when signup/login/reset are performed
    await cryptoWorkerPromise;
};

const UnleashFlagProviderWrapper = ({ children }: { children: ReactNode }) => {
    const api = useApi();
    return <UnleashFlagProvider api={api}>{children}</UnleashFlagProvider>;
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
];

const ephemeralLoginPaths = [SSO_PATHS.APP_SWITCHER, SSO_PATHS.REAUTH];

// Optimistically calculate if the account switcher should be visible
const initialSessionsLength = getPersistedSessions().length;
const initialSessionsLengthBool = Boolean(getPersistedSessions().length);

const BasePublicApp = () => {
    const api = useApi();
    const history = useHistory();
    const authentication = useAuthentication();
    const location = useLocationWithoutLocale<{ from?: H.Location }>();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);
    const [forkState, setForkState] = useState<ProduceForkData | null>(null);
    const [activeSessions, setActiveSessions] = useState<LocalSessionPersisted[]>();
    const [maybeHasActiveSessions] = useState(initialSessionsLengthBool);
    const [locationState, setLocationState] = useState<null | LoginLocationState>(null);

    const searchParams = new URLSearchParams(location.search);

    const [
        {
            data: { product: maybeQueryAppIntent, productParam },
            initialSearchParams,
            maybeLocalRedirect,
        },
    ] = useState(() => {
        return {
            data: getSearchParams(location, searchParams),
            initialLocation: location,
            initialSearchParams: searchParams,
            maybeLocalRedirect: getLocalRedirect(location),
        };
    });

    const [hasInitialSessionBlockingLoading, setHasInitialSessionBlockingLoading] = useState(() => {
        return (
            maybeHasActiveSessions &&
            ((maybeLocalRedirect && maybeLocalRedirect.type !== 'post-login') ||
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
            await handleRedirectLogin({ result, authentication });
            return completeResult;
        }
        setLocationState(result);
        if (result.pathname) {
            history.push(result.pathname);
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
            api,
            session,
            localRedirect: maybeLocalRedirect,
            initialSearchParams,
            forkState,
            preAppIntent: maybePreAppIntent,
            paths,
        });
        return handleLoginResult(result);
    };

    const handleProduceFork = async (data: ProduceForkData, session: AuthSession): Promise<OnLoginCallbackResult> => {
        const result = await getProduceForkLoginResult({
            api,
            session,
            data,
            paths,
        });
        return handleLoginResult(result);
    };

    const handleInvalidFork = () => {
        history.replace(paths.login);
    };

    const handleGetActiveSessions = async () => {
        const result = await getActiveSessions({
            api: getSilentApi(api),
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
            api,
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
    const isPartnerEnabled = false;

    return (
        <>
            <HandleLogout />
            <NotificationsChildren />
            <ModalsChildren />
            <Switch>
                <Route path={SSO_PATHS.OAUTH_AUTHORIZE}>
                    <AccountEffect
                        onEffect={async () => {
                            const result = await handleOAuthFork({ api });
                            if (result.type === 'invalid') {
                                handleInvalidFork();
                                return;
                            }
                            if (result.type === 'switch') {
                                await handleActiveSessions(result.payload.activeSessionsResult, result.payload.fork);
                                return;
                            }
                            await handleProduceFork(result.payload.fork, result.payload.session);
                            return;
                        }}
                    >
                        {loader}
                    </AccountEffect>
                </Route>
                <Route path={SSO_PATHS.AUTHORIZE}>
                    <AccountEffect
                        onEffect={async () => {
                            const result = await handleProtonFork({ api });
                            if (result.type === 'invalid') {
                                handleInvalidFork();
                                return;
                            }
                            if (result.type === 'switch') {
                                await handleActiveSessions(result.payload.activeSessionsResult, result.payload.fork);
                                return;
                            }
                            await handleProduceFork(result.payload.fork, result.payload.session);
                            return;
                        }}
                    >
                        {loader}
                    </AccountEffect>
                </Route>
                <Route path={[SSO_PATHS.EXTERNAL_SSO_LOGIN, SSO_PATHS.EXTERNAL_SSO_REAUTH]}>
                    <UnAuthenticated>
                        <ExternalSSOConsumer
                            onLogin={({ username, token, flow }) =>
                                history.replace(SSO_PATHS.LOGIN, {
                                    authType: AuthType.ExternalSSO,
                                    externalSSO: {
                                        token,
                                        flow,
                                    },
                                    username,
                                })
                            }
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
                    <UnAuthenticatedApiProvider>
                        <UnAuthenticated>
                            <CloseTicketContainer />
                        </UnAuthenticated>
                    </UnAuthenticatedApiProvider>
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
                    <UnAuthenticatedApiProvider>
                        <UnleashFlagProviderWrapper>
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
                                            <Switch location={location}>
                                                <Route path={SSO_PATHS.JOIN_MAGIC_LINK}>
                                                    <UnAuthenticatedApiProvider>
                                                        <UnleashFlagProviderWrapper>
                                                            <UnAuthenticated>
                                                                <JoinMagicLinkContainer
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
                                                        </UnleashFlagProviderWrapper>
                                                    </UnAuthenticatedApiProvider>
                                                </Route>
                                                <Route path={SSO_PATHS.SWITCH}>
                                                    <UnAuthenticated>
                                                        <SwitchAccountContainer
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
                                                    />
                                                </Route>
                                                {isPartnerEnabled && (
                                                    <Route path={[SSO_PATHS.PORKBUN_SIGNUP]}>
                                                        <UnAuthenticated>
                                                            <PartnerSignup initialSearchParams={initialSearchParams} />
                                                        </UnAuthenticated>
                                                    </Route>
                                                )}
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
                                                        />
                                                    </UnAuthenticated>
                                                </Route>
                                                <Route path={SSO_PATHS.FORGOT_USERNAME}>
                                                    <UnAuthenticated>
                                                        <ForgotUsernameContainer
                                                            toApp={maybePreAppIntent}
                                                            metaTags={forgotUsernamePage()}
                                                            loginUrl={paths.login}
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
                                                        />
                                                    </UnAuthenticated>
                                                </Route>
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
                                                                        api,
                                                                        oauthData:
                                                                            locationState.payload.data.payload
                                                                                .oauthData,
                                                                        UID: locationState.payload.session.UID,
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
                                                {isPartnerEnabled && (
                                                    <Route path={SSO_PATHS.PORKBUN_SIGN_IN}>
                                                        <UnAuthenticated>
                                                            <PartnerLogin initialSearchParams={initialSearchParams} />
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
                        </UnleashFlagProviderWrapper>
                    </UnAuthenticatedApiProvider>
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
