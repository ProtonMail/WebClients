import { c } from 'ttag';
import uniqid from 'uniqid';

import type { ItemImportIntent } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { isValidURL } from '@proton/pass/utils/url';

import { readCSV } from '../helpers/csv.reader';
import { ImportReaderError } from '../helpers/reader.error';
import type { ImportPayload } from '../types';
import type { ChromeItem } from './chrome.types';

const CHROME_HEADERS: (keyof ChromeItem)[] = ['name', 'url', 'username', 'password', 'note'];

export const readChromeData = async (data: string): Promise<ImportPayload> => {
    try {
        const items = await readCSV<ChromeItem>(data, CHROME_HEADERS);

        return [
            {
                type: 'new',
                vaultName: c('Title').t`Chrome import`,
                id: uniqid(),
                items: items.map((item): ItemImportIntent<'login'> => {
                    const validUrl = item.url ? isValidURL(item.url)?.valid : false;
                    const urls = validUrl ? [new URL(item.url!).origin] : [];

                    return {
                        type: 'login',
                        metadata: {
                            name: item.name || item.username || 'Unnamed Chrome item',
                            note: '',
                            itemUuid: uniqid(),
                        },
                        content: {
                            username: item.username || '',
                            password: item.password || '',
                            urls,
                            totpUri: '',
                        },
                        extraFields: [],
                        trashed: false,
                    };
                }),
            },
        ];
    } catch (e) {
        logger.warn('[Importer::Chrome]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new Error(c('Error').t`Chrome export file could not be parsed. ${errorDetail}`);
    }
};
