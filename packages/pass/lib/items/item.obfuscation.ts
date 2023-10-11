import type { Item, ItemExtraField, UnsafeItem, UnsafeItemExtraField } from '@proton/pass/types';
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
