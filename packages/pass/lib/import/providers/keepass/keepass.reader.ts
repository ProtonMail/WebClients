import get from 'lodash/get';
import { c } from 'ttag';
import X2JS from 'x2js';

import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importLoginItem,
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportPayload, ImportVault } from '@proton/pass/lib/import/types';
import type { ItemImportIntent, Maybe, MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import type { KeePassEntry, KeePassEntryValue, KeePassFile, KeePassGroup, KeePassItem } from './keepass.types';

const getKeePassEntryValue = (Value: KeePassEntryValue): string => (typeof Value === 'string' ? Value : Value.__text);

const getKeePassProtectInMemoryValue = (Value: KeePassEntryValue): string =>
    typeof Value === 'string' ? '' : Value._ProtectInMemory;

const isLegacyTotpDefinition = (item: KeePassItem) => Boolean(item.totpSeed && item.totpSettings);

const formatOtpAuthUriFromLegacyTotpDefinition = (item: KeePassItem): Maybe<string> => {
    try {
        const [period, digits] = item.totpSettings!.split(';').map((value) => parseInt(value, 10));
        if (isNaN(period) || isNaN(digits)) throw new Error();

        return `otpauth://totp/${item.name}:none?secret=${item.totpSeed}&period=${period}&digits=${digits}`;
    } catch (e) {
        logger.warn(`[Importer::KeePass] legacy TOTP settings for item "${item.name}" are not in the expected format`);
    }
};

const formatOtpAuthUri = (item: KeePassItem): Maybe<string> =>
    isLegacyTotpDefinition(item) ? formatOtpAuthUriFromLegacyTotpDefinition(item) : item.otpauth;

const entryToItem = (entry: KeePassEntry): ItemImportIntent<'login'> => {
    const entryString = Array.isArray(entry.String) ? entry.String : [entry.String];
    const item = entryString.reduce<KeePassItem>(
        (acc, { Key, Value }) => {
            if (!Key || !Value) return acc;

            switch (Key) {
                case 'Title':
                    acc.name = getKeePassEntryValue(Value);
                    break;
                case 'Notes':
                    acc.note = getKeePassEntryValue(Value);
                    break;
                case 'UserName':
                    acc.username = getKeePassEntryValue(Value);
                    break;
                case 'Password':
                    acc.password = getKeePassEntryValue(Value);
                    break;
                case 'URL':
                    acc.url = getKeePassEntryValue(Value);
                    break;
                case 'otp':
                    acc.otpauth = getKeePassEntryValue(Value);
                    break;
                case 'TOTP Seed':
                    acc.totpSeed = getKeePassEntryValue(Value);
                    break;
                case 'TOTP Settings':
                    acc.totpSettings = getKeePassEntryValue(Value);
                    break;
                default:
                    const type = getKeePassProtectInMemoryValue(Value) ? 'hidden' : 'text';

                    acc.customFields.push({
                        fieldName: Key || (type === 'hidden' ? c('Label').t`Hidden` : c('Label').t`Text`),
                        type,
                        data: { content: getKeePassEntryValue(Value) ?? '' },
                    });
            }

            return acc;
        },
        { customFields: [] }
    );

    return importLoginItem({
        name: item.name,
        note: item.note,
        ...getEmailOrUsername(item.username),
        password: item.password,
        urls: [item.url],
        totp: formatOtpAuthUri(item),
        extraFields: item.customFields,
    });
};

const groupToVault = (group: KeePassGroup): MaybeNull<ImportVault> => {
    const entry = get(group, 'Entry');
    if (!entry) return null;

    return {
        name: getImportedVaultName(group.Name),
        shareId: null,
        items: Array.isArray(entry) ? entry.map((entry) => entryToItem(entry)) : [entryToItem(entry)],
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

export const readKeePassData = ({ data }: { data: string }): ImportPayload => {
    try {
        const x2js = new X2JS({ stripWhitespaces: false });
        const importXml: KeePassFile = x2js.xml2js(data);
        const vaults = extractVaults(importXml.KeePassFile.Root as KeePassGroup, []);

        return {
            vaults,
            ignored: [],
            warnings: [],
        };
    } catch (e) {
        logger.warn('[Importer::KeePass]', e);
        throw new ImportProviderError('KeePass', e);
    }
};
