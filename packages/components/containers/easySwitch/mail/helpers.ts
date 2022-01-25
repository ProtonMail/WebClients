import { LABEL_COLORS } from '@proton/shared/lib/constants';
import { randomIntFromInterval } from '@proton/shared/lib/helpers/function';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { ImportedMailFolder, MailImportMapping } from '@proton/shared/lib/interfaces/EasySwitch';

import { FolderRelationshipsMap } from './interfaces';

const SEPARATOR_SPLIT_TOKEN = `##**${Date.now()}**##`;

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

export const getRandomLabelColor = () => LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)];

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

export const nameAlreadyExists = (name: string, collection: Pick<Label, 'Path'>[] | Pick<Folder, 'Path'>[]) => {
    return collection.map((i) => i.Path).some((i) => i.toLowerCase() === name.toLowerCase());
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

    return destinations.some((dest) => nameAlreadyExists(dest, collection));
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

export const getFolderRelationshipsMap = (folders: ImportedMailFolder[]) =>
    folders.reduce((acc: FolderRelationshipsMap, folder) => {
        const currentLevel = getLevel(folder.Source, folder.Separator, folders);

        acc[folder.Source] = folders
            .filter((f) => {
                const level = getLevel(f.Source, f.Separator, folders);
                return (
                    currentLevel + 1 === level &&
                    f.Source.split(f.Separator).slice(0, -1).join(f.Separator) === folder.Source
                );
            })
            .map((f) => f.Source);

        return acc;
    }, {});

export const dateToTimestamp = (date: Date) => Math.floor(date.getTime() / 1000);
