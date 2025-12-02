import React from 'react';
import { Route, BrowserRouter as Router, Switch, useRouteMatch } from 'react-router-dom';
import useFlag from '@proton/unleash/useFlag';
import { MainLayout } from '../ui/MainLayout';
import EligibilityGuard from '../ui/components/EligibillityGuard/EligibilityGuard';
import PerformanceMonitor from '../ui/components/PerformanceMonitor';
import { ProjectDetailView } from '../ui/projects/ProjectDetailView';
import { ProjectsView } from '../ui/projects/ProjectsView';

export type InnerAppProps = {
    conversationComponent: React.ComponentType<any>;
    headerComponent: React.ComponentType<any>;
};

export function InnerApp({ conversationComponent, headerComponent }: InnerAppProps) {
    const { url } = useRouteMatch(); // either "/guest" or "/u/:sessionId"
    const isLumoProjectsEnabled = useFlag('LumoProjects');
    return (
        <EligibilityGuard>
            <Router basename={url}>
                <MainLayout HeaderComponent={headerComponent}>
                    <Switch>
                        {isLumoProjectsEnabled &&
                            <Route exact path="/projects" component={ProjectsView} />
                        }
                        {isLumoProjectsEnabled &&
                            <Route path="/projects/:projectId" component={ProjectDetailView} />
                        }
                        <Route exact path="/" component={conversationComponent} />
                        <Route path="/c/:conversationId" component={conversationComponent} />
                    </Switch>
                </MainLayout>
                <PerformanceMonitor />
            </Router>
        </EligibilityGuard>
    );
}
