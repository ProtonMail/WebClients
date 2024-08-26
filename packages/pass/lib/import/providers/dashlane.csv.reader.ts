import { c } from 'ttag';

import { FileKey } from '@proton/pass/lib/import/builders/dashlane.builder';
import {
    processCreditCardItem,
    processIdentityItem,
    processLoginItem,
    processNoteItem,
} from '@proton/pass/lib/import/providers/dashlane.zip.reader';
import { logger } from '@proton/pass/utils/logger';

import { readCSV } from '../helpers/csv.reader';
import { ImportProviderError } from '../helpers/error';
import { getImportedVaultName } from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import type { DashlaneItem, ParserFunction } from './dashlane.types';

const Criteria = {
    [FileKey.Login]: {
        keys: ['username', 'password'],
        parser: processLoginItem as ParserFunction,
    },
    [FileKey.Ids]: {
        keys: ['issue_date', 'expiration_date'],
        parser: processIdentityItem as ParserFunction,
    },
    [FileKey.Payments]: {
        keys: ['cc_number', 'account_number'],
        parser: processCreditCardItem as ParserFunction,
    },
    [FileKey.PersonalInfo]: {
        keys: ['date_of_birth', 'email'],
        parser: processIdentityItem as ParserFunction,
    },
    [FileKey.SecureNotes]: {
        keys: ['title', 'note'],
        parser: processNoteItem as ParserFunction,
    },
};

const getParser = (item: DashlaneItem): [ParserFunction, FileKey] => {
    for (const key in Criteria) {
        const { keys, parser } = Criteria[key as FileKey];
        if (keys.every((k) => k in item)) return [parser, key as FileKey];
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

        const [parser] = getParser(items[0]);
        const vaultItems = items.map((item) => parser(item, importUsername));
        const vaults: ImportVault[] = [{ name: getImportedVaultName(), shareId: null, items: vaultItems }];

        return { vaults, ignored: [], warnings };
    } catch (e) {
        logger.warn('[Importer::Dashlane]', e);
        throw new ImportProviderError('Dashlane', e);
    }
};
