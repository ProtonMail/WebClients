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
import { readZIP } from '@proton/pass/lib/import/helpers/zip.reader';
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
import type { DeobfuscatedItemExtraField, ItemImportIntent, Maybe } from '@proton/pass/types';
import { extractFirst } from '@proton/pass/utils/array/extract-first';
import { prop } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';

import {
    extract1PasswordExtraFields,
    extract1PasswordIdentity,
    extract1PasswordLoginField,
    extract1PasswordSSHSections,
    extract1PasswordURLs,
    extract1PasswordWifiFields,
    format1PasswordMonthYear,
    into1PasswordDocumentItemFile,
    into1PasswordItemFiles,
    is1PasswordCCField,
} from './1p.utils';
import type { OnePass1PuxData, OnePassBaseItem, OnePassCreditCardFields, OnePassItem } from './1pux.types';
import { OnePassCategory, OnePassLoginDesignation, OnePassState, OnePasswordTypeMap } from './1pux.types';

const processNoteItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.NOTE }>
): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.overview.title,
        note: item.details?.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        trashed: item.state === OnePassState.ARCHIVED,
        extraFields: item.details.sections?.flatMap(extract1PasswordExtraFields) ?? [],
    });

const processLoginItem = async (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.LOGIN }>
): Promise<ItemImportIntent<'login'>> => {
    const [totp, extraFields] = extractFirst(
        item.details.sections?.flatMap(extract1PasswordExtraFields) ?? [],
        (extraField): extraField is DeobfuscatedItemExtraField<'totp'> => extraField.type === 'totp'
    );

    return importLoginItem({
        name: item.overview.title,
        note: item.details.notesPlain,
        password: extract1PasswordLoginField(item, OnePassLoginDesignation.PASSWORD),
        urls: extract1PasswordURLs(item),
        totp: totp?.data.totpUri,
        extraFields,
        trashed: item.state === OnePassState.ARCHIVED,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        ...(await getEmailOrUsername(extract1PasswordLoginField(item, OnePassLoginDesignation.USERNAME))),
    });
};

const processPasswordItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.PASSWORD }>
): ItemImportIntent<'login'> =>
    importLoginItem({
        name: item.overview.title,
        note: item.details.notesPlain,
        password: item.details.password,
        urls: extract1PasswordURLs(item),
        trashed: item.state === OnePassState.ARCHIVED,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        extraFields: item.details.sections?.flatMap(extract1PasswordExtraFields) ?? [],
    });

const processIdentityItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.IDENTITY }>
): Maybe<ItemImportIntent<'identity'>> =>
    importIdentityItem({
        name: item.overview.title,
        note: item.details.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        ...extract1PasswordIdentity(item.details.sections),
    });

const processCreditCardItem = (item: Extract<OnePassItem, { categoryUuid: OnePassCategory.CREDIT_CARD }>) => {
    const extraFields = item.details.sections?.flatMap(extract1PasswordExtraFields) ?? [];

    const { cardholder, ccnum, cvv, expiry, pin } = ((): OnePassCreditCardFields => {
        const { sections } = item.details;
        if (!sections || sections.length === 0) return {};

        return sections
            .flatMap((s) => s.fields)
            .reduce<OnePassCreditCardFields>((acc, field) => {
                if (is1PasswordCCField(field)) acc[field.id] = field;
                return acc;
            }, {});
    })();

    return importCreditCardItem({
        name: item.overview.title,
        note: item.details.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        trashed: item.state === OnePassState.ARCHIVED,
        cardholderName: cardholder?.value.string,
        number: ccnum?.value.creditCardNumber,
        verificationNumber: cvv?.value.concealed,
        expirationDate: format1PasswordMonthYear(expiry?.value.monthYear),
        pin: pin?.value.concealed,
        extraFields,
    });
};

const processCustomItem = (item: OnePassItem) =>
    importCustomItem({
        name: item.overview.title,
        note: item.details.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        trashed: item.state === OnePassState.ARCHIVED,
        sections: item.details.sections?.map((s) => ({
            sectionName: s.title || c('Label').t`Untitled`,
            sectionFields: extract1PasswordExtraFields(s),
        })),
        extraFields: item.details.sections?.flatMap(extract1PasswordExtraFields) ?? [],
    });

const processSshKeyItem = (item: OnePassItem) => {
    const sshKey = item.details.sections?.flatMap(prop('fields')).find((field) => field.id === 'private_key')
        ?.value?.sshKey;

    return importSshKeyItem({
        privateKey: sshKey?.metadata?.privateKey,
        publicKey: sshKey?.metadata?.publicKey,
        name: item.overview.title,
        note: item.details.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        trashed: item.state === OnePassState.ARCHIVED,
        extraFields: item.details.sections?.flatMap(extract1PasswordExtraFields) ?? [],
        sections: extract1PasswordSSHSections(sshKey),
    });
};

const processWifiItem = (item: OnePassItem) =>
    importWifiItem({
        name: item.overview.title,
        note: item.details.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        trashed: item.state === OnePassState.ARCHIVED,
        extraFields: item.details.sections?.flatMap(extract1PasswordExtraFields) ?? [],
        ...extract1PasswordWifiFields(item.details.sections),
    });

export const read1Password1PuxData = async (file: File): Promise<ImportReaderResult> => {
    try {
        const fileReader = await readZIP(file);
        const data = await fileReader.getFile('export.data');
        const content = await data?.text();

        if (!content) throw new Error('Unprocessable content');

        const parsed = JSON.parse(content) as OnePass1PuxData;
        const ignored: string[] = [];
        const vaults: ImportVault[] = [];

        for (const vault of parsed.accounts.flatMap(prop('vaults'))) {
            const name = getImportedVaultName(vault.attrs.name);
            const items: ItemImportIntent[] = [];

            for (const item of vault.items) {
                const category = item?.categoryUuid;
                const type = (category ? OnePasswordTypeMap[category] : null) ?? c('Label').t`Unknown`;
                const title = item?.overview?.title ?? item?.overview?.subtitle ?? '';
                const files = into1PasswordItemFiles(item.details.sections);

                try {
                    const value = await (async (): Promise<Maybe<ItemImportIntent>> => {
                        switch (item.categoryUuid) {
                            case OnePassCategory.LOGIN:
                                return attachFilesToItem(await processLoginItem(item), files);
                            case OnePassCategory.NOTE:
                                return attachFilesToItem(processNoteItem(item), files);
                            case OnePassCategory.CREDIT_CARD:
                                return attachFilesToItem(processCreditCardItem(item), files);
                            case OnePassCategory.PASSWORD:
                                const passwordItem = processPasswordItem(item);
                                return passwordItem ? attachFilesToItem(passwordItem, files) : passwordItem;
                            case OnePassCategory.IDENTITY:
                                const identityItem = processIdentityItem(item);
                                return identityItem ? attachFilesToItem(identityItem, files) : identityItem;
                            case OnePassCategory.SSH_KEY:
                                return attachFilesToItem(processSshKeyItem(item), files);
                            case OnePassCategory.WIFI:
                                return attachFilesToItem(processWifiItem(item), files);
                            case OnePassCategory.DOCUMENT:
                                const file = into1PasswordDocumentItemFile(item.details.documentAttributes);
                                if (file) files.unshift(file);
                                return attachFilesToItem(processCustomItem(item), files);
                            default:
                                const unknownItem = item as OnePassBaseItem & { details: any };
                                return 'loginFields' in unknownItem.details &&
                                    unknownItem.details.loginFields.length > 0
                                    ? attachFilesToItem(await processLoginItem(unknownItem as any), files)
                                    : attachFilesToItem(processCustomItem(unknownItem as any), files);
                        }
                    })();

                    if (!value) ignored.push(`[${type}] ${title}`);
                    else items.push(value);
                } catch (err) {
                    ignored.push(`[${type}] ${title}`);
                    logger.warn('[Importer::1Password::1pux]', err);
                }
            }

            vaults.push({ name, shareId: null, items });
        }

        return { vaults, ignored, warnings: [], fileReader };
    } catch (e) {
        logger.warn('[Importer::1Password::1pux]', e);
        throw new ImportProviderError('1Password', e);
    }
};
