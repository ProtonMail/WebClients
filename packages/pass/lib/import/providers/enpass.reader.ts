import { capitalize } from 'lodash';

import type { ItemImportIntent, Maybe, UnsafeItemExtraField } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';

import { ImportProviderError } from '../helpers/error';
import { getImportedVaultName, importCreditCardItem, importLoginItem, importNoteItem } from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import type { EnpassField, EnpassItem } from './enpass.types';
import { EnpassCategory, type EnpassData } from './enpass.types';

type RemainingField = EnpassField;

const knownFieldTypes = {
    login: ['username', 'email', 'totp', 'password', 'url'],
    creditCard: ['ccName', 'ccType', 'ccNumber', 'ccCvc', 'ccPin', 'ccExpiry'],
    ignored: ['section'],
} as const;

function isTrashedItem(item: EnpassItem<any>) {
    return item.archived !== 0 || item.trashed !== 0;
}

function extractFromFieldTypes<K extends string>(keys: readonly K[]) {
    const isSupportedKey = (type: any): type is K => keys.includes(type);

    return (fields: EnpassField[]) =>
        fields.reduce(
            (acc: { extracted: { [key in K]?: string }; remaining: RemainingField[] }, field) => {
                if (!field.value) {
                    return acc;
                }

                if (isSupportedKey(field.type) && !acc.extracted[field.type]) {
                    acc.extracted[field.type] = field.value;
                    return acc;
                }

                if (!knownFieldTypes.ignored.includes(field.type as any)) {
                    acc.remaining.push(field);
                    return acc;
                }

                return acc;
            },
            { extracted: {}, remaining: [] }
        );
}

const extractLoginFields = extractFromFieldTypes(knownFieldTypes.login);

const extractCCFields = extractFromFieldTypes(knownFieldTypes.creditCard);

function mapToExtraField(f: RemainingField): UnsafeItemExtraField {
    return {
        data: { content: f.value },
        fieldName: f.label,
        type: f.sensitive ? 'hidden' : 'text',
    };
}

const processLoginItem = (
    item: EnpassItem<EnpassCategory.LOGIN> | EnpassItem<EnpassCategory.PASSWORD>
): ItemImportIntent<'login'> => {
    const { extracted, remaining } = extractLoginFields(item.fields);

    return importLoginItem({
        name: item.title,
        note: item.note,
        trashed: isTrashedItem(item),
        createTime: item.createdAt,
        modifyTime: item.updated_at,

        extraFields: remaining.map(mapToExtraField),
        username: extracted.username || extracted.email,
        password: extracted.password,
        totp: extracted.totp,
        urls: extracted.url ? [extracted.url] : [],
    });
};

function processNoteItem(item: EnpassItem<EnpassCategory.NOTE>): ItemImportIntent<'note'> {
    return importNoteItem({
        name: item.title,
        note: item.note,
        trashed: item.archived !== 0 || item.trashed !== 0,
        createTime: item.createdAt,
        modifyTime: item.updated_at,
    });
}

function processCreditCardItem(
    item: EnpassItem<EnpassCategory.CREDIT_CARD>
): ItemImportIntent<'creditCard'> | ItemImportIntent[] {
    const { extracted: extractedCCData, remaining } = extractCCFields(item.fields);

    const ccItem = importCreditCardItem({
        name: item.title,
        note: item.note,
        trashed: isTrashedItem(item),
        createTime: item.createdAt,
        modifyTime: item.updated_at,

        cardholderName: extractedCCData.ccName,
        pin: extractedCCData.ccPin,
        expirationDate: extractedCCData.ccExpiry,
        number: extractedCCData.ccNumber,
        verificationNumber: extractedCCData.ccCvc,
    });

    if (remaining.some((f) => knownFieldTypes.login.includes(f.type as any))) {
        const enpassLoginItem: EnpassItem<EnpassCategory.LOGIN> = {
            ...item,
            category: EnpassCategory.LOGIN,
            fields: remaining,
        };

        const loginItem = processLoginItem(enpassLoginItem);

        return [ccItem, loginItem];
    }

    return ccItem;
}

export const readEnpassData = (data: string): ImportPayload => {
    try {
        const result = JSON.parse(data) as EnpassData;

        const items = result.items.map((i) => i);

        const ignored: string[] = [];

        const vaults: ImportVault[] = [
            {
                name: getImportedVaultName(),
                shareId: null,
                items: items
                    .map((item): Maybe<ItemImportIntent | ItemImportIntent[]> => {
                        switch (item.category) {
                            case EnpassCategory.LOGIN:
                            case EnpassCategory.PASSWORD:
                                return processLoginItem(item);
                            case EnpassCategory.NOTE:
                                return processNoteItem(item);
                            case EnpassCategory.CREDIT_CARD:
                                return processCreditCardItem(item);
                            default:
                                ignored.push(`[${capitalize(item.category) ?? 'Other'}] ${item.title}`);
                                return;
                        }
                    })
                    .flat()
                    .filter(truthy),
            },
        ];

        return { vaults, ignored, warnings: [] };
    } catch (e) {
        logger.warn('[Importer::Enpass]', e);
        throw new ImportProviderError('Enpass', e);
    }
};
