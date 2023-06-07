import { c } from 'ttag';

import type { ItemImportIntent } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string';

import { readCSV } from '../helpers/csv.reader';
import { ImportReaderError } from '../helpers/reader.error';
import { getImportedVaultName, importLoginItem } from '../helpers/transformers';
import type { ImportPayload } from '../types';
import type { SafariItem } from './safari.types';

/* Safari old version has Title,Url,Username,Password
 * while current version has Title,URL,Username,Password,Notes,OTPAuth
 * so we only expect headers in common and not all of them, to avoid readCSV throwing an error */
const SAFARI_EXPECTED_HEADERS: (keyof SafariItem)[] = ['Title', 'Username', 'Password'];

export const readSafariData = async (data: string): Promise<ImportPayload> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const result = await readCSV<SafariItem>({
            data,
            headers: SAFARI_EXPECTED_HEADERS,
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
                                name: item.Title,
                                note: item.Notes,
                                username: item.Username,
                                password: item.Password,
                                urls: [item.URL],
                                totp: item.OTPAuth,
                            })
                    ),
                },
            ],
            ignored,
            warnings,
        };
    } catch (e) {
        logger.warn('[Importer::Safari]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new Error(c('Error').t`Safari export file could not be parsed. ${errorDetail}`);
    }
};
