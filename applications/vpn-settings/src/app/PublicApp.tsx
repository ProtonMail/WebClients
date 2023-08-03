import { useCallback, useState } from 'react';
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
    ExperimentsProvider,
    FeaturesProvider,
    ProtonLoginCallback,
    UnAuthenticated,
    UnAuthenticatedApiProvider,
} from '@proton/components';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import ModalsChildren from '@proton/components/containers/modals/Children';
import { APPS, CLIENT_TYPES } from '@proton/shared/lib/constants';
import { setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';
import { localeCode } from '@proton/shared/lib/i18n';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

import forgotUsernamePage from '../pages/forgot-username';
import loginPage from '../pages/login';
import resetPasswordPage from '../pages/reset-password';
import signupPage from '../pages/signup';
import AccountLoaderPage from './AccountLoaderPage';
import VPNPublicApp from './VPNPublicApp';
import LoginContainer from './containers/LoginContainer';

setMetricsEnabled(true);

const getPaths = (maybeLocalePrefix: string): Paths => {
    const localePrefix = maybeLocalePrefix || getLocaleMapping(localeCode);
    const prefix = getLocalePathPrefix(localePrefix);
    return {
        login: `${prefix}/login`,
        signup: `${prefix}/signup`,
        reset: `${prefix}/reset-password`,
        forgotUsername: `${prefix}/forgot-username`,
    };
};

interface Props {
    onLogin: ProtonLoginCallback;
    locales: TtagLocaleMap;
}

const PublicApp = ({ onLogin, locales }: Props) => {
    const history = useHistory();
    const location = useLocationWithoutLocale<{ from?: H.Location }>();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);

    const loader = <AccountLoaderPage />;
    const paths = getPaths(location.localePrefix);

    return (
        <VPNPublicApp location={location} pathLocale={location.fullLocale} loader={loader} locales={locales}>
            <ModalsChildren />
            <UnAuthenticatedApiProvider loader={loader}>
                <FeaturesProvider>
                    <ExperimentsProvider>
                        <ForceRefreshContext.Provider value={refresh}>
                            <UnAuthenticated>
                                <Switch location={location}>
                                    <Route path="/reset-password">
                                        <AccountResetPasswordContainer
                                            metaTags={resetPasswordPage()}
                                            loginUrl={paths.login}
                                            setupVPN={false}
                                            toApp={APPS.PROTONVPN_SETTINGS}
                                            onLogin={async (...args) => onLogin(...args)}
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
                                            onLogin={async (args) =>
                                                onLogin({
                                                    ...args,
                                                    path: '/downloads?prompt',
                                                })
                                            }
                                        />
                                    </Route>
                                    <Route path="/login">
                                        <LoginContainer metaTags={loginPage()} onLogin={onLogin} paths={paths} />
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
                            </UnAuthenticated>
                        </ForceRefreshContext.Provider>
                    </ExperimentsProvider>
                </FeaturesProvider>
            </UnAuthenticatedApiProvider>
        </VPNPublicApp>
    );
};

export default PublicApp;
