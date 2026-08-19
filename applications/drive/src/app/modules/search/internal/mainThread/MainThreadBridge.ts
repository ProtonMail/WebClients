import type { DriveEvent, MaybeMissingNode, NodeEntity, NodeType } from '@protontech/drive-sdk';

import { ValidationError } from '@proton/drive';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
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
            // Is the folder the problem, or just this request? Only the first is worth skipping: if
            // the folder is gone there's nothing to list, now or later. A 429 or a 5xx tells us
            // nothing about the folder, so those still need retrying.
            // TODO: the SDK should really throw something explicit like MissingNodeError here.
            const isUnlistable =
                error instanceof ValidationError &&
                // The SDK's own getNode(parent) came back empty (it throws a ValidationError with no error code :/).
                (error.code === undefined ||
                    // The children endpoint says it's gone.
                    error.code === API_CUSTOM_ERROR_CODES.NOT_FOUND ||
                    // Still there, we just can't read it anymore.
                    error.code === API_CUSTOM_ERROR_CODES.NOT_ALLOWED);
            if (isUnlistable) {
                // Treat it as empty and carry on: throwing kills the whole populator task,
                // and the folder is still in the checkpoint, so every retry hits the same error
                // and indexing never finishes.
                Logger.warn(
                    `MainThreadBridge: iterateFolderChildrenNodeUids — folder ${parentNodeUid} is not accessible, treating as childless`
                );
                return [];
            }
            throw error;
        }
        return uids;
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
