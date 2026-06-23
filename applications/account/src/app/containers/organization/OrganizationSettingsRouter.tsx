import { type ReactNode, useRef, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
    ActivityMonitorDashboard,
    CatchAllSection,
    DomainsSection,
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
import { SetupOrganizationSection } from '@proton/components/containers/organization/SetupOrganizationSection';
import AccessControlSettingsSection from '@proton/components/containers/organization/accessControl/AccessControlSettingsSection';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';
import { GatewaysSection } from '@proton/vpn/components/Gateways';

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
    subscription: MaybeFreeSubscription;
    onOpenChat?: () => void;
}) => {
    const onceRef = useRef(false);
    // The setup organization route becomes unavailable post organization setup.
    // Keep this state while the setup modal is open to allow the user to stay on the route to prevent a bad UX redirect.
    const [setupState, setSetupState] = useState(false);

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
        },
    } = organizationAppRoutes;

    if (!organizationAppRoutes.available) {
        return <>{redirect}</>;
    }

    const isSetupAvailable = getIsSectionAvailable(setup) || setupState;

    return (
        <Switch>
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
            {isSetupAvailable && (
                <Route path={getSectionPath(path, setup)}>
                    <PrivateMainSettingsArea config={setup}>
                        <OrganizationScheduleCallSection onOpenChat={onOpenChat} />
                        <SetupOrganizationSection organization={organization} app={app} onSetup={setSetupState} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {/* After the org is setup, and the setup route becomes unavailable, we redirect to the users route */}
            {!isSetupAvailable && getIsSectionAvailable(users) && (
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
                        <OrganizationGroupsManagementSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {redirect}
        </Switch>
    );
};

export default OrganizationSettingsRouter;
