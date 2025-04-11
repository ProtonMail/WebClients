import type { DeobfuscatedItemRevision, FileForDownload, ItemType, VaultShareContent } from '@proton/pass/types';

export type ExportedItem<T extends ItemType = ItemType> = Omit<
    DeobfuscatedItemRevision<T>,
    'revision' | 'revisionTime' | 'lastUseTime' | 'flags'
> & { files?: string[] };

export type ExportedVault = VaultShareContent & { items: ExportedItem[] };

export type ExportData = {
    userId?: string;
    vaults: Record<string, ExportedVault>;
    version: string;
};

export type ExportCSVItem = {
    createTime: string;
    modifyTime: string;
    name: string;
    note: string;
    password: string;
    totp: string;
    type: ItemType;
    url: string;
    email: string;
    username: string;
    vault: string;
};

export enum ExportFormat {
    CSV = 'csv',
    PGP = 'pgp',
    ZIP = 'zip',
    JSON = 'json',
}

export type ExportOptions =
    | { format: ExportFormat.PGP; passphrase: string }
    | { format: Exclude<ExportFormat, ExportFormat.PGP> };

export type ExportRequestOptions = {
    format: ExportFormat;
    passphrase: string;
    fileAttachments: boolean;
    storageType: string;
    port?: string;
};

export type ExportResult = FileForDownload & { mimeType: string };
export type ExportFailure = { error: string };
