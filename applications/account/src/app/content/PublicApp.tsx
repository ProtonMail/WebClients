import { type ReactNode, useCallback, useRef, useState } from 'react';
import { BrowserRouter, Redirect, Route, Switch, useHistory } from 'react-router-dom';

import type * as H from 'history';

import * as bootstrap from '@proton/account/bootstrap';
import type { OnLoginCallback, OnLoginCallbackResult } from '@proton/components';
import {
    ApiProvider,
    AuthenticationProvider,
    ErrorBoundary,
    ModalsChildren,
    NotificationsChildren,
    ProtonApp,
    SSOForkProducer,
    StandardErrorPage,
    UnAuthenticated,
    UnAuthenticatedApiProvider,
} from '@proton/components';
import type { ProduceForkData } from '@proton/components/containers/app/SSOForkProducer';
import { SSOType } from '@proton/components/containers/app/SSOForkProducer';
import type { OnLoginCallbackArguments, ProtonLoginCallback } from '@proton/components/containers/app/interface';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import type { AppIntent, AuthSession } from '@proton/components/containers/login/interface';
import { AuthType } from '@proton/components/containers/login/interface';
import PaymentSwitcher from '@proton/components/containers/payments/PaymentSwitcher';
import PublicAppSetup from '@proton/components/containers/publicAppSetup/PublicAppSetup';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { initMainHost } from '@proton/cross-storage/lib';
import useInstance from '@proton/hooks/useInstance';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { pushForkSession } from '@proton/shared/lib/api/auth';
import createApi from '@proton/shared/lib/api/createApi';
import type { OAuthLastAccess } from '@proton/shared/lib/api/oauth';
import { getOAuthLastAccess } from '@proton/shared/lib/api/oauth';
import { getOrganization as getOrganizationConfig } from '@proton/shared/lib/api/organization';
import {
    getAppHref,
    getClientID,
    getExtension,
    getInvoicesPathname,
    isExtension,
} from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { getIsPassApp, getIsVPNApp, getToApp, getToAppName } from '@proton/shared/lib/authentication/apps';
import {
    ForkType,
    getCanUserReAuth,
    getReturnUrl,
    getShouldReAuth,
    produceExtensionFork,
    produceFork,
    produceForkConsumption,
    produceOAuthFork,
} from '@proton/shared/lib/authentication/fork';
import type { PushForkResponse } from '@proton/shared/lib/authentication/interface';
import type {
    GetActiveSessionsResult,
    LocalSessionPersisted,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { GetActiveSessionType } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, CLIENT_TYPES, SETUP_ADDRESS_PATH, SSO_PATHS, UNPAID_STATE } from '@proton/shared/lib/constants';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { getHas2023OfferCoupon } from '@proton/shared/lib/helpers/subscription';
import { getPathFromLocation, joinPaths } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getEncryptedSetupBlob, getRequiresAddressSetup } from '@proton/shared/lib/keys';
import { UnleashFlagProvider } from '@proton/unleash';
import noop from '@proton/utils/noop';

import forgotUsernamePage from '../../pages/forgot-username';
import resetPasswordPage from '../../pages/reset-password';
import * as config from '../config';
import HandleLogout from '../containers/HandleLogout';
import locales from '../locales';
import LoginContainer from '../login/LoginContainer';
import { getLoginMeta } from '../login/loginPagesJson';
import type { AppSwitcherState } from '../public/AppSwitcherContainer';
import AppSwitcherContainer from '../public/AppSwitcherContainer';
import type { AuthExtensionState } from '../public/AuthExtension';
import AuthExtension from '../public/AuthExtension';
import CallScheduledPage from '../public/CallScheduledPage';
import CloseTicketContainer from '../public/CloseTicketContainer';
import DisableAccountContainer from '../public/DisableAccountContainer';
import EmailForwardingContainer, { EmailForwardingRequest } from '../public/EmailForwardingContainer';
import EmailUnsubscribeContainer from '../public/EmailUnsubscribeContainer';
import ForgotUsernameContainer from '../public/ForgotUsernameContainer';
import GroupInviteContainer, { GroupInviteRequest } from '../public/GroupInviteContainer';
import InboxDesktopFreeTrialEnded from '../public/InboxDesktopFreeTrialEnded';
import JoinMagicLinkContainer from '../public/JoinMagicLinkContainer';
import OAuthConfirmForkContainer from '../public/OAuthConfirmForkContainer';
import type { ReAuthState } from '../public/ReAuthContainer';
import ReAuthContainer from '../public/ReAuthContainer';
import RemoveEmailContainer from '../public/RemoveEmailContainer';
import SwitchAccountContainer from '../public/SwitchAccountContainer';
import VerifyEmailContainer from '../public/VerifyEmailContainer';
import ResetPasswordContainer from '../reset/ResetPasswordContainer';
import SignupInviteContainer from '../signup/SignupInviteContainer';
import { getProductParams, getThemeFromLocation } from '../signup/searchParams';
import { getSignupMeta } from '../signup/signupPagesJson';
import SingleSignupContainer from '../single-signup/SingleSignupContainer';
import { extendStore, setupStore } from '../store/store';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import AccountLoaderPage from './AccountLoaderPage';
import AccountPublicApp from './AccountPublicApp';
import ExternalSSOConsumer from './ExternalSSOConsumer';
import SingleSignupSwitchContainer from './SingleSignupSwitchContainer';
import { UNAUTHENTICATED_ROUTES, getLocalRedirect, getPaths } from './helper';
import { addSession } from './session';

const completeResult: OnLoginCallbackResult = { state: 'complete' };
const inputResult: OnLoginCallbackResult = { state: 'input' };

const bootstrapApp = () => {
    const api = createApi({ config, sendLocaleHeaders: true });
    const authentication = bootstrap.createAuthentication({ initialAuth: false });
    bootstrap.init({ config, authentication, locales });
    initMainHost();
    initElectronClassnames();
    initSafariFontFixClassnames();
    extendStore({ config, api, authentication });
    const store = setupStore({ mode: 'public' });
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

const SIGN_IN_ROUTES = [
    SSO_PATHS.LOGIN,
    SSO_PATHS.MAIL_SIGN_IN,
    SSO_PATHS.CALENDAR_SIGN_IN,
    SSO_PATHS.PASS_SIGN_IN,
    SSO_PATHS.VPN_SIGN_IN,
    SSO_PATHS.DRIVE_SIGN_IN,
    SSO_PATHS.DOCS_SIGN_IN,
    SSO_PATHS.WALLET_SIGN_IN,
];

const getDefaultPath = (toApp: APP_NAMES) => {
    if (toApp === APPS.PROTONMAIL) {
        return '/inbox';
    }
    return '/';
};

const addSignupSearchParams = (searchParams: URLSearchParams, { appIntent }: { appIntent?: AppIntent }) => {
    searchParams.append('welcome', 'true');
    if (appIntent?.ref !== undefined) {
        searchParams.append('ref', appIntent.ref);
    }
};

// All SSO paths except login
const DISABLE_AUTO_SIGN_IN_ROUTES: string[] = Object.values(SSO_PATHS).filter(
    (path) => !SIGN_IN_ROUTES.includes(path as any)
);

interface Props {
    onLogin: ProtonLoginCallback;
}

const UnleashFlagProviderWrapper = ({ children }: { children: ReactNode }) => {
    const api = useApi();
    return <UnleashFlagProvider api={api}>{children}</UnleashFlagProvider>;
};

const BasePublicApp = ({ onLogin }: Props) => {
    const api = useApi();
    const history = useHistory();
    const authentication = useAuthentication();
    const location = useLocationWithoutLocale<{ from?: H.Location }>();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);
    const [forkState, setForkState] = useState<ProduceForkData>();
    const [confirmForkData, setConfirmForkState] = useState<{
        data: Extract<ProduceForkData, { type: SSOType.OAuth }>;
        session: AuthSession;
    }>();
    const [activeSessions, setActiveSessions] = useState<LocalSessionPersisted[]>();
    const ignoreAutoRef = useRef(false);
    const [locationState, setLocationState] = useState<
        | null
        | { type: 'reauth'; payload: ReAuthState }
        | {
              type: 'appSwitcher';
              payload: AppSwitcherState;
          }
    >(null);

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

    const getPreAppIntent = (forkState: ProduceForkData | undefined) => {
        return (
            (forkState?.type === SSOType.Proton && forkState.payload.forkParameters.app) ||
            maybeLocalRedirect?.toApp ||
            maybeQueryAppIntent
        );
    };

    // Either another app wants to fork, or a specific route is requested on this app
    const maybePreAppIntent = getPreAppIntent(forkState);
    const paths = getPaths(location.localePrefix, forkState, maybePreAppIntent, productParam);

    const handleProduceFork = async (data: ProduceForkData, session: AuthSession): Promise<OnLoginCallbackResult> => {
        if (data.type === SSOType.Proton) {
            const { forkParameters, searchParameters } = data.payload;
            const { app } = forkParameters;

            if (isExtension(app)) {
                const childClientID = getClientID(app);
                const { Selector: selector } = await api<PushForkResponse>(
                    withUIDHeaders(
                        session.UID,
                        pushForkSession({
                            ChildClientID: childClientID,
                            Independent: forkParameters.independent ? 1 : 0,
                        })
                    )
                );
                const result = await produceExtensionFork({
                    app,
                    payload: {
                        selector,
                        session,
                        forkParameters,
                    },
                });

                const state: AuthExtensionState = { ...result, app };
                history.replace('/auth-ext', state);
                return inputResult;
            }

            const produceForkPayload = await produceFork({
                api,
                session,
                forkParameters,
            });
            produceForkConsumption(produceForkPayload, searchParameters);
            return completeResult;
        }

        if (data.type === SSOType.OAuth) {
            const { payload } = data;
            const UID = session.UID;
            const {
                Access: { Accepted },
            } = await api<{
                Access: OAuthLastAccess;
            }>(withUIDHeaders(UID, getOAuthLastAccess(payload.oauthData.clientID)));
            if (Accepted) {
                await produceOAuthFork({ api, oauthData: payload.oauthData, UID });
                return completeResult;
            }
            setConfirmForkState({ data, session });
            history.replace(SSO_PATHS.OAUTH_CONFIRM_FORK);
            return inputResult;
        }

        throw new Error('Unknown fork type');
    };

    const getOrganization = async (session: OnLoginCallbackArguments) => {
        if (!session.User.Subscribed) {
            return undefined;
        }
        return api<{
            Organization: Organization;
        }>(withUIDHeaders(session.UID, getOrganizationConfig())).then(({ Organization }) => Organization);
    };

    const handleLogin: OnLoginCallback = async (session) => {
        const { loginPassword, clientKey, LocalID, User: user, appIntent } = session;

        invokeInboxDesktopIPC({ type: 'userLogin' });

        const maybeToApp = appIntent?.app || maybePreAppIntent;

        // In any forking scenario, ignore the app switcher
        if (!maybeToApp && !forkState) {
            setActiveSessions((previousSessions) => {
                return addSession(previousSessions, session);
            });

            const organization = await getOrganization(session).catch(noop);
            const appSwitcherState: AppSwitcherState = {
                session: { ...session, Organization: organization },
            };
            setLocationState({ type: 'appSwitcher', payload: appSwitcherState });
            history.replace(paths.appSwitcher);
            return inputResult;
        }

        const toApp = getToApp(maybeToApp, user);

        if (
            // Reauth is only triggered through the switch flow as in other scenarios the user always enters their password
            session.flow === 'switch' &&
            getCanUserReAuth(session.User) &&
            (session.prompt === 'login' ||
                (forkState?.type === SSOType.Proton && getShouldReAuth(forkState.payload.forkParameters, session)))
        ) {
            const reAuthState: ReAuthState = {
                session,
                reAuthType:
                    forkState && forkState.type === SSOType.Proton
                        ? forkState.payload.forkParameters.promptType
                        : 'default',
            };
            // Intentionally not using history state to avoid persisting it to the browser
            setLocationState({ type: 'reauth', payload: reAuthState });
            history.replace(paths.reauth);
            return inputResult;
        }

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
            if (toApp === APPS.PROTONVPN_SETTINGS) {
                const path = session.flow === 'signup' ? '/vpn-apps?prompt=true' : '/';
                return {
                    path: joinPaths(getSlugFromApp(toApp), path),
                    toApp: toApp,
                };
            }
        })();

        if (getRequiresAddressSetup(toApp, user) && !localRedirect?.path.includes(SETUP_ADDRESS_PATH)) {
            const blob =
                loginPassword && clientKey
                    ? await getEncryptedSetupBlob(clientKey, loginPassword).catch(noop)
                    : undefined;
            const params = new URLSearchParams();
            params.set('to', toApp);
            params.set('from', 'switch');
            const path = `${SETUP_ADDRESS_PATH}?${params.toString()}#${blob || ''}`;
            onLogin({
                ...session,
                path,
            });
            return completeResult;
        }

        // Upon login, if user is delinquent, the fork is aborted and the user is redirected to invoices
        if (user.Delinquent >= UNPAID_STATE.DELINQUENT) {
            onLogin({
                ...session,
                path: joinPaths(getSlugFromApp(toApp), getInvoicesPathname()),
            });
            return completeResult;
        }

        // Fork early to extensions because they don't need to follow the signup logic
        if (forkState?.type === SSOType.Proton && getExtension(forkState.payload.forkParameters.app)) {
            return handleProduceFork(
                {
                    type: SSOType.Proton,
                    payload: { forkParameters: forkState.payload.forkParameters },
                },
                session
            );
        }

        if (forkState?.type === SSOType.OAuth) {
            return handleProduceFork(
                {
                    type: SSOType.OAuth,
                    payload: { oauthData: forkState.payload.oauthData },
                },
                session
            );
        }

        if (forkState?.type === SSOType.Proton) {
            const searchParameters = new URLSearchParams();
            if (session.flow === 'signup') {
                addSignupSearchParams(searchParameters, { appIntent });
            }
            return handleProduceFork(
                {
                    type: SSOType.Proton,
                    payload: {
                        searchParameters,
                        forkParameters: forkState.payload.forkParameters,
                    },
                },
                session
            );
        }

        const getRedirectUrl = () => {
            if (localRedirect) {
                const path = localRedirect.path || '/';
                return new URL(getAppHref(path, APPS.PROTONACCOUNT, LocalID));
            }

            const returnUrl = getReturnUrl(initialSearchParams);
            if (returnUrl) {
                const url = new URL(
                    getAppHref(returnUrl.pathname, toApp, returnUrl.context === 'private' ? LocalID : undefined)
                );
                url.search = returnUrl.search;
                url.hash = returnUrl.hash;
                return url;
            }

            const path = getDefaultPath(toApp);
            const url = new URL(getAppHref(path, toApp, LocalID));
            if (session.flow === 'signup') {
                addSignupSearchParams(url.searchParams, { appIntent });
            }
            return url;
        };

        const url = getRedirectUrl();

        if (url.hostname === window.location.hostname || authentication.mode !== 'sso') {
            onLogin({
                ...session,
                path: getPathFromLocation(url),
            });
            return completeResult;
        }

        replaceUrl(url.toString());
        return completeResult;
    };

    const handleActiveSessionsFork = async (
        newForkState: ProduceForkData,
        { session, sessions, type }: GetActiveSessionsResult
    ): Promise<OnLoginCallbackResult> => {
        ignoreAutoRef.current = true;

        setForkState(newForkState);
        setActiveSessions(sessions);

        if (newForkState.type === SSOType.Proton) {
            const forkParameters = newForkState.payload.forkParameters;
            const autoSignIn = type === GetActiveSessionType.AutoPick;

            if (autoSignIn && getShouldReAuth(forkParameters, session)) {
                const reAuthState: ReAuthState = { session, reAuthType: forkParameters.promptType };
                setLocationState({ type: 'reauth', payload: reAuthState });
                history.replace(paths.reauth);
                return inputResult;
            }

            if (autoSignIn && forkParameters.forkType === undefined) {
                return handleProduceFork(
                    {
                        type: SSOType.Proton,
                        payload: { forkParameters },
                    },
                    session
                );
            }

            if (forkParameters.forkType === ForkType.SIGNUP) {
                const paths = getPaths(
                    location.localePrefix,
                    newForkState,
                    getPreAppIntent(newForkState),
                    productParam
                );
                history.replace(paths.signup);
                return inputResult;
            }
        }

        history.replace(sessions.length >= 1 ? SSO_PATHS.SWITCH : paths.login);
        return inputResult;
    };

    const handleInvalidFork = () => {
        ignoreAutoRef.current = true;
        history.replace(paths.login);
    };

    const handleActiveSessions = async ({
        session,
        sessions,
        type,
    }: GetActiveSessionsResult): Promise<OnLoginCallbackResult> => {
        // Ignore the automatic login
        if (ignoreAutoRef.current || DISABLE_AUTO_SIGN_IN_ROUTES.includes(location.pathname)) {
            setActiveSessions(sessions);
            if (!sessions.length && location.pathname === SSO_PATHS.SWITCH) {
                // This is recalculated because the set locale might have changed
                const paths = getPaths(location.localePrefix, forkState, maybePreAppIntent, productParam);
                history.replace(paths.login);
            }
            return inputResult;
        }
        if (type === GetActiveSessionType.AutoPick) {
            return handleLogin(session);
        }
        if (!sessions.length) {
            setActiveSessions(sessions);
            return inputResult;
        }
        setActiveSessions(sessions);
        history.replace(SSO_PATHS.SWITCH);
        return inputResult;
    };

    const updateActiveSessions = (updatedActiveSessions?: LocalSessionPersisted[]) => {
        if (!updatedActiveSessions?.length) {
            setActiveSessions([]);
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
            ? forkState.payload.oauthData.clientInfo.Name
            : confirmForkData?.data.payload.oauthData.clientInfo.Name;
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

    const hasBFCoupon = getHas2023OfferCoupon(searchParams.get('coupon')?.toUpperCase());
    const theme = getThemeFromLocation(location, searchParams);
    const loader = theme ? (
        <UnAuthenticated theme={theme.themeType}>
            <AccountLoaderPage className={theme.className} isDarkBg={theme.isDarkBg} />
        </UnAuthenticated>
    ) : (
        <AccountLoaderPage />
    );

    const hasBackToSwitch = (activeSessions?.length || 0) >= 1;

    return (
        <>
            <HandleLogout />
            <NotificationsChildren />
            <ModalsChildren />
            <Switch>
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
                <Route path={UNAUTHENTICATED_ROUTES.CLOSE_TICKET}>
                    <UnAuthenticatedApiProvider loader={loader}>
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
                <Route path="/call-scheduled">
                    <UnAuthenticated>
                        <CallScheduledPage />
                    </UnAuthenticated>
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
                            <UnleashFlagProviderWrapper>
                                <PublicAppSetup loader={loader}>
                                    <PaymentSwitcher loader={loader}>
                                        <ForceRefreshContext.Provider value={refresh}>
                                            <Switch location={location}>
                                                <Route path={`${SSO_PATHS.JOIN_MAGIC_LINK}`}>
                                                    <UnAuthenticated>
                                                        <JoinMagicLinkContainer
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
                                                {confirmForkData && toAppName && (
                                                    <Route path={SSO_PATHS.OAUTH_CONFIRM_FORK}>
                                                        <UnAuthenticated>
                                                            <OAuthConfirmForkContainer
                                                                name={toAppName}
                                                                image={
                                                                    confirmForkData.data.payload.oauthData.clientInfo
                                                                        .Logo
                                                                }
                                                                onConfirm={() => {
                                                                    return produceOAuthFork({
                                                                        api,
                                                                        oauthData:
                                                                            confirmForkData.data.payload.oauthData,
                                                                        UID: confirmForkData.session.UID,
                                                                    });
                                                                }}
                                                                onCancel={() => {
                                                                    // Force a hard refresh to get active sessions to refresh when signing up
                                                                    window.location.pathname = SSO_PATHS.SWITCH;
                                                                }}
                                                            />
                                                        </UnAuthenticated>
                                                    </Route>
                                                )}
                                                <Route path={SSO_PATHS.EXTERNAL_SSO_LOGIN}>
                                                    <UnAuthenticated>
                                                        <ExternalSSOConsumer
                                                            loader={loader}
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
                                                        />
                                                    </UnAuthenticated>
                                                </Route>
                                                <Route path={SSO_PATHS.SWITCH}>
                                                    <UnAuthenticated>
                                                        <SwitchAccountContainer
                                                            metaTags={getLoginMeta(maybePreAppIntent)}
                                                            activeSessions={activeSessions}
                                                            toApp={maybePreAppIntent}
                                                            toAppName={toAppName}
                                                            onLogin={handleLogin}
                                                            updateActiveSessions={updateActiveSessions}
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
                                                        hasBFCoupon={hasBFCoupon}
                                                        maybePreAppIntent={maybePreAppIntent}
                                                        initialSearchParams={initialSearchParams}
                                                        paths={paths}
                                                        metaTags={getSignupMeta(maybePreAppIntent)}
                                                        activeSessions={activeSessions}
                                                        loader={loader}
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
                                                <Route
                                                    path={[
                                                        SSO_PATHS.LOGIN,
                                                        SSO_PATHS.MAIL_SIGN_IN,
                                                        SSO_PATHS.CALENDAR_SIGN_IN,
                                                        SSO_PATHS.DRIVE_SIGN_IN,
                                                        SSO_PATHS.DOCS_SIGN_IN,
                                                        SSO_PATHS.VPN_SIGN_IN,
                                                        SSO_PATHS.PASS_SIGN_IN,
                                                        SSO_PATHS.WALLET_SIGN_IN,
                                                    ]}
                                                    exact
                                                >
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
                                                        />
                                                    </UnAuthenticated>
                                                </Route>
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
                                                {locationState?.type === 'appSwitcher' && (
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
                                        </ForceRefreshContext.Provider>
                                    </PaymentSwitcher>
                                </PublicAppSetup>
                            </UnleashFlagProviderWrapper>
                        </UnAuthenticatedApiProvider>
                    </AccountPublicApp>
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
                <ApiProvider api={api}>
                    <ProtonStoreProvider store={store}>
                        <BrowserRouter>
                            <ErrorBoundary big component={<StandardErrorPage big />}>
                                <BasePublicApp
                                    onLogin={(args) => {
                                        const url = authentication.login(args);
                                        replaceUrl(url);
                                    }}
                                />
                            </ErrorBoundary>
                        </BrowserRouter>
                    </ProtonStoreProvider>
                </ApiProvider>
            </AuthenticationProvider>
        </ProtonApp>
    );
};

export default PublicApp;
