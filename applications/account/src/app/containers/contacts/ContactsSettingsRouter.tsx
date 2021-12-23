import { Route, Redirect, Switch, useRouteMatch, useLocation } from 'react-router-dom';

import ContactsGeneralSettings from './ContactsGeneralSettings';
import ContactsImportSettings from './ContactsImportSettings';

const ContactsSettingsRouter = ({ redirect }: { redirect: string }) => {
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
            <Redirect to={redirect} />
        </Switch>
    );
};

export default ContactsSettingsRouter;
