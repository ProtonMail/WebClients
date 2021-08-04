import { useRef } from 'react';
import { Route, Switch } from 'react-router-dom';
import {
    useActiveBreakpoint,
    ModalsChildren,
    ErrorBoundary,
    StandardErrorPage,
    FeatureCode,
    useFeatures,
} from '@proton/components';
import MessageProvider from './containers/MessageProvider';
import ConversationProvider from './containers/ConversationProvider';
import AttachmentProvider from './containers/AttachmentProvider';
import ComposerContainer from './containers/ComposerContainer';
import PageContainer from './containers/PageContainer';
import { MAIN_ROUTE_PATH } from './constants';
import ContactProvider from './containers/ContactProvider';
import EncryptedSearchProvider from './containers/EncryptedSearchProvider';
import { MailContentRefProvider } from './hooks/useClickMailContent';

const MainContainer = () => {
    const breakpoints = useActiveBreakpoint();
    const mailContentRef = useRef<HTMLDivElement>(null);
    useFeatures([
        FeatureCode.EarlyAccessScope,
        FeatureCode.EnabledEarlyAccessDesynchronization,
        FeatureCode.EnabledEarlyAccess,
        FeatureCode.ScheduledSend,
        FeatureCode.BundlePromoShown,
        FeatureCode.EnabledEncryptedSearch,
        FeatureCode.UsedMailMobileApp,
        FeatureCode.Mnemonic,
    ]);

    return (
        <MessageProvider>
            <ConversationProvider>
                <AttachmentProvider>
                    <ContactProvider>
                        <EncryptedSearchProvider>
                            <ModalsChildren />
                            <MailContentRefProvider mailContentRef={mailContentRef}>
                                <ComposerContainer breakpoints={breakpoints}>
                                    {({ isComposerOpened }) => (
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
                                    )}
                                </ComposerContainer>
                            </MailContentRefProvider>
                        </EncryptedSearchProvider>
                    </ContactProvider>
                </AttachmentProvider>
            </ConversationProvider>
        </MessageProvider>
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
