import capitalize from 'lodash/capitalize';
import { c } from 'ttag';

import type { ItemImportIntent, Maybe, UnsafeItemExtraField } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { isObject } from '@proton/pass/utils/object/is-object';

import { ImportProviderError, ImportReaderError } from '../helpers/error';
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

const isTrashedItem = (item: EnpassItem<any>) => item.archived !== 0 || item.trashed !== 0;

const extractFromFieldTypes = <K extends string>(keys: readonly K[]) => {
    const isSupportedKey = (type: any): type is K => keys.includes(type);

    return (fields: EnpassField[]) =>
        fields.reduce(
            (acc: { extracted: { [key in K]?: string }; remaining: RemainingField[] }, field) => {
                if (!field.value) return acc;

                if (isSupportedKey(field.type) && !acc.extracted[field.type]) {
                    acc.extracted[field.type] = field.value;
                    return acc;
                }

                if (!(<readonly string[]>knownFieldTypes.ignored).includes(field.type)) {
                    acc.remaining.push(field);
                    return acc;
                }

                return acc;
            },
            { extracted: {}, remaining: [] }
        );
};

const extractLoginFields = extractFromFieldTypes(knownFieldTypes.login);
const extractCCFields = extractFromFieldTypes(knownFieldTypes.creditCard);

const mapToExtraField = ({ value, label, sensitive }: RemainingField): UnsafeItemExtraField => ({
    data: { content: value },
    fieldName: label,
    type: sensitive ? 'hidden' : 'text',
});

const processLoginItem = (
    item: EnpassItem<EnpassCategory.LOGIN> | EnpassItem<EnpassCategory.PASSWORD>
): ItemImportIntent<'login'> => {
    const { extracted, remaining } = extractLoginFields(item.fields ?? []);

    return importLoginItem({
        name: item.title,
        note: item.note,
        trashed: isTrashedItem(item),
        createTime: item.createdAt,
        modifyTime: item.updated_at,
        extraFields: remaining.map(mapToExtraField).concat(
            extracted.username && extracted.email
                ? [
                      {
                          data: { content: extracted.email },
                          fieldName: 'E-mail',
                          type: 'text',
                      },
                  ]
                : []
        ),
        username: extracted.username || extracted.email,
        password: extracted.password,
        totp: extracted.totp,
        urls: extracted.url ? [extracted.url] : [],
    });
};

const processNoteItem = (item: EnpassItem<EnpassCategory.NOTE>): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.title,
        note: item.note,
        trashed: item.archived !== 0 || item.trashed !== 0,
        createTime: item.createdAt,
        modifyTime: item.updated_at,
    });

const processCreditCardItem = (item: EnpassItem<EnpassCategory.CREDIT_CARD>): ItemImportIntent[] => {
    const { extracted: extractedCCData, remaining } = extractCCFields(item.fields ?? []);

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

    const hasLoginFields = remaining.some(({ type }) => (<readonly string[]>knownFieldTypes.login).includes(type));

    if (hasLoginFields) {
        const enpassLoginItem: EnpassItem<EnpassCategory.LOGIN> = {
            ...item,
            category: EnpassCategory.LOGIN,
            fields: remaining,
        };

        const loginItem = processLoginItem(enpassLoginItem);
        return [ccItem, loginItem];
    }

    return [ccItem];
};

const validateEnpassData = (data: any): data is EnpassData =>
    isObject(data) && 'items' in data && Array.isArray(data.items);

export const readEnpassData = (data: string): ImportPayload => {
    try {
        const result = JSON.parse(data);
        const valid = validateEnpassData(result);

        if (!valid) throw new ImportReaderError(c('Error').t`File does not match expected format`);

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
