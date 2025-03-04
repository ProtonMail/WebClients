import type { DeobfuscatedItem, DeobfuscatedItemExtraField, Item, ItemExtraField, ItemType } from '@proton/pass/types';
import type { DeobfuscateMode } from '@proton/pass/types/data/obfuscation';
import { deobfuscate, obfuscate } from '@proton/pass/utils/obfuscate/xor';

export const obfuscateExtraFields = (extraFields?: DeobfuscatedItemExtraField[]): ItemExtraField[] =>
    extraFields?.map((field) =>
        field.type === 'totp'
            ? { ...field, data: { totpUri: obfuscate(field.data.totpUri) } }
            : { ...field, data: { content: obfuscate(field.data.content) } }
    ) ?? [];

export const deobfuscateExtraFields = (extraFields?: ItemExtraField[]): DeobfuscatedItemExtraField[] =>
    extraFields?.map((extraField): DeobfuscatedItemExtraField => {
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

export const obfuscateItem = <T extends ItemType = ItemType>(item: DeobfuscatedItem): Item<T> => {
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
        case 'identity':
            return { ...item, ...base } satisfies Item<'identity'> as Item<T>;
        case 'sshKey':
        case 'wifi':
        case 'custom':
            throw new Error('FIXME');
    }
};

export const deobfuscateItem = <T extends ItemType>(item: Item): DeobfuscatedItem<T> => {
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
            } satisfies DeobfuscatedItem<'login'> as DeobfuscatedItem<T>;
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
            } satisfies DeobfuscatedItem<'creditCard'> as DeobfuscatedItem<T>;

        case 'note':
            return { ...item, ...base } satisfies DeobfuscatedItem<'note'> as DeobfuscatedItem<T>;
        case 'alias':
            return { ...item, ...base } satisfies DeobfuscatedItem<'alias'> as DeobfuscatedItem<T>;
        case 'identity':
            return { ...item, ...base } satisfies DeobfuscatedItem<'identity'> as DeobfuscatedItem<T>;
        case 'sshKey':
        case 'wifi':
        case 'custom':
            throw new Error('FIXME');
    }
};

export const deobfuscateItemPartial = <T extends ItemType, R = DeobfuscatedItem<T, DeobfuscateMode.AUTO>>(
    item: Item
): R => {
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
                    totpUri: deobfuscate(item.content.totpUri),
                },
            } satisfies DeobfuscatedItem<'login', DeobfuscateMode.AUTO> as R;
        case 'creditCard':
            return { ...item, ...base } satisfies DeobfuscatedItem<'creditCard', DeobfuscateMode.AUTO> as R;
        case 'note':
            return { ...item, ...base } satisfies DeobfuscatedItem<'note', DeobfuscateMode.AUTO> as R;
        case 'alias':
            return { ...item, ...base } satisfies DeobfuscatedItem<'alias', DeobfuscateMode.AUTO> as R;
        case 'identity':
            return { ...item, ...base } satisfies DeobfuscatedItem<'identity', DeobfuscateMode.AUTO> as R;
        case 'sshKey':
        case 'wifi':
        case 'custom':
            throw new Error('FIXME');
    }
};
