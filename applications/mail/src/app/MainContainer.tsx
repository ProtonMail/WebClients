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

const MainContainer = () => {
    const breakpoints = useActiveBreakpoint();

    return (
        <MessageProvider>
            <ConversationProvider>
                <AttachmentProvider>
                    <ContactProvider>
                        <ModalsChildren />
                        <ComposerContainer breakpoints={breakpoints}>
                            {({ onCompose }) => (
                                <Switch>
                                    <Route
                                        path={MAIN_ROUTE_PATH}
                                        render={() => <PageContainer breakpoints={breakpoints} onCompose={onCompose} />}
                                    />
                                </Switch>
                            )}
                        </ComposerContainer>
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
