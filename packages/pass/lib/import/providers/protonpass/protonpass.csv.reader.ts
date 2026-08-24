import type { ItemImportIntent, Maybe } from '../../../../types';
import type { AutofillUrl, ItemCreditCard } from '../../../../types/protobuf/item-v1';
import { groupByKey } from '../../../../utils/array/group-by-key';
import { truthy } from '../../../../utils/fp/predicates';
import { logger } from '../../../../utils/logger';
import { readCSV } from '../../helpers/csv.reader';
import { ImportProviderError } from '../../helpers/error';
import {
    getImportedVaultName,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '../../helpers/transformers';
import type { ImportReaderResult } from '../../types';
import type { ProtonPassCSVItem } from './protonpass.csv.types';

type CreditCardCsvItem = ItemCreditCard & { note: string };

const PASS_EXPECTED_HEADERS: (keyof ProtonPassCSVItem)[] = ['name', 'url', 'username', 'password', 'note', 'totp'];

/** When present, the `autofillUrls` column holds the authoritative full set of modes (JSON).
 * Falls back to `undefined` so the reader can use the legacy Default-only `url` column. */
const parseAutofillUrls = (raw?: string): Maybe<AutofillUrl[]> => {
    if (!raw) return undefined;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length ? (parsed as AutofillUrl[]) : undefined;
    } catch {
        return undefined;
    }
};

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

export const readProtonPassCSV = async (file: File, isGenericCSV: boolean = false): Promise<ImportReaderResult> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const data = await file.text();
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
                                const autofillUrls = parseAutofillUrls(item.autofillUrls);
                                return importLoginItem({
                                    name: item.name,
                                    note: item.note,
                                    // If the email column is missing then it's an old CSV format where the username column is actually the email
                                    email: hasNoEmailColumn ? item.username : item.email,
                                    username: hasNoEmailColumn ? undefined : item.username,
                                    password: item.password,
                                    // Prefer the structured column when present; otherwise the
                                    // legacy `url` column maps to Default-mode entries.
                                    urls: autofillUrls ? undefined : item.url?.split(', '),
                                    autofillUrls,
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
