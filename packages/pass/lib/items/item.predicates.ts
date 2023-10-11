import { type Item, type ItemRevision, ItemState, type UniqueItem } from '@proton/pass/types';

export const isLoginItem = (item: Item): item is Item<'login'> => item.type === 'login';
export const isAliasItem = (item: Item): item is Item<'alias'> => item.type === 'alias';
export const isNoteItem = (item: Item): item is Item<'note'> => item.type === 'note';

export const itemEq =
    <T extends UniqueItem>(a: T) =>
    (b: T): boolean =>
        a.shareId === b.shareId && a.itemId === b.itemId;

export const belongsToShare =
    (shareId: string) =>
    <T extends UniqueItem>(item: T): boolean =>
        item.shareId === shareId;

export const isTrashed = ({ state }: ItemRevision) => state === ItemState.Trashed;
