import type { ItemType, UnsafeItemRevision, VaultShareContent } from '@proton/pass/types';

export type ExportedItem<T extends ItemType = ItemType> = Omit<
    UnsafeItemRevision<T>,
    'revision' | 'revisionTime' | 'lastUseTime'
>;

export type ExportPayload = {
    version: string;
    encrypted: boolean;
    userId?: string;
    vaults: {
        [shareId: string]: VaultShareContent & {
            items: ExportedItem[];
        };
    };
};

export type ExportRequestPayload = { encrypted: true; passphrase: string } | { encrypted: false };
