import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route, Switch } from 'react-router-dom';
import { StandardPublicApp } from 'react-components';

import ForgotUsernameContainer from './containers/ForgotUsernameContainer';
import ResetPasswordContainer from './containers/ResetPasswordContainer';
import PublicLayout from './components/layout/PublicLayout';
import LoginContainer from './containers/LoginContainer';
import RedeemContainer from './containers/RedeemContainer';
import PreInviteContainer from './containers/PreInviteContainer';
import SignupContainer from './containers/SignupContainer/SignupContainer';

const PublicApp = ({ onLogin, locales }) => {
    return (
        <StandardPublicApp locales={locales}>
            <PublicLayout>
                <Switch>
                    <Route path="/redeem" render={({ history }) => <RedeemContainer history={history} />} />
                    <Route path="/reset-password" render={() => <ResetPasswordContainer onLogin={onLogin} />} />
                    <Route path="/forgot-username" component={ForgotUsernameContainer} />
                    <Route
                        path="/pre-invite/:selector/:token"
                        render={({ history, match }) => <PreInviteContainer history={history} match={match} />}
                    />
                    <Route
                        path="/signup/:step?"
                        render={({ history, match }) => (
                            <SignupContainer history={history} match={match} onLogin={onLogin} />
                        )}
                    />
                    <Route path="/login" render={() => <LoginContainer onLogin={onLogin} />} />
                    <Route
                        render={({ location }) => {
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
            </PublicLayout>
        </StandardPublicApp>
    );
};

PublicApp.propTypes = {
    onLogin: PropTypes.func.isRequired,
};

export default PublicApp;
