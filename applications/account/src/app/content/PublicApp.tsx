import React, { useState, useCallback } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import {
    StandardPublicApp,
    AccountLoginContainer,
    AccountSignupContainer,
    AccountForgotUsernameContainer,
    AccountResetPasswordContainer,
} from 'react-components';
import ForceRefreshContext from 'react-components/containers/forceRefresh/context';
import locales from '../locales';
import AccountPublicLayoutWrapper from './AccountPublicLayoutWrapper';

interface Props {
    onLogin: () => void;
}

const PublicApp = ({ onLogin }: Props) => {
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);

    return (
        <StandardPublicApp locales={locales}>
            <ForceRefreshContext.Provider value={refresh}>
                <Switch>
                    <Route
                        path="/signup"
                        render={({ history }) => (
                            <AccountSignupContainer
                                history={history}
                                onLogin={onLogin}
                                Layout={AccountPublicLayoutWrapper}
                            />
                        )}
                    />
                    <Route
                        path="/reset-password"
                        render={({ history }) => (
                            <AccountResetPasswordContainer
                                history={history}
                                onLogin={onLogin}
                                Layout={AccountPublicLayoutWrapper}
                            />
                        )}
                    />
                    <Route
                        path="/forgot-username"
                        render={({ history }) => (
                            <AccountForgotUsernameContainer history={history} Layout={AccountPublicLayoutWrapper} />
                        )}
                    />
                    <Route
                        path="/login"
                        render={() => <AccountLoginContainer onLogin={onLogin} Layout={AccountPublicLayoutWrapper} />}
                    />
                    <Redirect to="/login" />
                </Switch>
            </ForceRefreshContext.Provider>
        </StandardPublicApp>
    );
};

export default PublicApp;
