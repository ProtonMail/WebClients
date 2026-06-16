import { NodeWithSameNameExistsValidationError } from '@protontech/drive-sdk';

import { UploadDriveClientRegistry } from '../UploadDriveClientRegistry';
import type { FolderCreationTask } from '../types';
import { TaskExecutor } from './TaskExecutor';

/**
 * Executes folder creation and emits events
 * NO store access - only emits events
 */
export class FolderCreationExecutor extends TaskExecutor<FolderCreationTask> {
    async execute(task: FolderCreationTask): Promise<void> {
        const drive = UploadDriveClientRegistry.getDriveClient();

        try {
            const folder = await drive.createFolder(task.parentUid, task.name, task.modificationTime);

            void this.eventCallback?.({
                type: 'folder:complete',
                uploadId: task.uploadId,
                nodeUid: folder.uid,
                parentUid: folder.parentUid,
            });
        } catch (error) {
            if (error instanceof NodeWithSameNameExistsValidationError) {
                void this.eventCallback?.({
                    type: 'folder:conflict',
                    uploadId: task.uploadId,
                    error,
                });
            } else {
                void this.eventCallback?.({
                    type: 'folder:error',
                    uploadId: task.uploadId,
                    error: error instanceof Error ? error : new Error('Folder creation failed'),
                });
            }
        }
    }
}
