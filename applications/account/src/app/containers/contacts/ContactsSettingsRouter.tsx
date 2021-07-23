import React from 'react';
import { Route, Redirect, Switch, useRouteMatch, useLocation } from 'react-router-dom';

import ContactsGeneralSettings from './ContactsGeneralSettings';
import ContactsImportSettings from './ContactsImportSettings';

const ContactSettingsRouter = () => {
    const { path } = useRouteMatch();
    const location = useLocation();

    return (
        <Switch>
            <Route path={`${path}/general`}>
                <ContactsGeneralSettings location={location} />
            </Route>
            <Route path={`${path}/import-export`}>
                <ContactsImportSettings location={location} />
            </Route>
            <Redirect to={`${path}/dashboard`} />
        </Switch>
    );
};

export default ContactSettingsRouter;
