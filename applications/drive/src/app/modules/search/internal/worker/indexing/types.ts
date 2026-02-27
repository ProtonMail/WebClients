import type { MaybeNode, NodeType } from '@protontech/drive-sdk';

export interface MainThreadBridge {
    driveSdk: DriveSdkBridge;
}

export interface DriveSdkBridge {
    getMyFilesRootFolder(): Promise<MaybeNode>;
    iterateFolderChildren(parentNodeUid: string, filterOptions?: { type?: NodeType }): Promise<MaybeNode[]>;
}
