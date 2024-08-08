import capitalize from 'lodash/capitalize';
import { c } from 'ttag';

import { buildEnpassIdentity } from '@proton/pass/lib/import/builders/enpass.builder';
import type { ItemImportIntent, Maybe, UnsafeItemExtraField } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { isObject } from '@proton/pass/utils/object/is-object';

import { ImportProviderError, ImportReaderError } from '../helpers/error';
import {
    getImportedVaultName,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '../helpers/transformers';
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
    item: EnpassItem<EnpassCategory.LOGIN> | EnpassItem<EnpassCategory.PASSWORD>,
    importUsername?: boolean
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
        email: extracted.email,
        username: importUsername ? extracted.username : '',
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

const processCreditCardItem = (
    item: EnpassItem<EnpassCategory.CREDIT_CARD>,
    importUsername?: boolean
): ItemImportIntent[] => {
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

        const loginItem = processLoginItem(enpassLoginItem, importUsername);
        return [ccItem, loginItem];
    }

    return [ccItem];
};

const processIdentityItem = (item: EnpassItem<EnpassCategory.IDENTITY>): ItemImportIntent<'identity'> =>
    importIdentityItem({
        name: item.title,
        note: item.note,
        ...buildEnpassIdentity(item),
    });

const validateEnpassData = (data: any): data is EnpassData =>
    isObject(data) && 'items' in data && Array.isArray(data.items);

export const readEnpassData = ({ data, importUsername }: { data: string; importUsername?: boolean }): ImportPayload => {
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
                    .flatMap((item): Maybe<ItemImportIntent | ItemImportIntent[]> => {
                        switch (item.category) {
                            case EnpassCategory.LOGIN:
                            case EnpassCategory.PASSWORD:
                                return processLoginItem(item, importUsername);
                            case EnpassCategory.NOTE:
                                return processNoteItem(item);
                            case EnpassCategory.CREDIT_CARD:
                                return processCreditCardItem(item, importUsername);
                            case EnpassCategory.IDENTITY:
                                return processIdentityItem(item);
                            default:
                                ignored.push(`[${capitalize(item.category) ?? 'Other'}] ${item.title}`);
                                return;
                        }
                    })
                    .filter(truthy),
            },
        ];

        return { vaults, ignored, warnings: [] };
    } catch (e) {
        logger.warn('[Importer::Enpass]', e);
        throw new ImportProviderError('Enpass', e);
    }
};
