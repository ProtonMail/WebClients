import { c } from 'ttag';

import { readCSV } from '@proton/pass/lib/import/helpers/csv.reader';
import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportPayload, ImportVault } from '@proton/pass/lib/import/types';
import type { ItemImportIntent } from '@proton/pass/types';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import capitalize from '@proton/utils/capitalize';
import lastItem from '@proton/utils/lastItem';

import { type LastPassItem, LastPassNoteType } from './lastpass.types';
import {
    LASTPASS_EXPECTED_HEADERS,
    extractLastPassFieldValue,
    extractLastPassIdentity,
    formatLastPassCCExpirationDate,
} from './lastpass.utils';

const processLoginItem = (item: LastPassItem): ItemImportIntent<'login'> =>
    importLoginItem({
        name: item.name,
        note: item.extra,
        ...getEmailOrUsername(item.username),
        password: item.password,
        urls: [item.url],
        totp: item.totp,
    });

const processNoteItem = (item: LastPassItem): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.name,
        note: item.extra,
    });

const processCreditCardItem = (item: LastPassItem): ItemImportIntent<'creditCard'> =>
    importCreditCardItem({
        name: item.name,
        note: extractLastPassFieldValue(item.extra, 'Notes'),
        cardholderName: extractLastPassFieldValue(item.extra, 'Name on Card'),
        number: extractLastPassFieldValue(item.extra, 'Number'),
        verificationNumber: extractLastPassFieldValue(item.extra, 'Security Code'),
        expirationDate: formatLastPassCCExpirationDate(item.extra),
    });

const processIdentityItem = (item: LastPassItem): ItemImportIntent<'identity'> =>
    importIdentityItem({
        name: item.name,
        note: extractLastPassFieldValue(item.extra, 'Notes'),
        ...extractLastPassIdentity(item),
    });

export const readLastPassData = async ({ data }: { data: string }): Promise<ImportPayload> => {
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
                            if (!isNote) return processLoginItem(item);

                            const noteType = extractLastPassFieldValue(item.extra, 'NoteType');

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
