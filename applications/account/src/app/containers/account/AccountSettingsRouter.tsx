import type { ReactNode } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

import type { Location } from 'history';
import { c } from 'ttag';

import { EmergencyAccessSection } from '@proton/account/delegatedAccess/emergencyAccess/EmergencyAccessSection';
import AuthDevicesSettings from '@proton/account/sso/AuthDevicesSettings';
import { EasySwitchSettingsArea } from '@proton/activation';
import type { SectionConfig } from '@proton/components';
import {
    AccessibilitySection,
    AccountDashboard,
    AccountRecoverySection,
    AssistantToggle,
    AutomaticSubscriptionModal,
    CancelSubscriptionSection,
    CancelSubscriptionViaSupportSection,
    CredentialLeakSection,
    CreditsSection,
    DashboardTelemetry,
    DataRecoverySection,
    DeleteSection,
    DowngradeSubscriptionSection,
    EmailSubscriptionSection,
    FamilyPlanSection,
    GiftCodeSection,
    GroupMembershipSection,
    InviteSection,
    InviteSectionLegacy,
    InvoicesSection,
    LanguageAndTimeSection,
    LogsSection,
    OverviewSection,
    PasswordsSection,
    PaymentMethodsSection,
    PlansSection,
    PrivacySection,
    PrivateMainArea,
    PrivateMainSettingsArea,
    ReferralInvitesContextProvider,
    ReferralInvitesContextProviderLegacy,
    RewardSection,
    RewardSectionLegacy,
    SentinelSection,
    SessionRecoverySection,
    SessionsSection,
    SettingsMaintenanceLayoutWrapper,
    SettingsPageTitle,
    SettingsSectionWide,
    SubscriptionsSection,
    ThemesSection,
    ThirdPartySection,
    TwoFactorSection,
    UsernameSection,
    VpnAlsoInYourPlanSection,
    VpnBlogSection,
    VpnDownloadAndInfoSection,
    YourPlanSection,
    YourPlanSectionV2,
    YourPlanUpsellsSectionV2,
    YourStorageSection,
} from '@proton/components';
import NonPrivateRecoverySection from '@proton/components/containers/account/NonPrivateRecoveySection';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import DashboardComparePlansCTA from '@proton/components/containers/payments/subscription/YourPlanSectionV2/DashboardComparePlansCTA';
import SignInWithAnotherDeviceSettings from '@proton/components/containers/recovery/SignInWithAnotherDeviceSettings';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

import type { getAccountAppRoutes } from './routes';

const shouldRedirectToSubscriptions = (location: Location<unknown>, path: string, dashboard: SectionConfig) => {
    /**
     * Dashboard -> Subscription redirect to handle sections we moved from Dashboard to subscriptions page
     */
    if (location.hash && location.pathname === `${path}${dashboard.to}`) {
        return [
            '#your-subscriptions',
            '#payment-methods',
            '#credits',
            '#gift-code',
            '#invoices',
            '#email-subscription',
            '#cancel-subscription',
        ].includes(location.hash);
    }
};

const AccountSettingsRouter = ({
    redirect,
    path,
    accountAppRoutes,
    app,
}: {
    redirect: ReactNode;
    path: string;
    accountAppRoutes: ReturnType<typeof getAccountAppRoutes>;
    app: APP_NAMES;
}) => {
    const isReferralExpansionEnabled = useFlag('ReferralExpansion');
    const location = useLocation();
    const {
        routes: {
            vpnDashboardV2,
            subscription,
            dashboard,
            upgrade,
            easySwitch,
            referral,
            recovery,
            security,
            password,
            language,
            appearance,
            groupMembership,
        },
    } = accountAppRoutes;

    return (
        <Switch>
            {getIsSectionAvailable(subscription) && shouldRedirectToSubscriptions(location, path, dashboard) ? (
                <Redirect to={`${path}${subscription.to}${location.search}${location.hash}`} />
            ) : null}
            {getIsSectionAvailable(vpnDashboardV2) && (
                <Route path={getSectionPath(path, vpnDashboardV2)}>
                    <DashboardTelemetry app={app} />
                    <AutomaticSubscriptionModal />
                    <PrivateMainSettingsArea
                        config={vpnDashboardV2}
                        mainAreaClass="bg-lowered settings-cards"
                        wrapperClass="w-full p-4 lg:p-6 xl:p-12 max-w-custom mx-auto"
                        style={{ '--max-w-custom': '1500px' }}
                    >
                        <YourPlanSectionV2 app={app} />
                        <YourPlanUpsellsSectionV2 app={app} />
                        <VpnDownloadAndInfoSection app={app} />
                        <VpnAlsoInYourPlanSection app={app} />
                        <VpnBlogSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(dashboard) && dashboard.id === 'dashboardV2' && (
                <Route path={getSectionPath(path, dashboard)}>
                    <DashboardTelemetry app={app} />
                    <AutomaticSubscriptionModal />
                    <AccountDashboard app={app} config={dashboard} />
                </Route>
            )}
            {getIsSectionAvailable(subscription) && (
                <Route path={getSectionPath(path, subscription)}>
                    <AutomaticSubscriptionModal />
                    <PrivateMainSettingsArea
                        config={subscription}
                        mainAreaClass="bg-lowered settings-cards"
                        wrapperClass="w-full p-4 lg:p-6 xl:p-12 max-w-custom mx-auto"
                        style={{ '--max-w-custom': '1500px' }}
                    >
                        <YourPlanSectionV2
                            app={app}
                            editBillingCycle={true}
                            cta={<DashboardComparePlansCTA app={app} />}
                        />
                        <AssistantToggle />
                        <SubscriptionsSection />
                        <PaymentMethodsSection />
                        <CreditsSection />
                        <GiftCodeSection />
                        <InvoicesSection />
                        <EmailSubscriptionSection />
                        <CancelSubscriptionSection app={app} />
                        <CancelSubscriptionViaSupportSection />
                        <DowngradeSubscriptionSection app={app} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(dashboard) && dashboard.id === 'dashboard' && (
                <Route path={getSectionPath(path, dashboard)}>
                    <DashboardTelemetry app={app} />
                    <AutomaticSubscriptionModal />
                    <PrivateMainSettingsArea config={dashboard}>
                        <YourStorageSection app={app} />
                        <YourPlanSection app={app} />
                        <AssistantToggle />
                        <SubscriptionsSection />
                        <PaymentMethodsSection />
                        <CreditsSection />
                        <GiftCodeSection />
                        <InvoicesSection />
                        <EmailSubscriptionSection />
                        <CancelSubscriptionSection app={app} />
                        <CancelSubscriptionViaSupportSection />
                        <DowngradeSubscriptionSection app={app} />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(upgrade) && (
                <Route path={getSectionPath(path, upgrade)}>
                    <AutomaticSubscriptionModal />
                    <PrivateMainArea>
                        <div className="container-section-sticky">
                            <div className="text-center flex">
                                <SettingsSectionWide className="mx-auto">
                                    <SettingsPageTitle className="my-14">{c('new_plans: title')
                                        .t`Unlock premium features by upgrading`}</SettingsPageTitle>
                                    <PlansSection app={app} />
                                </SettingsSectionWide>
                            </div>
                        </div>
                    </PrivateMainArea>
                </Route>
            )}
            {getIsSectionAvailable(recovery) && (
                <Route path={getSectionPath(path, recovery)}>
                    <PrivateMainSettingsArea config={recovery}>
                        <OverviewSection />
                        <AccountRecoverySection />
                        <DataRecoverySection />
                        <EmergencyAccessSection app={app} />
                        <SessionRecoverySection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(password) && (
                <Route path={getSectionPath(path, password)}>
                    <PrivateMainSettingsArea config={password}>
                        <>
                            <UsernameSection app={app} />
                            <PasswordsSection />
                        </>
                        <TwoFactorSection />
                        {/* The following two sections are for non-private users */}
                        <NonPrivateRecoverySection />
                        <SignInWithAnotherDeviceSettings />
                        <EmergencyAccessSection app={app} />
                        <FamilyPlanSection />
                        {/* Those 3 sections are here for members of family plan that don't have access to the dashboard any more */}
                        <PaymentMethodsSection />
                        <CreditsSection />
                        <InvoicesSection />
                        <DeleteSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            <Route path={getSectionPath(path, language)}>
                <PrivateMainSettingsArea config={language}>
                    <LanguageAndTimeSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, appearance)}>
                <PrivateMainSettingsArea config={appearance}>
                    <ThemesSection />
                    <AccessibilitySection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, security)}>
                <AutomaticSubscriptionModal />
                <PrivateMainSettingsArea config={security}>
                    <SentinelSection app={app} />
                    <CredentialLeakSection />
                    <AuthDevicesSettings />
                    <SessionsSection />
                    <LogsSection />
                    <ThirdPartySection />
                    <PrivacySection />
                </PrivateMainSettingsArea>
            </Route>
            {getIsSectionAvailable(referral) && (
                <Route path={getSectionPath(path, referral)}>
                    {isReferralExpansionEnabled ? (
                        <ReferralInvitesContextProvider>
                            <PrivateMainSettingsArea config={referral}>
                                <InviteSection />
                                <RewardSection />
                            </PrivateMainSettingsArea>
                        </ReferralInvitesContextProvider>
                    ) : (
                        <ReferralInvitesContextProviderLegacy>
                            <PrivateMainSettingsArea config={referral}>
                                <InviteSectionLegacy />
                                <RewardSectionLegacy />
                            </PrivateMainSettingsArea>
                        </ReferralInvitesContextProviderLegacy>
                    )}
                </Route>
            )}
            {getIsSectionAvailable(easySwitch) && (
                <Route path={getSectionPath(path, easySwitch)}>
                    <SettingsMaintenanceLayoutWrapper config={easySwitch} maintenanceFlag="MaintenanceImporter">
                        <EasySwitchSettingsArea config={easySwitch} app={app} />
                    </SettingsMaintenanceLayoutWrapper>
                </Route>
            )}
            {getIsSectionAvailable(groupMembership) && (
                <Route path={getSectionPath(path, groupMembership)}>
                    <PrivateMainSettingsArea config={groupMembership}>
                        <GroupMembershipSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {redirect}
        </Switch>
    );
};

export default AccountSettingsRouter;
