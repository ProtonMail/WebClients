import type { ProtonPassCSVItem } from '@proton/pass/lib/import/providers/protonpass.csv.types';
import type { ItemImportIntent } from '@proton/pass/types';
import type { ItemCreditCard } from '@proton/pass/types/protobuf/item-v1';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';

import { readCSV } from '../helpers/csv.reader';
import { ImportProviderError } from '../helpers/error';
import {
    getImportedVaultName,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '../helpers/transformers';
import type { ImportPayload } from '../types';

type CreditCardCsvItem = ItemCreditCard & { note: string };

const PASS_EXPECTED_HEADERS: (keyof ProtonPassCSVItem)[] = ['name', 'url', 'username', 'password', 'note', 'totp'];

const processCreditCardItem = (item: ProtonPassCSVItem): ItemImportIntent<'creditCard'> => {
    const creditCardItem: CreditCardCsvItem = JSON.parse(item.note as string);

    return importCreditCardItem({
        name: item.name,
        note: creditCardItem.note,
        cardholderName: creditCardItem.cardholderName,
        number: creditCardItem.number,
        verificationNumber: creditCardItem.verificationNumber,
        expirationDate: creditCardItem.expirationDate,
        pin: creditCardItem.pin,
        createTime: item.createTime ? Number(item.createTime) : undefined,
        modifyTime: item.modifyTime ? Number(item.modifyTime) : undefined,
    });
};

const processIdentityItem = (item: ProtonPassCSVItem): ItemImportIntent<'identity'> =>
    importIdentityItem({
        name: item.name,
        ...JSON.parse(item.note as string),
    });

export const readProtonPassCSV = async ({
    data,
    importUsername,
    isGenericCSV = false,
}: {
    data: string;
    importUsername?: boolean;
    isGenericCSV?: boolean;
}): Promise<ImportPayload> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const result = await readCSV<ProtonPassCSVItem>({
            data,
            /* Don't verify headers of Generic CSV */
            headers: isGenericCSV ? undefined : PASS_EXPECTED_HEADERS,
            hasHeader: true,
            onError: (error) => warnings.push(error),
        });

        const hasNoEmailColumn = result.items[0]?.email === undefined;
        const groupByVaults = groupByKey(result.items, 'vault');

        return {
            vaults: groupByVaults.map((items) => ({
                name: getImportedVaultName(items[0].vault),
                shareId: null,
                items: items
                    .filter((item) => item.type !== 'alias')
                    .map((item) => {
                        switch (item.type) {
                            // If the type is undefined, it's not a Proton Pass CSV export but a Generic CSV template
                            case undefined:
                            case 'login':
                                return importLoginItem({
                                    name: item.name,
                                    note: item.note,
                                    // If the email column is missing then it's an old CSV format where the username column is actually the email
                                    email: hasNoEmailColumn ? item.username : item.email,
                                    username: hasNoEmailColumn || !importUsername ? undefined : item.username,
                                    password: item.password,
                                    urls: item.url?.split(', '),
                                    totp: item.totp,
                                    createTime: item.createTime ? Number(item.createTime) : undefined,
                                    modifyTime: item.modifyTime ? Number(item.modifyTime) : undefined,
                                });
                            case 'creditCard':
                                return processCreditCardItem(item);
                            case 'identity':
                                return processIdentityItem(item);
                            default:
                                return importNoteItem({
                                    name: item.name,
                                    note: item.note,
                                    createTime: item.createTime ? Number(item.createTime) : undefined,
                                    modifyTime: item.modifyTime ? Number(item.modifyTime) : undefined,
                                });
                        }
                    })
                    .filter(truthy),
            })),
            ignored,
            warnings,
        };
    } catch (e) {
        logger.warn('[Importer::Proton]', e);
        throw new ImportProviderError('Proton', e);
    }
};
