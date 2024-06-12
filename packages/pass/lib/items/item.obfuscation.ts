import type { Item, ItemExtraField, ItemType, UnsafeItem, UnsafeItemExtraField } from '@proton/pass/types';
import { deobfuscate, obfuscate } from '@proton/pass/utils/obfuscate/xor';

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

export const obfuscateItem = <T extends ItemType = ItemType>(item: UnsafeItem): Item<T> => {
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
                    itemEmail: obfuscate(item.content.itemEmail),
                    itemUsername: obfuscate(item.content.itemUsername),
                    password: obfuscate(item.content.password),
                    totpUri: obfuscate(item.content.totpUri),
                },
            } satisfies Item<'login'> as Item<T>;
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
            } satisfies Item<'creditCard'> as Item<T>;

        case 'note':
            return { ...item, ...base } satisfies Item<'note'> as Item<T>;
        case 'alias':
            return { ...item, ...base } satisfies Item<'alias'> as Item<T>;
    }
};

export const deobfuscateItem = <T extends ItemType>(item: Item): UnsafeItem<T> => {
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
                    itemEmail: deobfuscate(item.content.itemEmail),
                    itemUsername: deobfuscate(item.content.itemUsername),
                    password: deobfuscate(item.content.password),
                    totpUri: deobfuscate(item.content.totpUri),
                },
            } satisfies UnsafeItem<'login'> as UnsafeItem<T>;
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
            } satisfies UnsafeItem<'creditCard'> as UnsafeItem<T>;

        case 'note':
            return { ...item, ...base } satisfies UnsafeItem<'note'> as UnsafeItem<T>;
        case 'alias':
            return { ...item, ...base } satisfies UnsafeItem<'alias'> as UnsafeItem<T>;
    }
};
