import React, { Suspense, lazy } from 'react';
import { Route, Switch } from 'react-router-dom';
import { useActiveBreakpoint, LoaderPage, ModalsChildren } from 'react-components';

import MessageProvider from './containers/MessageProvider';
import ConversationProvider from './containers/ConversationProvider';
import AttachmentProvider from './containers/AttachmentProvider';
import ComposerContainer from './containers/ComposerContainer';
import PageContainer from './containers/PageContainer';
import { MAIN_ROUTE_PATH } from './constants';
import ContactProvider from './containers/ContactProvider';

const SettingsContainer = lazy(() => import('./SettingsContainer'));

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
                                    <Route path="/settings">
                                        <Suspense fallback={<LoaderPage />}>
                                            <SettingsContainer />
                                        </Suspense>
                                    </Route>
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

export default MainContainer;
