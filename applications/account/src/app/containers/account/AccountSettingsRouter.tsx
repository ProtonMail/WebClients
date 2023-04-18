import { ReactNode } from 'react';
import { Route, Switch } from 'react-router-dom';

import { c } from 'ttag';

import { EasySwitchSettingsArea } from '@proton/activation';
import {
    AccountRecoverySection,
    AutomaticSubscriptionModal,
    CancelSubscriptionSection,
    CreditsSection,
    DataRecoverySection,
    DeleteSection,
    EmailSubscriptionSection,
    FamilyPlanSection,
    GiftCodeSection,
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
    SessionsSection,
    SettingsPageTitle,
    SettingsSectionWide,
    SubscriptionModalProvider,
    SubscriptionsSection,
    TwoFactorSection,
    UsernameSection,
    YourPlanSection,
} from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import { InviteSection, ReferralInvitesContextProvider, RewardSection } from '@proton/components/containers/referral';
import { APP_NAMES } from '@proton/shared/lib/constants';

import { recoveryIds } from './recoveryIds';
import { getAccountAppRoutes } from './routes';

const AccountSettingsRouter = ({
    redirect,
    path,
    accountAppRoutes,
    app,
    isPassPlusEnabled,
}: {
    redirect: ReactNode;
    path: string;
    accountAppRoutes: ReturnType<typeof getAccountAppRoutes>;
    app: APP_NAMES;
    isPassPlusEnabled: boolean;
}) => {
    const {
        routes: { dashboard, upgrade, easySwitch, referral, recovery, security, password, language },
    } = accountAppRoutes;

    return (
        <Switch>
            {getIsSectionAvailable(dashboard) && (
                <Route path={getSectionPath(path, dashboard)}>
                    <SubscriptionModalProvider app={app}>
                        <AutomaticSubscriptionModal />
                        <PrivateMainSettingsArea config={dashboard}>
                            <YourPlanSection app={app} />
                            <SubscriptionsSection />
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
                                <div className="text-center flex">
                                    <SettingsSectionWide className="mxauto">
                                        <SettingsPageTitle className="mt1-5 mb1-5">{c('new_plans: title')
                                            .t`Unlock premium features by upgrading`}</SettingsPageTitle>
                                        <PlansSection isPassPlusEnabled={isPassPlusEnabled} />
                                    </SettingsSectionWide>
                                </div>
                            </div>
                        </PrivateMainArea>
                    </SubscriptionModalProvider>
                </Route>
            )}
            {getIsSectionAvailable(recovery) && (
                <Route path={getSectionPath(path, recovery)}>
                    <PrivateMainSettingsArea config={recovery}>
                        <OverviewSection ids={recoveryIds} />
                        <AccountRecoverySection />
                        <DataRecoverySection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            <Route path={getSectionPath(path, password)}>
                <PrivateMainSettingsArea config={password}>
                    <>
                        <UsernameSection app={app} />
                        <PasswordsSection />
                    </>
                    <TwoFactorSection />
                    <FamilyPlanSection />
                    {/* Those 3 sections are here for members of family plan that don't have access to the dashboard any more */}
                    <PaymentMethodsSection />
                    <CreditsSection />
                    <InvoicesSection />
                    <DeleteSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, language)}>
                <PrivateMainSettingsArea config={language}>
                    <LanguageAndTimeSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, security)}>
                <PrivateMainSettingsArea config={security}>
                    <SessionsSection />
                    <LogsSection />
                    <PrivacySection />
                </PrivateMainSettingsArea>
            </Route>
            {getIsSectionAvailable(referral) && (
                <Route path={getSectionPath(path, referral)}>
                    <ReferralInvitesContextProvider>
                        <PrivateMainSettingsArea config={referral}>
                            <InviteSection />
                            <RewardSection />
                        </PrivateMainSettingsArea>
                    </ReferralInvitesContextProvider>
                </Route>
            )}
            <Route path={getSectionPath(path, easySwitch)}>
                <EasySwitchSettingsArea config={easySwitch} />
            </Route>
            {redirect}
        </Switch>
    );
};

export default AccountSettingsRouter;
