import { ReactNode, useCallback, useState } from 'react';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';

import * as H from 'history';
import { Paths } from 'proton-account/src/app/content/helper';
import { getLocaleMapping } from 'proton-account/src/app/locales';
import AccountForgotUsernameContainer from 'proton-account/src/app/public/ForgotUsernameContainer';
import AccountResetPasswordContainer from 'proton-account/src/app/reset/ResetPasswordContainer';
import AccountSignupInviteContainer from 'proton-account/src/app/signup/SignupInviteContainer';
import AccountSingleSignupContainer from 'proton-account/src/app/single-signup/SingleSignupContainer';
import useLocationWithoutLocale, { getLocalePathPrefix } from 'proton-account/src/app/useLocationWithoutLocale';

import {
    NotificationsChildren,
    OnLoginCallbackResult,
    ProtonLoginCallback,
    UnAuthenticated,
    UnAuthenticatedApiProvider,
    UnleashFlagProvider,
} from '@proton/components';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import ModalsChildren from '@proton/components/containers/modals/Children';
import PaymentSwitcher from '@proton/components/containers/payments/PaymentSwitcher';
import PublicAppSetup from '@proton/components/containers/publicAppSetup/PublicAppSetup';
import { APPS, CLIENT_TYPES } from '@proton/shared/lib/constants';
import { localeCode } from '@proton/shared/lib/i18n';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

import forgotUsernamePage from '../pages/forgot-username';
import loginPage from '../pages/login';
import resetPasswordPage from '../pages/reset-password';
import signupPage from '../pages/signup';
import AccountLoaderPage from './AccountLoaderPage';
import VPNPublicApp from './VPNPublicApp';
import LoginContainer from './containers/LoginContainer';

const getPaths = (maybeLocalePrefix: string): Paths => {
    const localePrefix = maybeLocalePrefix || getLocaleMapping(localeCode);
    const prefix = getLocalePathPrefix(localePrefix);
    return {
        login: `${prefix}/login`,
        signup: `${prefix}/signup`,
        reset: `${prefix}/reset-password`,
        forgotUsername: `${prefix}/forgot-username`,
        reauth: '',
        appSwitcher: '',
    };
};

const completeResult: OnLoginCallbackResult = { state: 'complete' };

interface InnerPublicAppProps {
    onLogin: ProtonLoginCallback;
    loader: ReactNode;
    location: ReturnType<typeof useLocationWithoutLocale>;
}

const InnerPublicApp = ({ onLogin, loader, location }: InnerPublicAppProps) => {
    const history = useHistory();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);

    const paths = getPaths(location.localePrefix);

    return (
        <>
            <NotificationsChildren />
            <ModalsChildren />
            <UnAuthenticatedApiProvider loader={loader}>
                <UnleashFlagProvider>
                    <PublicAppSetup loader={loader}>
                        <ForceRefreshContext.Provider value={refresh}>
                            <UnAuthenticated>
                                <PaymentSwitcher loader={loader}>
                                    <Switch location={location}>
                                        <Route path="/reset-password">
                                            <AccountResetPasswordContainer
                                                metaTags={resetPasswordPage()}
                                                loginUrl={paths.login}
                                                setupVPN={false}
                                                toApp={APPS.PROTONVPN_SETTINGS}
                                                onLogin={async (...args) => {
                                                    onLogin(...args);
                                                    return completeResult;
                                                }}
                                            />
                                        </Route>
                                        <Route path="/forgot-username">
                                            <AccountForgotUsernameContainer
                                                metaTags={forgotUsernamePage()}
                                                loginUrl={paths.login}
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
                                        <Route path={['/pricing', '/signup']}>
                                            <AccountSingleSignupContainer
                                                metaTags={signupPage()}
                                                toApp={APPS.PROTONVPN_SETTINGS}
                                                loader={loader}
                                                productParam={APPS.PROTONVPN_SETTINGS}
                                                clientType={CLIENT_TYPES.VPN}
                                                onLogin={async (args) => {
                                                    onLogin({
                                                        ...args,
                                                        path: '/downloads?prompt',
                                                    });
                                                    return completeResult;
                                                }}
                                            />
                                        </Route>
                                        <Route path="/login">
                                            <LoginContainer
                                                metaTags={loginPage()}
                                                onLogin={async (args) => {
                                                    onLogin(args);
                                                    return completeResult;
                                                }}
                                                paths={paths}
                                            />
                                        </Route>
                                        <Redirect
                                            to={{
                                                pathname: paths.login,
                                                state: {
                                                    ...(typeof location.state === 'object' ? location.state : {}),
                                                    from: location,
                                                },
                                            }}
                                        />
                                    </Switch>
                                </PaymentSwitcher>
                            </UnAuthenticated>
                        </ForceRefreshContext.Provider>
                    </PublicAppSetup>
                </UnleashFlagProvider>
            </UnAuthenticatedApiProvider>
        </>
    );
};

interface PublicAppProps {
    onLogin: ProtonLoginCallback;
    locales: TtagLocaleMap;
}

// Wrap public app in VPN public app to ensure that translations are loaded before the inner child is loaded (meta tags)
const PublicApp = ({ onLogin, locales }: PublicAppProps) => {
    const location = useLocationWithoutLocale<{ from?: H.Location }>();
    const loader = <AccountLoaderPage />;

    return (
        <VPNPublicApp location={location} pathLocale={location.fullLocale} loader={loader} locales={locales}>
            <InnerPublicApp onLogin={onLogin} loader={loader} location={location} />
        </VPNPublicApp>
    );
};

export default PublicApp;
