import { c } from 'ttag';

import { seq } from '../../../../utils/fp/promises';
import { logger } from '../../../../utils/logger';
import { readCSV } from '../../helpers/csv.reader';
import { ImportProviderError } from '../../helpers/error';
import { getImportedVaultName } from '../../helpers/transformers';
import type { ImportReaderResult, ImportVault } from '../../types';
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
