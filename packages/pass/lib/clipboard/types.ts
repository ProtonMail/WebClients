export interface ClipboardApi {
    read: () => Promise<string>;
    write: (content: string) => Promise<void>;
}

export interface ClipboardService extends ClipboardApi {
    autoClear: (timeoutMs: number, content: string) => void;
}

export type ClipboardWriteDTO = { content: string };
export type ClipboardAutoClearDTO = { timeoutMs: number; content: string };
