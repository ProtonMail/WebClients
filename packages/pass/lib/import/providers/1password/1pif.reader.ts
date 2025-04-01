import { c } from 'ttag';

import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import { attachFilesToItem } from '@proton/pass/lib/import/helpers/files';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
import type { ItemImportIntent } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
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

export const processLoginItem = (item: OnePassLegacyItem): ItemImportIntent<'login'> => {
    const fields = item.secureContents.fields;

    return importLoginItem({
        name: item.title,
        note: item.secureContents?.notesPlain,
        ...getEmailOrUsername(
            fields?.find(({ designation }) => designation === OnePassLoginDesignation.USERNAME)?.value
        ),
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

        const ignored: string[] = [];
        const items: ItemImportIntent[] = parse1PifData(data)
            .map((item) => {
                const type = item?.typeName ?? c('Label').t`Unknown`;
                const title = item?.title ?? '';
                const files = attachments?.get(item.uuid) ?? [];

                try {
                    switch (item.typeName) {
                        case OnePassLegacyItemType.LOGIN:
                            return attachFilesToItem(processLoginItem(item), files);
                        case OnePassLegacyItemType.NOTE:
                            return attachFilesToItem(processNoteItem(item), files);
                        case OnePassLegacyItemType.PASSWORD:
                            return attachFilesToItem(processPasswordItem(item), files);
                        case OnePassLegacyItemType.CREDIT_CARD:
                            return attachFilesToItem(processCreditCardItem(item), files);
                        case OnePassLegacyItemType.IDENTITY:
                            return attachFilesToItem(processIdentityItem(item), files);
                        default:
                            ignored.push(`[${type}] ${title}`);
                    }
                } catch (err) {
                    ignored.push(`[${type}] ${title}`);
                    logger.warn('[Importer::1Password::1pif]', err);
                }
            })
            .filter(truthy);

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
