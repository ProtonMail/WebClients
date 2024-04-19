import type { ItemType, UnsafeItemRevision, VaultShareContent } from '@proton/pass/types';

export type ExportedItem<T extends ItemType = ItemType> = Omit<
    UnsafeItemRevision<T>,
    'revision' | 'revisionTime' | 'lastUseTime' | 'flags'
>;

export type ExportedVault = VaultShareContent & { items: ExportedItem[] };

export type ExportData = {
    encrypted: boolean;
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
    username: string;
    vault: string;
};

export enum ExportFormat {
    CSV = 'csv',
    PGP = 'pgp',
    ZIP = 'zip',
}

export type ExportOptions =
    | { format: ExportFormat.PGP; passphrase: string }
    | { format: Exclude<ExportFormat, ExportFormat.PGP> };

export type ExportFormValues = { format: ExportFormat; passphrase: string };
