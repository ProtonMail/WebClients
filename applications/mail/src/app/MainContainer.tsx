import { useRef } from 'react';
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
import GetStartedChecklistProvider from './containers/GetStartedChecklistProvider';
import { MailContentRefProvider } from './hooks/useClickMailContent';
import { store } from './logic/store';

const MainContainer = () => {
    const breakpoints = useActiveBreakpoint();
    const mailContentRef = useRef<HTMLDivElement>(null);
    useFeatures([
        FeatureCode.EarlyAccessScope,
        FeatureCode.ScheduledSend,
        FeatureCode.SpotlightScheduledSend,
        FeatureCode.BundlePromoShown,
        FeatureCode.EnabledEncryptedSearch,
        FeatureCode.SpotlightEncryptedSearch,
        FeatureCode.UsedMailMobileApp,
        FeatureCode.Mnemonic,
        FeatureCode.CalendarEmailNotification,
        FeatureCode.SpyTrackerProtection,
    ]);

    return (
        <ReduxProvider store={store}>
            <EncryptedSearchProvider>
                <MailContentRefProvider mailContentRef={mailContentRef}>
                    <GetStartedChecklistProvider>
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
                    </GetStartedChecklistProvider>
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
