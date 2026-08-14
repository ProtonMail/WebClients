import type { NodeEntity, NodeType } from '@protontech/drive-sdk';

import type { SdkDriveClient } from '../mainThread/MainThreadBridge';

export class FakeSdkDriveClient implements SdkDriveClient {
    private rootNode: NodeEntity | undefined;
    private nodes = new Map<string, NodeEntity>();
    private tree = new Map<string, NodeEntity[]>();
    private iterateError: Error | undefined;
    private failNextIterateFolders = new Map<string, Error>();
    private getNodeErrors = new Map<string, Error>();
    private iterateNodesErrors = new Map<string, Error>();

    setNode(nodeUid: string, node: NodeEntity): void {
        this.nodes.set(nodeUid, node);
    }

    setMyFilesRootNode(node: NodeEntity): void {
        this.rootNode = node;
    }

    setChildren(parentUid: string, children: NodeEntity[]): void {
        this.tree.set(parentUid, children);
    }

    setIterateError(error: Error): void {
        this.iterateError = error;
    }

    /** Make the NEXT children-iteration for this folder throw once, then succeed (transient failure). */
    failNextIterateForFolder(folderUid: string, error: Error): void {
        this.failNextIterateFolders.set(folderUid, error);
    }

    /** Make getNode(uid) throw the given error until cleared (e.g. a node-scoped decryption failure). */
    setGetNodeError(nodeUid: string, error: Error): void {
        this.getNodeErrors.set(nodeUid, error);
    }

    /** Clear a forced getNode failure so the node can be fetched again. */
    clearGetNodeError(nodeUid: string): void {
        this.getNodeErrors.delete(nodeUid);
    }

    /** Make iterateNodes throw when this uid is in the batch (a node that cannot be loaded at all). */
    setIterateNodesError(nodeUid: string, error: Error): void {
        this.iterateNodesErrors.set(nodeUid, error);
    }

    /** Clear a forced iterateNodes failure so the node can be loaded again. */
    clearIterateNodesError(nodeUid: string): void {
        this.iterateNodesErrors.delete(nodeUid);
    }

    async getNode(nodeUid: string): Promise<NodeEntity> {
        const forcedError = this.getNodeErrors.get(nodeUid);
        if (forcedError) {
            throw forcedError;
        }
        const node = this.nodes.get(nodeUid);
        if (node === undefined) {
            throw new Error(`FakeSdkDriveClient: node "${nodeUid}" not set. Call setNode() first.`);
        }
        return node;
    }

    async getMyFilesRootFolder(): Promise<NodeEntity> {
        if (this.rootNode === undefined) {
            throw new Error('FakeSdkDriveClient: rootNode not set. Call setMyFilesRootNode() first.');
        }
        return this.rootNode;
    }

    async *iterateFolderChildrenNodeUids(
        parentNodeUid: string,
        _filterOptions?: { type?: NodeType }
    ): AsyncIterable<string> {
        if (this.iterateError) {
            throw this.iterateError;
        }
        const oneShotError = this.failNextIterateFolders.get(parentNodeUid);
        if (oneShotError) {
            this.failNextIterateFolders.delete(parentNodeUid);
            throw oneShotError;
        }
        const children = this.tree.get(parentNodeUid) ?? [];
        for (const child of children) {
            yield child.uid;
        }
    }

    async *iterateNodes(uids: string[]): AsyncIterable<NodeEntity> {
        for (const uid of uids) {
            // Kept separate from getNodeErrors: a folder can be listable-but-not-directly-fetchable
            // (the vanished-folder confirmation path), so the two must be controllable independently.
            const forcedError = this.iterateNodesErrors.get(uid);
            if (forcedError) {
                throw forcedError;
            }
            const node = this.nodes.get(uid);
            if (node !== undefined) {
                yield node;
                continue;
            }
            // Fallback: scan tree so tests that only call setChildren still work.
            for (const children of this.tree.values()) {
                const found = children.find((c) => c.uid === uid);
                if (found) {
                    yield found;
                    break;
                }
            }
        }
    }
}
