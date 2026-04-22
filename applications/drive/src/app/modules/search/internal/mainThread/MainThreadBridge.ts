import type { DriveEvent, MaybeNode, NodeType } from '@protontech/drive-sdk';

import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { Logger } from '../shared/Logger';
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
    getMyFilesRootFolder(): Promise<MaybeNode>;
    getNode(nodeUid: string): Promise<MaybeNode>;
    iterateFolderChildren(parentNodeUid: string, filterOptions?: { type?: NodeType }): AsyncIterable<MaybeNode>;
    iterateTrashedNodes(): AsyncIterable<MaybeNode>;
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
    getMyFilesRootFolder(): Promise<MaybeNode>;
    getNode(nodeUid: string): Promise<MaybeNode>;
    iterateFolderChildren(parentNodeUid: string, filterOptions?: { type?: NodeType }): Promise<MaybeNode[]>;
    iterateTrashedNodes(): Promise<MaybeNode[]>;
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
    }

    // AbortController can't be serialized across Comlink, so we create a fresh one here.
    async fetchLastEventIdForTreeScopeId(treeEventScopeId: string): Promise<{ EventID: string; Code: number }> {
        Logger.info(`MainThreadBridge: fetchLastEventIdForTreeScopeId for scope ${treeEventScopeId}`);
        return this.fetchLastEventIdFn(treeEventScopeId, new AbortController());
    }

    updateLatestEventId(treeEventScopeId: string, eventId: string): void {
        this.latestEventIdProvider.saveLatestEventId(treeEventScopeId, eventId);
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

    async iterateFolderChildren(parentNodeUid: string, filterOptions?: { type?: NodeType }) {
        Logger.info('MainThreadBridge: iterateFolderChildren');
        const nodes: MaybeNode[] = [];
        for await (const node of this.driveClient.iterateFolderChildren(parentNodeUid, filterOptions)) {
            nodes.push(node);
        }
        return nodes;
    }

    async iterateTrashedNodes() {
        Logger.info('MainThreadBridge: iterateTrashedNodes');
        const nodes: MaybeNode[] = [];
        for await (const node of this.driveClient.iterateTrashedNodes()) {
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
