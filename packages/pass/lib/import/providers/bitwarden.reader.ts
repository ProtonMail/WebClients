import groupBy from 'lodash/groupBy';
import keyBy from 'lodash/keyBy';
import { c } from 'ttag';

import { buildBitwardenIdentity, extraFieldsFactory } from '@proton/pass/lib/import/builders/bitwarden.builder';
import type { ItemImportIntent, Maybe, UnsafeItemExtraField } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { BITWARDEN_ANDROID_APP_FLAG, isBitwardenLinkedAndroidAppUrl } from '@proton/pass/utils/url/android';

import { ImportProviderError, ImportReaderError } from '../helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import {
    type BitwardenCCItem,
    BitwardenCustomFieldType,
    type BitwardenData,
    type BitwardenItem,
    type BitwardenLoginItem,
    BitwardenType,
} from './bitwarden.types';

const BitwardenTypeMap: Record<number, string> = {
    1: 'Login',
    2: 'Note',
    3: 'Credit Card',
    4: 'Identification',
};

const extractUrls = (item: BitwardenLoginItem) =>
    (item.login.uris ?? []).reduce<{ web: string[]; android: string[] }>(
        (acc, { uri }) => {
            if (isBitwardenLinkedAndroidAppUrl(uri)) {
                acc.android.push(uri.replace(BITWARDEN_ANDROID_APP_FLAG, ''));
                return acc;
            } else {
                acc.web.push(uri);
            }

            return acc;
        },
        { web: [], android: [] }
    );

const extractExtraFields = (item: BitwardenLoginItem) =>
    item.fields
        ?.filter((field) => Object.values(BitwardenCustomFieldType).includes(field.type))
        .map<UnsafeItemExtraField>(({ name, type, value }) => extraFieldsFactory[type](name, value));

const formatCCExpirationDate = (item: BitwardenCCItem) => {
    const { expMonth, expYear } = item.card;
    if (!expMonth || !expYear) return '';

    return `${String(expMonth).padStart(2, '0')}${expYear}`;
};

const addCustomFieldsWarning = (ignored: string[], item: BitwardenItem) => {
    if (item.fields) {
        ignored.push(
            `[${BitwardenTypeMap[item.type]}] ${item.name}: ${c('Warning').t`item was imported without custom fields`}`
        );
    }
};

export const readBitwardenData = ({
    data,
    importUsername,
}: {
    data: string;
    importUsername?: boolean;
}): ImportPayload => {
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
                    switch (item.type) {
                        case BitwardenType.LOGIN:
                            const urls = extractUrls(item);
                            return importLoginItem({
                                name: item.name,
                                note: item.notes,
                                ...(importUsername
                                    ? getEmailOrUsername(item.login.username)
                                    : { email: item.login.username }),
                                password: item.login.password,
                                urls: urls.web,
                                totp: item.login.totp,
                                appIds: urls.android,
                                extraFields: extractExtraFields(item),
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
                                expirationDate: formatCCExpirationDate(item),
                            });
                        case BitwardenType.IDENTITY:
                            addCustomFieldsWarning(ignored, item);
                            return importIdentityItem({
                                name: item.name,
                                note: item.notes,
                                ...buildBitwardenIdentity(item),
                            });
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
