import groupBy from 'lodash/groupBy';
import keyBy from 'lodash/keyBy';
import { c } from 'ttag';

import { ImportProviderError, ImportReaderError } from '@proton/pass/lib/import/helpers/error';
import {
    getEmailOrUsername,
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

import { type BitwardenData, type BitwardenItem, BitwardenType } from './bitwarden.types';
import {
    extractBitwardenExtraFields,
    extractBitwardenIdentity,
    extractBitwardenUrls,
    formatBitwardenCCExpirationDate,
} from './bitwarden.utils';

const BitwardenTypeMap: Record<number, string> = {
    1: 'Login',
    2: 'Note',
    3: 'Credit Card',
    4: 'Identification',
};

const addCustomFieldsWarning = (ignored: string[], item: BitwardenItem) => {
    if (item.fields) {
        ignored.push(
            `[${BitwardenTypeMap[item.type]}] ${item.name}: ${c('Warning').t`item was imported without custom fields`}`
        );
    }
};

export const readBitwardenData = ({ data }: { data: string }): ImportPayload => {
    try {
        const parsedData = JSON.parse(data) as BitwardenData;
        const { items, encrypted, folders = [], collections = [] } = parsedData;
        if (encrypted) throw new ImportReaderError(c('Error').t`Encrypted JSON not supported`);
        if (!Array.isArray(items) || !Array.isArray(folders) || !Array.isArray(collections)) {
            throw new ImportReaderError(c('Error').t`Importing items failed`);
        }

        const ignored: string[] = [];

        // Collections and folders are mutually exclusive ** after exporting **,
        // ie. items beloging to an organization will have a null folderId (even
        // if they are also in a folder).
        const isB2B = Object.hasOwn(parsedData, 'collections');
        const folderMap = keyBy(isB2B ? collections : folders, 'id');
        const mappedItems = isB2B ? items.map((i) => ({ ...i, folderId: i.collectionIds?.at(0) || null })) : items;

        const groupedItems = groupBy(mappedItems, 'folderId');
        const vaults: ImportVault[] = Object.entries(groupedItems).map(([folderId, items]) => ({
            name: getImportedVaultName(folderMap[folderId ?? '']?.name),
            shareId: null,
            items: items
                .map((item): Maybe<ItemImportIntent> => {
                    try {
                        switch (item.type) {
                            case BitwardenType.LOGIN:
                                const urls = extractBitwardenUrls(item);
                                return importLoginItem({
                                    name: item.name,
                                    note: item.notes,
                                    ...getEmailOrUsername(item.login.username),
                                    password: item.login.password,
                                    urls: urls.web,
                                    totp: item.login.totp,
                                    appIds: urls.android,
                                    extraFields: extractBitwardenExtraFields(item.fields),
                                });
                            case BitwardenType.NOTE:
                                addCustomFieldsWarning(ignored, item);
                                return importNoteItem({
                                    name: item.name,
                                    note: item.notes,
                                });
                            case BitwardenType.CREDIT_CARD:
                                addCustomFieldsWarning(ignored, item);
                                return importCreditCardItem({
                                    name: item.name,
                                    note: item.notes,
                                    cardholderName: item.card.cardholderName,
                                    number: item.card.number,
                                    verificationNumber: item.card.code,
                                    expirationDate: formatBitwardenCCExpirationDate(item),
                                });
                            case BitwardenType.IDENTITY:
                                addCustomFieldsWarning(ignored, item);
                                return importIdentityItem({
                                    name: item.name,
                                    note: item.notes,
                                    ...extractBitwardenIdentity(item),
                                });
                        }
                    } catch (err) {
                        ignored.push(c('Error').t`[Error] an item could not be parsed`);
                        logger.warn('[Importer::Bitwarden]', err);
                    }
                })
                .filter(truthy),
        }));

        return { vaults, ignored, warnings: [] };
    } catch (e) {
        logger.warn('[Importer::Bitwarden]', e);
        throw new ImportProviderError('Bitwarden', e);
    }
};
