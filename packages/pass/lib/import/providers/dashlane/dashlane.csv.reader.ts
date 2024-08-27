import { c } from 'ttag';

import { readCSV } from '@proton/pass/lib/import/helpers/csv.reader';
import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import { getImportedVaultName } from '@proton/pass/lib/import/helpers/transformers';
import type { ImportPayload, ImportVault } from '@proton/pass/lib/import/types';
import { logger } from '@proton/pass/utils/logger';

import type { DashlaneItem, DashlaneItemParser } from './dashlane.types';
import { DashlaneFileKey } from './dashlane.types';
import {
    processDashlaneCC,
    processDashlaneIdentity,
    processDashlaneLogin,
    processDashlaneNote,
    processDashlanePersonalInfo,
} from './dashlane.utils';

const Criteria: Record<DashlaneFileKey, { keys: string[]; parser: DashlaneItemParser<any> }> = {
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

const getItemParser = (item: DashlaneItem): DashlaneItemParser => {
    for (const key in Criteria) {
        const { keys, parser } = Criteria[key as DashlaneFileKey];
        if (keys.every((k) => k in item)) return parser;
    }

    throw new Error(c('Error').t`Unknown item`);
};

export const readDashlaneDataCSV = async ({
    data,
    importUsername,
}: {
    data: string;
    importUsername?: boolean;
}): Promise<ImportPayload> => {
    const warnings: string[] = [];

    try {
        const { items } = await readCSV<DashlaneItem>({
            data,
            hasHeader: true,
            throwOnEmpty: false,
            onError: (error) => warnings?.push(error),
        });

        const parser = getItemParser(items[0]);
        const vaultItems = items.map((item) => parser(item, importUsername));
        const vaults: ImportVault[] = [{ name: getImportedVaultName(), shareId: null, items: vaultItems }];

        return { vaults, ignored: [], warnings };
    } catch (e) {
        logger.warn('[Importer::Dashlane]', e);
        throw new ImportProviderError('Dashlane', e);
    }
};
