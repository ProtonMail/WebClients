import type { MaybeNode, NodeType, ProtonDriveClient } from '@protontech/drive-sdk';

import { Logger } from './Logger';

export interface DriveSdkBridge {
    getMyFilesRootFolder(): Promise<MaybeNode>;
    iterateFolderChildren(parentNodeUid: string, filterOptions?: { type?: NodeType }): Promise<MaybeNode[]>;
}

// Bridge for operations that require main-thread APIs (e.g. ProtonDriveClient).
// Passed to the SharedWorker as a Comlink.proxy so the worker can invoke these
// methods while the actual execution happens on the main thread.
// TODO: Rename to MainThreadCallbacks for clarity.
export class MainThreadBridge {
    public readonly driveSdk: DriveSdkBridge;

    constructor(driveClient: ProtonDriveClient) {
        this.driveSdk = new DriveSdkBridge(driveClient);
    }
}

export class DriveSdkBridge {
    constructor(private driveClient: ProtonDriveClient) {}
    async getMyFilesRootFolder() {
        Logger.info('MainThreadBridge: getMyFilesRootFolder');
        return this.driveClient.getMyFilesRootFolder();
    }

    async iterateFolderChildren(parentNodeUid: string, filterOptions?: { type?: NodeType }) {
        Logger.info('MainThreadBridge: iterateFolderChildren');
        const nodes: MaybeNode[] = [];
        for await (const node of this.driveClient.iterateFolderChildren(parentNodeUid, filterOptions)) {
            nodes.push(node);
        }
        return nodes;
    }
}
