import { LOGGER_DB_PREFIX } from '../constants';
import type { LogEntry, Storage } from './types';

export class LocalStorage implements Storage {
    private keyPrefix: string;

    constructor(loggerName: string, loggerID: string = '') {
        this.keyPrefix = `${LOGGER_DB_PREFIX}${loggerName}${loggerID ? `-${loggerID}` : ''}-`;
    }

    private getLogs(): LogEntry[] {
        try {
            const data = localStorage.getItem(this.keyPrefix + 'logs');
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    private setLogs(logs: LogEntry[]): void {
        try {
            localStorage.setItem(this.keyPrefix + 'logs', JSON.stringify(logs));
        } catch {
            // Storage quota exceeded, remove oldest entries
            if (logs.length > 0) {
                logs.splice(0, Math.floor(logs.length / 2));
                this.setLogs(logs);
            }
        }
    }

    async store(entry: LogEntry): Promise<void> {
        const logs = this.getLogs();
        logs.push(entry);
        logs.sort((a, b) => a.timestamp - b.timestamp);
        this.setLogs(logs);
    }

    async retrieve(): Promise<LogEntry[]> {
        return this.getLogs();
    }

    async clear(): Promise<void> {
        // Remove all entries with this prefix
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.keyPrefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
    }

    async getCount(): Promise<number> {
        return this.getLogs().length;
    }

    async removeOldest(count: number): Promise<void> {
        const logs = this.getLogs();
        logs.splice(0, count);
        this.setLogs(logs);
    }

    async removeOlderThan(timestamp: number): Promise<number> {
        const logs = this.getLogs();
        const originalLength = logs.length;
        const filtered = logs.filter((log) => log.timestamp > timestamp);

        if (filtered.length === 0) {
            // Storage is now empty, clear everything
            await this.clear();
        } else {
            this.setLogs(filtered);
        }

        return originalLength - filtered.length;
    }

    async close(): Promise<void> {
        // No persistent connections to close in localStorage
    }
}
