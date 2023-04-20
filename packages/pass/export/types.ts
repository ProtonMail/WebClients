import type { ItemRevision, ItemType, VaultShareContent } from '../types';

export type ExportedItem<T extends ItemType = ItemType> = Omit<
    ItemRevision<T>,
    'revision' | 'revisionTime' | 'lastUseTime'
>;

export type ExportPayload = {
    version: string;
    encrypted: boolean;
    vaults: {
        [shareId: string]: VaultShareContent & {
            items: ExportedItem[];
        };
    };
};

export type ExportRequestPayload = { encrypted: true; passphrase: string } | { encrypted: false };
