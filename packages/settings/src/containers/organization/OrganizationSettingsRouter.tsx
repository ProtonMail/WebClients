import { type ReactNode, useRef, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import OrganizationAccountRecoverySection from '@proton/account-recovery/organization/OrganizationAccountRecoverySection';
import PrivateMainSettingsArea, {
    PrivateMainSettingsAreaBase,
} from '@proton/components/containers/layout/PrivateMainSettingsArea';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import OrganizationSpamFiltersSection from '@proton/mail-settings/filters/OrganizationSpamFiltersSection';
import OrganizationPasswordPoliciesSection from '@proton/organization/OrganizationPasswordPoliciesSection';
import OrganizationPasswordRemindersSection from '@proton/organization/OrganizationPasswordRemindersSection';
import OrganizationPasswordSection from '@proton/organization/OrganizationPasswordSection';
import OrganizationScheduleCallSection from '@proton/organization/OrganizationScheduleCallSection';
import OrganizationSection from '@proton/organization/OrganizationSection';
import OrganizationTwoFAEnforcementSection from '@proton/organization/OrganizationTwoFAEnforcementSection';
import OrganizationTwoFARemindersSection from '@proton/organization/OrganizationTwoFARemindersSection';
import { SetupOrganizationSection } from '@proton/organization/SetupOrganizationSection';
import AccessControlSettingsSection from '@proton/organization/accessControl/AccessControlSettingsSection';
import ActivityMonitorDashboard from '@proton/organization/b2bDashboard/ActivityMonitor/ActivityMonitorDashboard';
import CatchAllSection from '@proton/organization/domains/CatchAllSection';
import DomainsSection from '@proton/organization/domains/DomainsSection';
import OrganizationGroupsManagementSection from '@proton/organization/groups/OrganizationGroupsManagementSection';
import OrganizationRetentionPoliciesSection from '@proton/organization/retentionPolicy/OrganizationRetentionPoliciesSection';
import { SentinelSection } from '@proton/organization/sentinel/SentinelSection';
import SsoPage from '@proton/organization/sso/SsoPage';
import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import ServiceAccountsSection from '@proton/service-accounts/ServiceAccountsSection';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import { AlwaysOnVpnRoute } from '@proton/vpn/routes/organization/AlwaysOnVpnRoute';
import { GatewayMonitorRoute } from '@proton/vpn/routes/organization/GatewayMonitorRoute';
import { GatewaysRoute } from '@proton/vpn/routes/organization/GatewaysRoute';
import { SharedServersRoute } from '@proton/vpn/routes/organization/SharedServersRoute';

import UsersAndAddressesSection from '../members/UsersAndAddressesSection/UsersAndAddressesSection';
import MultiUserCreationSection from '../members/multipleUserCreation/MultiUserCreationSection';
import { FeatureAccessSection } from './components/FeatureAccessSection';
import type { getOrganizationAppRoutes } from './routes';

const OrganizationSettingsRouter = ({
    app,
    redirect,
    path,
    organizationAppRoutes,
    organization,
    onOpenChat,
    entitlements,
}: {
    app: APP_NAMES;
    redirect: ReactNode;
    path: string;
    organizationAppRoutes: ReturnType<typeof getOrganizationAppRoutes>;
    organization?: OrganizationExtended;
    onOpenChat?: () => void;
    entitlements: EntitlementChecksForOrgAndUser;
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
            serviceAccounts,
            sharedServers,
            alwaysOnVpn,
        },
    } = organizationAppRoutes;

    if (!organizationAppRoutes.available) {
        return <>{redirect}</>;
    }

    const isSetupAvailable = getIsSectionAvailable(setup) || setupState;

    return (
        <Switch>
            {getIsSectionAvailable(serviceAccounts) && (
                <Route path={getSectionPath(path, serviceAccounts)}>
                    <PrivateMainSettingsArea config={serviceAccounts}>
                        <ServiceAccountsSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(gateways) && (
                <Route path={getSectionPath(path, gateways)}>
                    <GatewaysRoute config={gateways} organization={organization} />
                </Route>
            )}
            {getIsSectionAvailable(sharedServers) && (
                <Route path={getSectionPath(path, sharedServers)}>
                    <SharedServersRoute config={sharedServers} />
                </Route>
            )}
            {getIsSectionAvailable(alwaysOnVpn) && (
                <Route path={getSectionPath(path, alwaysOnVpn)}>
                    <AlwaysOnVpnRoute config={alwaysOnVpn} />
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
                        <OrganizationAccountRecoverySection organization={organization} />
                        <OrganizationPasswordRemindersSection organization={organization} />
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
                    <GatewayMonitorRoute config={connectionEvents} />
                </Route>
            )}
            {getIsSectionAvailable(activityMonitor) && (
                <Route path={getSectionPath(path, activityMonitor)}>
                    <PrivateMainSettingsArea config={activityMonitor}>
                        <ActivityMonitorDashboard organization={organization} entitlements={entitlements} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(accessControl) && (
                <Route path={getSectionPath(path, accessControl)}>
                    <PrivateMainSettingsArea config={accessControl}>
                        <AccessControlSettingsSection />
                        <FeatureAccessSection {...organizationAppRoutes.featureAccess} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(groups) && (
                <Route path={getSectionPath(path, groups)}>
                    <PrivateMainSettingsArea config={groups}>
                        <OrganizationGroupsManagementSection app={app} upgradeRequired={groups.upgradeRequired} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {redirect}
        </Switch>
    );
};

export default OrganizationSettingsRouter;
