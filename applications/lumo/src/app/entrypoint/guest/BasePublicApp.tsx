import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import { SafeUserProvider } from '../../contexts/SafeUserContext';
import { ConversationProvider } from '../../providers/ConversationProvider';
import { GuestTrackingProvider } from '../../providers/GuestTrackingProvider';
import { IsGuestProvider } from '../../providers/IsGuestProvider';
import { LumoPlanProvider } from '../../providers/LumoPlanProvider';
import { LumoUpsellModalProvider } from '../../upsells/providers/LumoUpsellModalProvider';
import { InnerApp } from '../InnerApp';

const BasePublicApp = () => {
    return (
        <ConversationProvider>
            <IsGuestProvider isGuest={true}>
                <LumoPlanProvider>
                    <SafeUserProvider>
                        <Router>
                            <Switch>
                                <Route path="/guest">
                                    <GuestTrackingProvider>
                                        <LumoUpsellModalProvider>
                                            <InnerApp />
                                        </LumoUpsellModalProvider>
                                    </GuestTrackingProvider>
                                </Route>
                            </Switch>
                        </Router>
                    </SafeUserProvider>
                </LumoPlanProvider>
            </IsGuestProvider>
        </ConversationProvider>
    );
};

export default BasePublicApp;
