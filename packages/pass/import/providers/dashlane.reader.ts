import jszip from 'jszip';

import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import capitalize from '@proton/utils/capitalize';

import { readCSV } from '../helpers/csv.reader';
import { ImportProviderError } from '../helpers/error';
import { getImportedVaultName, importLoginItem, importNoteItem } from '../helpers/transformers';
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

const processLoginItem = (item: DashlaneLoginItem): ItemImportIntent<'login'> =>
    importLoginItem({
        name: item.title,
        note: item.note,
        username: item.username,
        password: item.password,
        urls: [item.url],
        totp: item.otpSecret,
        extraFields: [item.username2, item.username3].filter(Boolean).map((username, index) => ({
            fieldName: `username${index + 1}`,
            type: 'text',
            data: { content: username ?? '' },
        })),
    });

const processNoteItem = (item: DashlaneNoteItem): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.title,
        note: item.note,
    });

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
                name: getImportedVaultName(),
                shareId: null,
                items: [...loginItems, ...noteItems],
            },
        ];

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::Dashlane]', e);
        throw new ImportProviderError('Dashlane', e);
    }
};
