import { c } from 'ttag';

import type { ItemImportIntent } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string';
import capitalize from '@proton/utils/capitalize';
import groupWith from '@proton/utils/groupWith';
import lastItem from '@proton/utils/lastItem';

import { readCSV } from '../helpers/csv.reader';
import { ImportReaderError } from '../helpers/reader.error';
import { getImportedVaultName, importLoginItem, importNoteItem } from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import type { LastPassItem } from './lastpass.types';

const LASTPASS_EXPECTED_HEADERS: (keyof LastPassItem)[] = [
    'url',
    'username',
    'password',
    'extra',
    'name',
    'grouping',
    'fav',
];

const processLoginItem = (item: LastPassItem): ItemImportIntent<'login'> =>
    importLoginItem({
        name: item.name,
        note: item.extra,
        username: item.username,
        password: item.password,
        urls: [item.url],
        totp: item.totp,
    });

const processNoteItem = (item: LastPassItem): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.name,
        note: item.extra,
    });

export const readLastPassData = async (data: string): Promise<ImportPayload> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const result = await readCSV<LastPassItem>({
            data,
            headers: LASTPASS_EXPECTED_HEADERS,
            throwOnEmpty: true,
            onError: (error) =>
                warnings.push(
                    `[Warning] ${c('Error')
                        .t`LastPass will export a corrupted CSV file if any of your item fields contain unexpected commas, quotes or multiple lines`}`,
                    error
                ),
        });

        const groupedByVault = groupWith<LastPassItem>(
            (a, b) => a.grouping === b.grouping,
            result.items.map((item) => ({
                ...item,
                grouping: item.grouping ? lastItem(item.grouping?.split('\\')) : undefined,
            }))
        );

        const vaults: ImportVault[] = groupedByVault
            .filter(({ length }) => length > 0)
            .map((items) => {
                return {
                    type: 'new',
                    vaultName: getImportedVaultName(items?.[0].grouping),
                    id: uniqueId(),
                    items: items
                        .map((item) => {
                            const isNote = item.url === 'http://sn';
                            if (!isNote) return processLoginItem(item);

                            const matchType = isNote && item.extra?.match(/^NoteType:(.*)/);
                            const noteType = matchType && matchType[1];

                            if (!noteType) return processNoteItem(item);
                            ignored.push(`[${capitalize(noteType)}] ${item.name}`);
                        })
                        .filter(truthy),
                };
            });

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::LastPass]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`LastPass export file could not be parsed. ${errorDetail}`);
    }
};
