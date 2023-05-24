import { c, msgid } from 'ttag';

import type { ItemImportIntent } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string';
import { getFormattedDayFromTimestamp } from '@proton/pass/utils/time/format';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { isValidURL } from '@proton/pass/utils/url';

import { readCSV } from '../helpers/csv.reader';
import { ImportReaderError } from '../helpers/reader.error';
import type { ImportPayload } from '../types';
import type { FirefoxItem } from './firefox.types';

const FIREFOX_EXPECTED_HEADERS: (keyof FirefoxItem)[] = [
    'url',
    'username',
    'password',
    'timeCreated',
    'timePasswordChanged',
];

export const readFirefoxData = async (data: string): Promise<ImportPayload> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const result = await readCSV<FirefoxItem>(data, FIREFOX_EXPECTED_HEADERS, {
            onErrors: (errors) =>
                warnings.push(
                    `[Error] ${c('Error').ngettext(
                        msgid`Detected ${errors.length} corrupted csv row`,
                        `Detected ${errors.length} corrupted csv rows`,
                        errors.length
                    )}`
                ),
        });

        return {
            vaults: [
                {
                    type: 'new',
                    vaultName: c('Title').t`Import - ${getFormattedDayFromTimestamp(getEpoch())}`,
                    id: uniqueId(),
                    items: result.items
                        .filter((item) => item.url !== 'chrome://FirefoxAccounts')
                        .map((item): ItemImportIntent<'login'> => {
                            const urlResult = isValidURL(item.url ?? '');
                            const url = urlResult.valid ? new URL(urlResult.url) : undefined;
                            const name = url?.hostname || 'Unnamed item';

                            return {
                                type: 'login',
                                metadata: {
                                    name,
                                    note: '',
                                    itemUuid: uniqueId(),
                                },
                                content: {
                                    username: item.username || '',
                                    password: item.password || '',
                                    urls: [url?.origin].filter(truthy),
                                    totpUri: '',
                                },
                                extraFields: [],
                                trashed: false,
                                // Firefox uses unix time in milliseconds instead of seconds
                                createTime: item.timeCreated ? Math.floor(item.timeCreated / 1000) : undefined,
                                modifyTime: item.timePasswordChanged
                                    ? Math.floor(item.timePasswordChanged / 1000)
                                    : undefined,
                            };
                        }),
                },
            ],
            ignored,
            warnings,
        };
    } catch (e) {
        logger.warn('[Importer::Firefox]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new Error(c('Error').t`Firefox export file could not be parsed. ${errorDetail}`);
    }
};
