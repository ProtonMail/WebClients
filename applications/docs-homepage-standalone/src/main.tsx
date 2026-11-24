// As the Docs app: Tailwind's preflight and the page's height, Proton's page font, then the module's utilities, which
// the host loads.
import './tailwind.css';
import './fonts.css';
import 'proton-docs/homepage/tailwind.scss';
import { useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';

import {
    HomepageContent,
    type HomepageDependencies,
    HomepageDependenciesProvider,
    HomepageHeader,
    type HomepageNavigation,
    type HomepageRoute,
    HomepageLayout,
    HomepageSidebar,
    defaultHomepageMessages,
    formatHomepageParams,
    HomepageStyleScope,
    parseHomepageParams,
    SidebarStateProvider,
} from 'proton-docs/homepage';

const noop = () => {};
const empty = () => null;

async function* noNodes() {
    yield* [];
}

// The homepage's navigation on the window's history, as realtime's editor demos keep their address.
const historyListeners = new Set<() => void>();
window.addEventListener('popstate', () => historyListeners.forEach((listener) => listener()));

function subscribeToHistory(listener: () => void) {
    historyListeners.add(listener);
    return () => historyListeners.delete(listener);
}

function getHref({ view, params }: HomepageRoute) {
    const search = formatHomepageParams(params);
    return `/${view}${search && `?${search}`}`;
}

const navigate: HomepageNavigation['navigate'] = (to, { replace = false } = {}) => {
    window.history[replace ? 'replaceState' : 'pushState'](null, '', getHref(to));
    historyListeners.forEach((listener) => listener());
};

let route: HomepageRoute | undefined;
let routeHref = '';
function getRoute() {
    const href = window.location.pathname + window.location.search;
    if (!route || href !== routeHref) {
        routeHref = href;
        route = {
            view: window.location.pathname === '/trash' ? 'trash' : 'recents',
            params: parseHomepageParams(window.location.search),
        };
    }
    return route;
}

if (!['/recents', '/trash'].includes(window.location.pathname)) {
    window.history.replaceState(null, '', '/recents');
}

const dependencies: Omit<HomepageDependencies, 'navigation'> = {
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
    const navigation = { route: useSyncExternalStore(subscribeToHistory, getRoute), navigate, getHref };
    return (
        <HomepageStyleScope>
            <SidebarStateProvider>
                <HomepageDependenciesProvider dependencies={{ ...dependencies, navigation }}>
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

createRoot(document.getElementById('root')!).render(<Homepage />);
