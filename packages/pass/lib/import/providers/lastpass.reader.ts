import { c } from 'ttag';

import { buildLastpassIdentity } from '@proton/pass/lib/import/builders/lastpass.builder';
import type { ItemImportIntent } from '@proton/pass/types';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import capitalize from '@proton/utils/capitalize';
import lastItem from '@proton/utils/lastItem';

import { readCSV } from '../helpers/csv.reader';
import { ImportProviderError } from '../helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import { type LastPassItem, LastPassNoteType } from './lastpass.types';

const LASTPASS_EXPECTED_HEADERS: (keyof LastPassItem)[] = [
    'url',
    'username',
    'password',
    'extra',
    'name',
    'grouping',
    'fav',
];

const getFieldValue = (extra: LastPassItem['extra'], key: string) => {
    /* match key and get the value: 'NoteType:Credit Card' */
    if (!extra) return null;
    const match = extra.match(new RegExp(`${key}:(.*)`));
    return match && match[1];
};

const processLoginItem = (item: LastPassItem, importUsername?: boolean): ItemImportIntent<'login'> =>
    importLoginItem({
        name: item.name,
        note: item.extra,
        ...(importUsername ? getEmailOrUsername(item.username) : { email: item.username }),
        password: item.password,
        urls: [item.url],
        totp: item.totp,
    });

const processNoteItem = (item: LastPassItem): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.name,
        note: item.extra,
    });

const getCCExpirationDate = (extra: LastPassItem['extra']) => {
    /* lastpass exp date format: 'January, 2025' */
    const unformatted = getFieldValue(extra, 'Expiration Date');

    if (!unformatted) return null;

    /* Firefox requires a day to be present in the date to be valid */
    const date = new Date(`15 ${unformatted} UTC`);

    return `${String(date.getUTCMonth() + 1).padStart(2, '0')}${date.getUTCFullYear()}`;
};

const processCreditCardItem = (item: LastPassItem): ItemImportIntent<'creditCard'> =>
    importCreditCardItem({
        name: item.name,
        note: getFieldValue(item.extra, 'Notes'),
        cardholderName: getFieldValue(item.extra, 'Name on Card'),
        number: getFieldValue(item.extra, 'Number'),
        verificationNumber: getFieldValue(item.extra, 'Security Code'),
        expirationDate: getCCExpirationDate(item.extra),
    });

const processIdentityItem = (item: LastPassItem): ItemImportIntent<'identity'> =>
    importIdentityItem({
        name: item.name,
        note: getFieldValue(item.extra, 'Notes'),
        ...buildLastpassIdentity(item),
    });

export const readLastPassData = async ({
    data,
    importUsername,
}: {
    data: string;
    importUsername?: boolean;
}): Promise<ImportPayload> => {
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

        const groupedByVault = groupByKey(
            result.items.map((item) => ({
                ...item,
                grouping: item.grouping ? lastItem(item.grouping?.split('\\')) : '',
            })),
            'grouping'
        );

        const vaults: ImportVault[] = groupedByVault
            .filter(({ length }) => length > 0)
            .map((items) => {
                return {
                    name: getImportedVaultName(items?.[0].grouping),
                    shareId: null,
                    items: items
                        .map((item) => {
                            const isNote = item.url === 'http://sn';
                            if (!isNote) return processLoginItem(item, importUsername);

                            const noteType = getFieldValue(item.extra, 'NoteType');

                            if (!noteType) return processNoteItem(item);
                            if (noteType === LastPassNoteType.CREDIT_CARD) return processCreditCardItem(item);
                            if (noteType === LastPassNoteType.ADDRESS) return processIdentityItem(item);

                            ignored.push(`[${capitalize(noteType)}] ${item.name}`);
                        })
                        .filter(truthy),
                };
            });

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::LastPass]', e);
        throw new ImportProviderError('LastPass', e);
    }
};
