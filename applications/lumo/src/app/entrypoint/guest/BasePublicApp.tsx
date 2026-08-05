import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import { SafeUserProvider } from '../../contexts/SafeUserContext';
import { ConversationProvider } from '../../providers/ConversationProvider';
import { IsGuestProvider } from '../../providers/IsGuestProvider';
import { LumoPlanProvider } from '../../providers/LumoPlanProvider';
import { UsageLimitsTierSync } from '../../providers/UsageLimitsTierSync';
import { LumoUpsellModalProvider } from '../../upsells/providers/LumoUpsellModalProvider';
import { AgentApp } from '../AgentApp';
import { AiPaperTrailApp } from '../AiPaperTrailApp';
import { InnerApp } from '../InnerApp';
import { LUMO_ROUTES } from '../lumoRoutes';

const BasePublicApp = () => {
    return (
        <ConversationProvider>
            <IsGuestProvider isGuest={true}>
                <LumoPlanProvider>
                    <SafeUserProvider>
                        <Router>
                            <Switch>
                                <Route exact path={LUMO_ROUTES.AI_PAPER_TRAIL}>
                                    <LumoUpsellModalProvider>
                                        <UsageLimitsTierSync />
                                        <AiPaperTrailApp />
                                    </LumoUpsellModalProvider>
                                </Route>
                                <Route path="/agent">
                                    <LumoUpsellModalProvider>
                                        <UsageLimitsTierSync />
                                        <AgentApp />
                                    </LumoUpsellModalProvider>
                                </Route>
                                <Route path="/guest">
                                    <LumoUpsellModalProvider>
                                        <UsageLimitsTierSync />
                                        <InnerApp />
                                    </LumoUpsellModalProvider>
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
