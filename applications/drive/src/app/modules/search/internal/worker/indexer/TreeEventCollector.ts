import type { DriveEvent } from '@protontech/drive-sdk';

/**
 * Simple event buffer. Events are pushed in, peeked for processing, and committed after success.
 */
export class TreeEventCollector {
    private buffer: DriveEvent[] = [];

    push(event: DriveEvent): void {
        this.buffer.push(event);
    }

    /**
     * Return all buffered events without removing them.
     */
    peek(): DriveEvent[] {
        return this.buffer.slice();
    }

    /**
     * Remove the first `count` events from the buffer (the ones returned by a prior peek()).
     */
    commit(count: number): void {
        this.buffer.splice(0, count);
    }

    dispose(): void {
        this.buffer = [];
    }
}
