import { readCSV } from '@proton/pass/lib/import/helpers/csv.reader';
import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import { getImportedVaultName } from '@proton/pass/lib/import/helpers/transformers';
import { readZIP } from '@proton/pass/lib/import/helpers/zip.reader';
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
import type { Maybe } from '@proton/pass/types';
import { unary } from '@proton/pass/utils/fp/variadics';
import { logger } from '@proton/pass/utils/logger';

import type {
    DashlaneIdItem,
    DashlaneItem,
    DashlaneLoginItem,
    DashlaneNoteItem,
    DashlanePaymentItem,
    DashlanePersonalInfoItem,
} from './dashlane.types';
import {
    DASHLANE_CREDIT_CARDS_EXPECTED_HEADERS,
    DASHLANE_IDS_EXPECTED_HEADERS,
    DASHLANE_LOGINS_EXPECTED_HEADERS,
    DASHLANE_NOTES_EXPECTED_HEADERS,
    DASHLANE_PERSONAL_INFO_EXPECTED_HEADERS,
    processDashlaneCC,
    processDashlaneIdentity,
    processDashlaneLogin,
    processDashlaneNote,
    processDashlanePersonalInfo,
} from './dashlane.utils';

const parseDashlaneCSV = async <T extends DashlaneItem>(options: {
    data: Maybe<string>;
    headers: (keyof T)[];
    warnings?: string[];
}): Promise<T[]> => {
    return options.data
        ? (
              await readCSV<T>({
                  data: options.data,
                  headers: options.headers,
                  throwOnEmpty: false,
                  onError: (error) => options.warnings?.push(error),
              })
          ).items
        : [];
};

export const readDashlaneDataZIP = async (file: File): Promise<ImportReaderResult> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const fileReader = await readZIP(file);

        /* logins */
        const loginItems = (
            await parseDashlaneCSV<DashlaneLoginItem>({
                data: await fileReader.getFile('credentials.csv').then((blob) => blob?.text()),
                headers: DASHLANE_LOGINS_EXPECTED_HEADERS,
                warnings,
            })
        ).map((item) => processDashlaneLogin(item));

        /* notes */
        const noteItems = (
            await parseDashlaneCSV<DashlaneNoteItem>({
                data: await fileReader.getFile('securenotes.csv').then((blob) => blob?.text()),
                headers: DASHLANE_NOTES_EXPECTED_HEADERS,
                warnings,
            })
        ).map(unary(processDashlaneNote));

        /* credit cards */
        const creditCards = (
            await parseDashlaneCSV<DashlanePaymentItem>({
                data: await fileReader.getFile('payments.csv').then((blob) => blob?.text()),
                headers: DASHLANE_CREDIT_CARDS_EXPECTED_HEADERS,
                warnings,
            })
        ).map(unary(processDashlaneCC));

        const ids = (
            await parseDashlaneCSV<DashlaneIdItem>({
                data: await fileReader.getFile('ids.csv').then((blob) => blob?.text()),
                headers: DASHLANE_IDS_EXPECTED_HEADERS,
            })
        ).map(unary(processDashlaneIdentity));

        const personalInfos = (
            await parseDashlaneCSV<DashlanePersonalInfoItem>({
                data: await fileReader.getFile('personalInfo.csv').then((blob) => blob?.text()),
                headers: DASHLANE_PERSONAL_INFO_EXPECTED_HEADERS,
            })
        ).map(unary(processDashlanePersonalInfo));

        const vaults: ImportVault[] = [
            {
                name: getImportedVaultName(),
                shareId: null,
                items: [...loginItems, ...noteItems, ...creditCards, ...ids, ...personalInfos],
            },
        ];

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::Dashlane]', e);
        throw new ImportProviderError('Dashlane', e);
    }
};
