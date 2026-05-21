export type TransferMeta = {
    downloadId: string;
    filename: string;
    mimeType: string;
    size?: number;
};

export type SavingMechanism = 'memory' | 'opfs' | 'sw' | 'memory_fallback';
