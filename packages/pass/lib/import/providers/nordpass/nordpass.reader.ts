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
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { logger } from '@proton/pass/utils/logger';

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
    const vaults: ImportVault[] = [];

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

        for (const vaultItems of groupByKey(parsed.items, 'folder')) {
            if (vaultItems.length === 0) continue;

            /** FIXME: when supporting folders we should preserve the
             * NordPass folder structure when importing */
            const name = getImportedVaultName(vaultItems?.[0].folder);
            const items: ItemImportIntent[] = [];

            for (const item of vaultItems) {
                const type = item?.type ?? c('Label').t`Unknown`;
                const title = item?.name ?? '';

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
                        items.push(value);
                    }
                } catch (err) {
                    ignored.push(`[${type}] ${title}`);
                    logger.warn('[Importer::NordPass]', err);
                }
            }

            vaults.push({ name, items, shareId: null });
        }

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::NordPass]', e);
        throw new ImportProviderError('NordPass', e);
    }
};
