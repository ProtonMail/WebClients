import React from 'react';
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

const MainContainer = () => {
    const breakpoints = useActiveBreakpoint();

    return (
        <MessageProvider>
            <ConversationProvider>
                <AttachmentProvider>
                    <ContactProvider>
                        <EncryptedSearchProvider>
                            <ModalsChildren />
                            <ComposerContainer breakpoints={breakpoints}>
                                {({ onCompose, isComposerOpened }) => (
                                    <Switch>
                                        <Route
                                            path={MAIN_ROUTE_PATH}
                                            render={() => (
                                                <PageContainer
                                                    breakpoints={breakpoints}
                                                    isComposerOpened={isComposerOpened}
                                                    onCompose={onCompose}
                                                />
                                            )}
                                        />
                                    </Switch>
                                )}
                            </ComposerContainer>
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
