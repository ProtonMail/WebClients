import type { ExportedCsvItem } from '@proton/pass/lib/export/types';
import type { ItemImportIntent } from '@proton/pass/types';
import type { ItemCreditCard } from '@proton/pass/types/protobuf/item-v1';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';

import { readCSV } from '../helpers/csv.reader';
import { ImportProviderError } from '../helpers/error';
import { getImportedVaultName, importCreditCardItem, importLoginItem, importNoteItem } from '../helpers/transformers';
import type { ImportPayload } from '../types';

type CreditCardCsvItem = ItemCreditCard & { note: string };

const PASS_EXPECTED_HEADERS: (keyof ExportedCsvItem)[] = [
    'type',
    'name',
    'url',
    'username',
    'password',
    'note',
    'totp',
    'createTime',
    'modifyTime',
];

const processCreditCardItem = (item: ExportedCsvItem): ItemImportIntent<'creditCard'> => {
    const creditCardItem: CreditCardCsvItem = JSON.parse(item.note as string);

    return importCreditCardItem({
        name: item.name,
        note: creditCardItem.note,
        cardholderName: creditCardItem.cardholderName,
        number: creditCardItem.number,
        verificationNumber: creditCardItem.verificationNumber,
        expirationDate: creditCardItem.expirationDate,
        pin: creditCardItem.pin,
        createTime: Number(item.createTime),
        modifyTime: Number(item.modifyTime),
    });
};
export const readProtonPassCsvData = async (data: string): Promise<ImportPayload> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const result = await readCSV<ExportedCsvItem>({
            data,
            headers: PASS_EXPECTED_HEADERS,
            onError: (error) => warnings.push(error),
        });

        return {
            vaults: [
                {
                    name: getImportedVaultName(),
                    shareId: null,
                    items: result.items
                        .filter((item) => item.type !== 'alias')
                        .map((item) => {
                            switch (item.type) {
                                case 'login':
                                    return importLoginItem({
                                        name: item.name,
                                        note: item.note,
                                        username: item.username,
                                        password: item.password,
                                        urls: item.url?.split(', '),
                                        totp: item.totp,
                                        createTime: Number(item.createTime),
                                        modifyTime: Number(item.modifyTime),
                                    });
                                case 'creditCard':
                                    return processCreditCardItem(item);
                                default:
                                    return importNoteItem({
                                        name: item.name,
                                        note: item.note,
                                        createTime: Number(item.createTime),
                                        modifyTime: Number(item.modifyTime),
                                    });
                            }
                        })
                        .filter(truthy),
                },
            ],
            ignored,
            warnings,
        };
    } catch (e) {
        logger.warn('[Importer::Proton]', e);
        throw new ImportProviderError('Proton', e);
    }
};
