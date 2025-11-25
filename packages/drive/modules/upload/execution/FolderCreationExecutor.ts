import { NodeWithSameNameExistsValidationError } from '@protontech/drive-sdk';

import { getDrive } from '../../../index';
import type { FolderCreationTask } from '../types';
import { getNodeEntityFromMaybeNode } from '../utils/getNodeEntityFromMaybeNode';
import { TaskExecutor } from './TaskExecutor';

/**
 * Executes folder creation and emits events
 * NO store access - only emits events
 */
export class FolderCreationExecutor extends TaskExecutor<FolderCreationTask> {
    async execute(task: FolderCreationTask): Promise<void> {
        const drive = getDrive();

        try {
            const folder = await drive.createFolder(task.parentUid, task.name, task.modificationTime);
            const { node } = getNodeEntityFromMaybeNode(folder);

            this.eventCallback?.({
                type: 'folder:complete',
                uploadId: task.uploadId,
                nodeUid: node.uid,
                parentUid: node.parentUid,
            });
        } catch (error) {
            if (error instanceof NodeWithSameNameExistsValidationError) {
                this.eventCallback?.({
                    type: 'folder:conflict',
                    uploadId: task.uploadId,
                    error,
                });
            } else {
                this.eventCallback?.({
                    type: 'folder:error',
                    uploadId: task.uploadId,
                    error: error instanceof Error ? error : new Error('Folder creation failed'),
                });
            }
        }
    }
}
