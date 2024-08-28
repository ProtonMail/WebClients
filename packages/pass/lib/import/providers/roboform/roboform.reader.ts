import { readCSV } from '@proton/pass/lib/import/helpers/csv.reader';
import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importLoginItem,
    importNoteItem,
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportPayload, ImportVault } from '@proton/pass/lib/import/types';
import type { Maybe } from '@proton/pass/types';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { logger } from '@proton/pass/utils/logger';
import lastItem from '@proton/utils/lastItem';

import type { RoboformItem, RoboformVariadicItem } from './roboform.types';

/** In Roboform exports, fields beginning with `@` or `'` have a single quote (`'`) prepended.
 * To account for this, occurences of `'@` and `''` are replaced with their actual values,
 * ie. `@` and `'` respectively. */
const unescapeFieldValue = (value: string) => value.replace(/^'(?=@|')/, '');

const formatOtpAuthUri = (item: RoboformItem): Maybe<string> => {
    const totpDefinition = item.RfFieldsV2?.find((e) => e.startsWith('TOTP KEY$'));
    if (!totpDefinition) return;
    const secret = lastItem(totpDefinition.split(','));
    return `otpauth://totp/${item.Name}:none?secret=${secret}`;
};

export const readRoboformData = async ({ data }: { data: string }): Promise<ImportPayload> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const result = await readCSV<RoboformVariadicItem>({
            data,
            onError: (error) => warnings.push(error),
        });

        /*
         * Skips the first row (headers) and maps results to an array of RoboformItem's.
         */
        const items: RoboformItem[] = result.items
            .slice(1)
            .map(([Name, Url, MatchUrl, Login, Pwd, Note, Folder, ...RfFieldsV2]) => ({
                Name,
                Url,
                MatchUrl,
                Login: unescapeFieldValue(Login),
                Pwd: unescapeFieldValue(Pwd),
                Note,
                Folder: lastItem(Folder.split('/')),
                RfFieldsV2,
            }));

        const groupedByVault = groupByKey(items, 'Folder');

        const vaults: ImportVault[] = groupedByVault.map((roboformItems) => {
            const vaultName = roboformItems[0].Folder;

            const items = roboformItems.map((item) => {
                /* Bookmark */
                if (item.Url && !item.MatchUrl && !item.Login && !item.Pwd) {
                    return importLoginItem({
                        name: item.Name,
                        urls: [item.Url],
                        note: item.Note,
                    });
                }

                /* Note */
                if (!item.Url && !item.MatchUrl && !item.Login && !item.Pwd) {
                    return importNoteItem({
                        name: item.Name,
                        note: item.Note,
                    });
                }

                /* Login */
                return importLoginItem({
                    name: item.Name,
                    urls: [item.MatchUrl],
                    note: item.Note,
                    ...getEmailOrUsername(item.Login),
                    password: item.Pwd,
                    totp: formatOtpAuthUri(item),
                });
            });

            return {
                shareId: null,
                name: getImportedVaultName(vaultName),
                items,
            };
        });

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::Roboform]', e);
        throw new ImportProviderError('Roboform', e);
    }
};
