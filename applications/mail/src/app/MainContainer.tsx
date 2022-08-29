import { useEffect, useRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import {
    ErrorBoundary,
    FeatureCode,
    Logo,
    ModalsChildren,
    StandardErrorPage,
    Tooltip,
    useActiveBreakpoint,
    useFeatures,
    useSideApp,
} from '@proton/components';
import { useCalendarsInfoCoreListener } from '@proton/components/containers/eventManager/calendar/useCalendarsInfoListener';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

import { MAIN_ROUTE_PATH } from './constants';
import ComposerContainer from './containers/ComposerContainer';
import EncryptedSearchProvider from './containers/EncryptedSearchProvider';
import PageContainer from './containers/PageContainer';
import { ChecklistsProvider } from './containers/checklists';
import { SimpleLoginExtensionProvider } from './hooks/simpleLogin/useSimpleLoginExtension';
import { MailContentRefProvider } from './hooks/useClickMailContent';
import { store } from './logic/store';

const MainContainer = () => {
    const { handleClickSideApp } = useSideApp();
    const breakpoints = useActiveBreakpoint();
    const mailContentRef = useRef<HTMLDivElement>(null);
    const [{ feature: featureSw, loading: loadingSw }, { feature: calendarViewInMailFeature }] = useFeatures([
        FeatureCode.MailServiceWorker,
        FeatureCode.CalendarViewInMail,
        FeatureCode.EarlyAccessScope,
        FeatureCode.ScheduledSend,
        FeatureCode.SpotlightScheduledSend,
        FeatureCode.BundlePromoShown,
        FeatureCode.SpotlightEncryptedSearch,
        FeatureCode.UsedMailMobileApp,
        FeatureCode.SpyTrackerProtection,
        FeatureCode.ContextFiltering,
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

    useCalendarsInfoCoreListener();

    const rightSidebarContent = calendarViewInMailFeature?.Value && (
        <Tooltip title={CALENDAR_APP_NAME} originalPlacement="left">
            <button
                className="side-app-link flex border rounded"
                type="button"
                onClick={handleClickSideApp(APPS.PROTONCALENDAR)}
            >
                <Logo appName="proton-calendar" variant="glyph-only" className="mauto" hasTitle={false} />
            </button>
        </Tooltip>
    );

    return (
        <ReduxProvider store={store}>
            <EncryptedSearchProvider>
                <SimpleLoginExtensionProvider>
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
                                                        rightSidebarContent={rightSidebarContent}
                                                    />
                                                )}
                                            />
                                        </Switch>
                                    </>
                                )}
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
        <ErrorBoundary component={<StandardErrorPage />}>
            <MainContainer />
        </ErrorBoundary>
    );
};

export default WrappedMainContainer;
