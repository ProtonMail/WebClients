import React, { useState, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Loader, LoginContainer, ModalsChildren } from 'react-components';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';

import PublicLayout from './components/layout/PublicLayout';

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
        return <Loader />;
    }

    return (
        <>
            <ModalsChildren />
            <PublicLayout>
                <Router>
                    <Switch>
                        <Route render={() => <LoginContainer onLogin={onLogin} />} />
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
