import { c } from 'ttag';

import type { ItemExtraField, ItemImportIntent, Maybe } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string';
import { BITWARDEN_ANDROID_APP_FLAG, isBitwardenLinkedAndroidAppUrl } from '@proton/pass/utils/url';

import { ImportReaderError } from '../helpers/reader.error';
import { getImportedVaultName, importLoginItem, importNoteItem } from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import { BitwardenCustomFieldType, type BitwardenLoginItem } from './bitwarden.types';
import { type BitwardenData, BitwardenType } from './bitwarden.types';

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

export const readBitwardenData = (data: string): ImportPayload => {
    try {
        const { items, encrypted } = JSON.parse(data) as BitwardenData;
        if (encrypted) throw new ImportReaderError(c('Error').t`Encrypted JSON not supported`);

        const ignored: string[] = [];

        const vaults: ImportVault[] = [
            {
                type: 'new',
                vaultName: getImportedVaultName(),
                id: uniqueId(),
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
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`Bitwarden export file could not be parsed. ${errorDetail}`);
    }
};
