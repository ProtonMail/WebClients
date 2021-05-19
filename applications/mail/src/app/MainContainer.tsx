import React, { useRef } from 'react';
import { Route, Switch } from 'react-router-dom';
import { useActiveBreakpoint, ModalsChildren, ErrorBoundary, StandardErrorPage } from 'react-components';

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

    return (
        <MessageProvider>
            <ConversationProvider>
                <AttachmentProvider>
                    <ContactProvider>
                        <EncryptedSearchProvider>
                            <ModalsChildren />
                            <MailContentRefProvider mailContentRef={mailContentRef}>
                                <ComposerContainer breakpoints={breakpoints}>
                                    {({ onCompose, isComposerOpened }) => (
                                        <Switch>
                                            <Route
                                                path={MAIN_ROUTE_PATH}
                                                render={() => (
                                                    <PageContainer
                                                        ref={mailContentRef}
                                                        breakpoints={breakpoints}
                                                        isComposerOpened={isComposerOpened}
                                                        onCompose={onCompose}
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
