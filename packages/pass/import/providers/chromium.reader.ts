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
import type { ChromiumItem } from './chromium.types';

const CHROME_EXPECTED_HEADERS: (keyof ChromiumItem)[] = ['name', 'url', 'username', 'password'];

export const readChromiumData = async (data: string): Promise<ImportPayload> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const result = await readCSV<ChromiumItem>(data, CHROME_EXPECTED_HEADERS, {
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
                    items: result.items.map((item): ItemImportIntent<'login'> => {
                        const urlResult = isValidURL(item.url ?? '');
                        const url = urlResult.valid ? new URL(urlResult.url) : undefined;
                        const name = item.name || url?.hostname || 'Unnamed item';

                        return {
                            type: 'login',
                            metadata: {
                                name,
                                note: item.note ?? '',
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
                        };
                    }),
                },
            ],
            ignored,
            warnings,
        };
    } catch (e) {
        logger.warn('[Importer::Chrome]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new Error(c('Error').t`Chrome export file could not be parsed. ${errorDetail}`);
    }
};
