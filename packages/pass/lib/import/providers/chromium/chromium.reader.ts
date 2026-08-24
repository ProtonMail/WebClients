import type { ItemImportIntent } from '../../../../types';
import { logger } from '../../../../utils/logger';
import { readCSV } from '../../helpers/csv.reader';
import { ImportProviderError } from '../../helpers/error';
import { getEmailOrUsername, getImportedVaultName, importLoginItem } from '../../helpers/transformers';
import type { ImportReaderResult } from '../../types';
import type { ChromiumItem } from './chromium.types';

/** 'note' header is not required because not present on older chromium versions */
const CHROME_EXPECTED_HEADERS: (keyof ChromiumItem)[] = ['name', 'url', 'username', 'password'];

export const readChromiumData = async (file: File): Promise<ImportReaderResult> => {
    const ignored: string[] = [];
    const warnings: string[] = [];
    const items: ItemImportIntent[] = [];

    try {
        const data = await file.text();
        const parsed = await readCSV<ChromiumItem>({
            data,
            headers: CHROME_EXPECTED_HEADERS,
            onError: (error) => warnings.push(error),
        });

        for (const item of parsed.items) {
            items.push(
                importLoginItem({
                    name: item.name,
                    note: item.note,
                    password: item.password,
                    urls: [item.url],
                    ...(await getEmailOrUsername(item.username)),
                })
            );
        }

        return {
            vaults: [{ name: getImportedVaultName(), shareId: null, items }],
            ignored,
            warnings,
        };
    } catch (e) {
        logger.warn('[Importer::Chrome]', e);
        throw new ImportProviderError('Chrome', e);
    }
};
