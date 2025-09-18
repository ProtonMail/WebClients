import generateUID from '@proton/utils/generateUID';

import { UploadStatus, useUploadManagerStore } from './uploadManager.store';

// TODO: only has basic store interactions, actual upload logic needs to be implemented

export class UploadManager {
    private static instance: UploadManager | undefined;

    static getInstance(): UploadManager {
        if (!UploadManager.instance) {
            UploadManager.instance = new UploadManager();
        }

        return UploadManager.instance;
    }

    onItemConflict(uploadId: string) {
        this.pause([uploadId]);
        this.updateStatus([uploadId], UploadStatus.ConflictFound);
    }
    onTooManyItems(uploadId: string) {
        console.warn('onTooManyItems not implemented', uploadId);
    }

    async upload(files: File[]) {
        if (!files.length) {
            return;
        }
        const { addUploadItem } = useUploadManagerStore.getState();
        files.forEach(({ name }) => {
            addUploadItem({
                uploadId: generateUID(),
                name,
                progress: 0,
                status: UploadStatus.Pending,
            });
        });
    }

    resolveConflict(uploadId: string, solved: boolean) {
        console.warn('resolveConflict not implemented', uploadId, solved);
    }

    pause(uploadIds?: string[]) {
        if (uploadIds) {
            this.updateStatus(uploadIds, UploadStatus.Paused);
        }
    }

    resume(uploadIds?: string[]) {
        if (uploadIds) {
            this.updateStatus(uploadIds, UploadStatus.Uploading);
        }
    }

    cancel(uploadIds?: string[]) {
        if (uploadIds) {
            this.updateStatus(uploadIds, UploadStatus.Cancelled);
        }
    }

    clear() {
        const { clearQueue } = useUploadManagerStore.getState();
        clearQueue();
    }

    private updateStatus(uploadIds: string[], status: UploadStatus) {
        if (!uploadIds.length) {
            return;
        }
        const { updateUploadItem } = useUploadManagerStore.getState();
        uploadIds.forEach((id) => updateUploadItem(id, { status }));
    }
}

export const uploadManager = UploadManager.getInstance();
