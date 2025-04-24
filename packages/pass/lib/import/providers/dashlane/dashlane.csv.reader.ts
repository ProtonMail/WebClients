import { c } from 'ttag';

import { readCSV } from '@proton/pass/lib/import/helpers/csv.reader';
import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import { getImportedVaultName } from '@proton/pass/lib/import/helpers/transformers';
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
import { seq } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';

import type { DashlaneItem, DashlaneItemAsyncParser, DashlaneItemParser } from './dashlane.types';
import { DashlaneFileKey } from './dashlane.types';
import {
    processDashlaneCC,
    processDashlaneIdentity,
    processDashlaneLogin,
    processDashlaneNote,
    processDashlanePersonalInfo,
} from './dashlane.utils';

const Criteria: Record<
    DashlaneFileKey,
    { keys: string[]; parser: DashlaneItemParser<any> | DashlaneItemAsyncParser<any> }
> = {
    [DashlaneFileKey.Login]: {
        keys: ['username', 'password'],
        parser: processDashlaneLogin,
    },
    [DashlaneFileKey.Ids]: {
        keys: ['issue_date', 'expiration_date'],
        parser: processDashlaneIdentity,
    },
    [DashlaneFileKey.Payments]: {
        keys: ['cc_number', 'account_number'],
        parser: processDashlaneCC,
    },
    [DashlaneFileKey.PersonalInfo]: {
        keys: ['date_of_birth', 'email'],
        parser: processDashlanePersonalInfo,
    },
    [DashlaneFileKey.SecureNotes]: {
        keys: ['title', 'note'],
        parser: processDashlaneNote,
    },
};

const getItemParser = (item: DashlaneItem): DashlaneItemParser | DashlaneItemAsyncParser => {
    for (const key in Criteria) {
        const { keys, parser } = Criteria[key as DashlaneFileKey];
        if (keys.every((k) => k in item)) return parser;
    }

    throw new Error(c('Error').t`Unknown item`);
};

export const readDashlaneDataCSV = async (file: File): Promise<ImportReaderResult> => {
    const warnings: string[] = [];

    try {
        const data = await file.text();
        const { items } = await readCSV<DashlaneItem>({
            data,
            hasHeader: true,
            throwOnEmpty: false,
            onError: (error) => warnings?.push(error),
        });

        const parser = getItemParser(items[0]);
        const vaultItems = await seq(items, parser);
        const vaults: ImportVault[] = [{ name: getImportedVaultName(), shareId: null, items: vaultItems }];

        return { vaults, ignored: [], warnings };
    } catch (e) {
        logger.warn('[Importer::Dashlane]', e);
        throw new ImportProviderError('Dashlane', e);
    }
};
