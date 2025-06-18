import get from 'lodash/get';
import { c } from 'ttag';

import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importLoginItem,
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
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
        logger.warn(`[Importer::KeePass] legacy TOTP settings are not in the expected format`);
    }
};

const formatOtpAuthUri = (item: KeePassItem): Maybe<string> =>
    isLegacyTotpDefinition(item) ? formatOtpAuthUriFromLegacyTotpDefinition(item) : item.otpauth;

const entryToItem = async (entry: KeePassEntry): Promise<ItemImportIntent<'login'>> => {
    const entryString = Array.isArray(entry.String) ? entry.String : [entry.String];
    const item = entryString.reduce<KeePassItem>(
        (acc, field) => {
            if (!field?.Key || !field?.Value) return acc;

            const { Key, Value } = field;

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
        password: item.password,
        urls: [item.url],
        totp: formatOtpAuthUri(item),
        extraFields: item.customFields,
        ...(await getEmailOrUsername(item.username)),
    });
};

const groupToVault = async (group: KeePassGroup): Promise<MaybeNull<ImportVault>> => {
    const entries = get(group, 'Entry');
    if (!entries) return null;

    const name = getImportedVaultName(group.Name);
    const items: ItemImportIntent[] = [];

    for (const entry of Array.isArray(entries) ? entries : [entries]) {
        items.push(await entryToItem(entry));
    }

    return { name, shareId: null, items };
};

const extractVaults = async (group: KeePassGroup): Promise<ImportVault[]> => {
    const vaults: ImportVault[] = [];

    const vault = await groupToVault(group);
    if (vault) vaults.push(vault);

    const nestedGroup = get(group, 'Group');
    if (!nestedGroup) return vaults;

    for (const group of Array.isArray(nestedGroup) ? nestedGroup : [nestedGroup]) {
        const nested = await extractVaults(group);
        vaults.push(...nested);
    }

    return vaults;
};

export const readKeePassData = async (file: File): Promise<ImportReaderResult> => {
    try {
        const data = await file.text();
        const X2JS = (await import('x2js')).default;
        const parser = new X2JS({ stripWhitespaces: false });
        const importXml: KeePassFile = parser.xml2js(data);
        const vaults = await extractVaults(importXml.KeePassFile.Root as KeePassGroup);

        return { vaults, ignored: [], warnings: [] };
    } catch (e) {
        logger.warn('[Importer::KeePass]', e);
        throw new ImportProviderError('KeePass', e);
    }
};
