import type { FunctionComponent } from 'react';
import { useEffect, useRef } from 'react';
import { Route, Switch } from 'react-router-dom';

import {
    DrawerThemeInjector,
    ModalsChildren,
    SubscriptionModalProvider,
    useActiveBreakpoint,
    useConfig,
} from '@proton/components';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';
import { useInboxDesktopMessageForward } from '@proton/components/hooks/useInboxDesktopMessageForward';
import { FeatureCode, useFeatures } from '@proton/features';
import AssistantProvider from '@proton/llm/lib/providers/AssistantProvider';
import { useFlag } from '@proton/unleash';
import { useWalletAutoCreate } from '@proton/wallet/hooks/useWalletAutoCreate';
import { useInboxDesktopHeartbeat } from '@proton/shared/lib/desktop/heartbeat';

import { CheckAllRefProvider } from 'proton-mail/containers/CheckAllRefProvider';

import { MAIN_ROUTE_PATH } from './constants';
import ComposerContainer from './containers/ComposerContainer';
import EncryptedSearchProvider from './containers/EncryptedSearchProvider';
import PageContainer from './containers/PageContainer';
import ChecklistsProvider from './containers/onboardingChecklist/provider/ChecklistsProvider';
import { MailContentRefProvider } from './hooks/useClickMailContent';

const MainContainer: FunctionComponent = () => {
    const breakpoints = useActiveBreakpoint();
    const { APP_NAME } = useConfig();
    const mailContentRef = useRef<HTMLDivElement>(null);
    const { getFeature } = useFeatures([
        FeatureCode.MailServiceWorker,
        FeatureCode.EarlyAccessScope,
        FeatureCode.ScheduledSendFreemium,
        FeatureCode.SpotlightScheduledSend,
        FeatureCode.BundlePromoShown,
        FeatureCode.UsedMailMobileApp,
        FeatureCode.ESUserInterface,
    ]);

    const { feature: featureSw, loading: loadingSw } = getFeature(FeatureCode.MailServiceWorker);

    const shouldAutoSetupWallet = useFlag('WalletAutoSetup');
    useWalletAutoCreate({ higherLevelPilot: shouldAutoSetupWallet });

    useInboxDesktopMessageForward();
    useInboxDesktopHeartbeat();

    // Service Worker registration
    // Including a kill switch with a feature flag
    useEffect(() => {
        if ('serviceWorker' in navigator && !loadingSw) {
            const unregister = async () => {
                const registrations = await navigator.serviceWorker.getRegistrations();
                registrations.forEach((registration) => {
                    if (registration.scope === window.location.origin + '/') {
                        void registration.unregister();
                    }
                });
            };

            const register = async () => {
                try {
                    await navigator.serviceWorker.register('/service-worker.js');
                } catch {
                    console.log('No service worker found');
                }
            };

            const action = featureSw?.Value === true ? register : unregister;

            void action();
        }
    }, [featureSw, loadingSw]);

    return (
        <AssistantProvider>
            <QuickSettingsRemindersProvider>
                <DrawerThemeInjector />
                <EncryptedSearchProvider>
                    <MailContentRefProvider mailContentRef={mailContentRef}>
                        <ChecklistsProvider>
                            <SubscriptionModalProvider app={APP_NAME}>
                                <ComposerContainer breakpoints={breakpoints}>
                                    <CheckAllRefProvider>
                                        <ModalsChildren />
                                        <Switch>
                                            <Route
                                                path={MAIN_ROUTE_PATH}
                                                render={() => (
                                                    <PageContainer ref={mailContentRef} breakpoints={breakpoints} />
                                                )}
                                            />
                                        </Switch>
                                    </CheckAllRefProvider>
                                </ComposerContainer>
                            </SubscriptionModalProvider>
                        </ChecklistsProvider>
                    </MailContentRefProvider>
                </EncryptedSearchProvider>
            </QuickSettingsRemindersProvider>
        </AssistantProvider>
    );
};

export default MainContainer;
