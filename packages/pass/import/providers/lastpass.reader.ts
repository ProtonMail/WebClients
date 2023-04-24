import { c } from 'ttag';
import uniqid from 'uniqid';

import type { ItemImportIntent } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { isValidURL } from '@proton/pass/utils/url';
import groupWith from '@proton/utils/groupWith';
import lastItem from '@proton/utils/lastItem';

import { readCSV } from '../helpers/csv.reader';
import { ImportReaderError } from '../helpers/reader.error';
import type { ImportPayload } from '../types';
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
    const name = item.name || url?.hostname || 'Unnamed LastPass item';

    return {
        type: 'login',
        metadata: {
            name,
            note: item.extra ?? '',
            itemUuid: uniqid(),
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
        name: item.name || 'LastPass note',
        note: item.extra ?? '',
        itemUuid: uniqid(),
    },
    content: {},
    extraFields: [],
    trashed: false,
});

export const readLastPassData = async (data: string): Promise<ImportPayload> => {
    try {
        const lastPassItems = await readCSV<LastPassItem>(data, LASTPASS_EXPECTED_HEADERS);

        const groupedByVault = groupWith<LastPassItem>(
            (a, b) => a.grouping === b.grouping,
            lastPassItems.map((item) => ({
                ...item,
                grouping: item.grouping ? lastItem(item.grouping?.split('\\')) : undefined,
            }))
        );

        return groupedByVault
            .filter(({ length }) => length > 0)
            .map((items) => {
                return {
                    type: 'new',
                    vaultName: items?.[0].grouping ?? `${c('Title').t`LastPass import`}`,
                    id: uniqid(),
                    items: items.map((item) =>
                        item.url === 'http://sn' ? processNoteItem(item) : processLoginItem(item)
                    ),
                };
            });
    } catch (e) {
        logger.warn('[Importer::LastPass]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`LastPass export file could not be parsed. ${errorDetail}`);
    }
};
