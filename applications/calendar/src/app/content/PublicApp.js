import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';
import { StandardPublicApp, LoginForm } from 'react-components';
import locales from '../locales';

const PublicApp = ({ onLogin }) => {
    return (
        <StandardPublicApp locales={locales}>
            <Switch>
                <Route render={() => <LoginForm onLogin={onLogin} />} />
            </Switch>
        </StandardPublicApp>
    );
};

PublicApp.propTypes = {
    onLogin: PropTypes.func.isRequired
};

export default PublicApp;
