import { type HomepageDependencies, defaultHomepageMessages } from 'proton-docs/homepage';

const noop = () => {};

async function* noNodes() {
    yield* [];
}

/**
 * The homepage's dependencies a host supplies as data, mocked empty: the host renders the modals and notifications,
 * and navigates.
 */
export type MockDependencies = Omit<
    HomepageDependencies,
    'navigation' | 'openShareModal' | 'openMoveItemsModal' | 'createNotification'
>;

/** An empty Drive and recents, a free user's storage, and calls that do nothing. */
export const mockDependencies: MockDependencies = {
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
};
