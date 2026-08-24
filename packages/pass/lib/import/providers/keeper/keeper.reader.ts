import { c } from 'ttag';

import lastItem from '@proton/utils/lastItem';

import type { ItemImportIntent, Maybe } from '../../../../types';
import { WifiSecurity } from '../../../../types/protobuf';
import { groupByKey } from '../../../../utils/array/group-by-key';
import { truthy } from '../../../../utils/fp/predicates';
import { logger } from '../../../../utils/logger';
import { formatExpirationDateMMYYYY } from '../../../../utils/time/expiration-date';
import { ImportProviderError } from '../../helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importCreditCardItem,
    importCustomItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
    importSshKeyItem,
    importWifiItem,
} from '../../helpers/transformers';
import type { ImportReaderResult, ImportVault } from '../../types';
import type { KeeperData } from './keeper.types';
import { extractKeeperExtraFields, extractKeeperIdentity, getKeeperBuiltinExtraFields } from './keeper.utils';

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
                            /* If $type is undefined, then it's a "General" item type
                             * which was the type for login items on older Keeper versions */
                            case undefined:
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
                                return importNoteItem({
                                    name: title,
                                    note: item.notes,
                                    extraFields: extractKeeperExtraFields(item.custom_fields),
                                });
                            case 'bankCard':
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
                                    extraFields: extractKeeperExtraFields(item.custom_fields, [
                                        '$text:cardholderName:1',
                                        '$paymentCard::1',
                                        '$pinCode::1',
                                    ]),
                                });
                            case 'ssnCard':
                            case 'contact':
                                return importIdentityItem({
                                    name: item.title,
                                    note: item.notes,
                                    ...extractKeeperIdentity(item),
                                });

                            case 'sshKeys':
                                return importSshKeyItem({
                                    name: item.title,
                                    note: item.notes,
                                    publicKey: item.custom_fields?.['$keyPair::1']?.publicKey,
                                    privateKey: item.custom_fields?.['$keyPair::1']?.privateKey,
                                    extraFields: getKeeperBuiltinExtraFields(item)
                                        .concat(extractKeeperExtraFields(item.custom_fields, ['$keyPair::1']))
                                        .filter(truthy),
                                });

                            case 'wifiCredentials':
                                return importWifiItem({
                                    name: item.title,
                                    note: item.notes,
                                    ssid: item.custom_fields?.['$text:SSID:1'],
                                    security: WifiSecurity.UnspecifiedWifiSecurity,
                                    password: item.password,
                                    extraFields: extractKeeperExtraFields(item.custom_fields, ['$text:SSID:1']),
                                });

                            default:
                                return importCustomItem({
                                    name: item.title,
                                    note: item.notes,
                                    extraFields: getKeeperBuiltinExtraFields(item)
                                        .concat(extractKeeperExtraFields(item.custom_fields))
                                        .filter(truthy),
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
