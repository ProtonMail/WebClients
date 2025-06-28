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
    importSshKeyItem,
    importWifiItem,
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
import type { DeobfuscatedItemExtraField, ItemImportIntent, Maybe } from '@proton/pass/types';
import { extractFirst } from '@proton/pass/utils/array/extract-first';
import { prop } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';

import {
    extract1PasswordLegacyExtraFields,
    extract1PasswordLegacyIdentity,
    extract1PasswordLegacyURLs,
    extract1PasswordLegacyUnknownExtraFields,
    extractLegacy1PasswordWifiFields,
} from './1p.utils';
import type { OnePassLegacyItem } from './1pif.types';
import { OnePassLegacyItemType } from './1pif.types';
import { OnePassLoginDesignation } from './1pux.types';

const ENTRY_SEPARATOR_1PIF = '***';

export const processLoginItem = async (item: OnePassLegacyItem): Promise<ItemImportIntent<'login'>> => {
    const fields = item.secureContents.fields;

    const [totp, extraFields] = extractFirst(
        extract1PasswordLegacyExtraFields(item),
        (extraField): extraField is DeobfuscatedItemExtraField<'totp'> => extraField.type === 'totp'
    );

    const userIdentifiers = await getEmailOrUsername(
        fields?.find(({ designation }) => designation === OnePassLoginDesignation.USERNAME)?.value
    );

    return importLoginItem({
        ...userIdentifiers,
        name: item.title,
        note: item.secureContents?.notesPlain,
        password: fields?.find(({ designation }) => designation === OnePassLoginDesignation.PASSWORD)?.value,
        urls: extract1PasswordLegacyURLs(item),
        totp: totp?.data.totpUri,
        extraFields,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    });
};

export const processNoteItem = (item: OnePassLegacyItem): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.title,
        note: item.secureContents?.notesPlain,
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
        extraFields: [...extract1PasswordLegacyUnknownExtraFields(item), ...extract1PasswordLegacyExtraFields(item)],
    });

export const processSshKeyItem = (item: OnePassLegacyItem): ItemImportIntent<'sshKey'> => {
    const fields = item.secureContents.unknown_details?.sections?.flatMap(prop('fields'));
    const privateKey = fields?.find((f) => f?.n === 'sshKey-privateKey')?.v as string;
    const publicKey = fields?.find((f) => f?.n === 'sshKey-publicKey')?.v as string;

    return importSshKeyItem({
        privateKey,
        publicKey,
        name: item.title,
        note: item.secureContents.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        extraFields: [...extract1PasswordLegacyUnknownExtraFields(item), ...extract1PasswordLegacyExtraFields(item)],
    });
};

export const processWifiItem = (item: OnePassLegacyItem): ItemImportIntent<'wifi'> =>
    importWifiItem({
        name: item.title,
        note: item.secureContents?.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        extraFields: [...extract1PasswordLegacyUnknownExtraFields(item), ...extract1PasswordLegacyExtraFields(item)],
        ...extractLegacy1PasswordWifiFields(item.secureContents.sections),
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
                        case OnePassLegacyItemType.WIFI:
                            return attachFilesToItem(processWifiItem(item), files);
                        case OnePassLegacyItemType.SSH_KEY:
                            return attachFilesToItem(processSshKeyItem(item), files);
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
