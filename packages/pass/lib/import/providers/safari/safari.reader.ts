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

import type { SafariItem } from './safari.types';

/* Safari old version has Title,Url,Username,Password
 * while current version has Title,URL,Username,Password,Notes,OTPAuth
 * so we only expect headers in common and not all of them, to avoid readCSV throwing an error */
const SAFARI_EXPECTED_HEADERS: (keyof SafariItem)[] = ['Title', 'Username', 'Password'];

export const readSafariData = async ({ data }: { data: string }): Promise<ImportPayload> => {
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
                    name: getImportedVaultName(),
                    shareId: null,
                    items: result.items.map(
                        (item): ItemImportIntent<'login'> =>
                            importLoginItem({
                                name: item.Title,
                                note: item.Notes,
                                ...getEmailOrUsername(item.Username),
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
        throw new ImportProviderError('Safari', e);
    }
};
