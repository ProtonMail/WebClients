import type { Draft, EditDraft, NewDraft } from '@proton/pass/store/reducers';
import type { Item, ItemRevision, ItemType, UniqueItem } from '@proton/pass/types';
import { ItemState } from '@proton/pass/types';

export const isAliasItem = (item: Item): item is Item<'alias'> => item.type === 'alias';
export const isCCItem = (item: Item): item is Item<'creditCard'> => item.type === 'creditCard';
export const isLoginItem = (item: Item): item is Item<'login'> => item.type === 'login';
export const isNoteItem = (item: Item): item is Item<'note'> => item.type === 'note';

export const isItemType =
    <T extends ItemType>(type: T) =>
    <R extends ItemRevision>(item: R): item is R & ItemRevision<T> =>
        item.data.type === type;

export const isPasskeyItem = (item: Item): item is Item<'login'> =>
    isLoginItem(item) && (item.content.passkeys ?? []).length > 0;

export const itemEq =
    <T extends UniqueItem>(a: T) =>
    (b: T): boolean =>
        a.shareId === b.shareId && a.itemId === b.itemId;

export const belongsToShare =
    (shareId: string) =>
    <T extends UniqueItem>(item: T): boolean =>
        item.shareId === shareId;

export const isTrashed = ({ state }: ItemRevision) => state === ItemState.Trashed;

export const isEditItemDraft = (draft?: Draft): draft is EditDraft => draft?.mode === 'edit';
export const isNewItemDraft = (draft?: Draft): draft is NewDraft => draft?.mode === 'new';

export const isPinned = ({ pinned }: ItemRevision) => pinned;
export const isHealthCheckSkipped = ({ flags }: ItemRevision) => flags << 0 === 1;
export const isEmailBreached = ({ flags }: ItemRevision) => flags << 1 === 1;
