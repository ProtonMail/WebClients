import { c } from 'ttag';

import {
    processCreditCardItem,
    processLoginItem,
    processNoteItem,
} from '@proton/pass/lib/import/providers/dashlane.zip.reader';
import type { ItemImportIntent } from '@proton/pass/types';
import { oneOf } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import capitalize from '@proton/utils/capitalize';

import { readCSV } from '../helpers/csv.reader';
import { ImportProviderError } from '../helpers/error';
import { getImportedVaultName } from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import type { DashlaneIdItem, DashlaneItem, DashlanePersonalInfoItem, ParserFunction } from './dashlane.types';

const processIdsItem = ({ name, type }: DashlaneIdItem): string =>
    `[${capitalize(type ?? 'ID')}] ${name || 'Unknown ID'}`;

const processPersonalInfoItem = ({ title }: DashlanePersonalInfoItem): string =>
    `[Personal Info] ${title || 'Unnamed'}`;

enum FileKey {
    Login = 'Login',
    Ids = 'Ids',
    Payments = 'Payments',
    PersonalInfo = 'PersonalInfo',
    SecureNotes = 'SecureNotes',
}

const Criteria = {
    [FileKey.Login]: {
        keys: ['username', 'password'],
        parser: processLoginItem as ParserFunction,
    },
    [FileKey.Ids]: {
        keys: ['issue_date', 'expiration_date'],
        parser: processIdsItem as ParserFunction,
    },
    [FileKey.Payments]: {
        keys: ['cc_number', 'account_number'],
        parser: processCreditCardItem as ParserFunction,
    },
    [FileKey.PersonalInfo]: {
        keys: ['date_of_birth', 'email'],
        parser: processPersonalInfoItem as ParserFunction,
    },
    [FileKey.SecureNotes]: {
        keys: ['title', 'note'],
        parser: processNoteItem as ParserFunction,
    },
};

const getParser = (item: DashlaneItem): [ParserFunction, FileKey] => {
    for (const key in Criteria) {
        const { keys, parser } = Criteria[key as FileKey];

        if (keys.every((k) => k in item)) {
            return [parser, key as FileKey];
        }
    }

    throw new Error(c('Error').t`Unknown item`);
};

const groupItem = (item: (ItemImportIntent | string)[], itemKey: FileKey) => {
    const isItemIgnored = oneOf(FileKey.Ids, FileKey.PersonalInfo)(itemKey);

    return {
        vaultItems: isItemIgnored ? [] : (item as ItemImportIntent[]),
        ignored: isItemIgnored ? (item as string[]) : [],
    };
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

        const [parser, itemKey] = getParser(items[0]);

        const item = items.map((item) => parser(item, importUsername));

        const { vaultItems, ignored } = groupItem(item, itemKey);

        const vaults: ImportVault[] = [
            {
                name: getImportedVaultName(),
                shareId: null,
                items: vaultItems,
            },
        ];

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::Dashlane]', e);
        throw new ImportProviderError('Dashlane', e);
    }
};
