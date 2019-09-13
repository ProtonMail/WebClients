import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route, Switch } from 'react-router-dom';
import { StandardPublicApp } from 'react-components';

import PublicLayout from './components/layout/PublicLayout';
import LoginContainer from './containers/LoginContainer';
import ResetPasswordContainer from './containers/ResetPasswordContainer';
import ForgotUsernameContainer from './containers/ForgotUsernameContainer';
import RedeemContainer from './containers/RedeemContainer';
import PreInviteContainer from './containers/PreInviteContainer';
import SignupContainer from './containers/SignupContainer/SignupContainer';

import locales from './locales';

const PublicApp = ({ onLogin }) => {
    const hasStopRedirect = useRef(false);
    const stopRedirect = () => (hasStopRedirect.current = true);

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
                        exact
                        path="/signup"
                        render={({ history }) => (
                            <SignupContainer stopRedirect={stopRedirect} history={history} onLogin={onLogin} />
                        )}
                    />
                    <Route
                        path="/login"
                        render={({ history, location }) => (
                            <LoginContainer
                                stopRedirect={stopRedirect}
                                history={history}
                                location={location}
                                onLogin={onLogin}
                            />
                        )}
                    />
                    <Route
                        render={({ location }) => {
                            /**
                             * Needed due to the race condition between onLogin and history.push
                             * A state on the location is not possible because the location is not changed when logging out.
                             */
                            if (hasStopRedirect.current) {
                                return null;
                            }
                            return (
                                <Redirect
                                    to={{
                                        pathname: '/login',
                                        state: { from: location }
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
    onLogin: PropTypes.func.isRequired
};

export default PublicApp;
