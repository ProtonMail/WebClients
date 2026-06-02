import { Suspense, lazy } from 'react';
import { Route, BrowserRouter as Router, Switch, useRouteMatch } from 'react-router-dom';

import ConversationSkeleton from '../components/ConversationSkeleton';
import { GhostChatProvider } from '../providers/GhostChatProvider';
import { PandocProvider } from '../providers/PandocProvider';
import { SearchModalProvider } from '../providers/SearchModalProvider';
import { SidebarProvider } from '../providers/SidebarProvider';

const AgentPage = lazy(() => import('../components/Agent/AgentPage').then((m) => ({ default: m.AgentPage })));

/**
 * Minimal layout for the `/agent` surface: just the chat, no sidebar, no marketing chrome.
 * The shared chat components still expect a few providers (ghost chat, sidebar state,
 * search modal), so we mount those without ever rendering the sidebar itself.
 */
const AgentLayout = ({ children }: { children: React.ReactNode }) => (
    <GhostChatProvider>
        <SidebarProvider>
            <SearchModalProvider>
                <div className="relative flex flex-column flex-nowrap h-full w-full overflow-hidden reset4print">
                    <main className="flex-1 flex flex-column flex-nowrap min-h-0">{children}</main>
                </div>
            </SearchModalProvider>
        </SidebarProvider>
    </GhostChatProvider>
);

/**
 * Entry point for the simplified, single-agent chatbot route (`/agent?skill=<agentId>`).
 * Mirrors {@link InnerApp} but deliberately omits the sidebar and the new-chat marketing view.
 */
export function AgentApp() {
    const { url } = useRouteMatch(); // "/agent"

    return (
        <PandocProvider>
            <Router basename={url}>
                <AgentLayout>
                    <Suspense fallback={<ConversationSkeleton />}>
                        <Switch>
                            <Route exact path="/" component={AgentPage} />
                            <Route path="/c/:conversationId" component={AgentPage} />
                        </Switch>
                    </Suspense>
                </AgentLayout>
            </Router>
        </PandocProvider>
    );
}
