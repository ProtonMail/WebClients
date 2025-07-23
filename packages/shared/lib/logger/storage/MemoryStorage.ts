import type { LogEntry, Storage } from './types';

export class MemoryStorage implements Storage {
    private logs: LogEntry[] = [];

    private maxEntries: number;

    constructor(maxEntries: number = 1000) {
        this.maxEntries = maxEntries;
    }

    async store(entry: LogEntry): Promise<void> {
        this.logs.push(entry);
        this.logs.sort((a, b) => a.timestamp - b.timestamp);
        if (this.logs.length > this.maxEntries) {
            this.logs.splice(0, this.logs.length - this.maxEntries);
        }
    }

    async retrieve(): Promise<LogEntry[]> {
        return [...this.logs];
    }

    async clear(): Promise<void> {
        this.logs = [];
    }

    async getCount(): Promise<number> {
        return this.logs.length;
    }

    async removeOldest(count: number): Promise<void> {
        this.logs.splice(0, count);
    }

    async removeOlderThan(timestamp: number): Promise<number> {
        const originalLength = this.logs.length;
        this.logs = this.logs.filter((log) => log.timestamp > timestamp);
        const removedCount = originalLength - this.logs.length;

        // Memory storage doesn't need deletion, but we can clear if empty
        if (this.logs.length === 0) {
            this.logs = [];
        }

        return removedCount;
    }

    async close(): Promise<void> {
        // No connections to close, and we preserve data until explicitly cleared
    }
}
