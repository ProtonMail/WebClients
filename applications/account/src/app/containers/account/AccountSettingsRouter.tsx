import type { ReactNode } from 'react';
import { Route, Switch } from 'react-router-dom';

import { c } from 'ttag';

import AuthDevicesSettings from '@proton/account/sso/AuthDevicesSettings';
import { EasySwitchSettingsArea } from '@proton/activation';
import {
    AccessibilitySection,
    AccountRecoverySection,
    AssistantToggle,
    AutomaticSubscriptionModal,
    CancelSubscriptionSection,
    CancelSubscriptionViaSupportSection,
    CredentialLeakSection,
    CreditsSection,
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
    VPNDashboardTelemetry,
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
import { type APP_NAMES } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

import { recoveryIds } from './recoveryIds';
import type { getAccountAppRoutes } from './routes';

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
    const {
        routes: {
            dashboardV2,
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
            {getIsSectionAvailable(dashboardV2) && (
                <Route path={getSectionPath(path, dashboardV2)}>
                    <VPNDashboardTelemetry app={app} />
                    <AutomaticSubscriptionModal />
                    <PrivateMainSettingsArea
                        config={dashboardV2}
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
            {getIsSectionAvailable(subscription) && (
                <Route path={getSectionPath(path, subscription)}>
                    <AutomaticSubscriptionModal />
                    <PrivateMainSettingsArea
                        config={subscription}
                        mainAreaClass="bg-lowered settings-cards"
                        wrapperClass="w-full p-4 lg:p-6 xl:p-12 max-w-custom mx-auto"
                        style={{ '--max-w-custom': '1500px' }}
                    >
                        <YourPlanSectionV2 app={app} editBillingCycle={true} />
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
            {getIsSectionAvailable(dashboard) && (
                <Route path={getSectionPath(path, dashboard)}>
                    <VPNDashboardTelemetry app={app} />
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
                        <OverviewSection ids={recoveryIds} />
                        <AccountRecoverySection />
                        <DataRecoverySection />
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
                        <NonPrivateRecoverySection />
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
