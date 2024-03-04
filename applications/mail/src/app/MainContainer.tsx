import { FunctionComponent, useEffect, useRef } from 'react';
import { Route, Switch } from 'react-router-dom';

import {
    FeatureCode,
    ModalsChildren,
    SubscriptionModalProvider,
    useActiveBreakpoint,
    useConfig,
    useFeatures,
} from '@proton/components';
import { DrawerThemeInjector } from '@proton/components/containers/themes/ThemeInjector';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';

import { CheckAllRefProvider } from 'proton-mail/containers/CheckAllRefProvider';

import { MAIN_ROUTE_PATH } from './constants';
import ComposerContainer from './containers/ComposerContainer';
import EncryptedSearchProvider from './containers/EncryptedSearchProvider';
import PageContainer from './containers/PageContainer';
import ChecklistsProvider from './containers/onboardingChecklist/provider/ChecklistsProvider';
import { SimpleLoginExtensionProvider } from './hooks/simpleLogin/useSimpleLoginExtension';
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
        <QuickSettingsRemindersProvider>
            <DrawerThemeInjector />
            <EncryptedSearchProvider>
                <SimpleLoginExtensionProvider>
                    <MailContentRefProvider mailContentRef={mailContentRef}>
                        <ChecklistsProvider>
                            <ComposerContainer breakpoints={breakpoints}>
                                <CheckAllRefProvider>
                                    <ModalsChildren />
                                    <Switch>
                                        <SubscriptionModalProvider app={APP_NAME}>
                                            <Route
                                                path={MAIN_ROUTE_PATH}
                                                render={() => (
                                                    <PageContainer ref={mailContentRef} breakpoints={breakpoints} />
                                                )}
                                            />
                                        </SubscriptionModalProvider>
                                    </Switch>
                                </CheckAllRefProvider>
                            </ComposerContainer>
                        </ChecklistsProvider>
                    </MailContentRefProvider>
                </SimpleLoginExtensionProvider>
            </EncryptedSearchProvider>
        </QuickSettingsRemindersProvider>
    );
};

export default MainContainer;
