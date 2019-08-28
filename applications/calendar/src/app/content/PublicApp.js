import React, { useState, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Loader, LoginForm, ModalsChildren } from 'react-components';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';

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
        return 'OpenPGP failed to load. Handle better.';
    }

    if (loading) {
        return (
            <>
                <Loader />
            </>
        );
    }

    return (
        <>
            <ModalsChildren />
            <Router>
                <Switch>
                    <Route render={() => <LoginForm onLogin={onLogin} />} />
                </Switch>
            </Router>
        </>
    );
};

PublicApp.propTypes = {
    onLogin: PropTypes.func.isRequired
};

export default PublicApp;
