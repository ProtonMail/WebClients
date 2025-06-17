import { c } from 'ttag';

import { readCSV } from '@proton/pass/lib/import/helpers/csv.reader';
import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
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
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
import type { ItemImportIntent } from '@proton/pass/types';
import { WifiSecurity } from '@proton/pass/types/protobuf/item-v1';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { logger } from '@proton/pass/utils/logger';
import capitalize from '@proton/utils/capitalize';
import lastItem from '@proton/utils/lastItem';

import { type LastPassItem, LastPassNoteType } from './lastpass.types';
import {
    LASTPASS_EXPECTED_HEADERS,
    extractLastPassExtraFields,
    extractLastPassFieldValue,
    extractLastPassIdentity,
    formatLastPassCCExpirationDate,
} from './lastpass.utils';

const processLoginItem = async (item: LastPassItem): Promise<ItemImportIntent<'login'>> =>
    importLoginItem({
        name: item.name,
        note: item.extra,
        password: item.password,
        urls: [item.url],
        totp: item.totp,
        ...(await getEmailOrUsername(item.username)),
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

const processSshItem = (item: LastPassItem): ItemImportIntent<'sshKey'> =>
    importSshKeyItem({
        name: item.name,
        note: extractLastPassFieldValue(item.extra, 'Notes'),
        publicKey: extractLastPassFieldValue(item.extra, 'Public Key'),
        privateKey: extractLastPassFieldValue(item.extra, 'Private Key'),
        extraFields: extractLastPassExtraFields(item, ['Notes', 'Public Key', 'Private Key']),
    });

const processWifiItem = (item: LastPassItem): ItemImportIntent<'wifi'> =>
    importWifiItem({
        name: item.name,
        note: extractLastPassFieldValue(item.extra, 'Notes'),
        ssid: extractLastPassFieldValue(item.extra, 'SSID'),
        password: extractLastPassFieldValue(item.extra, 'Password'),
        security: WifiSecurity.UnspecifiedWifiSecurity,
        extraFields: extractLastPassExtraFields(item, ['Notes', 'SSID', 'Password']),
    });
const processCustomItem = (item: LastPassItem): ItemImportIntent<'custom'> =>
    importCustomItem({
        name: item.name,
        note: extractLastPassFieldValue(item.extra, 'Notes'),
        extraFields: extractLastPassExtraFields(item, ['Notes']),
    });

export const readLastPassData = async (file: File): Promise<ImportReaderResult> => {
    const ignored: string[] = [];
    const warnings: string[] = [];
    const vaults: ImportVault[] = [];

    try {
        const data = await file.text();
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

        for (const vaultItems of groupedByVault) {
            if (vaultItems.length === 0) continue;
            const items: ItemImportIntent[] = [];

            for (const item of vaultItems) {
                const itemType = extractLastPassFieldValue(item?.extra, 'NoteType');
                const type = capitalize(itemType ?? c('Label').t`Unknown`);
                const title = item?.name ?? '';

                try {
                    const value = await (async (): Promise<ItemImportIntent> => {
                        const isLoginItem = item.url !== 'http://sn';
                        if (isLoginItem) return processLoginItem(item);
                        if (!itemType) return processNoteItem(item);
                        if (type === LastPassNoteType.CREDIT_CARD) return processCreditCardItem(item);
                        if (type === LastPassNoteType.ADDRESS) return processIdentityItem(item);
                        if (type === LastPassNoteType.SSH_KEY) return processSshItem(item);
                        if (type === LastPassNoteType.WIFI_PASSWORD) return processWifiItem(item);
                        return processCustomItem(item);
                    })();

                    if (!value) ignored.push(`[${type}] ${title}`);
                    else items.push(value);
                } catch (err) {
                    ignored.push(`[${type}] ${title}`);
                    logger.warn('[Importer::LastPass]', err);
                }
            }

            vaults.push({
                name: getImportedVaultName(vaultItems?.[0].grouping),
                shareId: null,
                items,
            });
        }

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::LastPass]', e);
        throw new ImportProviderError('LastPass', e);
    }
};
