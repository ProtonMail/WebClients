import { c } from 'ttag';

import lastItem from '@proton/utils/lastItem';

import type { ItemImportIntent } from '../../../../types/data/items.dto';
import type { Maybe } from '../../../../types/utils';
import { logger } from '../../../../utils/logger';
import { readCSV } from '../../helpers/csv.reader';
import { ImportProviderError } from '../../helpers/error';
import { createImportFolderTree } from '../../helpers/folders';
import { getEmailOrUsername, getImportedVaultName, importLoginItem, importNoteItem } from '../../helpers/transformers';
import type { ImportReaderResult, ImportVault } from '../../types';
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

export const readRoboformData = async (file: File): Promise<ImportReaderResult> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const data = await file.text();
        const result = await readCSV<RoboformVariadicItem>({
            data,
            onError: (error) => warnings.push(error),
        });

        /** Skips the first row (headers) and maps results to an array of RoboformItem's. */
        const parsed: RoboformItem[] = result.items
            .slice(1)
            .map(([Name, Url, MatchUrl, Login, Pwd, Note, Folder, ...RfFieldsV2]) => ({
                Name,
                Url,
                MatchUrl,
                Login: unescapeFieldValue(Login),
                Pwd: unescapeFieldValue(Pwd),
                Note,
                Folder,
                RfFieldsV2,
            }));

        const tree = createImportFolderTree({ separator: '/' });
        const items: ItemImportIntent[] = [];

        for (const item of parsed) {
            const folderId = tree.add(item.Folder);

            const value = await (async (): Promise<Maybe<ItemImportIntent>> => {
                try {
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
                        password: item.Pwd,
                        totp: formatOtpAuthUri(item),
                        ...(await getEmailOrUsername(item.Login)),
                    });
                } catch (err) {
                    const title = item?.Name ?? '';
                    ignored.push(`[${c('Label').t`Unknown`}] ${title}`);
                    logger.warn('[Importer::Roboform]', err);
                }
            })();

            if (value) items.push({ ...value, folderId });
        }

        const vaults: ImportVault[] = [{ name: getImportedVaultName(), shareId: null, folders: tree.folders, items }];

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::Roboform]', e);
        throw new ImportProviderError('Roboform', e);
    }
};
