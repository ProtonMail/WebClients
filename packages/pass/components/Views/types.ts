import type { ItemDiff } from '@proton/pass/lib/items/item.diff';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import type {
    ItemCreateIntent,
    ItemEditIntent,
    ItemRevision,
    ItemRevisionWithOptimistic,
    ItemType,
    MaybeNull,
} from '@proton/pass/types';
import type { ParsedUrl } from '@proton/pass/utils/url/parser';

export type ItemViewProps<T extends ItemType = ItemType> = {
    revision: ItemRevisionWithOptimistic<T>;
    vault: VaultShareItem;
    handleDeleteClick: () => void;
    handleDismissClick: () => void;
    handleEditClick: () => void;
    handleHistoryClick: () => void;
    handleInviteClick: () => void;
    handleManageClick: () => void;
    handleMoveToTrashClick: () => void;
    handleMoveToVaultClick: () => void;
    handlePinClick: () => void;
    handleRestoreClick: () => void;
    handleRetryClick: () => void;
    handleSecureLinkClick: () => void;
    handleToggleFlagsClick: () => void;
};

export type ItemContentProps<T extends ItemType = ItemType, Extra = {}> = {
    diff?: ItemDiff<T>;
    revision: ItemRevision<T>;
    history?: boolean;
    secureLinkItem?: boolean;
} & Partial<Extra>;

export type ItemEditViewProps<T extends ItemType = ItemType> = {
    revision: ItemRevision<T>;
    vault: VaultShareItem;
    url: MaybeNull<ParsedUrl>;
    onCancel: () => void;
    onSubmit: (item: ItemEditIntent<T>) => void;
};

export type ItemNewViewProps<T extends ItemType = ItemType> = {
    shareId: string;
    url: MaybeNull<ParsedUrl>;
    onCancel: () => void;
    onSubmit: (item: ItemCreateIntent<T>) => void;
};
