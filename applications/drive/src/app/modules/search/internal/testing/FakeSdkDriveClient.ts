import type { MaybeNode, NodeType } from '@protontech/drive-sdk';

import type { SdkDriveClient } from '../mainThread/MainThreadBridge';

export class FakeSdkDriveClient implements SdkDriveClient {
    private rootNode: MaybeNode | undefined;
    private nodes = new Map<string, MaybeNode>();
    private tree = new Map<string, MaybeNode[]>();
    private iterateError: Error | undefined;

    setNode(nodeUid: string, node: MaybeNode): void {
        this.nodes.set(nodeUid, node);
    }

    setMyFilesRootNode(node: MaybeNode): void {
        this.rootNode = node;
    }

    setChildren(parentUid: string, children: MaybeNode[]): void {
        this.tree.set(parentUid, children);
    }

    setIterateFolderChildrenError(error: Error): void {
        this.iterateError = error;
    }

    async getNode(nodeUid: string): Promise<MaybeNode> {
        const node = this.nodes.get(nodeUid);
        if (node === undefined) {
            throw new Error(`FakeSdkDriveClient: node "${nodeUid}" not set. Call setNode() first.`);
        }
        return node;
    }

    async getMyFilesRootFolder(): Promise<MaybeNode> {
        if (this.rootNode === undefined) {
            throw new Error('FakeSdkDriveClient: rootNode not set. Call setMyFilesRootNode() first.');
        }
        return this.rootNode;
    }

    async *iterateFolderChildren(
        parentNodeUid: string,
        _filterOptions?: { type?: NodeType }
    ): AsyncIterable<MaybeNode> {
        if (this.iterateError) {
            throw this.iterateError;
        }
        const children = this.tree.get(parentNodeUid) ?? [];
        for (const child of children) {
            yield child;
        }
    }
}
