import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { hot } from 'react-hot-loader/root';
import { ErrorBoundary } from 'react-components';

import AuthLayout from '../components/layout/AuthLayout.js';
import OverviewContainer from '../containers/OverviewContainer';

const Routes = () => {
    return (
        <Router>
            <AuthLayout>
                <ErrorBoundary>
                    <OverviewContainer />
                </ErrorBoundary>
            </AuthLayout>
        </Router>
    );
};

export default hot(Routes);
