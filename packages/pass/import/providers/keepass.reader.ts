import get from 'lodash/get';
import { c } from 'ttag';
import uniqid from 'uniqid';
import X2JS from 'x2js';

import type { ItemImportIntent, MaybeNull } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { getFormattedDayFromTimestamp } from '@proton/pass/utils/time/format';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { isValidURL } from '@proton/pass/utils/url';

import { ImportReaderError } from '../helpers/reader.error';
import { type ImportPayload, ImportVault } from '../types';
import { KeePassEntry, KeePassFile, KeePassGroup, KeePassItem, KeyPassEntryValue } from './keepass.types';

const getKeyPassEntryValue = (Value: KeyPassEntryValue): string => (typeof Value === 'string' ? Value : Value.__text);

const entryToItem = (entry: KeePassEntry): ItemImportIntent<'login'> => {
    const item = entry.String.reduce<KeePassItem>((acc, { Key, Value }) => {
        switch (Key) {
            case 'Title':
                acc.name = getKeyPassEntryValue(Value);
                break;
            case 'Notes':
                acc.note = getKeyPassEntryValue(Value);
                break;
            case 'otp':
                acc.totp = getKeyPassEntryValue(Value);
                break;
            default:
                acc[Key.toLowerCase() as keyof KeePassItem] = getKeyPassEntryValue(Value);
        }

        return acc;
    }, {} as KeePassItem);

    const urlResult = isValidURL(item.url ?? '');
    const url = urlResult.valid ? new URL(urlResult.url) : undefined;
    const name = item.name || url?.hostname || c('Title').t`Unnamed item`;

    return {
        type: 'login',
        metadata: {
            name,
            itemUuid: uniqid(),
            note: item.note || '',
        },
        content: {
            username: item.username || '',
            password: item.password || '',
            urls: [url?.origin].filter(truthy),
            totpUri: item.totp ? parseOTPValue(item.totp, { label: name }) : '',
        },
        extraFields: [],
        trashed: false,
    };
};

const groupToVault = (group: KeePassGroup): MaybeNull<ImportVault> => {
    const entry = get(group, 'Entry');
    if (!entry) return null;

    const vaultName = group.Name || c('Title').t`Import (${getFormattedDayFromTimestamp(getEpoch())})`;

    return {
        type: 'new',
        vaultName,
        id: uniqid(),
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
        };
    } catch (e) {
        logger.warn('[Importer::KeePass]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`KeePass export file could not be parsed. ${errorDetail}`);
    }
};
