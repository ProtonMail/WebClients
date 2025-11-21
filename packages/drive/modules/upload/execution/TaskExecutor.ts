import type { EventCallback, UploadTask } from '../types';

/**
 * Abstract base class for all task executors
 * Ensures consistent API across different executor types (file, folder, photo)
 */
export abstract class TaskExecutor<T extends UploadTask = UploadTask> {
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
