import { c } from 'ttag';

import type { ItemImportIntent } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { uniqueId } from '@proton/pass/utils/string';
import { getFormattedDayFromTimestamp } from '@proton/pass/utils/time/format';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { isValidURL } from '@proton/pass/utils/url';
import capitalize from '@proton/utils/capitalize';
import groupWith from '@proton/utils/groupWith';
import lastItem from '@proton/utils/lastItem';

import { readCSV } from '../helpers/csv.reader';
import { ImportReaderError } from '../helpers/reader.error';
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

const processLoginItem = (item: LastPassItem): ItemImportIntent<'login'> => {
    const urlResult = isValidURL(item.url ?? '');
    const url = urlResult.valid ? new URL(urlResult.url) : undefined;
    const name = item.name || url?.hostname || 'Unnamed item';

    return {
        type: 'login',
        metadata: {
            name,
            note: item.extra ?? '',
            itemUuid: uniqueId(),
        },
        content: {
            username: item.username ?? '',
            password: item.password ?? '',
            urls: [url?.origin].filter(Boolean) as string[],
            totpUri: item.totp ? parseOTPValue(item.totp, { label: name }) : '',
        },
        extraFields: [],
        trashed: false,
    };
};

const processNoteItem = (item: LastPassItem): ItemImportIntent<'note'> => ({
    type: 'note',
    metadata: {
        name: item.name || 'Unnamed note',
        note: item.extra ?? '',
        itemUuid: uniqueId(),
    },
    content: {},
    extraFields: [],
    trashed: false,
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
                    vaultName:
                        items?.[0].grouping ?? `${c('Title').t`Import - ${getFormattedDayFromTimestamp(getEpoch())}`}`,
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
