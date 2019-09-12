import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';
import { StandardPublicApp, LoginForm, ModalsChildren } from 'react-components';

const PublicApp = ({ onLogin }) => {
    return (
        <StandardPublicApp>
            <ModalsChildren />
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
