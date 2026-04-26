import type { DriveEvent, MaybeNode } from '@protontech/drive-sdk';

import { type EventIdStorage, MainThreadBridge } from '../mainThread/MainThreadBridge';
import type { TreeEventScopeId } from '../shared/types';
import { FakeSdkDriveClient } from './FakeSdkDriveClient';
import { FakeSearchDriveClient } from './FakeSearchDriveClient';

/**
 * In-memory fake of MainThreadBridge for testing.
 * Composes fake SDK clients with the real MainThreadBridge constructor.
 * Provides a configurable file tree and controllable tree event subscriptions.
 */
export class FakeMainThreadBridge {
    private readonly fakeDriveClient: FakeSdkDriveClient;
    private readonly fakeSearchClient: FakeSearchDriveClient;
    private readonly bridge: MainThreadBridge;

    /** Scope IDs for which fetchLastEventIdForTreeScopeId was called. */
    public readonly fetchedEventIdScopes: string[] = [];
    /** The value returned by fetchLastEventIdForTreeScopeId. Override to change behavior. */
    public fetchLastEventIdResult = { EventID: 'evt-1', Code: 1000 };
    /** Calls to saveLatestEventId as [scopeId, eventId] pairs. */
    public readonly saveLatestEventIdCalls: [string, string][] = [];

    constructor() {
        this.fakeDriveClient = new FakeSdkDriveClient();
        this.fakeSearchClient = new FakeSearchDriveClient();

        const fakeEventIdStorage: EventIdStorage = {
            saveLatestEventId: (scope: string, id: string) => {
                this.saveLatestEventIdCalls.push([scope, id]);
            },
        };

        this.bridge = new MainThreadBridge(
            this.fakeDriveClient,
            this.fakeSearchClient,
            fakeEventIdStorage,
            async (treeEventScopeId: string) => {
                this.fetchedEventIdScopes.push(treeEventScopeId);
                return this.fetchLastEventIdResult;
            },
            async () => []
        );

        // Stub OpenPGP methods with a passthrough (no real CryptoProxy in tests).
        this.bridge.cryptoProxyBridge.openpgpEncryptIndexKey = async (plaintext: string) => `fake-openpgp:${plaintext}`;
        this.bridge.cryptoProxyBridge.openpgpDecryptIndexKey = async (armored: string) =>
            armored.replace('fake-openpgp:', '');
    }

    /** Set the root node returned by getMyFilesRootFolder. */
    setMyFilesRootNode(node: MaybeNode): void {
        this.fakeDriveClient.setMyFilesRootNode(node);
    }

    /** Register a node returned by getNode(). */
    setNode(nodeUid: string, node: MaybeNode): void {
        this.fakeDriveClient.setNode(nodeUid, node);
    }

    /** Set children for a given parent node UID. */
    setChildren(parentUid: string, children: MaybeNode[]): void {
        this.fakeDriveClient.setChildren(parentUid, children);
    }

    /** Set the list of trashed nodes returned by iterateTrashedNodes. */
    setTrashedNodes(nodes: MaybeNode[]): void {
        this.fakeDriveClient.setTrashedNodes(nodes);
    }

    /** Make iterateFolderChildren throw the given error. */
    setIterateFolderChildrenError(error: Error): void {
        this.fakeDriveClient.setIterateFolderChildrenError(error);
    }

    /** Push a tree event to a subscribed scope. */
    emitEvent(scopeId: TreeEventScopeId, event: DriveEvent): void {
        this.fakeSearchClient.emitEvent(scopeId, event);
    }

    /** Check if a scope subscription was disposed. */
    wasDisposed(scopeId: TreeEventScopeId): boolean {
        return this.fakeSearchClient.wasDisposed(scopeId);
    }

    /** Returns the real MainThreadBridge instance. */
    asBridge(): MainThreadBridge {
        return this.bridge;
    }
}
