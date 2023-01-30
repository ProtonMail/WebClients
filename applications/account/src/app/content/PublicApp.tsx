import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { OAuthLastAccess, getOAuthLastAccess } from '@proton/shared/lib/api/oauth';
import { getAppHref, getClientID, getExtension, getInvoicesPathname } from '@proton/shared/lib/apps/helper';
import { DEFAULT_APP, getAppFromPathname, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { getIsVPNApp, getToApp, getToAppName } from '@proton/shared/lib/authentication/apps';
import { PushForkResponse } from '@proton/shared/lib/authentication/interface';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import {
    GetActiveSessionsResult,
    LocalSessionPersisted,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { produceExtensionFork, produceFork, produceOAuthFork } from '@proton/shared/lib/authentication/sessionForking';
import {
    APPS,
    APPS_CONFIGURATION,
    CLIENT_TYPES,
    SETUP_ADDRESS_PATH,
    SSO_PATHS,
    UNPAID_STATE,
    isSSOMode,
} from '@proton/shared/lib/constants';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { getEncryptedSetupBlob, getRequiresAddressSetup } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import HandleLogout from '../containers/HandleLogout';
import LoginContainer from '../login/LoginContainer';
import { AuthExtensionState } from '../public/AuthExtension';
import AuthExtension from '../public/AuthExtension';
import EmailUnsubscribeContainer from '../public/EmailUnsubscribeContainer';
import ForgotUsernameContainer from '../public/ForgotUsernameContainer';
import OAuthConfirmForkContainer from '../public/OAuthConfirmForkContainer';
import RemoveRecoveryEmailContainer from '../public/RemoveRecoveryEmailContainer';
import SwitchAccountContainer from '../public/SwitchAccountContainer';
import VerifyRecoveryEmailContainer from '../public/VerifyRecoveryEmailContainer';
import ResetPasswordContainer from '../reset/ResetPasswordContainer';
import SignupContainer from '../signup/SignupContainer';
import SignupInviteContainer from '../signup/SignupInviteContainer';
import { getProduct, getProductParam } from '../signup/searchParams';
import AccountPublicApp from './AccountPublicApp';

const getPathFromLocation = (location: H.Location) => {
    return [location.pathname, location.search, location.hash].join('');
};

export const getSearchParams = (search: string) => {
    const searchParams = new URLSearchParams(search);

    const maybeProductParam = (searchParams.get('service') || searchParams.get('product') || undefined)?.toLowerCase();
    const product = getProduct(maybeProductParam);
    const productParam = getProductParam(product, maybeProductParam);

    return { product, productParam };
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
    if (pathname.includes(SETUP_ADDRESS_PATH)) {
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
    REMOVE_EMAIL: '/remove-email',
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
    const messageListenerRef = useRef<undefined | ((event: MessageEvent<any>) => void)>();

    useEffect(() => {
        return () => {
            if (messageListenerRef.current) {
                window.removeEventListener('message', messageListenerRef.current);
                messageListenerRef.current = undefined;
            }
        };
    }, []);

    const { product: maybeQueryAppIntent, productParam } = useMemo(() => {
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
                const result = await produceExtensionFork({
                    messageListenerRef,
                    extension,
                    payload: {
                        selector,
                        keyPassword: data.payload.keyPassword,
                        persistent: data.payload.persistent,
                        trusted: data.payload.trusted,
                        state: data.payload.state,
                    },
                });
                const type = result?.type === 'success' ? 'success' : 'error';
                const state: AuthExtensionState = { type, extension, payload: result?.payload };
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

        const toApp = getToApp(appIntent?.app || maybePreAppIntent || maybeLocalRedirect?.toApp, user);

        // Handle special case going for internal vpn on account settings.
        const localRedirect =
            maybeLocalRedirect ||
            (toApp === APPS.PROTONVPN_SETTINGS ? getLocalRedirect(APPS_CONFIGURATION[toApp].settingsSlug) : undefined);

        if (getRequiresAddressSetup(toApp, user) && !localRedirect?.pathname.includes(SETUP_ADDRESS_PATH)) {
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
            if (appIntent?.ref !== undefined) {
                url.searchParams.append('ref', appIntent.ref);
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

    const [toOAuthName, plan] =
        forkState?.type === SSOType.OAuth
            ? [forkState.payload.clientInfo.Name, undefined]
            : [confirmForkData?.payload.clientInfo.Name, forkState?.payload?.plan];
    const toInternalAppName = maybePreAppIntent && getToAppName(maybePreAppIntent);
    const toAppName = toOAuthName || toInternalAppName;

    const clientType = getIsVPNApp(maybePreAppIntent) ? CLIENT_TYPES.VPN : CLIENT_TYPES.MAIL;
    const setupVPN = true; /* True until apps have been deployed to support key-less accounts*/

    return (
        <>
            <HandleLogout />
            <ModalsChildren />
            <Switch>
                <Route path={`${UNAUTHENTICATED_ROUTES.UNSUBSCRIBE}/:subscriptions?`}>
                    <Unauthenticated>
                        <EmailUnsubscribeContainer />
                    </Unauthenticated>
                </Route>
                <Route path={UNAUTHENTICATED_ROUTES.VERIFY_EMAIL}>
                    <Unauthenticated>
                        <VerifyRecoveryEmailContainer
                            onSubscribe={(jwt) => {
                                history.replace({ pathname: `${UNAUTHENTICATED_ROUTES.UNSUBSCRIBE}`, hash: jwt });
                            }}
                        />
                    </Unauthenticated>
                </Route>
                <Route path={UNAUTHENTICATED_ROUTES.REMOVE_EMAIL}>
                    <Unauthenticated>
                        <RemoveRecoveryEmailContainer />
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
                        clientType={clientType}
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
                                                            window.location.pathname = SSO_PATHS.SWITCH;
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
                                                    productParam={productParam}
                                                    clientType={clientType}
                                                    toApp={maybePreAppIntent}
                                                    toAppName={toAppName}
                                                    onLogin={handleLogin}
                                                    onBack={hasBackToSwitch ? () => history.push('/login') : undefined}
                                                    setupVPN={setupVPN}
                                                />
                                            </Route>
                                            <Route path={SSO_PATHS.RESET_PASSWORD}>
                                                <ResetPasswordContainer
                                                    toApp={maybePreAppIntent}
                                                    onLogin={handleLogin}
                                                    setupVPN={setupVPN}
                                                />
                                            </Route>
                                            <Route path={SSO_PATHS.FORGOT_USERNAME}>
                                                <ForgotUsernameContainer />
                                            </Route>
                                            <Route path={SSO_PATHS.LOGIN}>
                                                <LoginContainer
                                                    toAppName={toAppName}
                                                    toApp={maybePreAppIntent}
                                                    showContinueTo={!!toOAuthName}
                                                    onLogin={handleLogin}
                                                    onBack={hasBackToSwitch ? () => history.push('/switch') : undefined}
                                                    setupVPN={setupVPN}
                                                    signupOptions={{plan}}
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
