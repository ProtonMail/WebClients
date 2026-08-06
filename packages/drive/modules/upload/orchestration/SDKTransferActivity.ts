import { type ProtonDriveClient, SDKEvent } from '@protontech/drive-sdk';
import type { ProtonDrivePhotosClient } from '@protontech/drive-sdk/dist/protonDrivePhotosClient';
import type { ProtonDrivePublicLinkClient } from '@protontech/drive-sdk/dist/protonDrivePublicLinkClient';

import { useUploadQueueStore } from '../store/uploadQueue.store';
import { UploadStatus, isTerminalStatus } from '../types';

/**
 * Tracks SDK upload transfer activity (paused/resumed state)
 *
 * TODO: This should be moved to a shared location (transfer manager) as it will be needed
 * for downloads as well. Consider making it generic to handle both upload and download transfers.
 */
export class SDKTransferActivity {
    private sdkEventsDisposer: (() => void) | null = null;
    private isAutomaticallyPaused = false;

    /**
     * Subscribe to SDK TransfersPaused and TransfersResumed events
     */
    subscribe(drive: ProtonDriveClient | ProtonDrivePhotosClient | ProtonDrivePublicLinkClient): void {
        if (this.sdkEventsDisposer) {
            return;
        }

        const unsubscribePaused = drive.onMessage(SDKEvent.TransfersPaused, () => this.handleTransfersPaused());
        const unsubscribeResumed = drive.onMessage(SDKEvent.TransfersResumed, () => this.handleTransfersResumed());

        this.sdkEventsDisposer = () => {
            unsubscribePaused();
            unsubscribeResumed();
        };
    }

    /**
     * Unsubscribe from SDK events
     */
    unsubscribe(): void {
        if (!this.sdkEventsDisposer) {
            return;
        }

        this.sdkEventsDisposer();
        this.sdkEventsDisposer = null;
    }

    /**
     * Check if currently subscribed to SDK events
     */
    isSubscribed(): boolean {
        return this.sdkEventsDisposer !== null;
    }

    /**
     * Check if transfers are automatically paused by SDK
     */
    isPaused(): boolean {
        return this.isAutomaticallyPaused;
    }

    /**
     * Check if all uploads are done and unsubscribe from SDK events if so
     */
    checkAndUnsubscribeIfQueueEmpty(): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        const hasActiveUploads = uploadQueueStore.getQueue().some((item) => !isTerminalStatus(item.status));

        if (!hasActiveUploads && this.sdkEventsDisposer) {
            this.unsubscribe();
        }
    }

    /**
     * Handle SDK TransfersPaused event - mark all in-progress uploads as paused
     */
    private handleTransfersPaused(): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        this.isAutomaticallyPaused = true;

        const allItems = uploadQueueStore.getQueue();
        const inProgressIds = allItems
            .filter((item) => item.status === UploadStatus.InProgress)
            .map((item) => item.uploadId);
        if (inProgressIds.length > 0) {
            uploadQueueStore.updateQueueItems(inProgressIds, { status: UploadStatus.PausedServer });
        }
    }

    /**
     * Handle SDK TransfersResumed event - resume all paused uploads
     */
    private handleTransfersResumed(): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        this.isAutomaticallyPaused = false;

        const allItems = uploadQueueStore.getQueue();
        const pausedIds = allItems
            .filter((item) => item.status === UploadStatus.PausedServer)
            .map((item) => item.uploadId);
        if (pausedIds.length > 0) {
            uploadQueueStore.updateQueueItems(pausedIds, { status: UploadStatus.InProgress });
        }
    }
}
