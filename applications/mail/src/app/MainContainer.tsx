import { Route } from 'react-router-dom';
import { useActiveBreakpoint } from 'react-components';

import MessageProvider from './containers/MessageProvider';
import ConversationProvider from './containers/ConversationProvider';
import AttachmentProvider from './containers/AttachmentProvider';
import ComposerContainer from './containers/ComposerContainer';
import PageContainer from './containers/PageContainer';
import React from 'react';
import { RouteProps } from './PrivateApp';

const MainContainer = () => {
    const breakpoints = useActiveBreakpoint();
    return (
        <MessageProvider>
            <ConversationProvider>
                <AttachmentProvider>
                    <ComposerContainer breakpoints={breakpoints}>
                        {({ onCompose }) => (
                            <Route
                                path="/:labelID?/:elementID?/:messageID?"
                                render={(routeProps: RouteProps) => (
                                    <PageContainer {...routeProps} breakpoints={breakpoints} onCompose={onCompose} />
                                )}
                            />
                        )}
                    </ComposerContainer>
                </AttachmentProvider>
            </ConversationProvider>
        </MessageProvider>
    );
};

export default MainContainer;
