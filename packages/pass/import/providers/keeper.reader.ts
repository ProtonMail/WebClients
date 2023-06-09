import { c } from 'ttag';

import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string';
import groupWith from '@proton/utils/groupWith';
import lastItem from '@proton/utils/lastItem';

import { readCSV } from '../helpers/csv.reader';
import { ImportReaderError } from '../helpers/reader.error';
import { getImportedVaultName, importLoginItem } from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import type { KeeperItem } from './keeper.types';

const extractTOTP = (item: KeeperItem): string => {
    /* the totp is the element which follows the element
     * 'TFC:Keeper', and Keeper doesn't allow more than 1
     * totp per item */
    const indexBeforeTOTP = item.findIndex((element) => element === 'TFC:Keeper');
    return indexBeforeTOTP > 0 ? item[indexBeforeTOTP + 1] : '';
};

/* item type is not defined in the CSV, so we import
 * as a login item if username or password or url or note
 * is not empty. ie: if an SSH key item has an username it
 * will be imported as a login item */
const isLoginItem = (item: KeeperItem): boolean => item[2] !== '' || item[3] !== '' || item[4] !== '' || item[5] !== '';

export const readKeeperData = async (data: string): Promise<ImportPayload> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const result = await readCSV<KeeperItem>({
            data,
            onError: (error) => warnings.push(error),
        });

        const groupedByVault = groupWith<KeeperItem>(
            (a, b) => a[0] === b[0],
            result.items.map(([folderName, ...rest]) => [lastItem(folderName?.split('\\')) ?? '', ...rest])
        );

        const vaults: ImportVault[] = groupedByVault
            .filter(({ length }) => length > 0)
            .map((items) => {
                return {
                    type: 'new',
                    vaultName: getImportedVaultName(items?.[0][0]),
                    id: uniqueId(),
                    items: items
                        .map((item): Maybe<ItemImportIntent> => {
                            if (!isLoginItem(item)) {
                                ignored.push(`[Unsupported] ${item[1]}`);
                                return;
                            }

                            return importLoginItem({
                                name: item[1],
                                note: item[5],
                                username: item[2],
                                password: item[3],
                                urls: [item[4]],
                                totp: extractTOTP(item),
                            });
                        })
                        .filter(truthy),
                };
            });

        return {
            vaults,
            ignored,
            warnings,
        };
    } catch (e) {
        logger.warn('[Importer::Keeper]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new Error(c('Error').t`Keeper export file could not be parsed. ${errorDetail}`);
    }
};
