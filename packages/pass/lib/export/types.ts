import type { ItemType, UnsafeItemRevision, VaultShareContent } from '@proton/pass/types';

export type ExportedItem<T extends ItemType = ItemType> = Omit<
    UnsafeItemRevision<T>,
    'revision' | 'revisionTime' | 'lastUseTime'
>;

export type ExportedVault = VaultShareContent & { items: ExportedItem[] };

export type ExportData = {
    encrypted: boolean;
    userId?: string;
    vaults: Record<string, ExportedVault>;
    version: string;
};

export type ExportOptions = { encrypted: true; passphrase: string } | { encrypted: false };
export type ExportFormValues = { encrypted: boolean; passphrase: string };
