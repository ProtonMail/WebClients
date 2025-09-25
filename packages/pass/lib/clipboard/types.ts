export interface ClipboardApi {
    read: () => Promise<string>;
    write: (content: string) => Promise<void>;
}

export interface ClipboardService extends ClipboardApi {
    autoClear: (timeoutMs: number, content: string) => void;
}

export type ClipboardSettings = { timeoutMs: ClipboardTTL };
export type ClipboardWriteDTO = { content: string };
export type ClipboardAutoClearDTO = { timeoutMs: number; content: string };

export enum ClipboardTTL {
    TTL_NEVER = -1,
    TTL_15_SEC = 15_000,
    TTL_1_MIN = 60_000,
    TTL_2_MIN = 120_000,
}

export const DEFAULT_CLIPBOARD_TTL = ClipboardTTL.TTL_2_MIN;
