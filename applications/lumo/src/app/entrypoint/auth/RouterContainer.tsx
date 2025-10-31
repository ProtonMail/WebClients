// import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import { useUser } from '@proton/account/user/hooks';
import { SubscriptionModalProvider, useConfig } from '@proton/components';

import { ConversationProvider } from '../../providers/ConversationProvider';
import { IsGuestProvider } from '../../providers/IsGuestProvider';
import { LumoPlanProvider } from '../../providers/LumoPlanProvider';
import { OnboardingProvider } from '../../providers/OnboardingProvider';
import { PrivateHeader } from '../../ui/header/PrivateHeader';
import { InteractiveConversationComponent } from '../../ui/interactiveConversation/InteractiveConversationComponent';
import { LumoUpsellModalProvider } from '../../ui/upsells/providers/LumoUpsellModalProvider';
import { InnerApp } from '../InnerApp';

export interface RouteParams {
    sessionId: string;
    conversationId: string;
}

const PrivateInteractiveConvoComponent = () => {
    const [user] = useUser();
    return <InteractiveConversationComponent user={user} />;
};

export const RouterContainer = () => {
    const { APP_NAME } = useConfig();

    return (
        <SubscriptionModalProvider app={APP_NAME}>
            <OnboardingProvider>
                <ConversationProvider>
                    <IsGuestProvider isGuest={false}>
                        <LumoPlanProvider>
                            <LumoUpsellModalProvider>
                                <Router>
                                    <Switch>
                                        <Route path="/u/:sessionId">
                                            <InnerApp
                                                headerComponent={PrivateHeader}
                                                conversationComponent={PrivateInteractiveConvoComponent}
                                            />
                                        </Route>
                                    </Switch>
                                </Router>
                            </LumoUpsellModalProvider>
                        </LumoPlanProvider>
                    </IsGuestProvider>
                </ConversationProvider>
            </OnboardingProvider>
        </SubscriptionModalProvider>
    );
};

export default RouterContainer;
