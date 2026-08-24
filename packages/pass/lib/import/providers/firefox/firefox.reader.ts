import type { ItemImportIntent } from '../../../../types';
import { logger } from '../../../../utils/logger';
import { msToEpoch } from '../../../../utils/time/epoch';
import { readCSV } from '../../helpers/csv.reader';
import { ImportProviderError } from '../../helpers/error';
import { getEmailOrUsername, getImportedVaultName, importLoginItem } from '../../helpers/transformers';
import type { ImportReaderResult } from '../../types';
import type { FirefoxItem } from './firefox.types';

const FIREFOX_EXPECTED_HEADERS: (keyof FirefoxItem)[] = [
    'url',
    'username',
    'password',
    'timeCreated',
    'timePasswordChanged',
];

export const readFirefoxData = async (file: File): Promise<ImportReaderResult> => {
    const ignored: string[] = [];
    const warnings: string[] = [];
    const items: ItemImportIntent[] = [];

    try {
        const data = await file.text();
        const parsed = await readCSV<FirefoxItem>({
            data,
            headers: FIREFOX_EXPECTED_HEADERS,
            onError: (error) => warnings.push(error),
        });

        for (const item of parsed.items) {
            if (item.url === 'chrome://FirefoxAccounts') continue;

            items.push(
                importLoginItem({
                    ...(await getEmailOrUsername(item.username)),
                    password: item.password,
                    urls: [item.url],
                    createTime: item.timeCreated ? msToEpoch(Number(item.timeCreated)) : undefined,
                    modifyTime: item.timePasswordChanged ? msToEpoch(Number(item.timePasswordChanged)) : undefined,
                })
            );
        }

        return {
            vaults: [{ name: getImportedVaultName(), shareId: null, items }],
            ignored,
            warnings,
        };
    } catch (e) {
        logger.warn('[Importer::Firefox]', e);
        throw new ImportProviderError('Firefox', e);
    }
};
