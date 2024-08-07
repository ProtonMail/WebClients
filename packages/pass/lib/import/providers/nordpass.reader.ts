import { c } from 'ttag';

import type { ItemImportIntent } from '@proton/pass/types';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';

import { readCSV } from '../helpers/csv.reader';
import { ImportProviderError } from '../helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importCreditCardItem,
    importLoginItem,
    importNoteItem,
} from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import { type NordPassItem, NordPassType } from './nordpass.types';

const NORDPASS_EXPECTED_HEADERS: (keyof NordPassItem)[] = [
    'name',
    'url',
    'username',
    'password',
    'note',
    'cardholdername',
    'cardnumber',
    'cvc',
    'expirydate',
    'zipcode',
    'folder',
    'full_name',
    'phone_number',
    'email', // not used for "Login" items, maybe for "Personal Info" items instead
    'address1',
    'address2',
    'city',
    'country',
    'state',
    'type',
];

const processLoginItem = (item: NordPassItem, importUsername?: boolean): ItemImportIntent<'login'> =>
    importLoginItem({
        name: item.name,
        note: item.note,
        ...(importUsername ? getEmailOrUsername(item.username) : { email: item.username }),
        password: item.password,
        urls: [item.url],
    });

const processNoteItem = (item: NordPassItem): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.name,
        note: item.note,
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

export const readNordPassData = async ({
    data,
    importUsername,
}: {
    data: string;
    importUsername?: boolean;
}): Promise<ImportPayload> => {
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
                            switch (item.type) {
                                case NordPassType.CREDIT_CARD:
                                    return processCreditCardItem(item);
                                case NordPassType.LOGIN:
                                    return processLoginItem(item, importUsername);
                                case NordPassType.NOTE:
                                    return processNoteItem(item);
                                default:
                                    ignored.push(`[${item.type ?? c('Placeholder').t`Other`}] ${item.name ?? ''}`);
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
