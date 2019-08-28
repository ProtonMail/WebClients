import React, { useState, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Loader, ModalsChildren, GenericError } from 'react-components';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';

import PublicLayout from './components/layout/PublicLayout';
import LoginContainer from './containers/LoginContainer';
import ResetPasswordContainer from './containers/ResetPasswordContainer';
import ForgotUsernameContainer from './containers/ForgotUsernameContainer';
import RedeemContainer from './containers/RedeemContainer';

const PublicApp = ({ onLogin }) => {
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
        return <GenericError />;
    }

    if (loading) {
        return <Loader />;
    }

    return (
        <>
            <ModalsChildren />
            <PublicLayout>
                <Router>
                    <Switch>
                        <Route path="/redeem" component={RedeemContainer} />
                        <Route
                            path="/reset-password"
                            render={({ history }) => <ResetPasswordContainer history={history} onLogin={onLogin} />}
                        />
                        <Route path="/forgot-username" component={ForgotUsernameContainer} />
                        <Route render={({ history }) => <LoginContainer history={history} onLogin={onLogin} />} />
                    </Switch>
                </Router>
            </PublicLayout>
        </>
    );
};

PublicApp.propTypes = {
    onLogin: PropTypes.func.isRequired
};

export default PublicApp;
