import { useCallback, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import type * as H from 'history';

import UnauthenticatedApiProvider from '@proton/components/containers/api/UnauthenticatedApiProvider';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import PublicAppSetup from '@proton/components/containers/publicAppSetup/PublicAppSetup';
import { SSO_PATHS, VPN_TV_PATH_WITH_CODE, VPN_TV_SIGNUP_REDIRECT } from '@proton/shared/lib/constants';
import { UnleashFlagProviderWithToolbar } from '@proton/unleash/UnleashFlagProviderWithToolbar';

import bornPrivateActivatePage from '../../pages/born-private.activate';
import bornPrivateRecoveryPage from '../../pages/born-private.recovery';
import AccountLoaderPage from '../AccountLoaderPage';
import locales from '../locales';
import AccountPublicApp from './AccountPublicApp';
import { ProductAttribution } from './ProductAttribution';
import UnleashFlagStarter from './UnleashFlagStarter';
import AppSwitcherContainer from './appSwitcher/AppSwitcherContainer';
import type { OnLoginCallback } from './authSession';
import PublicAppForgotUsername from './forgotUsername/PublicAppForgotUsername';
import ConfirmDesktopForkContainer from './fork/ConfirmDesktopForkContainer';
import ConfirmForkRedirectContainer from './fork/ConfirmForkRedirectContainer';
import OAuthConfirmForkContainer from './fork/OAuthConfirmForkContainer';
import useLocationWithoutLocale from './hooks/useLocationWithoutLocale';
import JoinMagicLinkContainer from './joinMagicLink/JoinMagicLinkContainer';
import TokenRedemptionContainer from './orgJoiningLink/TokenRedemptionContainer';
import { usePublicAppAuth } from './publicAppAuth';
import ReAuthContainer from './reAuth/ReAuthContainer';
import PublicAppSignIn from './sign-in/PublicAppSignIn';
import SigninHelpContainer from './sign-in/SigninHelpContainer';
import SignInWithAnotherDeviceContainer from './signInWithAnotherDevice/SignInWithAnotherDeviceContainer';
import PublicAppSignupInvite from './signup/PublicAppSignupInvite';
import PublicAppVpnSignup from './signup/PublicAppVpnSignup';
import SingleSignupSwitchContainer from './signup/SingleSignupSwitchContainer';
import { getProvisioningToken } from './signup/orgProvisioning';
import Activation from './signupCtx/flows/bornPrivate/activation/Activation';
import Recovery from './signupCtx/flows/bornPrivate/recovery/Recovery';
import { PublicAppContext } from './state-machine/PublicAppContext';
import { usePublicAppServices } from './state-machine/PublicAppServices';
import { loginPaths, selectHasBackToSwitch, selectPaths } from './state-machine/publicAppStateMachine';
import { runLogin as runMachineLogin } from './state-machine/runLogin';
import SwitchAccountContainer from './switchAccount/SwitchAccountContainer';
import { TvContainerGetVpnPlus } from './tv/TvContainerGetVpnPlus';
import { TvContainerNotSignedIn } from './tv/TvContainerNotSignedIn';
import PublicAppResetPassword from './unauthed-forgot-password/PublicAppResetPassword';

const PublicAppMainRoutes = () => {
    const services = usePublicAppServices();
    const { onPreload } = usePublicAppAuth();
    const location = useLocationWithoutLocale<{ from?: H.Location }>();
    const publicApp = PublicAppContext.useActorRef();
    const locationState = PublicAppContext.useSelector((state) => state.context.locationState);
    const productParam = PublicAppContext.useSelector((state) => state.context.productParam);
    const loginPath = PublicAppContext.useSelector((state) => selectPaths(state).login);
    const hasBackToSwitch = PublicAppContext.useSelector(selectHasBackToSwitch);
    const loader = <AccountLoaderPage />;

    const runLogin: OnLoginCallback = (session) => runMachineLogin(publicApp, session);
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);

    return (
        <UnauthenticatedApiProvider unauthenticatedApi={services.unauthenticatedApi}>
            <UnleashFlagProviderWithToolbar unleashClient={services.unleashClient}>
                <PublicAppSetup>
                    <ForceRefreshContext.Provider value={refresh}>
                        <AccountPublicApp
                            pathLocale={location.fullLocale}
                            location={location}
                            locales={locales}
                            onPreload={onPreload}
                            loader={loader}
                        >
                            <ProductAttribution productParam={productParam} />
                            <UnleashFlagStarter location={location} />
                            <Switch location={location}>
                                <Route path={VPN_TV_PATH_WITH_CODE}>
                                    <TvContainerNotSignedIn />
                                </Route>
                                <Route path={VPN_TV_SIGNUP_REDIRECT}>
                                    <TvContainerGetVpnPlus />
                                </Route>
                                <Route path={SSO_PATHS.JOIN_MAGIC_LINK}>
                                    <JoinMagicLinkContainer />
                                </Route>
                                <Route path={SSO_PATHS.SIGN_IN_WITH_ANOTHER_DEVICE}>
                                    <SignInWithAnotherDeviceContainer />
                                </Route>
                                <Route path={SSO_PATHS.SWITCH}>
                                    <SwitchAccountContainer />
                                </Route>
                                <Route path={SSO_PATHS.BORN_PRIVATE_ACTIVATE}>
                                    <Activation metaTags={bornPrivateActivatePage()} onLogin={runLogin} />
                                </Route>
                                <Route path={SSO_PATHS.JOIN_ORG}>
                                    <TokenRedemptionContainer />
                                </Route>
                                <Route path={SSO_PATHS.BORN_PRIVATE_RECOVERY}>
                                    <Recovery metaTags={bornPrivateRecoveryPage()} />
                                </Route>
                                <Route
                                    path={[
                                        SSO_PATHS.SIGNUP,
                                        SSO_PATHS.START,
                                        SSO_PATHS.REFERRAL_PLAN_SELECTION,
                                        SSO_PATHS.BUSINESS_SIGNUP,
                                        SSO_PATHS.BUSINESS_SIGNUP_GENERIC,
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
                                        SSO_PATHS.SPACES_SIGNUP,
                                        SSO_PATHS.PORKBUN_SIGNUP,
                                        SSO_PATHS.PORKBUN_SIGN_IN,
                                        SSO_PATHS.BORN_PRIVATE,
                                        // A sales-provisioned link (`provisioningToken`) keeps the /vpn path but
                                        // signs up here, since this signup resolves and redeems the deal. The VPN
                                        // signup ignores the token, so links without one still go to it.
                                        ...(getProvisioningToken(location.hash)
                                            ? [SSO_PATHS.VPN_SIGNUP, SSO_PATHS.VPN_PRICING]
                                            : []),
                                    ]}
                                >
                                    <SingleSignupSwitchContainer />
                                </Route>
                                <Route path={[SSO_PATHS.VPN_SIGNUP, SSO_PATHS.VPN_PRICING]}>
                                    <PublicAppVpnSignup />
                                </Route>
                                <Route path={`${SSO_PATHS.INVITE}/:selector/:token`}>
                                    <PublicAppSignupInvite />
                                </Route>
                                <Route path={SSO_PATHS.SIGNIN_HELP}>
                                    <SigninHelpContainer />
                                </Route>
                                <Route path={SSO_PATHS.RESET_PASSWORD}>
                                    <PublicAppResetPassword />
                                </Route>
                                <Route path={SSO_PATHS.FORGOT_USERNAME}>
                                    <PublicAppForgotUsername />
                                </Route>
                                <Route path={loginPaths} exact>
                                    <PublicAppSignIn />
                                </Route>
                                {locationState?.type === 'oauth-consent' && (
                                    <Route path={SSO_PATHS.OAUTH_AUTHORIZE_CONSENT}>
                                        <OAuthConfirmForkContainer consent={locationState} />
                                    </Route>
                                )}
                                {locationState?.type === 'fork-redirect-consent' && (
                                    <Route path={SSO_PATHS.AUTHORIZE_REDIRECT_CONSENT}>
                                        <ConfirmForkRedirectContainer consent={locationState} />
                                    </Route>
                                )}
                                {locationState?.type === 'desktop-fork-consent' && (
                                    <Route path="/auth-desktop/confirm">
                                        <ConfirmDesktopForkContainer consent={locationState} />
                                    </Route>
                                )}
                                {locationState?.type === 'reauth' && (
                                    <Route path={SSO_PATHS.REAUTH}>
                                        <ReAuthContainer state={locationState.payload} />
                                    </Route>
                                )}
                                {locationState?.type === 'app-switcher' && (
                                    <Route path={SSO_PATHS.APP_SWITCHER}>
                                        <AppSwitcherContainer state={locationState.payload} />
                                    </Route>
                                )}
                                <Redirect
                                    to={{
                                        pathname: hasBackToSwitch ? SSO_PATHS.SWITCH : loginPath,
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
            </UnleashFlagProviderWithToolbar>
        </UnauthenticatedApiProvider>
    );
};

export default PublicAppMainRoutes;
