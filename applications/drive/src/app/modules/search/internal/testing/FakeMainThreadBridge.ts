import type { DriveEvent, NodeEntity } from '@protontech/drive-sdk';

import { type EventIdStorage, MainThreadBridge } from '../mainThread/MainThreadBridge';
import type { SearchMetrics } from '../shared/searchMetrics';
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

        // Comlink structured-clones every argument crossing the worker -> main-thread boundary,
        // which strips Error subclass identity (prototype, `name`, and own properties like
        // `status`). Mirror that here so tests exercise the real serialization boundary instead
        // of passing objects by reference - otherwise a metric that misclassifies a bridged
        // error looks fine in tests and reports the wrong kind in production.
        // Caveat: jsdom's DOMException degrades to a bare object under Node's structuredClone,
        // where a real browser preserves its `name`. Don't assert on a bridged DOMException.
        const dispatchSearchMetric = this.bridge.dispatchSearchMetric;
        this.bridge.dispatchSearchMetric = <K extends keyof SearchMetrics>(
            method: K,
            args: Parameters<SearchMetrics[K]>[0]
        ) => dispatchSearchMetric(method, structuredClone(args));
    }

    /** Set the root node returned by getMyFilesRootFolder. */
    setMyFilesRootNode(node: NodeEntity): void {
        this.fakeDriveClient.setMyFilesRootNode(node);
    }

    /** Register a node returned by getNode(). */
    setNode(nodeUid: string, node: NodeEntity): void {
        this.fakeDriveClient.setNode(nodeUid, node);
    }

    /** Set children for a given parent node UID. */
    setChildren(parentUid: string, children: NodeEntity[]): void {
        this.fakeDriveClient.setChildren(parentUid, children);
    }

    /** Make iterateFolderChildrenNodeUids and iterateNodes throw the given error. */
    setIterateError(error: Error): void {
        this.fakeDriveClient.setIterateError(error);
    }

    /** Make the next children-iteration for a folder throw once, then succeed (transient failure). */
    failNextIterateForFolder(folderUid: string, error: Error): void {
        this.fakeDriveClient.failNextIterateForFolder(folderUid, error);
    }

    /** Force getNode(uid) to throw the given error until cleared (e.g. a decryption failure). */
    setGetNodeError(nodeUid: string, error: Error): void {
        this.fakeDriveClient.setGetNodeError(nodeUid, error);
    }

    /** Clear a forced getNode failure so the node can be fetched again. */
    clearGetNodeError(nodeUid: string): void {
        this.fakeDriveClient.clearGetNodeError(nodeUid);
    }

    /** Make iterateNodes throw when this uid is in the batch (a node that cannot be loaded at all). */
    setIterateNodesError(nodeUid: string, error: Error): void {
        this.fakeDriveClient.setIterateNodesError(nodeUid, error);
    }

    /** Clear a forced iterateNodes failure so the node can be loaded again. */
    clearIterateNodesError(nodeUid: string): void {
        this.fakeDriveClient.clearIterateNodesError(nodeUid);
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
