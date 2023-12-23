import type { ItemType, UnsafeItemRevision, VaultShareContent } from '@proton/pass/types';

export type ExportedItem<T extends ItemType = ItemType> = Omit<
    UnsafeItemRevision<T>,
    'revision' | 'revisionTime' | 'lastUseTime'
>;

export type ExportData = {
    version: string;
    encrypted: boolean;
    userId?: string;
    vaults: {
        [shareId: string]: VaultShareContent & {
            items: ExportedItem[];
        };
    };
};

export type ExportOptions = { encrypted: true; passphrase: string } | { encrypted: false };
export type ExportFormValues = ExportOptions;
