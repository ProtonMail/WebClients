import React, {Suspense, lazy} from 'react';
import {Route, BrowserRouter as Router, Switch, useRouteMatch} from 'react-router-dom';

import {PandocProvider} from '../providers/PandocProvider';
import {MainLayout} from '../ui/MainLayout';
import ConversationSkeleton from '../ui/components/ConversationSkeleton';
import PerformanceMonitor from '../ui/components/PerformanceMonitor';

const ConversationPage = lazy(() => import('../pages/ConversationPage').then((m) => ({default: m.ConversationPage})));
const ProjectsView = lazy(() => import('../ui/projects/ProjectsView').then((m) => ({default: m.ProjectsView})));
const ProjectDetailView = lazy(() =>
    import('../ui/projects/ProjectDetailView').then((m) => ({default: m.ProjectDetailView}))
);

export function InnerApp() {
    const {url} = useRouteMatch(); // either "/guest" or "/u/:sessionId"

    return (

        <PandocProvider>
            <Router basename={url}>
                <MainLayout>
                    <Suspense fallback={<ConversationSkeleton/>}>
                        <Switch>
                            <Route exact path="/projects" component={ProjectsView}/>
                            <Route path="/projects/:projectId" component={ProjectDetailView}/>
                            <Route exact path="/" component={ConversationPage}/>
                            <Route path="/c/:conversationId" component={ConversationPage}/>
                        </Switch>
                    </Suspense>
                </MainLayout>
                <PerformanceMonitor/>
            </Router>
        </PandocProvider>
    );
}
