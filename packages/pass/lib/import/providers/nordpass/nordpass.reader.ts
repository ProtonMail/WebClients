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

import { type NordPassItem, NordPassType } from './nordpass.types';
import { NORDPASS_EXPECTED_HEADERS, extractNordPassIdentity } from './nordpass.utils';

const processLoginItem = (item: NordPassItem): ItemImportIntent<'login'> =>
    importLoginItem({
        name: item.name,
        note: item.note,
        ...getEmailOrUsername(item.username),
        password: item.password,
        urls: [item.url],
    });

const processNoteItem = (item: NordPassItem): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.name,
        note: item.note,
    });

const processIdentityItem = (item: NordPassItem): ItemImportIntent<'identity'> =>
    importIdentityItem({
        name: item.name,
        note: item.note,
        ...extractNordPassIdentity(item),
    });

const processCreditCardItem = (item: NordPassItem): ItemImportIntent<'creditCard'> => {
    /* NordPass expiration date format is MM/YY, we need MMYYYY */
    const expirationDate = item.expirydate?.length
        ? `${item.expirydate.slice(0, 2)}20${item.expirydate.slice(3, 5)}`
        : undefined;

    return importCreditCardItem({
        name: item.name,
        note: item.note,
        cardholderName: item.cardholdername,
        number: item.cardnumber,
        verificationNumber: item.cvc,
        expirationDate,
    });
};

export const readNordPassData = async ({ data }: { data: string }): Promise<ImportPayload> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const result = await readCSV<NordPassItem>({
            data,
            headers: NORDPASS_EXPECTED_HEADERS,
            throwOnEmpty: true,
            onError: (error) => warnings.push(error),
        });

        const groupedByVault = groupByKey(result.items, 'folder');

        const vaults: ImportVault[] = groupedByVault
            .filter(({ length }) => length > 0)
            .map((items) => {
                return {
                    name: getImportedVaultName(items?.[0].folder),
                    shareId: null,
                    items: items
                        .map((item) => {
                            const type = item?.type ?? c('Label').t`Unknown`;
                            const title = item?.name ?? '';

                            try {
                                switch (item.type) {
                                    case NordPassType.CREDIT_CARD:
                                        return processCreditCardItem(item);
                                    case NordPassType.IDENTITY:
                                        return processIdentityItem(item);
                                    case NordPassType.LOGIN:
                                        return processLoginItem(item);
                                    case NordPassType.NOTE:
                                        return processNoteItem(item);
                                    default:
                                        ignored.push(`[${type}] ${title}`);
                                }
                            } catch (err) {
                                ignored.push(`[${type}] ${title}`);
                                logger.warn('[Importer::NordPass]', err);
                            }
                        })
                        .filter(truthy),
                };
            });

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::NordPass]', e);
        throw new ImportProviderError('NordPass', e);
    }
};
