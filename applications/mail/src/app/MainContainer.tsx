import { useEffect, useRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import {
    ErrorBoundary,
    FeatureCode,
    ModalsChildren,
    StandardErrorPage,
    useActiveBreakpoint,
    useFeatures,
} from '@proton/components';

import { MAIN_ROUTE_PATH } from './constants';
import ComposerContainer from './containers/ComposerContainer';
import EncryptedSearchProvider from './containers/EncryptedSearchProvider';
import PageContainer from './containers/PageContainer';
import ChecklistsProvider from './containers/onboardingChecklist/provider/ChecklistsProvider';
import { SimpleLoginExtensionProvider } from './hooks/simpleLogin/useSimpleLoginExtension';
import { MailContentRefProvider } from './hooks/useClickMailContent';
import { store, useSetReduxThunkExtraArgs } from './logic/store';

const MainContainer = () => {
    useSetReduxThunkExtraArgs();
    const breakpoints = useActiveBreakpoint();
    const mailContentRef = useRef<HTMLDivElement>(null);
    const { getFeature } = useFeatures([
        FeatureCode.MailServiceWorker,
        FeatureCode.EarlyAccessScope,
        FeatureCode.ScheduledSendFreemium,
        FeatureCode.SpotlightScheduledSend,
        FeatureCode.BundlePromoShown,
        FeatureCode.SpotlightEncryptedSearch,
        FeatureCode.UsedMailMobileApp,
        FeatureCode.LegacyMessageMigrationEnabled,
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
        <ReduxProvider store={store}>
            <EncryptedSearchProvider>
                <SimpleLoginExtensionProvider>
                    <MailContentRefProvider mailContentRef={mailContentRef}>
                        <ChecklistsProvider>
                            <ComposerContainer breakpoints={breakpoints}>
                                <ModalsChildren />
                                <Switch>
                                    <Route
                                        path={MAIN_ROUTE_PATH}
                                        render={() => <PageContainer ref={mailContentRef} breakpoints={breakpoints} />}
                                    />
                                </Switch>
                            </ComposerContainer>
                        </ChecklistsProvider>
                    </MailContentRefProvider>
                </SimpleLoginExtensionProvider>
            </EncryptedSearchProvider>
        </ReduxProvider>
    );
};

const WrappedMainContainer = () => {
    return (
        <ErrorBoundary component={<StandardErrorPage big />}>
            <MainContainer />
        </ErrorBoundary>
    );
};

export default WrappedMainContainer;
