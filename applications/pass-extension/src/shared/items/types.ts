import type { ItemCreateIntent, ItemEditIntent, ItemRevision, ItemType, VaultShare } from '@proton/pass/types';

export type ItemTypeViewProps<T extends ItemType = ItemType> = {
    vault: VaultShare;
    revision: ItemRevision<T>;
    optimistic: boolean;
    failed: boolean;
    trashed: boolean;
    handleEditClick: () => void;
    handleRetryClick: () => void;
    handleDismissClick: () => void;
    handleMoveToTrashClick: () => void;
    handleMoveToVaultClick: () => void;
    handleRestoreClick: () => void;
    handleDeleteClick: () => void;
};

export type ItemEditProps<T extends ItemType = ItemType> = {
    vault: VaultShare;
    revision: ItemRevision<T>;
    onSubmit: (item: ItemEditIntent<T>) => void;
    onCancel: () => void;
};

export type ItemNewProps<T extends ItemType = ItemType> = {
    shareId: string;
    onSubmit: (item: ItemCreateIntent<T>) => void;
    onCancel: () => void;
};
