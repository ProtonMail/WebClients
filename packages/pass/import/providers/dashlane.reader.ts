import jszip from 'jszip';
import { c } from 'ttag';

import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { uniqueId } from '@proton/pass/utils/string';
import { getFormattedDayFromTimestamp } from '@proton/pass/utils/time/format';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { isValidURL } from '@proton/pass/utils/url';
import capitalize from '@proton/utils/capitalize';

import { readCSV } from '../helpers/csv.reader';
import { ImportReaderError } from '../helpers/reader.error';
import type { ImportPayload, ImportVault } from '../types';
import type {
    DashlaneIdItem,
    DashlaneItem,
    DashlaneLoginItem,
    DashlaneNoteItem,
    DashlanePaymentItem,
    DashlanePersonalInfoItem,
} from './dashlane.types';

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

const parseDashlaneCSV = async <T extends DashlaneItem>(options: {
    data: Maybe<string>;
    headers: (keyof T)[];
    warnings?: string[];
}): Promise<T[]> => {
    return options.data
        ? (
              await readCSV<T>({
                  data: options.data,
                  headers: options.headers,
                  throwOnEmpty: false,
                  onError: (error) => options.warnings?.push(error),
              })
          ).items
        : [];
};

export const readDashlaneData = async (data: ArrayBuffer): Promise<ImportPayload> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const zipFile = await jszip.loadAsync(data);
        /* logins */
        const loginItems = (
            await parseDashlaneCSV<DashlaneLoginItem>({
                data: await zipFile.file('credentials.csv')?.async('string'),
                headers: DASHLANE_LOGINS_EXPECTED_HEADERS,
                warnings,
            })
        ).map(processLoginItem);

        /* notes */
        const noteItems = (
            await parseDashlaneCSV<DashlaneNoteItem>({
                data: await zipFile.file('securenotes.csv')?.async('string'),
                headers: DASHLANE_NOTES_EXPECTED_HEADERS,
                warnings,
            })
        ).map(processNoteItem);

        /* unsupported ids */
        const ids = await parseDashlaneCSV<DashlaneIdItem>({
            data: await zipFile.file('ids.csv')?.async('string'),
            headers: ['type', 'number'],
        });

        /* unsupported payments */
        const payments = await parseDashlaneCSV<DashlanePaymentItem>({
            data: await zipFile.file('payments.csv')?.async('string'),
            headers: ['account_name'],
        });

        /* unsupported payments */
        const personalInfos = await parseDashlaneCSV<DashlanePersonalInfoItem>({
            data: await zipFile.file('personalInfo.csv')?.async('string'),
            headers: ['title'],
        });

        ignored.push(
            ...ids.map(({ type, name }) => `[${capitalize(type ?? 'ID')}] ${name || 'Unknown ID'}`),
            ...personalInfos.map(({ title }) => `[${'Personal Info'}] ${title || 'Unnamed'}`),
            ...payments.map(({ account_name }) => `[${'Payment'}] ${account_name || 'Unnamed payment'}`)
        );

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
