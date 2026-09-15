import type { ReactNode } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

import type { Location } from 'history';
import { c } from 'ttag';

import { EmergencyContactSection } from '@proton/account/delegatedAccess/emergencyContact/EmergencyContactSection';
import { RecoveryContactSection } from '@proton/account/delegatedAccess/recoveryContact/RecoveryContactSection';
import AuthDevicesSettings from '@proton/account/sso/AuthDevicesSettings';
import { EasySwitchSettingsArea } from '@proton/activation';
import { ThirdPartySection } from '@proton/calendar-video-conferencing/thirdParty/ThirdPartySection';
import SettingsMaintenanceLayoutWrapper from '@proton/components/components/maintenanceLayout/SettingsMaintenanceLayoutWrapper';
import AccessibilitySection from '@proton/components/containers/account/AccessibilitySection';
import DeleteSection from '@proton/components/containers/account/DeleteSection';
import EmailSubscriptionSection from '@proton/components/containers/account/EmailSubscriptionSection';
import FamilyPlanSection from '@proton/components/containers/account/FamilyPlanSection';
import NonPrivateRecoverySection from '@proton/components/containers/account/NonPrivateRecoveySection';
import PasswordsSection from '@proton/components/containers/account/PasswordsSection';
import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import TwoFactorSection from '@proton/components/containers/account/TwoFactorSection';
import UsernameSection from '@proton/components/containers/account/UsernameSection';
import AccountDashboard from '@proton/components/containers/account/dashboard/dashboard';
import GroupMembershipSection from '@proton/components/containers/account/groups/GroupMembershipSection';
import CredentialLeakSection from '@proton/components/containers/credentialLeak/CredentialLeakSection';
import LanguageAndTimeSection from '@proton/components/containers/general/LanguageAndTimeSection';
import InvoicesSection from '@proton/components/containers/invoices/InvoicesSection';
import PrivateMainArea from '@proton/components/containers/layout/PrivateMainArea';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import { SettingsCardMaxWidth, SettingsLayoutVariant } from '@proton/components/containers/layout/interface';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import LogsSection from '@proton/components/containers/logs/LogsSection';
import CreditsSection from '@proton/components/containers/payments/CreditsSection';
import GiftCodeSection from '@proton/components/containers/payments/GiftCodeSection';
import PlansSection from '@proton/components/containers/payments/PlansSection';
import SubscriptionsSection from '@proton/components/containers/payments/SubscriptionsSection';
import PaymentMethodsSection from '@proton/components/containers/payments/methods/PaymentMethodsSection';
import AutomaticSubscriptionModal from '@proton/components/containers/payments/subscription/AutomaticSubscriptionModal';
import DashboardTelemetry from '@proton/components/containers/payments/subscription/DashboardTelemetry';
import DowngradeSubscriptionSection from '@proton/components/containers/payments/subscription/DowngradeSubscriptionSection';
import { UpsellModalTelemetryProvider } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import YourPlanSection from '@proton/components/containers/payments/subscription/YourPlanSection';
import DashboardComparePlansCTA from '@proton/components/containers/payments/subscription/YourPlanSectionV2/DashboardComparePlansCTA';
import YourPlanSectionV2 from '@proton/components/containers/payments/subscription/YourPlanSectionV2/YourPlanSectionV2';
import { YourPlanUpsellsSectionV2 } from '@proton/components/containers/payments/subscription/YourPlanSectionV2/YourPlanUpsellsSectionV2';
import YourStorageSection from '@proton/components/containers/payments/subscription/YourStorageSection';
import AssistantToggle from '@proton/components/containers/payments/subscription/assistant/AssistantToggle';
import { CancelSubscriptionSection } from '@proton/components/containers/payments/subscription/cancelSubscription/CancelSubscriptionSection';
import CancelSubscriptionViaSupportSection from '@proton/components/containers/payments/subscription/cancelSubscriptionViaSupport/CancelSubscriptionViaSupportSection';
import PrivacySection from '@proton/components/containers/privacy/PrivacySection';
import SignInWithAnotherDeviceSettings from '@proton/components/containers/recovery/SignInWithAnotherDeviceSettings';
import { ReferralInvitesContextProvider } from '@proton/components/containers/referral/ReferralInvitesContext';
import ReferralPageTelemetry from '@proton/components/containers/referral/components/ReferralPageTelemetry';
import { InviteSection } from '@proton/components/containers/referral/invite/InviteSection';
import { RewardSection } from '@proton/components/containers/referral/rewards/RewardSection';
import { SentinelSection } from '@proton/components/containers/sentinel/SentinelSection';
import SessionsSection from '@proton/components/containers/sessions/SessionsSection';
import ThemesSection from '@proton/components/containers/themes/ThemesSection';
import { VpnAlsoInYourPlanSection } from '@proton/components/containers/vpn/VpnAlsoInYourPlanSection/VpnAlsoInYourPlanSection';
import { VpnBlogSection } from '@proton/components/containers/vpn/VpnBlogSection/VpnBlogSection';
import { PaymentsContextProvider } from '@proton/payments-ui/ui/context/PaymentContext';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { VPNDownloadAndInfoSection } from '@proton/vpn/components/VPNDownloadSection';

import RecoverySettingsRouter from './recovery/RecoverySettingsRouter';
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

    if (!accountAppRoutes.available) {
        return <>{redirect}</>;
    }

    return (
        <Switch>
            {getIsSectionAvailable(subscription) && shouldRedirectToSubscriptions(location, path, dashboard) ? (
                <Redirect to={`${path}${subscription.to}${location.search}${location.hash}`} />
            ) : null}
            {getIsSectionAvailable(vpnDashboardV2) && (
                <Route path={getSectionPath(path, vpnDashboardV2)}>
                    <DashboardTelemetry app={app} />
                    <AutomaticSubscriptionModal />
                    <UpsellModalTelemetryProvider context="account-home">
                        <PrivateMainSettingsArea
                            config={vpnDashboardV2}
                            variant={SettingsLayoutVariant.Card}
                            maxWidth={SettingsCardMaxWidth.Wide}
                        >
                            <YourPlanSectionV2 app={app} />
                            <YourPlanUpsellsSectionV2 app={app} />
                            <VPNDownloadAndInfoSection app={app} />
                            <VpnAlsoInYourPlanSection app={app} />
                            <VpnBlogSection />
                        </PrivateMainSettingsArea>
                    </UpsellModalTelemetryProvider>
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
                    <UpsellModalTelemetryProvider context="account-home">
                        <PrivateMainSettingsArea
                            config={subscription}
                            variant={SettingsLayoutVariant.Card}
                            maxWidth={SettingsCardMaxWidth.Wide}
                        >
                            <YourPlanSectionV2
                                app={app}
                                editBillingCycle={true}
                                cta={<DashboardComparePlansCTA app={app} />}
                            />
                            <AssistantToggle />
                            <SubscriptionsSection />
                            <PaymentMethodsSection app={app} />
                            <CreditsSection app={app} />
                            <GiftCodeSection />
                            <InvoicesSection app={app} />
                            <EmailSubscriptionSection toggleContainerClassName="gap-4" />
                            <CancelSubscriptionSection app={app} />
                            <CancelSubscriptionViaSupportSection />
                            <DowngradeSubscriptionSection app={app} />
                        </PrivateMainSettingsArea>
                    </UpsellModalTelemetryProvider>
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
                        <PaymentMethodsSection app={app} />
                        <CreditsSection app={app} />
                        <GiftCodeSection />
                        <InvoicesSection app={app} />
                        <EmailSubscriptionSection toggleContainerClassName="gap-4" />
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
                    <RecoverySettingsRouter app={app} recovery={recovery} path={path} />
                </Route>
            )}
            {getIsSectionAvailable(password) && (
                <Route path={getSectionPath(path, password)}>
                    <PrivateMainSettingsArea
                        config={password}
                        variant={SettingsLayoutVariant.Card}
                        maxWidth={SettingsCardMaxWidth.Narrow}
                    >
                        <UsernameSection app={app} />
                        <PasswordsSection />
                        <TwoFactorSection />
                        {/* The following two sections are for non-private users */}
                        <NonPrivateRecoverySection />
                        <SignInWithAnotherDeviceSettings />
                        <PaymentsContextProvider>
                            <EmergencyContactSection app={app} />
                        </PaymentsContextProvider>
                        <RecoveryContactSection app={app} />
                        <FamilyPlanSection />
                        {/* Those 3 sections are here for members of family plan that don't have access to the dashboard any more */}
                        <PaymentMethodsSection app={app} />
                        <CreditsSection app={app} />
                        <InvoicesSection app={app} />
                        <DeleteSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            <Route path={getSectionPath(path, language)}>
                <PrivateMainSettingsArea
                    config={language}
                    variant={SettingsLayoutVariant.Card}
                    maxWidth={SettingsCardMaxWidth.Narrow}
                >
                    <LanguageAndTimeSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, appearance)}>
                <PrivateMainSettingsArea
                    config={appearance}
                    variant={SettingsLayoutVariant.Card}
                    maxWidth={SettingsCardMaxWidth.Medium}
                >
                    <ThemesSection />
                    <AccessibilitySection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, security)}>
                <AutomaticSubscriptionModal />
                <PrivateMainSettingsArea
                    config={security}
                    variant={SettingsLayoutVariant.Card}
                    maxWidth={SettingsCardMaxWidth.Medium}
                >
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
                    <ReferralPageTelemetry />
                    <ReferralInvitesContextProvider>
                        <PrivateMainSettingsArea
                            config={referral}
                            variant={SettingsLayoutVariant.Card}
                            maxWidth={SettingsCardMaxWidth.Medium}
                        >
                            <InviteSection />
                            <RewardSection />
                        </PrivateMainSettingsArea>
                    </ReferralInvitesContextProvider>
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
