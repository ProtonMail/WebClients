import { c } from 'ttag';

import type { ItemExtraField, ItemImportIntent, Maybe } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { BITWARDEN_ANDROID_APP_FLAG, isBitwardenLinkedAndroidAppUrl } from '@proton/pass/utils/url';

import { ImportProviderError, ImportReaderError } from '../helpers/error';
import { getImportedVaultName, importCreditCardItem, importLoginItem, importNoteItem } from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import {
    type BitwardenCCItem,
    BitwardenCustomFieldType,
    type BitwardenData,
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

const extractExtraFields = (item: BitwardenLoginItem) => {
    return item.fields
        ?.filter((field) => Object.values(BitwardenCustomFieldType).includes(field.type))
        .map<ItemExtraField>(({ name, type, value }) => {
            switch (type) {
                case BitwardenCustomFieldType.TEXT:
                    return {
                        fieldName: name || c('Label').t`Text`,
                        type: 'text',
                        data: { content: value ?? '' },
                    };
                case BitwardenCustomFieldType.HIDDEN:
                    return {
                        fieldName: name || c('Label').t`Hidden`,
                        type: 'hidden',
                        data: { content: value ?? '' },
                    };
            }
        });
};

const formatCCExpirationDate = (item: BitwardenCCItem) => {
    const { expMonth, expYear } = item.card;
    if (!expMonth || !expYear) return '';

    return `${String(expMonth).padStart(2, '0')}${expYear}`;
};

export const readBitwardenData = (data: string): ImportPayload => {
    try {
        const { items, encrypted } = JSON.parse(data) as BitwardenData;
        if (encrypted) throw new ImportReaderError(c('Error').t`Encrypted JSON not supported`);

        const ignored: string[] = [];

        const vaults: ImportVault[] = [
            {
                name: getImportedVaultName(),
                shareId: null,
                items: items
                    .map((item): Maybe<ItemImportIntent> => {
                        switch (item.type) {
                            case BitwardenType.LOGIN:
                                const urls = extractUrls(item);
                                return importLoginItem({
                                    name: item.name,
                                    note: item.notes,
                                    username: item.login.username,
                                    password: item.login.password,
                                    urls: urls.web,
                                    totp: item.login.totp,
                                    appIds: urls.android,
                                    extraFields: extractExtraFields(item),
                                });
                            case BitwardenType.NOTE:
                                return importNoteItem({
                                    name: item.name,
                                    note: item.notes,
                                });
                            case BitwardenType.CREDIT_CARD:
                                return importCreditCardItem({
                                    name: item.name,
                                    note: item.notes,
                                    cardholderName: item.card.cardholderName,
                                    number: item.card.number,
                                    verificationNumber: item.card.code,
                                    expirationDate: formatCCExpirationDate(item),
                                });
                            default:
                                ignored.push(`[${BitwardenTypeMap[item.type] ?? 'Other'}] ${item.name}`);
                                return;
                        }
                    })
                    .filter(truthy),
            },
        ];

        return { vaults, ignored, warnings: [] };
    } catch (e) {
        logger.warn('[Importer::Bitwarden]', e);
        throw new ImportProviderError('Bitwarden', e);
    }
};
