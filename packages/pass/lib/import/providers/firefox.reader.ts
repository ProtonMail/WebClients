import type { ItemImportIntent } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { msToEpoch } from '@proton/pass/utils/time/epoch';

import { readCSV } from '../helpers/csv.reader';
import { ImportProviderError } from '../helpers/error';
import { getEmailOrUsername, getImportedVaultName, importLoginItem } from '../helpers/transformers';
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
        const result = await readCSV<FirefoxItem>({
            data,
            headers: FIREFOX_EXPECTED_HEADERS,
            onError: (error) => warnings.push(error),
        });

        return {
            vaults: [
                {
                    name: getImportedVaultName(),
                    shareId: null,
                    items: result.items
                        .filter((item) => item.url !== 'chrome://FirefoxAccounts')
                        .map(
                            (item): ItemImportIntent<'login'> =>
                                importLoginItem({
                                    ...getEmailOrUsername(item.username),
                                    password: item.password,
                                    urls: [item.url],
                                    createTime: item.timeCreated ? msToEpoch(Number(item.timeCreated)) : undefined,
                                    modifyTime: item.timePasswordChanged
                                        ? msToEpoch(Number(item.timePasswordChanged))
                                        : undefined,
                                })
                        ),
                },
            ],
            ignored,
            warnings,
        };
    } catch (e) {
        logger.warn('[Importer::Firefox]', e);
        throw new ImportProviderError('Firefox', e);
    }
};
