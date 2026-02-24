// import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import { SubscriptionModalProvider, useConfig } from '@proton/components';

import { SafeUserProvider } from '../../contexts/SafeUserContext';
import { ConversationProvider } from '../../providers/ConversationProvider';
import { IsGuestProvider } from '../../providers/IsGuestProvider';
import { LumoPlanProvider } from '../../providers/LumoPlanProvider';
import { OnboardingProvider } from '../../providers/OnboardingProvider';
import { LumoUpsellModalProvider } from '../../upsells/providers/LumoUpsellModalProvider';
import { InnerApp } from '../InnerApp';

export interface RouteParams {
    sessionId: string;
    conversationId: string;
}

export const RouterContainer = () => {
    const { APP_NAME } = useConfig();

    return (
        <SubscriptionModalProvider app={APP_NAME}>
            <OnboardingProvider>
                <ConversationProvider>
                    <IsGuestProvider isGuest={false}>
                        <LumoPlanProvider>
                            <LumoUpsellModalProvider>
                                <SafeUserProvider>
                                    <Router>
                                        <Switch>
                                            <Route path="/u/:sessionId">
                                                <InnerApp />
                                            </Route>
                                        </Switch>
                                    </Router>
                                </SafeUserProvider>
                            </LumoUpsellModalProvider>
                        </LumoPlanProvider>
                    </IsGuestProvider>
                </ConversationProvider>
            </OnboardingProvider>
        </SubscriptionModalProvider>
    );
};

export default RouterContainer;
