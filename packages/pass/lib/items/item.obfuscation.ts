import type { DeobfuscatedItem, DeobfuscatedItemExtraField, Item, ItemExtraField, ItemType } from '@proton/pass/types';
import type { DeobfuscateMode } from '@proton/pass/types/data/obfuscation';
import { deobfuscate, obfuscate } from '@proton/pass/utils/obfuscate/xor';

export const obfuscateExtraFields = (extraFields?: DeobfuscatedItemExtraField[]): ItemExtraField[] =>
    extraFields?.map((field) => {
        switch (field.type) {
            case 'totp':
                return { ...field, data: { totpUri: obfuscate(field.data.totpUri) } };
            case 'timestamp':
                return { ...field, data: { timestamp: obfuscate(field.data.timestamp) } };
            default:
                return { ...field, data: { content: obfuscate(field.data.content) } };
        }
    }) ?? [];

export const deobfuscateExtraFields = (extraFields?: ItemExtraField[]): DeobfuscatedItemExtraField[] =>
    extraFields?.map((extraField): DeobfuscatedItemExtraField => {
        switch (extraField.type) {
            case 'totp':
                return {
                    ...extraField,
                    data: { totpUri: deobfuscate(extraField.data.totpUri) },
                };
            case 'timestamp':
                return {
                    ...extraField,
                    data: { timestamp: deobfuscate(extraField.data.timestamp) },
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

    const obfuscatedItem = ((): Item => {
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
                } satisfies Item<'login'>;
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
                } satisfies Item<'creditCard'>;

            case 'note':
                return { ...item, ...base } satisfies Item<'note'>;
            case 'alias':
                return { ...item, ...base } satisfies Item<'alias'>;
            case 'identity':
                return { ...item, ...base } satisfies Item<'identity'>;
            case 'sshKey':
                return {
                    ...item,
                    ...base,
                    content: {
                        ...item.content,
                        privateKey: obfuscate(item.content.privateKey),
                    },
                } satisfies Item<'sshKey'>;
            case 'wifi':
                return {
                    ...item,
                    ...base,
                    content: {
                        ...item.content,
                        password: obfuscate(item.content.password),
                    },
                } satisfies Item<'wifi'>;
            case 'custom':
                return { ...item, ...base } satisfies Item<'custom'>;
        }
    })();

    return obfuscatedItem as Item<T>;
};

export const deobfuscateItem = <T extends ItemType>(item: Item): DeobfuscatedItem<T> => {
    const base = {
        metadata: { ...item.metadata, note: deobfuscate(item.metadata.note) },
        extraFields: deobfuscateExtraFields(item.extraFields),
    };

    const deobfuscatedItem = ((): DeobfuscatedItem => {
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
                } satisfies DeobfuscatedItem<'login'>;
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
                } satisfies DeobfuscatedItem<'creditCard'>;

            case 'note':
                return { ...item, ...base } satisfies DeobfuscatedItem<'note'>;
            case 'alias':
                return { ...item, ...base } satisfies DeobfuscatedItem<'alias'>;
            case 'identity':
                return { ...item, ...base } satisfies DeobfuscatedItem<'identity'>;
            case 'sshKey':
                return {
                    ...item,
                    ...base,
                    content: {
                        ...item.content,
                        privateKey: deobfuscate(item.content.privateKey),
                    },
                } satisfies DeobfuscatedItem<'sshKey'>;
            case 'wifi':
                return {
                    ...item,
                    ...base,
                    content: {
                        ...item.content,
                        password: deobfuscate(item.content.password),
                    },
                } satisfies DeobfuscatedItem<'wifi'>;
            case 'custom':
                return { ...item, ...base } satisfies DeobfuscatedItem<'custom'>;
        }
    })();

    return deobfuscatedItem as DeobfuscatedItem<T>;
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
            return { ...item, ...base } satisfies DeobfuscatedItem<'sshKey', DeobfuscateMode.AUTO> as R;
        case 'wifi':
            return { ...item, ...base } satisfies DeobfuscatedItem<'wifi', DeobfuscateMode.AUTO> as R;
        case 'custom':
            return { ...item, ...base } satisfies DeobfuscatedItem<'custom', DeobfuscateMode.AUTO> as R;
    }
};
