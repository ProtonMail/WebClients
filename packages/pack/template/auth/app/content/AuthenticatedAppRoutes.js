import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { hot } from 'react-hot-loader/root';

import Home from '../containers/Home';
import About from '../containers/About';
import AuthLayout from '../components/layout/AuthLayout';

const NotFoundContainer = () => <h1>Not found</h1>;

const Routes = () => {
    return (
        <Router>
            <AuthLayout>
                <Switch>
                    <Route path="/" exact component={Home} />
                    <Route path="/about" exact component={About} />
                    <Route component={NotFoundContainer} />
                </Switch>
            </AuthLayout>
        </Router>
    );
};

export default hot(Routes);
