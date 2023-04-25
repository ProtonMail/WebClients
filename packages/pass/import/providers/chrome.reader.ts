import { c } from 'ttag';
import uniqid from 'uniqid';

import type { ItemImportIntent } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { isValidURL } from '@proton/pass/utils/url';

import { readCSV } from '../helpers/csv.reader';
import { ImportReaderError } from '../helpers/reader.error';
import type { ImportPayload } from '../types';
import type { ChromeItem } from './chrome.types';

const CHROME_EXPECTED_HEADERS: (keyof ChromeItem)[] = ['name', 'url', 'username', 'password'];

export const readChromeData = async (data: string): Promise<ImportPayload> => {
    try {
        const items = await readCSV<ChromeItem>(data, CHROME_EXPECTED_HEADERS);

        return {
            vaults: [
                {
                    type: 'new',
                    vaultName: c('Title').t`Chrome import`,
                    id: uniqid(),
                    items: items.map((item): ItemImportIntent<'login'> => {
                        const urlResult = isValidURL(item.url ?? '');
                        const url = urlResult.valid ? new URL(urlResult.url) : undefined;
                        const name = item.name || url?.hostname || 'Unnamed Chrome item';

                        return {
                            type: 'login',
                            metadata: {
                                name,
                                note: item.note ?? '',
                                itemUuid: uniqid(),
                            },
                            content: {
                                username: item.username || '',
                                password: item.password || '',
                                urls: [url?.origin].filter(Boolean) as string[],
                                totpUri: '',
                            },
                            extraFields: [],
                            trashed: false,
                        };
                    }),
                },
            ],
            ignored: [],
        };
    } catch (e) {
        logger.warn('[Importer::Chrome]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new Error(c('Error').t`Chrome export file could not be parsed. ${errorDetail}`);
    }
};
