import { useCallback, useState } from 'react';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';

import AccountForgotUsernameContainer from 'proton-account/src/app/public/ForgotUsernameContainer';
import AccountResetPasswordContainer from 'proton-account/src/app/reset/ResetPasswordContainer';
import AccountSignupContainer from 'proton-account/src/app/signup/SignupContainer';
import SignupInviteContainer from 'proton-account/src/app/signup/SignupInviteContainer';

import { ProtonLoginCallback, StandardPublicApp, Unauthenticated } from '@proton/components';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import { CLIENT_TYPES } from '@proton/shared/lib/constants';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { setLiteRedirect } from '@proton/shared/lib/subscription/redirect';

import LoginContainer from './containers/LoginContainer';

interface Props {
    onLogin: ProtonLoginCallback;
    locales: TtagLocaleMap;
}

const PublicApp = ({ onLogin, locales }: Props) => {
    const history = useHistory();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);
    return (
        <StandardPublicApp locales={locales}>
            <ForceRefreshContext.Provider value={refresh}>
                <Unauthenticated>
                    <Switch>
                        <Route path="/reset-password">
                            <AccountResetPasswordContainer
                                hasGenerateKeys={false}
                                onLogin={async (...args) => onLogin(...args)}
                            />
                        </Route>
                        <Route path="/forgot-username">
                            <AccountForgotUsernameContainer />
                        </Route>
                        <Route path="/pre-invite/:selector/:token">
                            <SignupInviteContainer
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
                        <Route path="/signup">
                            <AccountSignupContainer
                                clientType={CLIENT_TYPES.VPN}
                                onLogin={async (args) => onLogin({ ...args, path: '/downloads?prompt' })}
                            />
                        </Route>
                        <Route path="/login">
                            <LoginContainer onLogin={onLogin} />
                        </Route>
                        <Route
                            render={({ location }) => {
                                setLiteRedirect(new URLSearchParams(location.search));
                                return (
                                    <Redirect
                                        to={{
                                            pathname: '/login',
                                            state: { from: location },
                                        }}
                                    />
                                );
                            }}
                        />
                    </Switch>
                </Unauthenticated>
            </ForceRefreshContext.Provider>
        </StandardPublicApp>
    );
};

export default PublicApp;
