import type { ProtonDriveClient } from '@protontech/drive-sdk';
import type { ProtonDrivePublicLinkClient } from '@protontech/drive-sdk/dist/protonDrivePublicLinkClient';

import { getDrive } from '../../../index';
import type { EventCallback, UploadTask } from '../types';

/**
 * Abstract base class for all task executors
 * Ensures consistent API across different executor types (file, folder, photo)
 */
export abstract class TaskExecutor<T extends UploadTask = UploadTask> {
    #driveClient: ProtonDriveClient | ProtonDrivePublicLinkClient | undefined;

    get driveClient() {
        return this.#driveClient || getDrive();
    }
    set driveClient(driveClientInstance: ProtonDriveClient | ProtonDrivePublicLinkClient) {
        this.#driveClient = driveClientInstance;
    }

    protected eventCallback?: EventCallback;

    /**
     * Set event callback - called by orchestrator
     */
    setEventCallback(callback: EventCallback): void {
        this.eventCallback = callback;
    }

    /**
     * Execute the task
     * Emits events instead of returning result
     */
    abstract execute(task: T): Promise<void>;
}
