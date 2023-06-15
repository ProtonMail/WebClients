import { ReactNode, useRef } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
    CatchAllSection,
    DomainsSection,
    MultiUserCreationSection,
    OrganizationPasswordSection,
    OrganizationSection,
    OrganizationSpamFiltersSection,
    OrganizationTwoFAEnforcementSection,
    OrganizationTwoFAHeader,
    OrganizationTwoFARemindersSection,
    PrivateMainSettingsArea,
    UsersAndAddressesSection,
    useOrganization,
} from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import { APP_NAMES } from '@proton/shared/lib/constants';

import type { getOrganizationAppRoutes } from './routes';

const OrganizationSettingsRouter = ({
    app,
    redirect,
    path,
    organizationAppRoutes,
    isOrgSpamBlockListEnabled,
    isOrgTwoFactorEnabled,
}: {
    app: APP_NAMES;
    redirect: ReactNode;
    path: string;
    organizationAppRoutes: ReturnType<typeof getOrganizationAppRoutes>;
    isOrgSpamBlockListEnabled: boolean;
    isOrgTwoFactorEnabled: boolean;
}) => {
    const onceRef = useRef(false);
    const [organization] = useOrganization();

    const {
        routes: { setup, domains, orgKeys, users, filter, security },
    } = organizationAppRoutes;

    return (
        <Switch>
            {getIsSectionAvailable(setup) && (
                <Route path={getSectionPath(path, setup)}>
                    <PrivateMainSettingsArea config={setup}>
                        <OrganizationSection organization={organization} app={app} />
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
                            app={app}
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
                        <UsersAndAddressesSection app={app} />
                        <MultiUserCreationSection app={app} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(filter) && isOrgSpamBlockListEnabled && (
                <Route path={getSectionPath(path, filter)}>
                    <PrivateMainSettingsArea config={filter}>
                        <OrganizationSpamFiltersSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(security) && isOrgTwoFactorEnabled && (
                <Route path={getSectionPath(path, security)}>
                    <PrivateMainSettingsArea config={security}>
                        <OrganizationTwoFAHeader organization={organization} />
                        <OrganizationTwoFARemindersSection organization={organization} />
                        <OrganizationTwoFAEnforcementSection organization={organization} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {redirect}
        </Switch>
    );
};

export default OrganizationSettingsRouter;
