import type { MaybeNode, NodeType, ProtonDriveClient } from '@protontech/drive-sdk';

import { Logger } from './Logger';
import type { DriveSdkBridge as IDriveSdkBridge, MainThreadBridge as IMainThreadBridge } from './worker/indexing/types';

// Bridge for operations that require main-thread APIs (e.g. ProtonDriveClient).
// Passed to the SharedWorker as a Comlink.proxy so the worker can invoke these
// methods while the actual execution happens on the main thread.
export class MainThreadBridge implements IMainThreadBridge {
    public driveSdk: IDriveSdkBridge;

    constructor(private driveClient: ProtonDriveClient) {
        this.driveSdk = new DriveSdkBridge(this.driveClient);
    }
}

class DriveSdkBridge implements IDriveSdkBridge {
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
