import React from 'react';
import { Route, BrowserRouter as Router, Switch, useRouteMatch } from 'react-router-dom';

import { MainLayout } from '../ui/MainLayout';
import EligibilityGuard from '../ui/components/EligibillityGuard/EligibilityGuard';

export type InnerAppProps = {
    conversationComponent: React.ComponentType<any>;
    headerComponent: React.ComponentType<any>;
};

export function InnerApp({ conversationComponent, headerComponent }: InnerAppProps) {
    const { url } = useRouteMatch(); // either "/guest" or "/u/:sessionId"
    
    return (
        <EligibilityGuard>
            <Router basename={url}>
                <MainLayout HeaderComponent={headerComponent}>
                    <Switch>
                        <Route exact path="/" component={conversationComponent} />
                        <Route path="/c/:conversationId" component={conversationComponent} />
                    </Switch>
                </MainLayout>
            </Router>
        </EligibilityGuard>
    );
}
