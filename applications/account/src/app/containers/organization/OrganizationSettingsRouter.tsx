import { ReactNode, useRef } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
    CatchAllSection,
    DomainsSection,
    OrganizationPasswordSection,
    OrganizationSection,
    PrivateMainSettingsArea,
    useOrganization,
    UsersAndAddressesSection,
} from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';

import { getOrganizationAppRoutes } from './routes';

const OrganizationSettingsRouter = ({
    redirect,
    path,
    organizationAppRoutes,
}: {
    redirect: ReactNode;
    path: string;
    organizationAppRoutes: ReturnType<typeof getOrganizationAppRoutes>;
}) => {
    const onceRef = useRef(false);
    const [organization] = useOrganization();

    const {
        routes: { setup, domains, orgKeys, users },
    } = organizationAppRoutes;

    return (
        <Switch>
            {getIsSectionAvailable(setup) && (
                <Route path={getSectionPath(path, setup)}>
                    <PrivateMainSettingsArea config={setup}>
                        <OrganizationSection organization={organization} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {/* After the org is setup, and the setup route becomes unavailable, we redirect to the users route */}
            {!getIsSectionAvailable(setup) && getIsSectionAvailable(users) && (
                <Route path={getSectionPath(path, setup)}>
                    <Redirect to={getSectionPath(path, users)} />
                </Route>
            )}
            {getIsSectionAvailable(domains) && (
                <Route path={getSectionPath(path, domains)}>
                    <PrivateMainSettingsArea config={domains}>
                        <DomainsSection />
                        <CatchAllSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(orgKeys) && (
                <Route path={getSectionPath(path, orgKeys)}>
                    <PrivateMainSettingsArea config={orgKeys}>
                        <OrganizationSection
                            organization={organization}
                            onSetupOrganization={() => {
                                // Disable automatic activation modal when setting up an organization
                                onceRef.current = true;
                            }}
                        />
                        <OrganizationPasswordSection organization={organization} onceRef={onceRef} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(users) && (
                <Route path={getSectionPath(path, users)}>
                    <PrivateMainSettingsArea config={users}>
                        <UsersAndAddressesSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {redirect}
        </Switch>
    );
};

export default OrganizationSettingsRouter;
