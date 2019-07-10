import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { hot } from 'react-hot-loader/root';
import { ErrorBoundary, useLocale } from 'react-components';

import Home from '../containers/Home';
import About from '../containers/About';
import AuthLayout from '../components/layout/AuthLayout';

const NotFoundContainer = () => <h1>Not found</h1>;

const Routes = () => {
    // Use locale inside the app
    useLocale();
    return (
        <Router>
            <AuthLayout>
                <Route
                    render={({ location }) => (
                        <ErrorBoundary key={location.key}>
                            <Switch>
                                <Route path="/" exact component={Home} />
                                <Route path="/about" exact component={About} />
                                <Route component={NotFoundContainer} />
                            </Switch>
                        </ErrorBoundary>
                    )}
                />
            </AuthLayout>
        </Router>
    );
};

export default hot(Routes);
