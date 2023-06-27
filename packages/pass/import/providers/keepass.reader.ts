import get from 'lodash/get';
import { c } from 'ttag';
import X2JS from 'x2js';

import type { ItemImportIntent, MaybeNull } from '@proton/pass/types';
import type { ItemExtraField } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string';

import { ImportReaderError } from '../helpers/reader.error';
import { getImportedVaultName, importLoginItem } from '../helpers/transformers';
import type { ImportVault } from '../types';
import { type ImportPayload } from '../types';
import type { KeePassEntry, KeePassFile, KeePassGroup, KeePassItem, KeyPassEntryValue } from './keepass.types';

const getKeyPassEntryValue = (Value: KeyPassEntryValue): string => (typeof Value === 'string' ? Value : Value.__text);

const getKeePassProtectInMemoryValue = (Value: KeyPassEntryValue): string =>
    typeof Value === 'string' ? '' : Value._ProtectInMemory;

const entryToItem = (entry: KeePassEntry): ItemImportIntent<'login'> => {
    const entryString = Array.isArray(entry.String) ? entry.String : [entry.String];
    const item = entryString.reduce<KeePassItem & { customFields: ItemExtraField[] }>(
        (acc, { Key, Value }) => {
            if (Key === undefined || Value === undefined) {
                return acc;
            }
            switch (Key) {
                case 'Title':
                    acc.name = getKeyPassEntryValue(Value);
                    break;
                case 'Notes':
                    acc.note = getKeyPassEntryValue(Value);
                    break;
                case 'UserName':
                    acc.username = getKeyPassEntryValue(Value);
                    break;
                case 'Password':
                    acc.password = getKeyPassEntryValue(Value);
                    break;
                case 'URL':
                    acc.url = getKeyPassEntryValue(Value);
                    break;
                case 'otp':
                    acc.totp = getKeyPassEntryValue(Value);
                    break;
                default:
                    acc.customFields.push({
                        fieldName: Key,
                        type: getKeePassProtectInMemoryValue(Value) ? 'hidden' : 'text',
                        data: { content: getKeyPassEntryValue(Value) ?? '' },
                    });
            }

            return acc;
        },
        { customFields: [] } as KeePassItem & { customFields: [] }
    );

    return importLoginItem({
        name: item.name,
        note: item.note,
        username: item.username,
        password: item.password,
        urls: [item.url],
        totp: item.totp,
        extraFields: item.customFields,
    });
};

const groupToVault = (group: KeePassGroup): MaybeNull<ImportVault> => {
    const entry = get(group, 'Entry');
    if (!entry) return null;

    return {
        type: 'new',
        vaultName: getImportedVaultName(group.Name),
        id: uniqueId(),
        items: Array.isArray(entry) ? entry.map(entryToItem) : [entryToItem(entry)],
    };
};

const extractVaults = (group: KeePassGroup, vaults: ImportVault[] = []): ImportVault[] => {
    const vault = groupToVault(group);
    if (vault) vaults.push(vault);

    const nestedGroup = get(group, 'Group');

    if (!nestedGroup) return vaults;

    return Array.isArray(nestedGroup)
        ? nestedGroup.reduce((acc, cur) => acc.concat(extractVaults(cur, [])), vaults)
        : extractVaults(nestedGroup, vaults);
};

export const readKeePassData = (data: string): ImportPayload => {
    try {
        const x2js = new X2JS();
        const importXml: KeePassFile = x2js.xml2js(data);
        const vaults = extractVaults(importXml.KeePassFile.Root as KeePassGroup);

        return {
            vaults,
            ignored: [],
            warnings: [],
        };
    } catch (e) {
        logger.warn('[Importer::KeePass]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`KeePass export file could not be parsed. ${errorDetail}`);
    }
};
