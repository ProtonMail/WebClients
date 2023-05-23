import jszip from 'jszip';
import { c, msgid } from 'ttag';

import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { uniqueId } from '@proton/pass/utils/string';
import { getFormattedDayFromTimestamp } from '@proton/pass/utils/time/format';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { isValidURL } from '@proton/pass/utils/url';

import type { CSVReaderResult } from '../helpers/csv.reader';
import { readCSV } from '../helpers/csv.reader';
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
    'otpSecret',
];

const DASHLANE_NOTES_EXPECTED_HEADERS: (keyof DashlaneNoteItem)[] = ['title', 'note'];

const processLoginItem = (item: DashlaneLoginItem): ItemImportIntent<'login'> => {
    const urlResult = isValidURL(item.url ?? '');
    const url = urlResult.valid ? new URL(urlResult.url) : undefined;
    const name = item.title || url?.hostname || 'Unnamed item';

    return {
        type: 'login',
        metadata: {
            name,
            note: item.note ?? '',
            itemUuid: uniqueId(),
        },
        content: {
            username: item.username ?? '',
            password: item.password ?? '',
            urls: [url?.origin].filter(truthy),
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

const parseLoginCSV = async (data: Maybe<string>, warnings: string[]): Promise<CSVReaderResult<DashlaneLoginItem>> => {
    if (data === undefined) {
        throw new ImportReaderError(c('Error').t`The file credentials.csv is missing from the Dashlane ZIP file`);
    }

    return readCSV<DashlaneLoginItem>(data, DASHLANE_LOGINS_EXPECTED_HEADERS, {
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

const parseNoteCSV = async (data: Maybe<string>, warnings: string[]): Promise<CSVReaderResult<DashlaneNoteItem>> => {
    if (data === undefined) {
        throw new ImportReaderError(c('Error').t`The file securenotes.csv is missing from the Dashlane ZIP file`);
    }

    return readCSV<DashlaneNoteItem>(data, DASHLANE_NOTES_EXPECTED_HEADERS, {
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

    try {
        const zipFile = await jszip.loadAsync(data);

        const loginsCsv = await zipFile.file('credentials.csv')?.async('string');
        const loginsParsedData = await parseLoginCSV(loginsCsv, warnings);
        const loginItems = loginsParsedData.items.map(processLoginItem);

        const notesCsv = await zipFile.file('securenotes.csv')?.async('string');
        const notesParsedData = await parseNoteCSV(notesCsv, warnings);
        const noteItems = notesParsedData.items.map(processNoteItem);

        const vaults: ImportVault[] = [
            {
                type: 'new',
                vaultName: c('Title').t`Import - ${getFormattedDayFromTimestamp(getEpoch())}`,
                id: uniqueId(),
                items: [...loginItems, ...noteItems],
            },
        ];

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::Dashlane]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`Dashlane export file could not be parsed. ${errorDetail}`);
    }
};
