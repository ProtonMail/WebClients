import { ReactNode, useEffect } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

import {
    AccountEasySwitchSection,
    AccountRecoverySection,
    BillingSection,
    CancelSubscriptionSection,
    CreditsSection,
    DataRecoverySection,
    DeleteSection,
    EmailSubscriptionSection,
    FeatureCode,
    GiftCodeSection,
    ImportListSection,
    InvoicesSection,
    LanguageAndTimeSection,
    LogsSection,
    OverviewSection,
    PasswordsSection,
    PaymentMethodsSection,
    PlansSection,
    PrivateMainSettingsArea,
    SessionsSection,
    useFeature,
    UsernameSection,
    YourPlanSection,
} from '@proton/components';
import { InviteSection, ReferralInvitesContextProvider, RewardSection } from '@proton/components/containers/referral';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';

import { getAccountAppRoutes } from './routes';
import AccountAutomaticDashboardModal from './AccountAutomaticDashboardModal';
import { recoveryIds } from './recoveryIds';

const RecoverySettingsPageVisited = () => {
    const { feature: hasVisitedRecoveryPage, update: setVisitedRecoveryPage } = useFeature(
        FeatureCode.VisitedRecoveryPage
    );

    useEffect(() => {
        if (hasVisitedRecoveryPage?.Value === false) {
            void setVisitedRecoveryPage(true);
        }
    }, [hasVisitedRecoveryPage]);

    return null;
};

const AccountSettingsRouter = ({
    redirect,
    path,
    accountAppRoutes,
}: {
    redirect: ReactNode;
    path: string;
    accountAppRoutes: ReturnType<typeof getAccountAppRoutes>;
}) => {
    const location = useLocation();

    const {
        routes: { dashboard, easySwitch, referral, recovery, security, password, language },
    } = accountAppRoutes;

    return (
        <Switch>
            {getIsSectionAvailable(dashboard) && (
                <Route path={getSectionPath(path, dashboard)}>
                    <AccountAutomaticDashboardModal location={location} />
                    <PrivateMainSettingsArea location={location} config={dashboard}>
                        <PlansSection />
                        <YourPlanSection />
                        <BillingSection />
                        <PaymentMethodsSection />
                        <CreditsSection />
                        <GiftCodeSection />
                        <InvoicesSection />
                        <EmailSubscriptionSection />
                        <CancelSubscriptionSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(recovery) && (
                <Route path={getSectionPath(path, recovery)}>
                    <RecoverySettingsPageVisited />
                    <PrivateMainSettingsArea location={location} config={recovery}>
                        <OverviewSection ids={recoveryIds} />
                        <AccountRecoverySection />
                        <DataRecoverySection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            <Route path={getSectionPath(path, password)}>
                <PrivateMainSettingsArea location={location} config={password}>
                    <UsernameSection />
                    <PasswordsSection />
                    <DeleteSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, language)}>
                <PrivateMainSettingsArea location={location} config={language}>
                    <LanguageAndTimeSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, security)}>
                <PrivateMainSettingsArea location={location} config={security}>
                    <SessionsSection />
                    <LogsSection />
                </PrivateMainSettingsArea>
            </Route>
            {getIsSectionAvailable(referral) && (
                <Route path={getSectionPath(path, referral)}>
                    <ReferralInvitesContextProvider>
                        <PrivateMainSettingsArea location={location} config={referral}>
                            <InviteSection />
                            <RewardSection />
                        </PrivateMainSettingsArea>
                    </ReferralInvitesContextProvider>
                </Route>
            )}
            <Route path={getSectionPath(path, easySwitch)}>
                <PrivateMainSettingsArea location={location} config={easySwitch}>
                    <AccountEasySwitchSection />
                    <ImportListSection />
                </PrivateMainSettingsArea>
            </Route>
            {redirect}
        </Switch>
    );
};

export default AccountSettingsRouter;
