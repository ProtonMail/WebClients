import type { DeobfuscatedItemRevision, ItemType, VaultShareContent } from '@proton/pass/types';

export type ExportedItem<T extends ItemType = ItemType> = Omit<
    DeobfuscatedItemRevision<T>,
    'revision' | 'revisionTime' | 'lastUseTime' | 'flags'
> & { files?: string[] };

export type ExportedVault = VaultShareContent & { items: ExportedItem[] };
export type ExportedFile = { id: string; fileName: string; content: ArrayBuffer; mimeType: string };

export type ExportData = {
    encrypted: boolean;
    userId?: string;
    vaults: Record<string, ExportedVault>;
    files: ExportedFile[];
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
    EPEX = 'epex',
    PEX = 'pex',
}

export type ExportOptions =
    | { format: ExportFormat.EPEX | ExportFormat.PGP; passphrase: string }
    | { format: Exclude<ExportFormat, ExportFormat.EPEX | ExportFormat.PGP> };

export type ExportFormValues = { format: ExportFormat; passphrase: string; fileAttachments: boolean };

export type FilenamePayload = { filename: string };
