import type { NodeEntity, NodeType } from '@protontech/drive-sdk';

import type { SdkDriveClient } from '../mainThread/MainThreadBridge';

export class FakeSdkDriveClient implements SdkDriveClient {
    private rootNode: NodeEntity | undefined;
    private nodes = new Map<string, NodeEntity>();
    private tree = new Map<string, NodeEntity[]>();
    private trashedNodes: NodeEntity[] = [];
    private iterateError: Error | undefined;

    setNode(nodeUid: string, node: NodeEntity): void {
        this.nodes.set(nodeUid, node);
    }

    setMyFilesRootNode(node: NodeEntity): void {
        this.rootNode = node;
    }

    setChildren(parentUid: string, children: NodeEntity[]): void {
        this.tree.set(parentUid, children);
    }

    setTrashedNodes(nodes: NodeEntity[]): void {
        this.trashedNodes = nodes;
    }

    setIterateFolderChildrenError(error: Error): void {
        this.iterateError = error;
    }

    async getNode(nodeUid: string): Promise<NodeEntity> {
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

    async *iterateFolderChildren(
        parentNodeUid: string,
        _filterOptions?: { type?: NodeType }
    ): AsyncIterable<NodeEntity> {
        if (this.iterateError) {
            throw this.iterateError;
        }
        const children = this.tree.get(parentNodeUid) ?? [];
        for (const child of children) {
            yield child;
        }
    }

    async *iterateTrashedNodes(): AsyncIterable<NodeEntity> {
        for (const node of this.trashedNodes) {
            yield node;
        }
    }
}
