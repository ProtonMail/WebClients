import React, { Suspense, lazy } from 'react';
import { Redirect, Route, BrowserRouter as Router, Switch, useRouteMatch } from 'react-router-dom';

import ConversationSkeleton from '../components/ConversationSkeleton';
import DebugView from '../features/dev/DebugView';
import { useLumoFlags } from '../hooks/useLumoFlags';
import { MainLayout } from '../layouts/MainLayout';
import { GhostChatProvider } from '../providers/GhostChatProvider';
import { PandocProvider } from '../providers/PandocProvider';
import { LUMO_ROUTES } from './lumoRoutes';

const ConversationPage = lazy(() =>
    import('../layouts/ConversationPage').then((m) => ({ default: m.ConversationPage }))
);
const ProjectsView = lazy(() => import('../features/projects/ProjectsView').then((m) => ({ default: m.ProjectsView })));
const ProjectDetailView = lazy(() =>
    import('../features/projects/ProjectDetailView').then((m) => ({ default: m.ProjectDetailView }))
);
const ApiDocsPage = lazy(() => import('../features/api-docs/ApiDocsPage').then((m) => ({ default: m.ApiDocsPage })));
const AiPaperTrailView = lazy(() =>
    import('../features/aiPaperTrail/AiPaperTrailView').then((m) => ({ default: m.AiPaperTrailView }))
);
const AllChatsView = lazy(() => import('../features/allChats/AllChatsView').then((m) => ({ default: m.AllChatsView })));
const SchedulesView = lazy(() =>
    import('../features/schedules/SchedulesView').then((m) => ({ default: m.SchedulesView }))
);

export function InnerApp() {
    const { url } = useRouteMatch(); // either "/guest" or "/u/:sessionId"
    const { apiKeyManagement, imageTools, artifactsView, aiPaperTrailRoute, schedules } = useLumoFlags();

    return (
        <PandocProvider>
            <Router basename={url}>
                <Switch>
                    {/* Standalone full-screen experience, rendered without the Lumo sidebar/header. */}
                    {aiPaperTrailRoute && (
                        <Route exact path={LUMO_ROUTES.AI_PAPER_TRAIL}>
                            <GhostChatProvider>
                                <Suspense fallback={<ConversationSkeleton />}>
                                    <AiPaperTrailView />
                                </Suspense>
                            </GhostChatProvider>
                        </Route>
                    )}
                    <Route>
                        <MainLayout>
                            <Suspense fallback={<ConversationSkeleton />}>
                                <Switch>
                                    <Route exact path="/projects" component={ProjectsView} />
                                    <Route path="/projects/:projectId" component={ProjectDetailView} />
                                    {artifactsView && <Route exact path="/library" component={ConversationPage} />}
                                    {imageTools && !artifactsView && (
                                        <Route exact path="/images" component={ConversationPage} />
                                    )}
                                    {/* With artifacts view, Images and Creations are Library tabs. */}
                                    {artifactsView && imageTools && (
                                        <Redirect
                                            exact
                                            from="/images"
                                            to={{ pathname: '/library', search: '?tab=images' }}
                                        />
                                    )}
                                    {artifactsView && <Redirect exact from="/creations" to="/library" />}
                                    {!artifactsView && imageTools && <Redirect exact from="/library" to="/images" />}
                                    {apiKeyManagement && <Route exact path="/docs/api" component={ApiDocsPage} />}
                                    <Route exact path="/chats" component={AllChatsView} />
                                    {schedules && <Route exact path="/schedules" component={SchedulesView} />}

                                    <Route exact path="/" component={ConversationPage} />
                                    <Route path="/c/:conversationId" component={ConversationPage} />
                                </Switch>
                            </Suspense>
                        </MainLayout>
                        <DebugView />
                    </Route>
                </Switch>
            </Router>
        </PandocProvider>
    );
}
