import { c } from 'ttag';

import type {
    Item,
    ItemExtraField,
    ItemRevision,
    UniqueItem,
    UnsafeItem,
    UnsafeItemExtraField,
} from '@proton/pass/types';

import { arrayInterpolate } from '../array';
import { deobfuscate, obfuscate } from '../obfuscate/xor';
import { UNIX_DAY, UNIX_MONTH, UNIX_WEEK, getEpoch } from '../time';

export const isLoginItem = (item: Item): item is Item<'login'> => item.type === 'login';
export const isAliasItem = (item: Item): item is Item<'alias'> => item.type === 'alias';
export const isNoteItem = (item: Item): item is Item<'note'> => item.type === 'note';

export const getItemKey = ({ shareId, itemId, revision }: ItemRevision) => `${shareId}-${itemId}-${revision}`;

export const getItemActionId = (
    payload:
        | { optimisticId: string; itemId?: string; shareId: string }
        | { optimisticId?: string; itemId: string; shareId: string }
) => `${payload.shareId}-${payload?.optimisticId ?? payload.itemId!}`;

export const itemEq =
    <T extends UniqueItem>(a: T) =>
    (b: T): boolean =>
        a.shareId === b.shareId && a.itemId === b.itemId;

export const belongsToShare =
    (shareId: string) =>
    <T extends UniqueItem>(item: T): boolean =>
        item.shareId === shareId;

export const interpolateRecentItems =
    <T extends ItemRevision>(items: T[]) =>
    (shouldInterpolate: boolean) => {
        type DateCluster = { label: string; boundary: number };
        const now = getEpoch();

        return arrayInterpolate<T, DateCluster>(items, {
            clusters: shouldInterpolate
                ? [
                      { label: c('Label').t`Today`, boundary: now - UNIX_DAY },
                      { label: c('Label').t`Last week`, boundary: now - UNIX_WEEK },
                      { label: c('Label').t`Last 2 weeks`, boundary: now - UNIX_WEEK * 2 },
                      { label: c('Label').t`Last month`, boundary: now - UNIX_MONTH },
                  ]
                : [],
            fallbackCluster: { label: c('Label').t`Older than last month`, boundary: 0 },
            shouldInterpolate: ({ lastUseTime, modifyTime }, { boundary }) =>
                Math.max(lastUseTime ?? modifyTime, modifyTime) > boundary,
        });
    };

export const flattenItemsByShareId = (itemsByShareId: {
    [shareId: string]: { [itemId: string]: ItemRevision };
}): ItemRevision[] => Object.values(itemsByShareId).flatMap(Object.values);

export const obfuscateExtraFields = (extraFields?: UnsafeItemExtraField[]): ItemExtraField[] =>
    extraFields?.map((field) =>
        field.type === 'totp'
            ? { ...field, data: { totpUri: obfuscate(field.data.totpUri) } }
            : { ...field, data: { content: obfuscate(field.data.content) } }
    ) ?? [];

export const deobfuscateExtraFields = (extraFields?: ItemExtraField[]): UnsafeItemExtraField[] =>
    extraFields?.map((extraField): UnsafeItemExtraField => {
        switch (extraField.type) {
            case 'totp':
                return {
                    ...extraField,
                    data: { totpUri: deobfuscate(extraField.data.totpUri) },
                };
            default:
                return {
                    ...extraField,
                    data: { content: deobfuscate(extraField.data.content) },
                };
        }
    }) ?? [];

export const obfuscateItem = (item: UnsafeItem): Item => {
    const base = {
        metadata: { ...item.metadata, note: obfuscate(item.metadata.note) },
        extraFields: obfuscateExtraFields(item.extraFields),
    };

    switch (item.type) {
        case 'login':
            return {
                ...item,
                ...base,
                content: {
                    ...item.content,
                    username: obfuscate(item.content.username),
                    password: obfuscate(item.content.password),
                    totpUri: obfuscate(item.content.totpUri),
                },
            };
        case 'creditCard':
            return {
                ...item,
                ...base,
                content: {
                    ...item.content,
                    number: obfuscate(item.content.number),
                    verificationNumber: obfuscate(item.content.verificationNumber),
                    pin: obfuscate(item.content.pin),
                },
            };

        case 'note':
            return { ...item, ...base };
        case 'alias':
            return { ...item, ...base };
    }
};

export const deobfuscateItem = (item: Item): UnsafeItem => {
    const base = {
        metadata: { ...item.metadata, note: deobfuscate(item.metadata.note) },
        extraFields: deobfuscateExtraFields(item.extraFields),
    };

    switch (item.type) {
        case 'login':
            return {
                ...item,
                ...base,
                content: {
                    ...item.content,
                    username: deobfuscate(item.content.username),
                    password: deobfuscate(item.content.password),
                    totpUri: deobfuscate(item.content.totpUri),
                },
            };
        case 'creditCard':
            return {
                ...item,
                ...base,
                content: {
                    ...item.content,
                    number: deobfuscate(item.content.number),
                    verificationNumber: deobfuscate(item.content.verificationNumber),
                    pin: deobfuscate(item.content.pin),
                },
            };

        case 'note':
            return { ...item, ...base };
        case 'alias':
            return { ...item, ...base };
    }
};
