import { getNodeEntity } from '../../../../../utils/sdk/getNodeEntity';
import { Logger } from '../../Logger';
import type { MainThreadBridge } from './types';

// A dummy indexer just to test the bridge - not final implementation.
export class DummyIndexer {
    constructor(private bridge: MainThreadBridge) {
        this.bridge = bridge;
    }

    async start() {
        try {
            const maybeNode = await this.bridge.driveSdk.getMyFilesRootFolder();
            const nodeEntity = getNodeEntity(maybeNode);
            Logger.debug(`My files root folder: ${nodeEntity.node.uid}`);

            const children = await this.bridge.driveSdk.iterateFolderChildren(nodeEntity.node.uid);
            for (const node of children) {
                const currentNode = getNodeEntity(node).node;
                Logger.debug(`Indexer child found: ${currentNode.name} / ${currentNode.uid}`);

                // TODO: process metadata
                // TODO: Collect folder for recursive processing
            }
        } catch (error) {
            Logger.debug(`Indexer error: ${error}`);
        }
    }
}
