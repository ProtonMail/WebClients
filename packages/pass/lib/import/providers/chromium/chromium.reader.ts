import { readCSV } from '@proton/pass/lib/import/helpers/csv.reader';
import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importLoginItem,
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportPayload } from '@proton/pass/lib/import/types';
import type { ItemImportIntent } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import type { ChromiumItem } from './chromium.types';

const CHROME_EXPECTED_HEADERS: (keyof ChromiumItem)[] = ['name', 'url', 'username', 'password'];

export const readChromiumData = async ({ data }: { data: string }): Promise<ImportPayload> => {
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
                    name: getImportedVaultName(),
                    shareId: null,
                    items: result.items.map(
                        (item): ItemImportIntent<'login'> =>
                            importLoginItem({
                                name: item.name,
                                note: item.note,
                                ...getEmailOrUsername(item.username),
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
        throw new ImportProviderError('Chrome', e);
    }
};
