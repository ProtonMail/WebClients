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
import { CSVReaderResult } from '../helpers/csv.reader';
import { ImportReaderError } from '../helpers/reader.error';
import type { ImportPayload, ImportVault } from '../types';
import { DashlaneLoginItem } from './dashlane.types';

const DASHLANE_LOGINS_EXPECTED_HEADERS: (keyof DashlaneLoginItem)[] = [
    'username',
    'title',
    'password',
    'note',
    'url',
    'category',
];

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
            // TODO totp needs more testing
            totpUri: item.otpSecret ? parseOTPValue(item.otpSecret, { label: item.title }) : '',
        },
        extraFields: [],
        trashed: false,
    };
};

const parseCsvData = async (
    zipFile: jszip,
    fileName: 'credentials.csv' | 'securenotes.csv',
    warnings: string[]
): Promise<CSVReaderResult<DashlaneLoginItem>> => {
    const itemsZip = zipFile.file(fileName);
    const itemsCsv = await itemsZip?.async('string');

    if (itemsCsv === undefined) {
        throw new Error(`${fileName} in your zip file could not be read`);
    }

    return readCSV<DashlaneLoginItem>(itemsCsv, DASHLANE_LOGINS_EXPECTED_HEADERS, {
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

        const loginsParsedData = await parseCsvData(zipFile, 'credentials.csv', warnings);
        const loginItems = loginsParsedData.items.map((loginItem) => processLoginItem(loginItem));

        // TODO noteItems

        items = loginItems;

        const vaults: ImportVault[] = [
            {
                type: 'new',
                vaultName: c('Title').t`Import - ${getFormattedDayFromTimestamp(getEpoch())}`,
                id: uniqueId(),
                items: items,
            },
        ];

        return { vaults, ignored, warnings: [] };
    } catch (e) {
        logger.warn('[Importer::Dashlane]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`Dashlane export file could not be parsed. ${errorDetail}`);
    }
};
