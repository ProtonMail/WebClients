export type ClipboardService = {
    writeClipboardContent: (content: string) => Promise<void>;
};

export type ClipboardApi = {
    read: () => Promise<string>;
    write: (content: string) => Promise<void>;
};
