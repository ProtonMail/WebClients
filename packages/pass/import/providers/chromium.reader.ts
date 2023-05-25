import { c } from 'ttag';

import type { ItemImportIntent } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string';

import { readCSV } from '../helpers/csv.reader';
import { ImportReaderError } from '../helpers/reader.error';
import { getImportedVaultName, importLoginItem } from '../helpers/transformers';
import type { ImportPayload } from '../types';
import type { ChromiumItem } from './chromium.types';

const CHROME_EXPECTED_HEADERS: (keyof ChromiumItem)[] = ['name', 'url', 'username', 'password'];

export const readChromiumData = async (data: string): Promise<ImportPayload> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const result = await readCSV<ChromiumItem>({
            data,
            headers: CHROME_EXPECTED_HEADERS,
            onError: (error) => warnings.push(error),
        });

        return {
            vaults: [
                {
                    type: 'new',
                    vaultName: getImportedVaultName(),
                    id: uniqueId(),
                    items: result.items.map(
                        (item): ItemImportIntent<'login'> =>
                            importLoginItem({
                                name: item.name,
                                note: item.note,
                                username: item.username,
                                password: item.password,
                                urls: [item.url],
                            })
                    ),
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
