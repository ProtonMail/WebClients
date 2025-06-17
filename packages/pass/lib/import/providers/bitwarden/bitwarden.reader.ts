import groupBy from 'lodash/groupBy';
import keyBy from 'lodash/keyBy';
import { c } from 'ttag';

import { ImportProviderError, ImportReaderError } from '@proton/pass/lib/import/helpers/error';
import { attachFilesToItem } from '@proton/pass/lib/import/helpers/files';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
    importSshKeyItem,
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import { type BitwardenData, BitwardenType } from './bitwarden.types';
import {
    extractBitwardenExtraFields,
    extractBitwardenIdentity,
    extractBitwardenSSHSections,
    extractBitwardenUrls,
    formatBitwardenCCExpirationDate,
} from './bitwarden.utils';

export const readBitwardenData = async (
    file: File,
    attachments?: Map<string, string[]>
): Promise<ImportReaderResult> => {
    try {
        const data = await file.text();
        const parsedData = JSON.parse(data) as BitwardenData;
        const { items, encrypted, folders = [], collections = [] } = parsedData;

        if (encrypted) throw new ImportReaderError(c('Error').t`Encrypted JSON not supported`);
        if (!Array.isArray(items) || !Array.isArray(folders) || !Array.isArray(collections)) {
            throw new ImportReaderError(c('Error').t`Importing items failed`);
        }

        const vaults: ImportVault[] = [];
        const ignored: string[] = [];

        // Collections and folders are mutually exclusive ** after exporting **,
        // ie. items beloging to an organization will have a null folderId (even
        // if they are also in a folder).
        const isB2B = Object.hasOwn(parsedData, 'collections');
        const folderMap = keyBy(isB2B ? collections : folders, 'id');
        const mappedItems = isB2B ? items.map((i) => ({ ...i, folderId: i.collectionIds?.at(0) || null })) : items;

        for (const [folderId, vaultItems] of Object.entries(groupBy(mappedItems, 'folderId'))) {
            const name = getImportedVaultName(folderMap[folderId ?? '']?.name);
            const items: ItemImportIntent[] = [];

            for (const item of vaultItems) {
                try {
                    const value = await (async (): Promise<Maybe<ItemImportIntent>> => {
                        switch (item.type) {
                            case BitwardenType.LOGIN:
                                const urls = extractBitwardenUrls(item);
                                return importLoginItem({
                                    name: item.name,
                                    note: item.notes,
                                    password: item.login.password,
                                    urls: urls.web,
                                    totp: item.login.totp,
                                    appIds: urls.android,
                                    extraFields: extractBitwardenExtraFields(item.fields),
                                    ...(await getEmailOrUsername(item.login.username)),
                                });
                            case BitwardenType.NOTE:
                                return importNoteItem({
                                    name: item.name,
                                    note: item.notes,
                                    extraFields: extractBitwardenExtraFields(item.fields),
                                });
                            case BitwardenType.CREDIT_CARD:
                                return importCreditCardItem({
                                    name: item.name,
                                    note: item.notes,
                                    cardholderName: item.card.cardholderName,
                                    number: item.card.number,
                                    verificationNumber: item.card.code,
                                    expirationDate: formatBitwardenCCExpirationDate(item),
                                    extraFields: extractBitwardenExtraFields(item.fields),
                                });
                            case BitwardenType.IDENTITY:
                                return importIdentityItem({
                                    name: item.name,
                                    note: item.notes,
                                    ...extractBitwardenIdentity(item),
                                });
                            case BitwardenType.SSH_KEY:
                                return importSshKeyItem({
                                    name: item.name,
                                    note: item.notes,
                                    publicKey: item.sshKey.publicKey,
                                    privateKey: item.sshKey.privateKey,
                                    extraFields: extractBitwardenExtraFields(item.fields),
                                    sections: extractBitwardenSSHSections(item),
                                });
                        }
                    })();

                    if (!value) ignored.push(`[${item.type}] ${item.name}`);
                    else {
                        const files = attachments?.get(item.id) ?? [];
                        items.push(attachFilesToItem(value, files));
                    }
                } catch (err) {
                    ignored.push(`[${item.type}] ${item.name}`);
                    logger.warn('[Importer::Bitwarden]', err);
                }
            }

            vaults.push({ name, shareId: null, items });
        }

        return { vaults, ignored, warnings: [] };
    } catch (e) {
        logger.warn('[Importer::Bitwarden]', e);
        throw new ImportProviderError('Bitwarden', e);
    }
};
