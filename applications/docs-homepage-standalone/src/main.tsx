import { createRoot } from 'react-dom/client';
import { BrowserRouter, NavLink, Redirect, Route, Switch } from 'react-router-dom';
import { CompatRouter } from 'react-router-dom-v5-compat';

import {
    HomepageContent,
    type HomepageDependencies,
    HomepageDependenciesProvider,
    HomepageHeader,
    type HomepageHeaderComponentProps,
    HomepageSidebar,
    type HomepageSidebarComponentProps,
    type HomepageSidebarListItemLinkComponentProps,
    defaultHomepageMessages,
    HomepageStyleScope,
    SidebarStateProvider,
} from 'proton-docs/homepage';

import './tailwind.css';

// Standalone host: every dependency the module needs, empty. Nothing here is interactive.

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
    messages: defaultHomepageMessages,
    openShareModal: noop,
    openMoveItemsModal: noop,
};

// Stand-ins for the Proton components the real host injects.

function Header({ title, actionArea, userDropdown }: HomepageHeaderComponentProps) {
    return (
        <header className="flex items-center gap-4 p-2">
            <strong>{title}</strong>
            {actionArea}
            {userDropdown}
        </header>
    );
}

function Sidebar({ logo, primary, children, version }: HomepageSidebarComponentProps) {
    return (
        <aside className="flex w-64 shrink-0 flex-col gap-2 p-2">
            {logo}
            {primary}
            {children}
            {version}
        </aside>
    );
}

function SidebarListItemLink({
    children,
    itemClassName,
    className,
    forceReload,
    ...props
}: HomepageSidebarListItemLinkComponentProps) {
    return (
        <NavLink {...props} className={className}>
            {children}
        </NavLink>
    );
}

function Homepage() {
    return (
        <HomepageStyleScope>
            <SidebarStateProvider>
                <HomepageDependenciesProvider dependencies={dependencies}>
                    <div className="flex h-screen">
                        <HomepageSidebar
                            appsDropdown={empty}
                            appVersionComponent={empty}
                            logo={empty}
                            protonSidebar={Sidebar}
                            sidebarListItemLink={SidebarListItemLink}
                            appVersion=""
                        />
                        <main className="flex min-w-0 grow flex-col">
                            <HomepageHeader protonHeader={Header} userDropdown={empty} reportDescriptionContext={[]} />
                            <HomepageContent />
                        </main>
                    </div>
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
