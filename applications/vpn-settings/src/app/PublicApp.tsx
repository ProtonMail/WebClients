import { useCallback, useState } from 'react';
import { Redirect, Route, Switch, useHistory, useLocation } from 'react-router-dom';

import AccountForgotUsernameContainer from 'proton-account/src/app/public/ForgotUsernameContainer';
import AccountResetPasswordContainer from 'proton-account/src/app/reset/ResetPasswordContainer';
import AccountSignupInviteContainer from 'proton-account/src/app/signup/SignupInviteContainer';
import AccountSingleSignupContainer from 'proton-account/src/app/single-signup/SingleSignupContainer';

import {
    ExperimentsProvider,
    FeaturesProvider,
    ProtonLoginCallback,
    StandardPublicApp,
    UnAuthenticated,
    UnAuthenticatedApiProvider,
} from '@proton/components';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import { APPS, CLIENT_TYPES } from '@proton/shared/lib/constants';
import { setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

import AccountLoaderPage from './AccountLoaderPage';
import LoginContainer from './containers/LoginContainer';

setMetricsEnabled(true);

interface Props {
    onLogin: ProtonLoginCallback;
    locales: TtagLocaleMap;
}

const PublicApp = ({ onLogin, locales }: Props) => {
    const history = useHistory();
    const location = useLocation();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);

    const loader = <AccountLoaderPage />;

    return (
        <StandardPublicApp loader={loader} locales={locales}>
            <UnAuthenticatedApiProvider loader={loader}>
                <FeaturesProvider>
                    <ExperimentsProvider>
                        <ForceRefreshContext.Provider value={refresh}>
                            <UnAuthenticated>
                                <Switch>
                                    <Route path="/reset-password">
                                        <AccountResetPasswordContainer
                                            setupVPN={false}
                                            toApp={APPS.PROTONVPN_SETTINGS}
                                            onLogin={async (...args) => onLogin(...args)}
                                        />
                                    </Route>
                                    <Route path="/forgot-username">
                                        <AccountForgotUsernameContainer />
                                    </Route>
                                    <Route path="/pre-invite/:selector/:token">
                                        <AccountSignupInviteContainer
                                            loader={loader}
                                            clientType={CLIENT_TYPES.VPN}
                                            onValid={(inviteData) =>
                                                history.replace({
                                                    pathname: '/signup',
                                                    state: { invite: inviteData },
                                                })
                                            }
                                            onInvalid={() => history.push('/signup')}
                                        />
                                    </Route>
                                    <Route path={['/pricing', '/signup']}>
                                        <AccountSingleSignupContainer
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
                                        <LoginContainer onLogin={onLogin} />
                                    </Route>
                                    <Redirect
                                        to={{
                                            pathname: '/login',
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
        </StandardPublicApp>
    );
};

export default PublicApp;
