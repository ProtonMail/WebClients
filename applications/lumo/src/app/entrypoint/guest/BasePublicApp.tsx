import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import { ConversationProvider } from '../../providers/ConversationProvider';
import { GuestTrackingProvider } from '../../providers/GuestTrackingProvider';
import { PublicHeader } from '../../ui/header/PublicHeader';
import { InteractiveConversationComponent } from '../../ui/interactiveConversation/InteractiveConversationComponent';
import { LumoUpsellModalProvider } from '../../ui/upsells/providers/LumoUpsellModalProvider';
import { InnerApp } from '../InnerApp';

const BasePublicApp = () => {
    return (
        <ConversationProvider>
            <Router>
                <Switch>
                    <Route path="/guest">
                        <GuestTrackingProvider>
                            <LumoUpsellModalProvider>
                                <InnerApp
                                    headerComponent={PublicHeader}
                                    conversationComponent={InteractiveConversationComponent}
                                />
                            </LumoUpsellModalProvider>
                        </GuestTrackingProvider>
                    </Route>
                </Switch>
            </Router>
        </ConversationProvider>
    );
};

export default BasePublicApp;
