import { c } from 'ttag';

import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
import { formatExpirationDateMMYYYY } from '@proton/pass/lib/validation/credit-card';
import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { logger } from '@proton/pass/utils/logger';
import lastItem from '@proton/utils/lastItem';

import type { KeeperData, KeeperItem } from './keeper.types';
import { extractKeeperExtraFields, extractKeeperIdentity } from './keeper.utils';

const addCustomFieldsWarning = (ignored: string[], item: KeeperItem) => {
    try {
        if (item.custom_fields) {
            const warning = `[${item.$type}] ${item.title}: ${c('Warning').t`item was imported without custom fields`}`;
            switch (item.$type) {
                case 'encryptedNotes':
                    if (Object.keys(item.custom_fields).some((field) => field !== '$note::1')) {
                        ignored.push(warning);
                    }
                    break;
                case 'bankCard':
                    const notCustomFields = ['$paymentCard::1', '$text:cardholderName:1', '$pinCode::1'];
                    if (Object.keys(item.custom_fields).some((field) => !notCustomFields.includes(field))) {
                        ignored.push(warning);
                    }
                    break;
                default:
                    return;
            }
        }
    } catch {}
};

export const readKeeperData = async (file: File): Promise<ImportReaderResult> => {
    const ignored: string[] = [];
    const warnings: string[] = [];
    const vaults: ImportVault[] = [];

    try {
        const data = await file.text();
        const parsedData = JSON.parse(data) as KeeperData;
        const items = parsedData.records;
        const groupedByVault = groupByKey(items, (item) => lastItem(item.folders?.[0].folder?.split('\\') ?? '') ?? '');

        for (const vaultItems of groupedByVault) {
            const name = getImportedVaultName(lastItem(vaultItems[0]?.folders?.[0]?.folder?.split?.('\\') ?? ''));
            const items: ItemImportIntent[] = [];

            for (const item of vaultItems) {
                const type = item.$type ?? c('Label').t`Unknown`;
                const title = item.title ?? '';

                try {
                    const value = await (async (): Promise<Maybe<ItemImportIntent>> => {
                        switch (item.$type) {
                            case 'login':
                                return importLoginItem({
                                    name: title,
                                    note: item.notes,
                                    password: item.password,
                                    urls: [item.login_url],
                                    totp: item.custom_fields?.['$oneTimeCode::1'],
                                    extraFields: extractKeeperExtraFields(item.custom_fields, ['$oneTimeCode::1']),
                                    ...(await getEmailOrUsername(item.login)),
                                });
                            case 'encryptedNotes':
                                addCustomFieldsWarning(ignored, item);
                                return importNoteItem({
                                    name: title,
                                    note: `${item.custom_fields?.['$note::1'] ?? ''}\n${item.notes ?? ''}`.trim(),
                                });
                            case 'bankCard':
                                addCustomFieldsWarning(ignored, item);
                                return importCreditCardItem({
                                    name: title,
                                    note: item.notes,
                                    cardholderName: item.custom_fields?.['$text:cardholderName:1'],
                                    number: item.custom_fields?.['$paymentCard::1']?.cardNumber,
                                    expirationDate: formatExpirationDateMMYYYY(
                                        item.custom_fields?.['$paymentCard::1']?.cardExpirationDate ?? ''
                                    ),
                                    verificationNumber: item.custom_fields?.['$paymentCard::1']?.cardSecurityCode,
                                    pin: item.custom_fields?.['$pinCode::1'],
                                });
                            case 'ssnCard':
                            case 'contact':
                                return importIdentityItem({
                                    name: item.title,
                                    note: item.notes,
                                    ...extractKeeperIdentity(item),
                                });
                        }
                    })();

                    if (!value) ignored.push(`[${type}] ${title}`);
                    else items.push(value);
                } catch (err) {
                    ignored.push(`[${type}] ${title}`);
                    logger.warn('[Importer::Keeper]', err);
                }
            }

            vaults.push({ name, shareId: null, items });
        }

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::Keeper]', e);
        throw new ImportProviderError('Keeper', e);
    }
};
