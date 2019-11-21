import React from 'react';
import { Route, Switch } from 'react-router-dom';
import PageContainer from './containers/PageContainer';

const PrivateAppRoutes = () => {
    return (
        <Switch>
            <Route path="/:labelID/:elementID?" component={PageContainer} />
        </Switch>
    );
};

export default PrivateAppRoutes;
