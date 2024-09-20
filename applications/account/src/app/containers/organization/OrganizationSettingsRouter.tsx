import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
    AuthenticationLogs,
    CatchAllSection,
    DomainsSection,
    GatewaysSection,
    MultiUserCreationSection,
    OrganizationGroupsManagementSection,
    OrganizationPasswordSection,
    OrganizationScheduleCallSection,
    OrganizationSection,
    OrganizationSpamFiltersSection,
    OrganizationTwoFAEnforcementSection,
    OrganizationTwoFAHeader,
    OrganizationTwoFARemindersSection,
    PrivateMainSettingsArea,
    SsoPage,
    SubscriptionModalProvider,
    UsersAndAddressesSection,
    VPNEvents,
    useOrganization,
} from '@proton/components';
import { PrivateMainSettingsAreaBase } from '@proton/components/containers/layout/PrivateMainSettingsArea';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import type { getOrganizationAppRoutes } from './routes';

const OrganizationSettingsRouter = ({
    app,
    redirect,
    path,
    organizationAppRoutes,
    onOpenChat,
}: {
    app: APP_NAMES;
    redirect: ReactNode;
    path: string;
    organizationAppRoutes: ReturnType<typeof getOrganizationAppRoutes>;
    onOpenChat?: () => void;
}) => {
    const onceRef = useRef(false);
    const [organization] = useOrganization();

    const {
        routes: { gateways, setup, domains, orgKeys, users, filter, security, sso, connectionEvents, groups },
    } = organizationAppRoutes;

    if (!organizationAppRoutes.available) {
        return <>{redirect}</>;
    }

    return (
        <Switch>
            {getIsSectionAvailable(gateways) && (
                <Route path={getSectionPath(path, gateways)}>
                    <PrivateMainSettingsArea config={gateways}>
                        <SubscriptionModalProvider app={app}>
                            <GatewaysSection organization={organization} />
                        </SubscriptionModalProvider>
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
                    <SubscriptionModalProvider app={app}>
                        <PrivateMainSettingsArea config={orgKeys}>
                            <OrganizationScheduleCallSection onOpenChat={onOpenChat} />
                            <OrganizationSection app={app} organization={organization} />
                            <OrganizationPasswordSection organization={organization} onceRef={onceRef} />
                        </PrivateMainSettingsArea>
                    </SubscriptionModalProvider>
                </Route>
            )}
            {getIsSectionAvailable(users) && (
                <Route path={getSectionPath(path, users)}>
                    <SubscriptionModalProvider app={app}>
                        <PrivateMainSettingsArea config={users}>
                            <OrganizationScheduleCallSection onOpenChat={onOpenChat} />
                            <UsersAndAddressesSection app={app} onceRef={onceRef} />
                            <MultiUserCreationSection app={app} />
                        </PrivateMainSettingsArea>
                    </SubscriptionModalProvider>
                </Route>
            )}
            {getIsSectionAvailable(filter) && (
                <Route path={getSectionPath(path, filter)}>
                    <PrivateMainSettingsArea config={filter}>
                        <OrganizationSpamFiltersSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(security) && (
                <Route path={getSectionPath(path, security)}>
                    <PrivateMainSettingsArea config={security}>
                        <OrganizationTwoFAHeader organization={organization} />
                        <OrganizationTwoFARemindersSection organization={organization} />
                        <OrganizationTwoFAEnforcementSection organization={organization} />
                        <AuthenticationLogs organization={organization} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(sso) && (
                <Route path={getSectionPath(path, sso)}>
                    <PrivateMainSettingsAreaBase title={sso.title || sso.text} description={sso.description}>
                        <SubscriptionModalProvider app={app}>
                            <SsoPage />
                        </SubscriptionModalProvider>
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
