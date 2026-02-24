import React, {Suspense, lazy} from 'react';
import {Route, BrowserRouter as Router, Switch, useRouteMatch} from 'react-router-dom';

import {PandocProvider} from '../providers/PandocProvider';
import {MainLayout} from '../layouts/MainLayout';
import ConversationSkeleton from '../components/ConversationSkeleton';
import DebugView from '../features/dev/DebugView';

const ConversationPage = lazy(() => import('../layouts/ConversationPage').then((m) => ({default: m.ConversationPage})));
const ProjectsView = lazy(() => import('../features/projects/ProjectsView').then((m) => ({default: m.ProjectsView})));
const ProjectDetailView = lazy(() =>
    import('../features/projects/ProjectDetailView').then((m) => ({default: m.ProjectDetailView}))
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
                <DebugView/>
            </Router>
        </PandocProvider>
    );
}
