import { ReactNode, useEffect } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import { c } from 'ttag';

import { APP_NAMES } from '@proton/shared/lib/constants';
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
    SubscriptionModalProvider,
    AutomaticSubscriptionModal,
    PrivateMainArea,
    SettingsPageTitle,
    PrivacySection,
} from '@proton/components';
import { InviteSection, ReferralInvitesContextProvider, RewardSection } from '@proton/components/containers/referral';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';

import { getAccountAppRoutes } from './routes';
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
    app,
}: {
    redirect: ReactNode;
    path: string;
    accountAppRoutes: ReturnType<typeof getAccountAppRoutes>;
    app: APP_NAMES;
}) => {
    const location = useLocation();

    const {
        routes: { dashboard, upgrade, easySwitch, referral, recovery, security, password, language },
    } = accountAppRoutes;

    return (
        <Switch>
            {getIsSectionAvailable(dashboard) && (
                <Route path={getSectionPath(path, dashboard)}>
                    <SubscriptionModalProvider app={app}>
                        <AutomaticSubscriptionModal />
                        <PrivateMainSettingsArea location={location} config={dashboard}>
                            <YourPlanSection app={app} />
                            <BillingSection />
                            <PaymentMethodsSection />
                            <CreditsSection />
                            <GiftCodeSection />
                            <InvoicesSection />
                            <EmailSubscriptionSection />
                            <CancelSubscriptionSection />
                        </PrivateMainSettingsArea>
                    </SubscriptionModalProvider>
                </Route>
            )}
            {getIsSectionAvailable(upgrade) && (
                <Route path={getSectionPath(path, upgrade)}>
                    <SubscriptionModalProvider app={app}>
                        <PrivateMainArea>
                            <div className="container-section-sticky">
                                <div className="text-center">
                                    <SettingsPageTitle className="mt1-5 mb1-5">{c('new_plans: title')
                                        .t`Unlock premium features by upgrading`}</SettingsPageTitle>
                                </div>
                                <PlansSection />
                            </div>
                        </PrivateMainArea>
                    </SubscriptionModalProvider>
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
                    <PrivacySection />
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
