import capitalize from 'lodash/capitalize';
import { c } from 'ttag';

import { ImportProviderError, ImportReaderError } from '@proton/pass/lib/import/helpers/error';
import { attachFilesToItem } from '@proton/pass/lib/import/helpers/files';
import {
    getImportedVaultName,
    importCreditCardItem,
    importCustomItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { isObject } from '@proton/pass/utils/object/is-object';

import type { EnpassItem } from './enpass.types';
import { EnpassCategory, type EnpassData } from './enpass.types';
import {
    ENPASS_FIELD_TYPES,
    enpassFileReader,
    extractEnpassCC,
    extractEnpassCustom,
    extractEnpassExtraFields,
    extractEnpassIdentity,
    extractEnpassLogin,
    getUniqueFilename,
    isTrashedEnpassItem,
} from './enpass.utils';

const processLoginItem = (
    item: EnpassItem<EnpassCategory.LOGIN> | EnpassItem<EnpassCategory.PASSWORD>
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
        username: extracted.username,
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

        const loginItem = processLoginItem(enpassLoginItem);
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

const processCustomItem = (item: EnpassItem<any>): ItemImportIntent<'custom'> => {
    const { remaining } = extractEnpassCustom(item.fields ?? []);

    return importCustomItem({
        name: item.title,
        note: item.note,
        extraFields: extractEnpassExtraFields(remaining),
    });
};

const validateEnpassData = (data: any): data is EnpassData =>
    isObject(data) && 'items' in data && Array.isArray(data.items);

export const readEnpassData = async (file: File): Promise<ImportReaderResult> => {
    try {
        const data = await file.text();
        const result = JSON.parse(data);
        const valid = validateEnpassData(result);

        if (!valid) throw new ImportReaderError(c('Error').t`File does not match expected format`);

        const items = result.items.map((i) => i);
        const ignored: string[] = [];
        const fileReader = enpassFileReader();

        const vaults: ImportVault[] = [
            {
                name: getImportedVaultName(),
                shareId: null,
                items: items
                    .flatMap<Maybe<ItemImportIntent>>((item) => {
                        const type = capitalize(item?.category ?? c('Label').t`Unknown`);
                        const title = item?.title ?? '';

                        const files =
                            item.attachments?.map(({ data, name }) => {
                                const uniqueFilename = getUniqueFilename(name);
                                fileReader.registerFile(uniqueFilename, data);
                                return uniqueFilename;
                            }) ?? [];

                        try {
                            switch (item.category) {
                                case EnpassCategory.LOGIN:
                                case EnpassCategory.PASSWORD:
                                    return attachFilesToItem(processLoginItem(item), files);
                                case EnpassCategory.NOTE:
                                    return attachFilesToItem(processNoteItem(item), files);
                                case EnpassCategory.CREDIT_CARD:
                                    const [cardItem, loginItem] = processCreditCardItem(item);
                                    return [attachFilesToItem(cardItem, files), loginItem];
                                case EnpassCategory.IDENTITY:
                                    return attachFilesToItem(processIdentityItem(item), files);
                                default:
                                    return attachFilesToItem(processCustomItem(item), files);
                            }
                        } catch (err) {
                            ignored.push(`[${type}] ${title}`);
                            logger.warn('[Importer::Enpass]', err);
                        }
                    })
                    .filter(truthy),
            },
        ];

        return { vaults, ignored, warnings: [], fileReader };
    } catch (e) {
        logger.warn('[Importer::Enpass]', e);
        throw new ImportProviderError('Enpass', e);
    }
};
