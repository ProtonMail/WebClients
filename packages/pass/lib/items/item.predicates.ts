import type { Draft, EditDraft, NewDraft } from '../../store/reducers/drafts';
import type { Item, ItemExtraField, ItemRevision, LoginItem, UniqueItem } from '../../types/data/items';
import { ItemFlag, ItemState } from '../../types/data/items';
import type { ItemType } from '../../types/protobuf';
import { and, not, oneOf, or } from '../../utils/fp/predicates';
import { deobfuscate } from '../../utils/obfuscate/xor';
import { MONITOR_CHECK_CONFIG, MonitorCheckType } from '../monitor/types';
import { isAutofillTargetMode } from '../urls/utils/autofill';

export const isAliasItem = (item: Item): item is Item<'alias'> => item.type === 'alias';

const isLoginItem = (item: Item): item is Item<'login'> => item.type === 'login';

export const isItemType =
    <T extends ItemType>(type: T) =>
    <R extends ItemRevision>(item: R): item is R & ItemRevision<T> =>
        item.data.type === type;

const matchItemTypes =
    (types: ItemType[]) =>
    <R extends ItemRevision>(item: R) =>
        oneOf(...types)(item.data.type);

const NON_CLONABLE_ITEMS: ItemType[] = ['alias'];
const NON_CLONABLE_FREE_ITEMS: ItemType[] = ['alias', 'creditCard', 'custom', 'sshKey', 'wifi'];

export const isClonableItem = (free: boolean) =>
    not(matchItemTypes(free ? NON_CLONABLE_FREE_ITEMS : NON_CLONABLE_ITEMS));

export const isPasskeyItem = (item: Item): item is Item<'login'> =>
    isLoginItem(item) && (item.content.passkeys ?? []).length > 0;

export const itemEq =
    <T extends UniqueItem>(a: T) =>
    <T extends UniqueItem>(b: T): boolean =>
        a.shareId === b.shareId && a.itemId === b.itemId;

export const itemAny =
    <T extends UniqueItem>(a: T[]) =>
    <T extends UniqueItem>(b: T): boolean =>
        a.some(itemEq(b));

export const belongsToShares =
    (shareIds?: string[]) =>
    <T extends UniqueItem>(item: T): boolean =>
        shareIds ? shareIds.includes(item.shareId) : true;

export const matchesLoginPassword =
    (password: string) =>
    (item: ItemRevision<'login'>): boolean =>
        deobfuscate(item.data.content.password) === password;

export const isTrashed = ({ state }: ItemRevision) => state === ItemState.Trashed;
export const isActive = not(isTrashed);

export const isEditItemDraft = (draft?: Draft): draft is EditDraft => draft?.mode === 'edit';
export const isNewItemDraft = (draft?: Draft): draft is NewDraft => draft?.mode === 'new';

export const isPinned = ({ pinned }: ItemRevision) => pinned;

export const isItemShared = ({ shareCount = 0 }: ItemRevision) => shareCount > 0;

const hasItemFlag =
    (bitFlag: ItemFlag) =>
    ({ flags }: ItemRevision) =>
        (flags & bitFlag) === bitFlag;

export const isHealthCheckSkipped = hasItemFlag(ItemFlag.SkipHealthCheck);
export const isBreached = hasItemFlag(ItemFlag.EmailBreached);
export const isMonitored = not(isHealthCheckSkipped);
export const isDisabledAlias = hasItemFlag(ItemFlag.AliasDisabled);
export const hasAttachments = hasItemFlag(ItemFlag.HasAttachments);
export const hasHadAttachments = hasItemFlag(ItemFlag.HasHadAttachments);
export const isDisabledAliasItem = (item: ItemRevision) => isAliasItem(item.data) && isDisabledAlias(item);

export const isWeakPasswordCheckSkipped = hasItemFlag(ItemFlag.SkipWeakPasswordCheck);
export const isCompromisedPasswordCheckSkipped = hasItemFlag(ItemFlag.SkipCompromisedPasswordCheck);
export const isReusedPasswordCheckSkipped = hasItemFlag(ItemFlag.SkipReusedPasswordCheck);
export const is2FACheckSkipped = hasItemFlag(ItemFlag.Skip2FACheck);

/** Global item exclusion from Pass Monitor (`SkipHealthCheck`). */
export const isFullyExcluded = (item: ItemRevision) => isHealthCheckSkipped(item);

const isPerCheckSkipped = (type: MonitorCheckType) => hasItemFlag(MONITOR_CHECK_CONFIG[type].flag);

/** Whether a specific monitor check is ignored (global exclusion or per-check skip). */
export const isCheckIgnored = (type: MonitorCheckType) => (item: ItemRevision) =>
    isHealthCheckSkipped(item) || isPerCheckSkipped(type)(item);

export const hasAnyPerCheckIgnored = (item: ItemRevision) =>
    Object.values(MonitorCheckType).some((type) => isPerCheckSkipped(type)(item));

export const hasAnyExclusion = (item: ItemRevision) => isHealthCheckSkipped(item) || hasAnyPerCheckIgnored(item);

/** Active login eligible for a specific monitor check (not globally or per-check ignored). */
export const isEligibleForMonitorCheck = (type: MonitorCheckType) => and(isActive, not(isCheckIgnored(type)));

export const isActiveMonitored = and(isActive, isMonitored);
export const isExcluded = and(isActive, not(isMonitored));

export const hasEmail = (email: string) => (item: LoginItem) =>
    Boolean(item.data.content.itemEmail.v.length && deobfuscate(item.data.content.itemEmail) === email);

const hasUsername = (username: string) => (item: LoginItem) =>
    Boolean(item.data.content.itemUsername.v.length && deobfuscate(item.data.content.itemUsername) === username);

export const hasUserIdentifier = (userIdentifier: string) => (item: LoginItem) =>
    or(hasEmail(userIdentifier), hasUsername(userIdentifier))(item);

export const hasDomain = (item: LoginItem) =>
    item.data.content.autofillUrls.some(({ mode }) => isAutofillTargetMode(mode));

export const hasOTP = ({ data: { content, extraFields } }: LoginItem) =>
    Boolean(
        content.totpUri.v.length || extraFields.some((field) => field.type === 'totp' && field.data.totpUri.v.length)
    );

export const hasPasskeys = ({ data: { content } }: LoginItem) => (content.passkeys ?? []).length > 0;

export const isExtraOTPField = (field: ItemExtraField): field is ItemExtraField<'totp'> => field.type === 'totp';
