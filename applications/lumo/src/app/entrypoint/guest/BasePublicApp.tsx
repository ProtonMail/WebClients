import { Redirect, Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import { SafeUserProvider } from '../../contexts/SafeUserContext';
import { ConversationProvider } from '../../providers/ConversationProvider';
import { UsageLimitsTierSync } from '../../providers/UsageLimitsTierSync';
import { IsGuestProvider } from '../../providers/IsGuestProvider';
import { LumoPlanProvider } from '../../providers/LumoPlanProvider';
import { LumoUpsellModalProvider } from '../../upsells/providers/LumoUpsellModalProvider';
import { LUMO_ROUTES } from '../lumoRoutes';
import { AgentApp } from '../AgentApp';
import { InnerApp } from '../InnerApp';

const BasePublicApp = () => {
    return (
        <ConversationProvider>
            <IsGuestProvider isGuest={true}>
                <LumoPlanProvider>
                    <SafeUserProvider>
                        <Router>
                            <Switch>
                                <Route exact path={LUMO_ROUTES.AI_PAPER_TRAIL}>
                                    <Redirect to={`${LUMO_ROUTES.GUEST}${LUMO_ROUTES.AI_PAPER_TRAIL}`} />
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
