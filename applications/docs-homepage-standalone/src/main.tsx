// As the Docs app: Tailwind's preflight and the page's height, Proton's page font, then the module's utilities, which
// the host loads.
import './tailwind.css';
import './fonts.css';
import 'proton-docs/homepage/tailwind.scss';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { CompatRouter } from 'react-router-dom-v5-compat';

import {
    HomepageContent,
    type HomepageDependencies,
    HomepageDependenciesProvider,
    HomepageHeader,
    HomepageLayout,
    HomepageSidebar,
    defaultHomepageMessages,
    HomepageStyleScope,
    SidebarStateProvider,
} from 'proton-docs/homepage';

const noop = () => {};
const empty = () => null;

async function* noNodes() {
    yield* [];
}

const dependencies: HomepageDependencies = {
    drive: {
        getMyFilesRootFolder: async () => ({ uid: '', name: '', treeEventScopeId: '' }),
        iterateNodes: noNodes,
        iterateTrashedNodes: noNodes,
        getNode: async () => undefined,
        getNodeHierarchy: async () => [],
        renameNode: async () => undefined,
        trashNodes: noNodes,
        restoreNodes: noNodes,
        deleteNodes: noNodes,
    } as unknown as HomepageDependencies['drive'],
    eventSubscriber: { initialize: async () => {}, reset: noop, subscribeToSharedDocument: noop },
    coreEventSubscriber: { addListener: () => noop },
    pendingInvitations: [],
    recentlyAcceptedInvitations: [],
    acceptInvitation: async () => {},
    declineInvitation: async () => {},
    reloadInvitations: noop,
    api: (async () => ({ RecentDocuments: [], Code: '1000' })) as unknown as HomepageDependencies['api'],
    logger: console,
    reportTelemetry: noop,
    createNotification: noop,
    getAppHref: (path) => path,
    dateFormat: { localeCode: 'en-US', hourCycle: 'h23' },
    errorTracking: { traceError: noop, addBreadcrumb: noop, isReportable: () => false },
    featureFlags: { bulkTrash: false, bulkMove: false },
    addresses: [],
    contactEmails: [],
    // A free user's quarter-full storage, who can upgrade.
    storage: { usedSpace: 512 * 1024 ** 2, maxSpace: 2 * 1024 ** 3, upgradeHref: '#' },
    appVersion: { version: '0.4.8.6', fullVersion: '0.4.8.6+standalone' },
    messages: defaultHomepageMessages,
    openShareModal: noop,
    openMoveItemsModal: noop,
};

function Homepage() {
    return (
        <HomepageStyleScope>
            <SidebarStateProvider>
                <HomepageDependenciesProvider dependencies={dependencies}>
                    <HomepageLayout
                        sidebar={
                            <HomepageSidebar
                                appsDropdown={empty}
                                logo={empty}
                                userDropdown={empty}
                                reportDescriptionContext={[]}
                            />
                        }
                        header={<HomepageHeader headerActions={empty} />}
                    >
                        <HomepageContent />
                    </HomepageLayout>
                </HomepageDependenciesProvider>
            </SidebarStateProvider>
        </HomepageStyleScope>
    );
}

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <CompatRouter>
            <Switch>
                <Route path={['/recents', '/trash']} component={Homepage} />
                <Redirect to="/recents" />
            </Switch>
        </CompatRouter>
    </BrowserRouter>
);
