import React from 'react';
import { Route, Switch } from 'react-router-dom';
import {
    StandardPublicApp,
    LoginContainer,
    SignupContainer,
    ModalsChildren,
    ResetPasswordContainer,
    ForgotUsernameContainer
} from 'react-components';
import locales from '../locales';

interface Props {
    onLogin: () => void;
}

const PublicApp = ({ onLogin }: Props) => {
    return (
        <StandardPublicApp locales={locales}>
            <ModalsChildren />
            <Switch>
                <Route
                    path="/signup"
                    render={({ history }) => <SignupContainer history={history} onLogin={onLogin} locales={locales} />}
                />
                <Route
                    path="/reset-password"
                    render={() => <ResetPasswordContainer onLogin={onLogin} locales={locales} />}
                />
                <Route
                    path="/forgot-username"
                    render={({ history }) => <ForgotUsernameContainer history={history} locales={locales} />}
                />
                <Route path="/login" render={() => <LoginContainer onLogin={onLogin} locales={locales} />} />
            </Switch>
        </StandardPublicApp>
    );
};

export default PublicApp;
