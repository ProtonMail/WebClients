import type { ItemDiff } from '@proton/pass/lib/items/item.diff';
import type { ShareItem } from '@proton/pass/store/reducers';
import type {
    ItemCreateIntent,
    ItemEditIntent,
    ItemRevision,
    ItemRevisionWithOptimistic,
    ItemType,
    MaybeNull,
} from '@proton/pass/types';
import type { ParsedUrl } from '@proton/pass/utils/url/types';

export type ItemViewProps<T extends ItemType = ItemType> = {
    revision: ItemRevisionWithOptimistic<T>;
    share: ShareItem;
    handleDeleteClick: () => void;
    handleDismissClick: () => void;
    handleEditClick: () => void;
    handleHistoryClick: () => void;
    handleManageClick: () => void;
    handleMoveToTrashClick: () => void;
    handlePinClick: () => void;
    handleRestoreClick: () => void;
    handleRetryClick: () => void;
    handleSecureLinkClick: () => void;
    handleToggleFlagsClick: () => void;
    handleShareItemClick: () => void;
    handleLeaveItemClick: () => void;
};

export type ItemContentProps<T extends ItemType = ItemType, Extra = {}> = {
    diff?: ItemDiff<T>;
    revision: ItemRevision<T>;
    viewingHistory?: boolean;
    secureLinkItem?: boolean;
} & Partial<Extra>;

export type ItemEditViewProps<T extends ItemType = ItemType> = {
    revision: ItemRevision<T>;
    share: ShareItem;
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
