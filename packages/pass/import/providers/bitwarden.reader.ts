import { c } from 'ttag';
import uniqid from 'uniqid';

import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp';
import { BITWARDEN_ANDROID_APP_FLAG, isBitwardenLinkedAndroidAppUrl, isValidURL } from '@proton/pass/utils/url';

import { ImportReaderError } from '../helpers/reader.error';
import type { ImportPayload } from '../types';
import { type BitwardenData, BitwardenType } from './bitwarden.types';

export const readBitwardenData = (data: string): ImportPayload => {
    try {
        const { items, encrypted } = JSON.parse(data) as BitwardenData;
        if (encrypted) throw new ImportReaderError(c('Error').t`Encrypted JSON not supported`);

        return [
            {
                type: 'new',
                vaultName: c('Title').t`Bitwarden import`,
                id: uniqid(),
                items: items
                    .filter(({ type }) => Object.values(BitwardenType).includes(type))
                    .map((item): Maybe<ItemImportIntent> => {
                        switch (item.type) {
                            case BitwardenType.LOGIN:
                                const uris = (item.login.uris ?? []).reduce<{ web: string[]; android: string[] }>(
                                    (acc, { uri }) => {
                                        if (isBitwardenLinkedAndroidAppUrl(uri)) {
                                            acc.android.push(uri.replace(BITWARDEN_ANDROID_APP_FLAG, ''));
                                            return acc;
                                        }

                                        const { valid, url } = isValidURL(uri);
                                        if (valid) acc.web.push(new URL(url).origin);

                                        return acc;
                                    },
                                    { web: [], android: [] }
                                );

                                const loginCreationIntent: ItemImportIntent<'login'> = {
                                    type: 'login',
                                    metadata: {
                                        name: item.name,
                                        note: item.notes ?? '',
                                        itemUuid: uniqid(),
                                    },
                                    content: {
                                        username: item.login.username ?? '',
                                        password: item.login.password ?? '',
                                        urls: uris.web,
                                        totpUri: item.login.totp
                                            ? parseOTPValue(item.login.totp, { label: item.name })
                                            : '',
                                    },
                                    platformSpecific: {
                                        android: {
                                            allowedApps: uris.android.map((appId) => ({
                                                packageName: appId,
                                                appName: appId,
                                                hashes: [appId],
                                            })),
                                        },
                                    },
                                    extraFields: [],
                                    trashed: false,
                                };

                                return loginCreationIntent;

                            case BitwardenType.NOTE:
                                const noteCreationIntent: ItemImportIntent<'note'> = {
                                    type: 'note',
                                    metadata: {
                                        name: item.name,
                                        note: item.notes ?? '',
                                        itemUuid: uniqid(),
                                    },
                                    content: {},
                                    extraFields: [],
                                    trashed: false,
                                };

                                return noteCreationIntent;
                            default:
                                return;
                        }
                    })
                    .filter((intent): intent is ItemImportIntent => intent !== undefined),
            },
        ];
    } catch (e) {
        logger.warn('[Importer::Bitwarden]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`Bitwarden export file could not be parsed. ${errorDetail}`);
    }
};
