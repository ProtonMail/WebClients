import { c } from 'ttag';

import type { ItemImportIntent, Maybe } from '../../../../types';
import { safeCall } from '../../../../utils/fp/safe-call';
import { logger } from '../../../../utils/logger';
import { readCSV } from '../../helpers/csv.reader';
import { ImportProviderError } from '../../helpers/error';
import { createImportFolderTree } from '../../helpers/folders';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '../../helpers/transformers';
import type { ImportReaderResult, ImportVault } from '../../types';
import { type NordPassItem, NordPassType } from './nordpass.types';
import { NORDPASS_EXPECTED_HEADERS, extractNordPassExtraFields, extractNordPassIdentity } from './nordpass.utils';

const processAdditionalUrls = (additionalUrls?: string) =>
    safeCall((): string[] => (additionalUrls ? JSON.parse(additionalUrls) : []))() ?? [];

const processLoginItem = async (item: NordPassItem): Promise<ItemImportIntent<'login'>> => {
    const urls = [item.url].concat(processAdditionalUrls(item.additional_urls));

    return importLoginItem({
        name: item.name,
        note: item.note,
        password: item.password,
        urls,
        ...(await getEmailOrUsername(item.username)),
    });
};

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

export const readNordPassData = async (file: File): Promise<ImportReaderResult> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const data = await file.text();
        const parsed = await readCSV<NordPassItem>({
            data,
            /** NOTE: `additional_urls` and `custom_fields` are not expected in the legacy
             * NordPass formats, as such they're excluded from the CSV parsing pass. */
            headers: NORDPASS_EXPECTED_HEADERS,
            throwOnEmpty: true,
            onError: (error) => warnings.push(error),
        });

        const tree = createImportFolderTree();
        const vaultItems: ItemImportIntent[] = [];

        for (const item of parsed.items) {
            if (item.type === NordPassType.FOLDER) {
                tree.add(item.name);
                continue;
            }

            const type = item?.type ?? c('Label').t`Unknown`;
            const title = item?.name ?? '';
            const folderId = tree.add(item.folder);

            try {
                const value = await (async (): Promise<Maybe<ItemImportIntent>> => {
                    switch (item.type) {
                        case NordPassType.CREDIT_CARD:
                            return processCreditCardItem(item);
                        case NordPassType.IDENTITY:
                            return processIdentityItem(item);
                        case NordPassType.LOGIN:
                            return processLoginItem(item);
                        case NordPassType.NOTE:
                            return processNoteItem(item);
                    }
                })();

                if (!value) ignored.push(`[${type}] ${title}`);
                else {
                    value.extraFields = extractNordPassExtraFields(item);
                    vaultItems.push({ ...value, folderId });
                }
            } catch (err) {
                ignored.push(`[${type}] ${title}`);
                logger.warn('[Importer::NordPass]', err);
            }
        }

        const vaults: ImportVault[] = [
            { name: getImportedVaultName(), shareId: null, folders: tree.folders, items: vaultItems },
        ];

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::NordPass]', e);
        throw new ImportProviderError('NordPass', e);
    }
};
