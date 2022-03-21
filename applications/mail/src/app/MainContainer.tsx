import { useEffect, useRef } from 'react';
import { Route, Switch } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import {
    useActiveBreakpoint,
    ModalsChildren,
    ErrorBoundary,
    StandardErrorPage,
    FeatureCode,
    useFeatures,
} from '@proton/components';
import ComposerContainer from './containers/ComposerContainer';
import PageContainer from './containers/PageContainer';
import { MAIN_ROUTE_PATH } from './constants';
import EncryptedSearchProvider from './containers/EncryptedSearchProvider';
import { ChecklistsProvider } from './containers/checklists';
import { MailContentRefProvider } from './hooks/useClickMailContent';
import { store } from './logic/store';

const MainContainer = () => {
    const breakpoints = useActiveBreakpoint();
    const mailContentRef = useRef<HTMLDivElement>(null);
    const [{ feature: featureSw, loading: loadingSw }] = useFeatures([
        FeatureCode.MailServiceWorker,
        FeatureCode.EarlyAccessScope,
        FeatureCode.ScheduledSend,
        FeatureCode.SpotlightScheduledSend,
        FeatureCode.BundlePromoShown,
        FeatureCode.EnabledEncryptedSearch,
        FeatureCode.SpotlightEncryptedSearch,
        FeatureCode.UsedMailMobileApp,
        FeatureCode.SpyTrackerProtection,
    ]);

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
                <MailContentRefProvider mailContentRef={mailContentRef}>
                    <ChecklistsProvider>
                        <ComposerContainer breakpoints={breakpoints}>
                            {({ isComposerOpened }) => (
                                <>
                                    <ModalsChildren />
                                    <Switch>
                                        <Route
                                            path={MAIN_ROUTE_PATH}
                                            render={() => (
                                                <PageContainer
                                                    ref={mailContentRef}
                                                    breakpoints={breakpoints}
                                                    isComposerOpened={isComposerOpened}
                                                />
                                            )}
                                        />
                                    </Switch>
                                </>
                            )}
                        </ComposerContainer>
                    </ChecklistsProvider>
                </MailContentRefProvider>
            </EncryptedSearchProvider>
        </ReduxProvider>
    );
};

const WrappedMainContainer = () => {
    return (
        <ErrorBoundary component={<StandardErrorPage />}>
            <MainContainer />
        </ErrorBoundary>
    );
};

export default WrappedMainContainer;
