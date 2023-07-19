import getMonth from 'date-fns/getMonth';
import getYear from 'date-fns/getYear';
import { c } from 'ttag';

import type { ItemImportIntent } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import capitalize from '@proton/utils/capitalize';
import groupWith from '@proton/utils/groupWith';
import lastItem from '@proton/utils/lastItem';

import { readCSV } from '../helpers/csv.reader';
import { ImportProviderError } from '../helpers/error';
import { getImportedVaultName, importCreditCardItem, importLoginItem, importNoteItem } from '../helpers/transformers';
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

const getCCExpirationDate = (extra: LastPassItem['extra']) => {
    /* lastpass exp date format: 'January, 2025' */
    const unformatted = getFieldValue(extra, 'Expiration Date');

    if (!unformatted) return null;

    const date = new Date(`${unformatted} UTC`);

    return `${String(getMonth(date) + 1).padStart(2, '0')}${getYear(date)}`;
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
                    name: getImportedVaultName(items?.[0].grouping),
                    shareId: null,
                    items: items
                        .map((item) => {
                            const isNote = item.url === 'http://sn';
                            if (!isNote) return processLoginItem(item);

                            const noteType = getFieldValue(item.extra, 'NoteType');

                            if (noteType === LastPassNoteType.CREDIT_CARD) {
                                return processCreditCardItem(item);
                            }

                            if (!noteType) return processNoteItem(item);
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
