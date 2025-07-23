export interface LogEntry {
    id: string;
    timestamp: number;
    level: string;
    encryptedMessage: string;
    encryptedArgs: string[];
}

export interface Storage {
    store(entry: LogEntry): Promise<void>;
    retrieve(): Promise<LogEntry[]>;
    clear(): Promise<void>;
    getCount(): Promise<number>;
    removeOldest(count: number): Promise<void>;
    removeOlderThan(timestamp: number): Promise<number>;
    close(): Promise<void>;
}
