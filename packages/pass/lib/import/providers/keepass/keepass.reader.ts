import { c } from 'ttag';

import type { ItemImportIntent } from '../../../../types/data/items.dto';
import type { Maybe, MaybeArray } from '../../../../types/utils';
import { logger } from '../../../../utils/logger';
import { ImportProviderError } from '../../helpers/error';
import type { ImportFolderTree } from '../../helpers/folders';
import { createImportFolderTree } from '../../helpers/folders';
import { getEmailOrUsername, getImportedVaultName, importLoginItem } from '../../helpers/transformers';
import type { ImportReaderResult, ImportVault } from '../../types';
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

const entryToItem = async (
    entry: KeePassEntry,
    { trashed }: { trashed: boolean }
): Promise<ItemImportIntent<'login'>> => {
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
        trashed,
        ...(await getEmailOrUsername(item.username)),
    });
};

const toArray = <T>(value: Maybe<MaybeArray<T>>): T[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
};

type KeePassImportContext = {
    tree: ImportFolderTree;
    recycleBinUUID: Maybe<string>;
};

const isRecycleBin = (group: KeePassGroup, recycleBinUUID: Maybe<string>) =>
    Boolean(recycleBinUUID) && group.UUID === recycleBinUUID;

const extractItems = async (
    group: KeePassGroup,
    path: string[],
    context: KeePassImportContext,
    inRecycleBin = false
): Promise<ItemImportIntent[]> => {
    const trashed = inRecycleBin || isRecycleBin(group, context.recycleBinUUID);
    const folderId = trashed ? null : context.tree.add(path);
    const items: ItemImportIntent[] = [];

    for (const entry of toArray(group.Entry)) {
        const item = await entryToItem(entry, { trashed });
        items.push({ ...item, folderId });
    }

    for (const subgroup of toArray(group.Group)) {
        items.push(...(await extractItems(subgroup, [...path, subgroup.Name], context, trashed)));
    }

    return items;
};

export const readKeePassData = async (file: File): Promise<ImportReaderResult> => {
    try {
        const data = await file.text();
        const X2JS = (await import('x2js')).default;
        const parser = new X2JS({ stripWhitespaces: false });
        const importXml: KeePassFile = parser.xml2js(data);
        const { Meta, Root } = importXml.KeePassFile;

        const tree = createImportFolderTree();
        const context: KeePassImportContext = { tree, recycleBinUUID: Meta?.RecycleBinUUID };
        const rootGroups = toArray(Root.Group);
        const hasSingleRootGroup = rootGroups.length === 1;
        const items: ItemImportIntent[] = [];

        for (const group of rootGroups) {
            // If only a single root, import to the vault root
            const path = hasSingleRootGroup ? [] : [group.Name];
            items.push(...(await extractItems(group, path, context)));
        }

        const vaultName = hasSingleRootGroup ? rootGroups[0].Name : undefined;
        const vaults: ImportVault[] = [
            { name: getImportedVaultName(vaultName), shareId: null, folders: tree.folders, items },
        ];

        return { vaults, ignored: [], warnings: [] };
    } catch (e) {
        logger.warn('[Importer::KeePass]', e);
        throw new ImportProviderError('KeePass', e);
    }
};
