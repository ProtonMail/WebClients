import { type Dispatch, type ReactNode, type SetStateAction, useCallback, useEffect, useState } from 'react';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';

import type * as H from 'history';

import { loadCrypto } from '@proton/account/bootstrap';
import UnauthenticatedApiProvider from '@proton/components/containers/api/UnauthenticatedApiProvider';
import type { OnLoginCallback } from '@proton/components/containers/app/interface';
import UnAuthenticated from '@proton/components/containers/authentication/UnAuthenticated';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import { AuthType } from '@proton/components/containers/login/interface';
import PublicAppSetup from '@proton/components/containers/publicAppSetup/PublicAppSetup';
import useApi from '@proton/components/hooks/useApi';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getIsPassApp, getIsVPNApp, getToAppName } from '@proton/shared/lib/authentication/apps';
import { produceOAuthFork } from '@proton/shared/lib/authentication/fork';
import type { ActiveSession, GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS, type APP_NAMES, CLIENT_TYPES, SSO_PATHS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { FlagProvider } from '@proton/unleash';
import noop from '@proton/utils/noop';

import forgotUsernamePage from '../../pages/forgot-username';
import resetPasswordPage from '../../pages/reset-password';
import locales from '../locales';
import LoginContainer, { type LoginContainerState } from '../login/LoginContainer';
import { getLoginMeta } from '../login/loginPagesJson';
import AppSwitcherContainer from '../public/AppSwitcherContainer';
import AuthDesktop from '../public/AuthDesktop';
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
import SigninHelpContainer from '../public/SigninHelpContainer';
import SwitchAccountContainer from '../public/SwitchAccountContainer';
import VerifyEmailContainer from '../public/VerifyEmailContainer';
import SignInWithAnotherDeviceContainer from '../public/signInWithAnotherDevice/SignInWithAnotherDeviceContainer';
import ResetPasswordContainer from '../reset/ResetPasswordContainer';
import SignupInviteContainer from '../signup/SignupInviteContainer';
import { getSignupMeta } from '../signup/signupPagesJson';
import SingleSignupContainer from '../single-signup/SingleSignupContainer';
import { extraThunkArguments } from '../store/public-thunk';
import type useLocationWithoutLocale from '../useLocationWithoutLocale';
import AccountPublicApp from './AccountPublicApp';
import ExternalSSOConsumer from './ExternalSSOConsumer';
import SingleSignupSwitchContainer from './SingleSignupSwitchContainer';
import { type ProduceForkData, SSOType } from './actions/forkInterface';
import { getSanitizedLocationDescriptorObject } from './actions/getSanitizedLocationDescriptorObject';
import type { LoginLocationState, LoginResult } from './actions/interface';
import { type Paths, UNAUTHENTICATED_ROUTES } from './helper';

let cryptoWorkerPromise: Promise<void> | undefined;

const handlePreload = () => {
    if (!cryptoWorkerPromise) {
        cryptoWorkerPromise = loadCrypto({
            appName: APPS.PROTONACCOUNT,
            unleashClient: undefined,
        });
    }
};

let started = false;

const handleStartFlags = () => {
    if (!started) {
        const unleashClient = extraThunkArguments.unleashClient;
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

const getClientType = (toApp: APP_NAMES | undefined) => {
    if (getIsVPNApp(toApp)) {
        return CLIENT_TYPES.VPN;
    }
    if (getIsPassApp(toApp)) {
        return CLIENT_TYPES.PASS;
    }
    return CLIENT_TYPES.MAIL;
};

export interface PublicAppInteractiveProps {
    loader: ReactNode;
    location: ReturnType<typeof useLocationWithoutLocale>;
    handleLogin: OnLoginCallback;
    handleLoginResult: (result: LoginResult) => void;
    handleGetActiveSessions: () => Promise<GetActiveSessionsResult>;
    locationState: LoginLocationState | null;
    activeSessions: ActiveSession[] | undefined;
    hasBackToSwitch: boolean;
    paths: Paths;
    blockingLoginEffect: ReactNode | null;
    maybePreAppIntent: APP_NAMES | undefined;
    forkState: ProduceForkData | null;
    productParam: ProductParam;
    searchParams: URLSearchParams;
    initialSearchParams: URLSearchParams;
    setActiveSessions: Dispatch<SetStateAction<ActiveSession[] | undefined>>;
    initialSessionsLength: number;
    loginPaths: string[];
}

const PublicAppInteractive = ({
    loader,
    location,
    handleLogin,
    handleLoginResult,
    handleGetActiveSessions,
    locationState,
    activeSessions,
    hasBackToSwitch,
    paths,
    blockingLoginEffect,
    maybePreAppIntent,
    forkState,
    productParam,
    searchParams,
    initialSearchParams,
    setActiveSessions,
    initialSessionsLength,
    loginPaths,
}: PublicAppInteractiveProps) => {
    const normalApi = useApi();
    const history = useHistory();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);

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

    return (
        <Switch location={location}>
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
                                location: SSO_PATHS.OAUTH_PARTNERS,
                            };
                            try {
                                handleLoginResult(loginLocationState);
                            } catch (error) {}
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
                            history.replace(paths.login, state);
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
            {locationState?.type === 'auth-desktop' && (
                <Route path="/auth-desktop">
                    <AuthDesktop state={locationState.payload} />
                </Route>
            )}
            {locationState?.type === 'oauth-partners' && (
                <Route path={SSO_PATHS.OAUTH_PARTNERS}>
                    <UnAuthenticated>
                        <OAuthPartnersContainer
                            loader={loader}
                            state={locationState.payload}
                            unauthenticatedApi={extraThunkArguments.unauthenticatedApi}
                            onLogin={handleLogin}
                            onCredentials={({ email, sessions }) => {
                                if (sessions?.sessions) {
                                    setActiveSessions(sessions.sessions);
                                }
                                const state: LoginContainerState | undefined = email
                                    ? {
                                          username: email,
                                      }
                                    : undefined;
                                history.replace(paths.login, state);
                            }}
                            toApp={maybePreAppIntent}
                            productParam={productParam}
                        />
                    </UnAuthenticated>
                </Route>
            )}
            <Route path="/call-scheduled">
                <UnAuthenticated>
                    <CallScheduledPage />
                </UnAuthenticated>
            </Route>
            {blockingLoginEffect && <Route path="*">{blockingLoginEffect}</Route>}
            <Route path="*">
                <UnauthenticatedApiProvider unauthenticatedApi={extraThunkArguments.unauthenticatedApi}>
                    <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
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
                                        <Route path={SSO_PATHS.SIGN_IN_WITH_ANOTHER_DEVICE}>
                                            <UnAuthenticated>
                                                <SignInWithAnotherDeviceContainer
                                                    paths={paths}
                                                    api={extraThunkArguments.api}
                                                    onStartAuth={handleStartAuth}
                                                    onLogin={handleLogin}
                                                    productParam={productParam}
                                                    toAppName={toAppName}
                                                    toApp={maybePreAppIntent}
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
                                                SSO_PATHS.START,
                                                SSO_PATHS.REFERAL_PLAN_SELECTION,
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
                                                SSO_PATHS.LUMO_SIGNUP_B2B,
                                                SSO_PATHS.MEET_SIGNUP,
                                                SSO_PATHS.MEET_SIGNUP_B2B,
                                                SSO_PATHS.PORKBUN_SIGNUP,
                                                SSO_PATHS.PORKBUN_SIGN_IN,
                                                SSO_PATHS.FIRST_EMAIL,
                                                SSO_PATHS.GREENLAND_SIGNUP,
                                            ]}
                                        >
                                            <SingleSignupSwitchContainer
                                                initialSessionsLength={Boolean(initialSessionsLength)}
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
                                                handleLogin={handleLogin}
                                                fork={!!forkState}
                                                onBack={hasBackToSwitch ? () => history.push(paths.login) : undefined}
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
                                                onBack={hasBackToSwitch ? () => history.push(paths.login) : undefined}
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
                                                        history.replace(
                                                            getSanitizedLocationDescriptorObject({
                                                                pathname: paths.signup,
                                                                search: '?mode=sps',
                                                                state: { invite: inviteData },
                                                            })
                                                        )
                                                    }
                                                    onInvalid={() => history.push(paths.signup)}
                                                />
                                            </UnAuthenticated>
                                        </Route>
                                        <Route path={SSO_PATHS.SIGNIN_HELP}>
                                            <UnAuthenticated>
                                                <SigninHelpContainer toApp={maybePreAppIntent} paths={paths} />
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
                                        {locationState?.type === 'confirm-oauth' && (
                                            <Route path={SSO_PATHS.OAUTH_CONFIRM_FORK}>
                                                <UnAuthenticated>
                                                    <OAuthConfirmForkContainer
                                                        name={toAppName}
                                                        image={
                                                            locationState.payload.data.payload.oauthData.clientInfo.Logo
                                                        }
                                                        onConfirm={async () => {
                                                            if (locationState?.type !== 'confirm-oauth') {
                                                                throw new Error('Missing state');
                                                            }
                                                            const uidApi = getUIDApi(
                                                                locationState.payload.session.data.UID,
                                                                normalApi
                                                            );
                                                            const url = await produceOAuthFork({
                                                                api: uidApi,
                                                                oauthData: locationState.payload.data.payload.oauthData,
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
                                                    ...(typeof location.state === 'object' ? location.state : {}),
                                                    from: location,
                                                },
                                            }}
                                        />
                                    </Switch>
                                </AccountPublicApp>
                            </ForceRefreshContext.Provider>
                        </PublicAppSetup>
                    </FlagProvider>
                </UnauthenticatedApiProvider>
            </Route>
        </Switch>
    );
};

export default PublicAppInteractive;
