import type { ItemDiff } from '../../lib/items/item.diff';
import type { ParsedUrl } from '../../lib/urls/types';
import type { ShareItem } from '../../store/reducers';
import type { ItemRevision, ItemRevisionWithOptimistic } from '../../types/data/items';
import type { ItemCreateIntent, ItemEditIntent } from '../../types/data/items.dto';
import type { ItemType } from '../../types/protobuf';
import type { MaybeNull } from '../../types/utils';

export type ItemViewProps<T extends ItemType = ItemType> = {
    revision: ItemRevisionWithOptimistic<T>;
    share: ShareItem;
    handleSecureLinkClick: () => void;
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
    type: T;
    shareId: string;
    folderId: MaybeNull<string>;
    url: MaybeNull<ParsedUrl>;
    onCancel: () => void;
    onSubmit: (item: ItemCreateIntent<T>) => void;
};
