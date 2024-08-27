import capitalize from 'lodash/capitalize';
import { c } from 'ttag';

import { ImportProviderError, ImportReaderError } from '@proton/pass/lib/import/helpers/error';
import {
    getImportedVaultName,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportPayload, ImportVault } from '@proton/pass/lib/import/types';
import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { isObject } from '@proton/pass/utils/object/is-object';

import type { EnpassItem } from './enpass.types';
import { EnpassCategory, type EnpassData } from './enpass.types';
import {
    ENPASS_FIELD_TYPES,
    extractEnpassCC,
    extractEnpassExtraFields,
    extractEnpassIdentity,
    extractEnpassLogin,
    isTrashedEnpassItem,
} from './enpass.utils';

const processLoginItem = (
    item: EnpassItem<EnpassCategory.LOGIN> | EnpassItem<EnpassCategory.PASSWORD>,
    importUsername?: boolean
): ItemImportIntent<'login'> => {
    const { extracted, remaining } = extractEnpassLogin(item.fields ?? []);

    return importLoginItem({
        name: item.title,
        note: item.note,
        trashed: isTrashedEnpassItem(item),
        createTime: item.createdAt,
        modifyTime: item.updated_at,
        extraFields: extractEnpassExtraFields(remaining).concat(
            extracted.username && extracted.email
                ? [{ data: { content: extracted.email }, fieldName: 'E-mail', type: 'text' }]
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
    const { extracted: extractedCCData, remaining } = extractEnpassCC(item.fields ?? []);

    const ccItem = importCreditCardItem({
        name: item.title,
        note: item.note,
        trashed: isTrashedEnpassItem(item),
        createTime: item.createdAt,
        modifyTime: item.updated_at,
        cardholderName: extractedCCData.ccName,
        pin: extractedCCData.ccPin,
        expirationDate: extractedCCData.ccExpiry,
        number: extractedCCData.ccNumber,
        verificationNumber: extractedCCData.ccCvc,
    });

    const hasLoginFields = remaining.some(({ type }) => (<readonly string[]>ENPASS_FIELD_TYPES.login).includes(type));

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
        ...extractEnpassIdentity(item),
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
