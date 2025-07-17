export type ClipboardService = {
    startClearTimeout: (timeoutMs: number, content: string) => void;
};

export type ClipboardApi = {
    read: () => Promise<string>;
    write: (content: string) => Promise<void>;
};
