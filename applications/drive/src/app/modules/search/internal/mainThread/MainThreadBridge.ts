import type { DriveEvent, MaybeMissingNode, NodeEntity, NodeType } from '@protontech/drive-sdk';

import { ValidationError } from '@proton/drive';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { Logger } from '../shared/Logger';
import { type SearchMetrics, searchMetrics } from '../shared/searchMetrics';
import type { TreeEventScopeId } from '../shared/types';
import { CryptoProxyBridge } from './CryptoProxyBridge';

export type FetchLastEventIdForTreeScopeId = (
    treeEventScopeId: string,
    abortSignal: AbortController
) => Promise<{
    EventID: string;
    Code: number;
}>;

/** Subset of ProtonDriveClient used by DriveSdkBridge. */
export interface SdkDriveClient {
    getMyFilesRootFolder(): Promise<NodeEntity>;
    getNode(nodeUid: string): Promise<NodeEntity>;
    iterateFolderChildrenNodeUids(parentNodeUid: string, filterOptions?: { type?: NodeType }): AsyncIterable<string>;
    iterateNodes(uids: string[]): AsyncIterable<MaybeMissingNode>;
}

/** Subset of ProtonDriveClient used by DriveSdkForSearchBridge. */
export interface SearchDriveClient {
    subscribeToTreeEvents(
        treeEventScopeId: string,
        callback: (event: DriveEvent) => Promise<void>
    ): Promise<{ dispose(): void }>;
}

/** Subset of LatestEventIdProvider used by MainThreadBridge. */
export interface EventIdStorage {
    saveLatestEventId(treeEventScopeId: string, eventId: string): void;
}

export interface DriveSdkBridgeInterface {
    getMyFilesRootFolder(): Promise<NodeEntity>;
    getNode(nodeUid: string): Promise<NodeEntity>;
    iterateFolderChildrenNodeUids(parentNodeUid: string, filterOptions?: { type?: NodeType }): Promise<string[]>;
    iterateNodes(uids: string[]): Promise<NodeEntity[]>;
}

// Bridge for operations that require main-thread APIs (e.g. ProtonDriveClient).
// Passed to the SharedWorker as a Comlink.proxy so the worker can invoke these
// methods while the actual execution happens on the main thread.
export class MainThreadBridge {
    public readonly driveSdk: DriveSdkBridgeInterface;
    public readonly driveSdkForSearch: DriveSdkForSearchBridge;
    public readonly cryptoProxyBridge: CryptoProxyBridge;
    private readonly fetchLastEventIdFn: FetchLastEventIdForTreeScopeId;
    private readonly latestEventIdProvider: EventIdStorage;

    constructor(
        driveClient: SdkDriveClient,
        driveClientForSearchEvents: SearchDriveClient,
        latestEventIdProvider: EventIdStorage,
        fetchLastEventIdForTreeScopeId: FetchLastEventIdForTreeScopeId,
        getUserKeys: () => Promise<DecryptedKey[]>
    ) {
        this.driveSdk = new DriveSdkBridge(driveClient);
        this.driveSdkForSearch = new DriveSdkForSearchBridge(driveClientForSearchEvents);
        this.cryptoProxyBridge = new CryptoProxyBridge(getUserKeys);
        this.latestEventIdProvider = latestEventIdProvider;
        this.fetchLastEventIdFn = fetchLastEventIdForTreeScopeId;

        // Bind methods so they survive Comlink proxy dispatch (which loses `this`).
        this.fetchLastEventIdForTreeScopeId = this.fetchLastEventIdForTreeScopeId.bind(this);
        this.updateLatestEventId = this.updateLatestEventId.bind(this);
        this.dispatchSearchMetric = this.dispatchSearchMetric.bind(this);
    }

    // AbortController can't be serialized across Comlink, so we create a fresh one here.
    async fetchLastEventIdForTreeScopeId(treeEventScopeId: string): Promise<{ EventID: string; Code: number }> {
        Logger.info(`MainThreadBridge: fetchLastEventIdForTreeScopeId for scope ${treeEventScopeId}`);
        return this.fetchLastEventIdFn(treeEventScopeId, new AbortController());
    }

    updateLatestEventId(treeEventScopeId: string, eventId: string): void {
        this.latestEventIdProvider.saveLatestEventId(treeEventScopeId, eventId);
    }

    /**
     * Forward a search-metric event from the worker to the main-thread `searchMetrics`.
     */
    dispatchSearchMetric<K extends keyof SearchMetrics>(method: K, args: Parameters<SearchMetrics[K]>[0]): void {
        (searchMetrics[method] as (input: typeof args) => void)(args);
    }
}

export class DriveSdkBridge {
    constructor(private driveClient: SdkDriveClient) {}
    async getMyFilesRootFolder() {
        Logger.info('MainThreadBridge: getMyFilesRootFolder');
        return this.driveClient.getMyFilesRootFolder();
    }

    async getNode(nodeUid: string) {
        Logger.info(`MainThreadBridge: getNode ${nodeUid}`);
        return this.driveClient.getNode(nodeUid);
    }

    async iterateFolderChildrenNodeUids(parentNodeUid: string, filterOptions?: { type?: NodeType }) {
        Logger.info('MainThreadBridge: iterateFolderChildrenNodeUids');
        const uids: string[] = [];
        try {
            for await (const uid of this.driveClient.iterateFolderChildrenNodeUids(parentNodeUid, filterOptions)) {
                uids.push(uid);
            }
        } catch (error) {
            // The SDK validates the parent still exists before listing children and throws instead
            // of returning a missing marker. A folder that vanished between being queued and being
            // walked (concurrent delete/move) is treated as childless so the walk continues. Confirm
            // via a direct getNode call rather than assuming from the ValidationError alone: a
            // ValidationError can also mean pagination failed partway through a folder that still
            // exists, which must still surface as an error rather than silently truncate its children.
            if (error instanceof ValidationError && (await this.isNodeGone(parentNodeUid))) {
                Logger.warn(
                    `MainThreadBridge: iterateFolderChildrenNodeUids — folder ${parentNodeUid} not found (deleted or no permissions), treating as childless`
                );
                return [];
            }
            throw error;
        }
        return uids;
    }

    /**
     * Confirms a node is genuinely gone (vs. some other validation-shaped failure while it still
     * exists) by re-fetching it directly. Any other error while confirming (e.g. network) is treated
     * as inconclusive so the original error is surfaced instead of guessing.
     * TODO: Ideally the SDK should throw a more expressive/explicit "MissingNodeError" instead.
     */
    private async isNodeGone(nodeUid: string): Promise<boolean> {
        try {
            await this.driveClient.getNode(nodeUid);
            return false;
        } catch (error) {
            return error instanceof ValidationError;
        }
    }

    async iterateNodes(uids: string[]) {
        Logger.info('MainThreadBridge: iterateNodes');
        const nodes: NodeEntity[] = [];
        for await (const node of this.driveClient.iterateNodes(uids)) {
            if ('missingUid' in node) {
                Logger.warn(`MainThreadBridge: iterateNodes — node ${node.missingUid} not found, skipping`);
                continue;
            }
            nodes.push(node);
        }
        return nodes;
    }
}

export class DriveSdkForSearchBridge {
    private activeSubscriptions = new Map<TreeEventScopeId, { dispose(): void }>();

    constructor(private readonly driveClient: SearchDriveClient) {}

    async subscribeToTreeEvents(
        treeEventScopeId: TreeEventScopeId,
        onEvent: (event: DriveEvent) => void
    ): Promise<void> {
        Logger.info(`DriveSdkForSearchBridge: subscribing to tree events for scope ${treeEventScopeId}`);

        if (this.activeSubscriptions.has(treeEventScopeId)) {
            Logger.warn(`Duplicate tree event subscription for scope ${treeEventScopeId}`);
        }

        const subscription = await this.driveClient.subscribeToTreeEvents(
            treeEventScopeId,
            async (event: DriveEvent) => {
                onEvent(event);
            }
        );

        this.activeSubscriptions.set(treeEventScopeId, subscription);
    }

    disposeTreeEventSubscription(treeEventScopeId: TreeEventScopeId): void {
        const subscription = this.activeSubscriptions.get(treeEventScopeId);
        if (!subscription) {
            Logger.info(
                `DriveSdkForSearchBridge: no active subscription for scope ${treeEventScopeId}, nothing to dispose`
            );
            return;
        }

        Logger.info(`DriveSdkForSearchBridge: disposing tree event subscription for scope ${treeEventScopeId}`);
        subscription.dispose();
        this.activeSubscriptions.delete(treeEventScopeId);
    }
}
