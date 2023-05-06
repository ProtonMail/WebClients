import { c } from 'ttag';

import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { uniqueId } from '@proton/pass/utils/string';
import { getFormattedDayFromTimestamp } from '@proton/pass/utils/time/format';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { BITWARDEN_ANDROID_APP_FLAG, isBitwardenLinkedAndroidAppUrl, isValidURL } from '@proton/pass/utils/url';

import { ImportReaderError } from '../helpers/reader.error';
import type { ImportPayload, ImportVault } from '../types';
import { type BitwardenData, BitwardenType } from './bitwarden.types';

const BitwardenTypeMap: Record<number, string> = {
    1: 'Login',
    2: 'Note',
    3: 'Credit Card',
    4: 'Identification',
};

export const readBitwardenData = (data: string): ImportPayload => {
    try {
        const { items, encrypted } = JSON.parse(data) as BitwardenData;
        if (encrypted) throw new ImportReaderError(c('Error').t`Encrypted JSON not supported`);

        const ignored: string[] = [];

        const vaults: ImportVault[] = [
            {
                type: 'new',
                vaultName: c('Title').t`Import - ${getFormattedDayFromTimestamp(getEpoch())}`,
                id: uniqueId(),
                items: items
                    .map((item): Maybe<ItemImportIntent> => {
                        const name = item.name ?? 'Unnamed item';

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
                                        name,
                                        note: item.notes ?? '',
                                        itemUuid: uniqueId(),
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
                                        name,
                                        note: item.notes ?? '',
                                        itemUuid: uniqueId(),
                                    },
                                    content: {},
                                    extraFields: [],
                                    trashed: false,
                                };

                                return noteCreationIntent;
                            default:
                                ignored.push(`[${BitwardenTypeMap[item.type] ?? 'Other'}] ${item.name}`);
                                return;
                        }
                    })
                    .filter(truthy),
            },
        ];

        return { vaults, ignored };
    } catch (e) {
        logger.warn('[Importer::Bitwarden]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`Bitwarden export file could not be parsed. ${errorDetail}`);
    }
};
