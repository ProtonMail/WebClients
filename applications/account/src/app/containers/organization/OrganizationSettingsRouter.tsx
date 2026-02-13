import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import OLESSettingsArea from '@proton/activation/src/oles/components/SettingsArea';
import {
    ActivityMonitorDashboard,
    CatchAllSection,
    DomainsSection,
    GatewaysSection,
    MultiUserCreationSection,
    OrganizationGroupsManagementSection,
    OrganizationPasswordPoliciesSection,
    OrganizationPasswordSection,
    OrganizationRetentionPoliciesSection,
    OrganizationScheduleCallSection,
    OrganizationSection,
    OrganizationSpamFiltersSection,
    OrganizationTwoFAEnforcementSection,
    OrganizationTwoFARemindersSection,
    PrivateMainSettingsArea,
    PrivateMainSettingsAreaBase,
    SentinelSection,
    SharedServersSection,
    SsoPage,
    UsersAndAddressesSection,
    VPNEvents,
} from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import AccessControlSettingsSection from '@proton/components/containers/organization/accessControl/AccessControlSettingsSection';
import type { Subscription } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';

import { FeatureAccessSection } from './components/FeatureAccessSection';
import { RolesAndPermissionsSection } from './components/RolesAndPermissionsSection';
import type { getOrganizationAppRoutes } from './routes';

const OrganizationSettingsRouter = ({
    app,
    redirect,
    path,
    organizationAppRoutes,
    user,
    organization,
    subscription,
    onOpenChat,
}: {
    app: APP_NAMES;
    redirect: ReactNode;
    path: string;
    organizationAppRoutes: ReturnType<typeof getOrganizationAppRoutes>;
    user: UserModel;
    organization?: OrganizationExtended;
    subscription?: Subscription;
    onOpenChat?: () => void;
}) => {
    const onceRef = useRef(false);

    const {
        routes: {
            gateways,
            setup,
            domains,
            orgKeys,
            users,
            filter,
            retentionPolicies,
            security,
            sso,
            connectionEvents,
            activityMonitor,
            groups,
            accessControl,
            rolesAndPermissions,
            sharedServers,
            migrationAssistant,
        },
    } = organizationAppRoutes;

    if (!organizationAppRoutes.available) {
        return <>{redirect}</>;
    }

    return (
        <Switch>
            {getIsSectionAvailable(migrationAssistant) && (
                <Route path={getSectionPath(path, migrationAssistant)}>
                    <OLESSettingsArea />
                </Route>
            )}
            {getIsSectionAvailable(gateways) && (
                <Route path={getSectionPath(path, gateways)}>
                    <PrivateMainSettingsArea config={gateways}>
                        <GatewaysSection organization={organization} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(sharedServers) && (
                <Route path={getSectionPath(path, sharedServers)}>
                    <PrivateMainSettingsArea config={sharedServers}>
                        <SharedServersSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(setup) && (
                <Route path={getSectionPath(path, setup)}>
                    <PrivateMainSettingsArea config={setup}>
                        <OrganizationScheduleCallSection onOpenChat={onOpenChat} />
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
                        <DomainsSection onceRef={onceRef} />
                        <CatchAllSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(orgKeys) && (
                <Route path={getSectionPath(path, orgKeys)}>
                    <PrivateMainSettingsArea config={orgKeys}>
                        <OrganizationScheduleCallSection onOpenChat={onOpenChat} />
                        <OrganizationSection app={app} organization={organization} />
                        <OrganizationPasswordSection organization={organization} onceRef={onceRef} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(users) && (
                <Route path={getSectionPath(path, users)}>
                    <PrivateMainSettingsArea config={users}>
                        <OrganizationScheduleCallSection onOpenChat={onOpenChat} />
                        <UsersAndAddressesSection app={app} onceRef={onceRef} />
                        <MultiUserCreationSection app={app} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(filter) && (
                <Route path={getSectionPath(path, filter)}>
                    <PrivateMainSettingsArea config={filter}>
                        <OrganizationSpamFiltersSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(retentionPolicies) && (
                <Route path={getSectionPath(path, retentionPolicies)}>
                    <PrivateMainSettingsArea config={retentionPolicies}>
                        <OrganizationRetentionPoliciesSection organization={organization} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(security) && (
                <Route path={getSectionPath(path, security)}>
                    <PrivateMainSettingsArea config={security}>
                        <SentinelSection app={app} variant="organization" />
                        <OrganizationPasswordPoliciesSection organization={organization} />
                        <OrganizationTwoFARemindersSection organization={organization} />
                        <OrganizationTwoFAEnforcementSection organization={organization} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(sso) && (
                <Route path={getSectionPath(path, sso)}>
                    <PrivateMainSettingsAreaBase title={sso.title || sso.text} description={sso.description}>
                        <SsoPage app={app} />
                    </PrivateMainSettingsAreaBase>
                </Route>
            )}
            {getIsSectionAvailable(connectionEvents) && (
                <Route path={getSectionPath(path, connectionEvents)}>
                    <PrivateMainSettingsArea config={connectionEvents}>
                        <VPNEvents />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(activityMonitor) && (
                <Route path={getSectionPath(path, activityMonitor)}>
                    <PrivateMainSettingsArea config={activityMonitor}>
                        <ActivityMonitorDashboard user={user} organization={organization} subscription={subscription} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(accessControl) && (
                <Route path={getSectionPath(path, accessControl)}>
                    <PrivateMainSettingsArea config={accessControl}>
                        <AccessControlSettingsSection />
                        <FeatureAccessSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(rolesAndPermissions) && (
                <Route path={getSectionPath(path, rolesAndPermissions)}>
                    <PrivateMainSettingsArea config={rolesAndPermissions}>
                        <RolesAndPermissionsSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(groups) && (
                <Route path={getSectionPath(path, groups)}>
                    <PrivateMainSettingsArea config={groups}>
                        <OrganizationGroupsManagementSection organization={organization} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {redirect}
        </Switch>
    );
};

export default OrganizationSettingsRouter;
