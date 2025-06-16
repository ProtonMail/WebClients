import { c } from 'ttag';

import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import { attachFilesToItem } from '@proton/pass/lib/import/helpers/files';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importCreditCardItem,
    importCustomItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import {
    extract1PasswordLegacyExtraFields,
    extract1PasswordLegacyIdentity,
    extract1PasswordLegacyNote,
    extract1PasswordLegacyURLs,
} from './1p.utils';
import type { OnePassLegacyItem } from './1pif.types';
import { OnePassLegacyItemType } from './1pif.types';
import { OnePassLoginDesignation } from './1pux.types';

const ENTRY_SEPARATOR_1PIF = '***';

export const processLoginItem = async (item: OnePassLegacyItem): Promise<ItemImportIntent<'login'>> => {
    const fields = item.secureContents.fields;

    return importLoginItem({
        name: item.title,
        note: item.secureContents?.notesPlain,
        ...(await getEmailOrUsername(
            fields?.find(({ designation }) => designation === OnePassLoginDesignation.USERNAME)?.value
        )),
        password: fields?.find(({ designation }) => designation === OnePassLoginDesignation.PASSWORD)?.value,
        urls: extract1PasswordLegacyURLs(item),
        extraFields: extract1PasswordLegacyExtraFields(item),
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    });
};

export const processNoteItem = (item: OnePassLegacyItem): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.title,
        note: extract1PasswordLegacyNote(item),
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        extraFields: extract1PasswordLegacyExtraFields(item),
    });

export const processPasswordItem = (item: OnePassLegacyItem): ItemImportIntent<'login'> =>
    importLoginItem({
        name: item.title,
        note: item.secureContents?.notesPlain,
        password: item.secureContents?.password,
        urls: extract1PasswordLegacyURLs(item),
        extraFields: extract1PasswordLegacyExtraFields(item),
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    });

export const processCreditCardItem = (item: OnePassLegacyItem): ItemImportIntent<'creditCard'> => {
    const expirationDate =
        item.secureContents.expiry_mm && item.secureContents.expiry_yy
            ? `${String(item.secureContents.expiry_mm).padStart(2, '0')}${item.secureContents.expiry_yy}`
            : undefined;

    return importCreditCardItem({
        name: item.title,
        note: item.secureContents.notesPlain,
        cardholderName: item.secureContents.cardholder,
        number: item.secureContents.ccnum,
        verificationNumber: item.secureContents.cvv,
        expirationDate,
        pin: item.secureContents.pin,
        extraFields: extract1PasswordLegacyExtraFields(item),
    });
};

export const processIdentityItem = (item: OnePassLegacyItem): ItemImportIntent<'identity'> =>
    importIdentityItem({
        name: item.title,
        note: item.secureContents.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        ...extract1PasswordLegacyIdentity(item.secureContents.sections),
    });

export const processCustomItem = (item: OnePassLegacyItem): ItemImportIntent<'custom'> =>
    importCustomItem({
        name: item.title,
        note: item.secureContents.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        extraFields: extract1PasswordLegacyExtraFields(item),
    });

export const parse1PifData = (data: string): OnePassLegacyItem[] =>
    data
        .split('\n')
        .filter((line) => !line.startsWith(ENTRY_SEPARATOR_1PIF) && Boolean(line))
        .map((rawItem) => JSON.parse(rawItem));

export const read1Password1PifData = async (
    file: File,
    attachments?: Map<string, string[]>
): Promise<ImportReaderResult> => {
    try {
        const data = await file.text();
        if (!data) throw new Error('Unprocessable content');

        const parsed = parse1PifData(data);
        const ignored: string[] = [];
        const items: ItemImportIntent[] = [];

        for (const item of parsed) {
            const type = item?.typeName ?? c('Label').t`Unknown`;
            const title = item?.title ?? '';
            const files = attachments?.get(item.uuid) ?? [];

            try {
                const value = await (async (): Promise<Maybe<ItemImportIntent>> => {
                    switch (item.typeName) {
                        case OnePassLegacyItemType.LOGIN:
                            return attachFilesToItem(await processLoginItem(item), files);
                        case OnePassLegacyItemType.NOTE:
                            return attachFilesToItem(processNoteItem(item), files);
                        case OnePassLegacyItemType.PASSWORD:
                            return attachFilesToItem(processPasswordItem(item), files);
                        case OnePassLegacyItemType.CREDIT_CARD:
                            return attachFilesToItem(processCreditCardItem(item), files);
                        case OnePassLegacyItemType.IDENTITY:
                            return attachFilesToItem(processIdentityItem(item), files);
                        default:
                            return attachFilesToItem(processCustomItem(item), files);
                    }
                })();

                if (!value) ignored.push(`[${type}] ${title}`);
                else items.push(value);
            } catch (err) {
                ignored.push(`[${type}] ${title}`);
                logger.warn('[Importer::1Password::1pif]', err);
            }
        }

        const vaults: ImportVault[] = [
            {
                name: getImportedVaultName(),
                shareId: null,
                items: items,
            },
        ];

        return { vaults, ignored, warnings: [] };
    } catch (e) {
        logger.warn('[Importer::1Password::1pif]', e);
        throw new ImportProviderError('1Password', e);
    }
};
