import { type ReactNode, useEffect } from 'react';
import { useCallback, useState } from 'react';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';

import type * as H from 'history';
import ExternalSSOConsumer from 'proton-account/src/app/content/ExternalSSOConsumer';
import type { Paths } from 'proton-account/src/app/content/helper';
import { getLocaleMapping } from 'proton-account/src/app/locales';
import AccountForgotUsernameContainer from 'proton-account/src/app/public/ForgotUsernameContainer';
import AccountResetPasswordContainer from 'proton-account/src/app/reset/ResetPasswordContainer';
import AccountSignupInviteContainer from 'proton-account/src/app/signup/SignupInviteContainer';
import AccountSingleSignupContainer from 'proton-account/src/app/single-signup/SingleSignupContainer';
import useLocationWithoutLocale, { getLocalePathPrefix } from 'proton-account/src/app/useLocationWithoutLocale';

import { createUnleash, loadCrypto } from '@proton/account/bootstrap';
import {
    ModalsChildren,
    NotificationsChildren,
    type OnLoginCallbackArguments,
    type OnLoginCallbackResult,
    type ProtonLoginCallback,
    UnAuthenticated,
    UnauthenticatedApiProvider,
} from '@proton/components';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import { AuthType } from '@proton/components/containers/login/interface';
import PaymentSwitcher from '@proton/components/containers/payments/PaymentSwitcher';
import PublicAppSetup from '@proton/components/containers/publicAppSetup/PublicAppSetup';
import useInstance from '@proton/hooks/useInstance';
import { getToAppName } from '@proton/shared/lib/authentication/apps';
import { APPS, CLIENT_TYPES, SSO_PATHS } from '@proton/shared/lib/constants';
import { localeCode } from '@proton/shared/lib/i18n';
import type { Api } from '@proton/shared/lib/interfaces';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { isMember } from '@proton/shared/lib/user/helpers';
import { FlagProvider } from '@proton/unleash';
import noop from '@proton/utils/noop';

import forgotUsernamePage from '../pages/forgot-username';
import loginPage from '../pages/login';
import resetPasswordPage from '../pages/reset-password';
import signupPage from '../pages/signup';
import AccountLoaderPage from './AccountLoaderPage';
import VPNPublicApp from './VPNPublicApp';
import LoginContainer, { type LoginContainerState } from './containers/LoginContainer';

export const publicRoutes = {
    reset: '/reset-password',
    forgotUsername: '/forgot-username',
    signup: '/signup',
    pricing: '/pricing',
    login: SSO_PATHS.LOGIN,
    sso: SSO_PATHS.EXTERNAL_SSO_LOGIN,
    ssoReauth: SSO_PATHS.EXTERNAL_SSO_REAUTH,
};

const getPaths = (maybeLocalePrefix: string): Paths => {
    const localePrefix = maybeLocalePrefix || getLocaleMapping(localeCode);
    const prefix = getLocalePathPrefix(localePrefix);
    return {
        login: `${prefix}${publicRoutes.login}`,
        signup: `${prefix}${publicRoutes.signup}`,
        reset: `${prefix}${publicRoutes.reset}`,
        forgotUsername: `${prefix}${publicRoutes.forgotUsername}`,
        reauth: '',
        appSwitcher: '',
    };
};

const Effect = ({ onEffect, children }: { onEffect: () => void; children: ReactNode }) => {
    useEffect(() => {
        onEffect();
    }, []);
    return children;
};

const completeResult: OnLoginCallbackResult = { state: 'complete' };

interface InnerPublicAppProps {
    api: Api;
    onLogin: ProtonLoginCallback;
    loader: ReactNode;
    location: ReturnType<typeof useLocationWithoutLocale>;
}

let cryptoWorkerPromise: Promise<void> | undefined;

const handlePreload = () => {
    if (!cryptoWorkerPromise) {
        cryptoWorkerPromise = loadCrypto({
            appName: APPS.PROTONACCOUNT,
        });
    }
};

const handlePreSubmit = async () => {
    handlePreload();
    // The crypto worked must be loaded when signup/login/reset are performed
    await cryptoWorkerPromise;
};

const InnerPublicApp = ({ api, onLogin, loader, location }: InnerPublicAppProps) => {
    const { unauthenticatedApi, unleashClient } = useInstance(() => {
        const unauthenticatedApi = createUnauthenticatedApi(api);
        const unleashClient = createUnleash({ api: unauthenticatedApi.apiCallback });
        unleashClient.start().catch(noop);
        return {
            unauthenticatedApi,
            unleashClient,
        };
    });
    const history = useHistory();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);
    const [initialLocation, setInitialLocation] = useState<H.Location | undefined>();

    const paths = getPaths(location.localePrefix);

    const handleStartAuth = () => {
        return unauthenticatedApi.startUnAuthFlow();
    };

    const handleLoginWithDefaultPath = (session: OnLoginCallbackArguments) => {
        const { User } = session.data;
        const previousHash = initialLocation?.hash || '';
        const previousSearch = initialLocation?.search || '';
        const path = initialLocation?.pathname || (User && isMember(User) ? '/account-password' : '/dashboard');
        const pathWithSearch = `${path}${previousSearch}${previousHash}`;
        return onLogin({ ...session, path: pathWithSearch });
    };

    return (
        <>
            <NotificationsChildren />
            <ModalsChildren />
            <UnauthenticatedApiProvider unauthenticatedApi={unauthenticatedApi}>
                <FlagProvider unleashClient={unleashClient} startClient={false}>
                    <PublicAppSetup>
                        <ForceRefreshContext.Provider value={refresh}>
                            <UnAuthenticated>
                                <PaymentSwitcher>
                                    <Switch location={location}>
                                        <Route path={publicRoutes.reset}>
                                            <AccountResetPasswordContainer
                                                metaTags={resetPasswordPage()}
                                                loginUrl={paths.login}
                                                setupVPN={false}
                                                toApp={APPS.PROTONVPN_SETTINGS}
                                                productParam={APPS.PROTONVPN_SETTINGS}
                                                onPreSubmit={handlePreSubmit}
                                                onStartAuth={handleStartAuth}
                                                onLogin={async (data) => {
                                                    handleLoginWithDefaultPath(data);
                                                    return completeResult;
                                                }}
                                            />
                                        </Route>
                                        <Route path={publicRoutes.forgotUsername}>
                                            <AccountForgotUsernameContainer
                                                toApp={APPS.PROTONVPN_SETTINGS}
                                                metaTags={forgotUsernamePage()}
                                                loginUrl={paths.login}
                                                onStartAuth={handleStartAuth}
                                            />
                                        </Route>
                                        <Route path="/pre-invite/:selector/:token">
                                            <AccountSignupInviteContainer
                                                loader={loader}
                                                clientType={CLIENT_TYPES.VPN}
                                                onValid={(inviteData) =>
                                                    history.replace({
                                                        pathname: paths.signup,
                                                        state: { invite: inviteData },
                                                    })
                                                }
                                                onInvalid={() => history.push(paths.signup)}
                                            />
                                        </Route>
                                        <Route path={[publicRoutes.pricing, publicRoutes.signup]}>
                                            <AccountSingleSignupContainer
                                                metaTags={signupPage()}
                                                toApp={APPS.PROTONVPN_SETTINGS}
                                                toAppName={getToAppName(APPS.PROTONVPN_SETTINGS)}
                                                loader={loader}
                                                productParam={APPS.PROTONVPN_SETTINGS}
                                                clientType={CLIENT_TYPES.VPN}
                                                onPreSubmit={handlePreSubmit}
                                                onLogin={async (args) => {
                                                    onLogin({
                                                        ...args,
                                                        path: '/downloads?prompt',
                                                    });
                                                    return completeResult;
                                                }}
                                                onStartAuth={handleStartAuth}
                                            />
                                        </Route>
                                        <Route path={[publicRoutes.sso, publicRoutes.ssoReauth]}>
                                            <UnAuthenticated>
                                                <ExternalSSOConsumer
                                                    onOAuthLogin={noop}
                                                    onLogin={({ username, token, flow }) => {
                                                        const state: LoginContainerState = {
                                                            authTypeData: { type: AuthType.ExternalSSO },
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
                                        <Route path={publicRoutes.login}>
                                            <LoginContainer
                                                initialLocation={initialLocation}
                                                metaTags={loginPage()}
                                                onLogin={async (args) => {
                                                    handleLoginWithDefaultPath(args);
                                                    return completeResult;
                                                }}
                                                onPreSubmit={handlePreSubmit}
                                                paths={paths}
                                                onStartAuth={handleStartAuth}
                                            />
                                        </Route>
                                        <Route path="*">
                                            <Effect
                                                onEffect={() => {
                                                    setInitialLocation(location);
                                                }}
                                            >
                                                <Redirect to={paths.login} />
                                            </Effect>
                                        </Route>
                                    </Switch>
                                </PaymentSwitcher>
                            </UnAuthenticated>
                        </ForceRefreshContext.Provider>
                    </PublicAppSetup>
                </FlagProvider>
            </UnauthenticatedApiProvider>
        </>
    );
};

interface PublicAppProps {
    onLogin: ProtonLoginCallback;
    locales: TtagLocaleMap;
    api: Api;
}

// Wrap public app in VPN public app to ensure that translations are loaded before the inner child is loaded (meta tags)
const PublicApp = ({ api, onLogin, locales }: PublicAppProps) => {
    const location = useLocationWithoutLocale<{ from?: H.Location }>();
    const loader = <AccountLoaderPage />;

    return (
        <VPNPublicApp
            location={location}
            pathLocale={location.fullLocale}
            loader={loader}
            locales={locales}
            onPreload={handlePreload}
        >
            <InnerPublicApp api={api} onLogin={onLogin} loader={loader} location={location} />
        </VPNPublicApp>
    );
};

export default PublicApp;
