import { c } from 'ttag';

import type { ItemExtraField, ItemImportIntent, Maybe } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import groupWith from '@proton/utils/groupWith';
import lastItem from '@proton/utils/lastItem';

import { readCSV } from '../helpers/csv.reader';
import { ImportProviderError } from '../helpers/error';
import { getImportedVaultName, importLoginItem, importNoteItem } from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import type { KeeperItem } from './keeper.types';

const extractTOTP = (item: KeeperItem): string => {
    /* the totp is the element which follows the element
     * 'TFC:Keeper', and Keeper doesn't allow more than 1
     * totp per item */
    const indexBeforeTOTP = item.findIndex((element) => element === 'TFC:Keeper');
    return indexBeforeTOTP > 0 ? item[indexBeforeTOTP + 1] : '';
};

const extractExtraFields = (item: KeeperItem): ItemExtraField[] => {
    const customFields: ItemExtraField[] = [];
    if (item.length > 7) {
        for (let i = 7; i < item.length; i += 2) {
            /* skip totp field because it was already added in extractTOTP above */
            if (item[i] == 'TFC:Keeper') continue;

            const type = item[i] === 'Hidden Field' ? 'hidden' : 'text';

            customFields.push({
                fieldName: item[i] || (type === 'hidden' ? c('Label').t`Hidden` : c('Label').t`Text`),
                type,
                data: {
                    content: item[i + 1],
                },
            });
        }
    }
    return customFields;
};

/* item type is not defined in the CSV, so we import
 * as a login item if username or password or url or note
 * is not empty. ie: if an SSH key item has an username it
 * will be imported as a login item */
const isLoginItem = (item: KeeperItem): boolean => item[2] !== '' || item[3] !== '' || item[4] !== '' || item[5] !== '';

/* all fields empty except note field at index 5 */
const isNoteItem = (item: KeeperItem): boolean =>
    item.every((value, idx) => {
        if (idx < 2) return true;
        if (idx === 5) return value !== '';
        if (idx !== 5) return !value;
    });

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
                    name: getImportedVaultName(items?.[0][0]),
                    shareId: null,
                    items: items
                        .map((item): Maybe<ItemImportIntent> => {
                            if (isNoteItem(item)) {
                                return importNoteItem({
                                    name: item[1],
                                    note: item[5],
                                });
                            }

                            if (isLoginItem(item)) {
                                return importLoginItem({
                                    name: item[1],
                                    note: item[5],
                                    username: item[2],
                                    password: item[3],
                                    urls: [item[4]],
                                    totp: extractTOTP(item),
                                    extraFields: extractExtraFields(item),
                                });
                            }

                            ignored.push(`[Unsupported] ${item[1]}`);
                            return;
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
        throw new ImportProviderError('Keeper', e);
    }
};
