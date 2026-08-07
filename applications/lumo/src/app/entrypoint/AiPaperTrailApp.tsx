import { Suspense, lazy } from 'react';
import { Redirect, Route, BrowserRouter as Router, useRouteMatch } from 'react-router-dom';

import ConversationSkeleton from '../components/ConversationSkeleton';
import { useLumoFlags } from '../hooks/useLumoFlags';
import { GhostChatProvider } from '../providers/GhostChatProvider';
import { PandocProvider } from '../providers/PandocProvider';
import { LUMO_ROUTES } from './lumoRoutes';

const AiPaperTrailView = lazy(() =>
    import('../features/aiPaperTrail/AiPaperTrailView').then((m) => ({ default: m.AiPaperTrailView }))
);

/**
 * Standalone entry for the AI Paper Trail campaign at `/aitrail`.
 * Mirrors {@link AgentApp}: a root-level public surface without the `/guest` prefix.
 */
export function AiPaperTrailApp() {
    const { url } = useRouteMatch();
    const { aiPaperTrailRoute } = useLumoFlags();

    if (!aiPaperTrailRoute) {
        return <Redirect to={LUMO_ROUTES.GUEST} />;
    }

    return (
        <PandocProvider>
            <Router basename={url}>
                <GhostChatProvider>
                    <Suspense fallback={<ConversationSkeleton />}>
                        <Route exact path="/" component={AiPaperTrailView} />
                    </Suspense>
                </GhostChatProvider>
            </Router>
        </PandocProvider>
    );
}
