import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { LoginContainer } from 'react-components';

import UnAuthLayout from '../components/layout/UnAuthLayout';

const UnAuthenticatedAppRoutes = ({ onLogin }) => {
    return (
        <Router>
            <UnAuthLayout>
                <Switch>
                    <Route render={() => <LoginContainer onLogin={onLogin} />} />
                </Switch>
            </UnAuthLayout>
        </Router>
    );
};

UnAuthenticatedAppRoutes.propTypes = {
    onLogin: PropTypes.func.isRequired
};

export default UnAuthenticatedAppRoutes;
