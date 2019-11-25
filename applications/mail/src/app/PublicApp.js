import React, { useState, useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';
import { Loader, ModalsChildren, ResetPasswordContainer, ForgotUsernameContainer } from 'react-components';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';

import PublicLayout from './components/layout/PublicLayout';
import LoginContainer from './containers/LoginContainer';
import SignupContainer from './containers/SignupContainer';
import { Redirect } from 'react-router';

const PublicApp = ({ onLogin }) => {
    const hasStopRedirect = useRef(false);
    const stopRedirect = () => (hasStopRedirect.current = true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useLayoutEffect(() => {
        (async () => {
            await Promise.all([loadOpenPGP()]);
        })()
            .then(() => setLoading(false))
            .catch(() => setError(true));
    }, []);

    if (error) {
        return 'OpenPGP failed to load. Handle better.';
    }

    if (loading) {
        return <Loader />;
    }

    return (
        <>
            <ModalsChildren />
            <PublicLayout>
                <Switch>
                    <Route path="/reset-password" render={() => <ResetPasswordContainer onLogin={onLogin} />} />
                    <Route path="/forgot-username" component={ForgotUsernameContainer} />
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
                        path="/signup/:step?"
                        render={({ history, match }) => (
                            <SignupContainer
                                stopRedirect={stopRedirect}
                                history={history}
                                match={match}
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
        </>
    );
};

PublicApp.propTypes = {
    onLogin: PropTypes.func.isRequired
};

export default PublicApp;
