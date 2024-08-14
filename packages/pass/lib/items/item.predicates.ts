import type { Draft, EditDraft, NewDraft } from '@proton/pass/store/reducers';
import type { Item, ItemExtraField, ItemRevision, ItemType, LoginItem, UniqueItem } from '@proton/pass/types';
import { ItemFlag, ItemState } from '@proton/pass/types';
import { and, not, or } from '@proton/pass/utils/fp/predicates';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

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

export const belongsToShares =
    (shareIds?: string[]) =>
    <T extends UniqueItem>(item: T): boolean =>
        shareIds ? shareIds.includes(item.shareId) : true;

export const isTrashed = ({ state }: ItemRevision) => state === ItemState.Trashed;
export const isActive = not(isTrashed);

export const isEditItemDraft = (draft?: Draft): draft is EditDraft => draft?.mode === 'edit';
export const isNewItemDraft = (draft?: Draft): draft is NewDraft => draft?.mode === 'new';

export const isPinned = ({ pinned }: ItemRevision) => pinned;

const hasItemFlag =
    (bitFlag: ItemFlag) =>
    ({ flags }: ItemRevision) =>
        (flags & bitFlag) === bitFlag;

export const isHealthCheckSkipped = hasItemFlag(ItemFlag.SkipHealthCheck);
export const isBreached = hasItemFlag(ItemFlag.EmailBreached);
export const isMonitored = not(isHealthCheckSkipped);
export const isAliasDisabled = hasItemFlag(ItemFlag.AliasDisabled);

export const isActiveMonitored = and(isActive, isMonitored);
export const isExcluded = and(isActive, not(isMonitored));

export const hasEmail = (email: string) => (item: LoginItem) =>
    Boolean(item.data.content.itemEmail.v && deobfuscate(item.data.content.itemEmail) === email);

export const hasUsername = (username: string) => (item: LoginItem) =>
    Boolean(item.data.content.itemUsername.v && deobfuscate(item.data.content.itemUsername) === username);

export const hasUserIdentifier = (userIdentifier: string) => (item: LoginItem) =>
    or(hasEmail(userIdentifier), hasUsername(userIdentifier))(item);

export const hasDomain = (item: LoginItem) => item.data.content.urls.length > 0;

export const hasOTP = ({ data: { content, extraFields } }: LoginItem) =>
    Boolean(content.totpUri.v || extraFields.some((field) => field.type === 'totp' && field.data.totpUri.v));

export const isExtraOTPField = (field: ItemExtraField): field is ItemExtraField<'totp'> => field.type === 'totp';
