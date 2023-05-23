import jszip from 'jszip';
import { c, msgid } from 'ttag';

import type { ItemImportIntent } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { uniqueId } from '@proton/pass/utils/string';
import { getFormattedDayFromTimestamp } from '@proton/pass/utils/time/format';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';

import { readCSV } from '../helpers/csv.reader';
import type { CSVReaderResult } from '../helpers/csv.reader';
import { ImportReaderError } from '../helpers/reader.error';
import type { ImportPayload, ImportVault } from '../types';
import type { DashlaneLoginItem, DashlaneNoteItem } from './dashlane.types';

const DASHLANE_LOGINS_EXPECTED_HEADERS: (keyof DashlaneLoginItem)[] = [
    'username',
    'title',
    'password',
    'note',
    'url',
    'category',
];

const DASHLANE_NOTES_EXPECTED_HEADERS: (keyof DashlaneNoteItem)[] = ['title', 'note'];

const processLoginItem = (item: DashlaneLoginItem): ItemImportIntent<'login'> => {
    return {
        type: 'login',
        metadata: {
            name: item.title || 'Unnamed item',
            note: item.note ?? '',
            itemUuid: uniqueId(),
        },
        content: {
            username: item.username ?? '',
            password: item.password ?? '',
            urls: [item.url].filter(truthy),
            totpUri: item.otpSecret ? parseOTPValue(item.otpSecret, { label: item.title }) : '',
        },
        extraFields: [],
        trashed: false,
    };
};

const processNoteItem = (item: DashlaneNoteItem): ItemImportIntent<'note'> => {
    return {
        type: 'note',
        metadata: {
            name: item.title || 'Unnamed note',
            note: item.note ?? '',
            itemUuid: uniqueId(),
        },
        content: {},
        extraFields: [],
        trashed: false,
    };
};

const parseCsvData = async (
    stringCsv: string | undefined,
    EXPECTED_HEADERS: (keyof DashlaneLoginItem)[] | (keyof DashlaneNoteItem)[],
    warnings: string[]
): Promise<CSVReaderResult<DashlaneLoginItem>> => {
    if (stringCsv === undefined) {
        switch (EXPECTED_HEADERS) {
            case DASHLANE_LOGINS_EXPECTED_HEADERS:
                throw new ImportReaderError(
                    c('Error').t`The file credentials.csv is missing from the Dashlane ZIP file`
                );
            case DASHLANE_NOTES_EXPECTED_HEADERS:
                throw new ImportReaderError(
                    c('Error').t`The file securenotes.csv is missing from the Dashlane ZIP file`
                );
            default:
                throw new ImportReaderError(c('Error').t`The CSV in the Dashlane ZIP file could not be read`);
        }
    }

    return readCSV<DashlaneLoginItem>(stringCsv, EXPECTED_HEADERS, {
        onErrors: (errors) =>
            warnings.push(
                `[Error] ${c('Error').ngettext(
                    msgid`Detected ${errors.length} corrupted csv row`,
                    `Detected ${errors.length} corrupted csv rows`,
                    errors.length
                )}`
            ),
    });
};

export const readDashlaneData = async (data: ArrayBuffer): Promise<ImportPayload> => {
    const ignored: string[] = [];
    const warnings: string[] = [];
    let items: ItemImportIntent[] = [];
    try {
        const zipFile = await jszip.loadAsync(data);

        const loginsZip = zipFile.file('credentials.csv');
        const loginsCsv = await loginsZip?.async('string');
        const loginsParsedData = await parseCsvData(loginsCsv, DASHLANE_LOGINS_EXPECTED_HEADERS, warnings);
        const loginItems = loginsParsedData.items.map((loginItem) => processLoginItem(loginItem));

        const notesZip = zipFile.file('securenotes.csv');
        const notesCsv = await notesZip?.async('string');
        const notesParsedData = await parseCsvData(notesCsv, DASHLANE_NOTES_EXPECTED_HEADERS, warnings);
        const noteItems = notesParsedData.items.map((noteItem) => processNoteItem(noteItem));

        items = [...loginItems, ...noteItems];

        const vaults: ImportVault[] = [
            {
                type: 'new',
                vaultName: c('Title').t`Import - ${getFormattedDayFromTimestamp(getEpoch())}`,
                id: uniqueId(),
                items: items,
            },
        ];

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::Dashlane]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`Dashlane export file could not be parsed. ${errorDetail}`);
    }
};
