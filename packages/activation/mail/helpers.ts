import { ImportedMailFolder, MailImportMapping } from '@proton/activation/interface';
import { ACCENT_COLORS } from '@proton/shared/lib/constants';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';
import isTruthy from '@proton/utils/isTruthy';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { FolderRelationshipsMap } from './interfaces';

const SEPARATOR_SPLIT_TOKEN = `##**${Date.now()}**##`;
export const RESERVED_NAMES = ['scheduled'];

export const splitEscaped = (s = '', separator = '/') => {
    if (separator !== '/') {
        return s.split(separator);
    }

    /*
        We initially used a Regex with negative lookbehind
        which caused problem with safari. This is the fix
        we came up with.
     */
    return s
        .split('\\/')
        .join(SEPARATOR_SPLIT_TOKEN)
        .split('/')
        .map((s) => s.split(SEPARATOR_SPLIT_TOKEN).join('\\/'));
};

export const escapeSlashes = (s = '') => splitEscaped(s).join('\\/');

export const unescapeSlashes = (s = '') => s.split('\\/').join('/');

export const getRandomLabelColor = () => ACCENT_COLORS[randomIntFromInterval(0, ACCENT_COLORS.length - 1)];

export const mappingHasFoldersTooLong = (mapping: MailImportMapping[]) => {
    return mapping.some((m) => {
        const splitted = splitEscaped(m.Destinations.FolderPath);
        return m.checked && splitted[splitted.length - 1].length >= 100;
    });
};

export const mappingHasLabelsTooLong = (mapping: MailImportMapping[]) => {
    return mapping.some((m) => {
        if (!m.checked || !m.Destinations.Labels || !m.Destinations.Labels.length) {
            return false;
        }
        return m.Destinations.Labels[0]?.Name.length >= 100;
    });
};

export const nameAlreadyExists = (
    name: string,
    collection: Pick<Label, 'Path'>[] | Pick<Folder, 'Path'>[],
    folderFullPath: string
) => {
    return collection.some((item) => item.Path === name && name === folderFullPath);
};

export const mappingHasUnavailableNames = (
    mapping: MailImportMapping[],
    collection: Label[] | Folder[],
    isLabelMapping: boolean
) => {
    const destinations = mapping
        .filter((m) => m.checked)
        .map((m) => (isLabelMapping ? m.Destinations.Labels?.[0]?.Name : unescapeSlashes(m.Destinations.FolderPath)))
        .filter(isTruthy);

    return destinations.some((dest, index) => nameAlreadyExists(dest, collection, mapping[index].Source));
};

export const mappingHasReservedNames = (mapping: MailImportMapping[]) => {
    return mapping.some((m) => {
        const [firstLevel] = splitEscaped(m.Destinations.FolderPath?.toLocaleLowerCase());
        return m.checked && RESERVED_NAMES.includes(firstLevel);
    });
};

export const getLevel = (name: string, separator: string, folders: ImportedMailFolder[]) => {
    const split = splitEscaped(name, separator);
    let level = 0;
    while (split.length) {
        split.pop();
        if (folders.find((f) => f.Source === split.join(separator))) {
            level += 1;
        }
    }

    return level;
};

export const getFolderRelationshipsMap = (folders: ImportedMailFolder[]) => {
    const levelMap = folders.reduce<{ [source: string]: number }>((acc, folder) => {
        acc[folder.Source] = getLevel(folder.Source, folder.Separator, folders);

        return acc;
    }, {});

    return folders.reduce<FolderRelationshipsMap>((acc, folder) => {
        const currentLevel = levelMap[folder.Source];

        acc[folder.Source] = folders
            .filter((f) => {
                const level = levelMap[f.Source];
                return (
                    currentLevel + 1 === level &&
                    f.Source.startsWith(folder.Source) &&
                    f.Source[folder.Source.length] === f.Separator
                );
            })
            .map((f) => f.Source);

        return acc;
    }, {});
};

export const dateToTimestamp = (date: Date) => Math.floor(date.getTime() / 1000);
