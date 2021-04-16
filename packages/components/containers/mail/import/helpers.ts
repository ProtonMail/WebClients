import { LABEL_COLORS } from 'proton-shared/lib/constants';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { Folder } from 'proton-shared/lib/interfaces/Folder';
import { Label } from 'proton-shared/lib/interfaces/Label';

import { G_OAUTH_CLIENT_ID, G_OAUTH_SCOPE, G_OAUTH_REDIRECT_PATH } from './constants';
import { FolderMapping, FolderRelationshipsMap, MailImportFolder } from './interfaces';

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

export const getOAuthRedirectURL = () => {
    const { protocol, host } = window.location;
    return `${protocol}//${host}${G_OAUTH_REDIRECT_PATH}`;
};

export const getOAuthAuthorizationUrl = (email?: string) => {
    const params = new URLSearchParams();

    params.append('redirect_uri', getOAuthRedirectURL());
    params.append('response_type', 'code');
    params.append('access_type', 'offline');
    params.append('client_id', G_OAUTH_CLIENT_ID);
    params.append('scope', G_OAUTH_SCOPE);
    params.append('prompt', 'consent');

    if (email) {
        params.append('login_hint', email);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const getRandomLabelColor = () => LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)];

export const mappingHasFoldersTooLong = (mapping: FolderMapping[]) => {
    return mapping.some((m) => {
        const splitted = splitEscaped(m.Destinations.FolderPath);
        return m.checked && splitted[splitted.length - 1].length >= 100;
    });
};

export const mappingHasLabelsTooLong = (mapping: FolderMapping[]) => {
    return mapping.some((m) => {
        if (!m.checked || !m.Destinations.Labels || !m.Destinations.Labels.length) {
            return false;
        }
        return m.Destinations.Labels[0]?.Name.length >= 100;
    });
};

export const nameAlreadyExists = (name: string, collection: Label[] | Folder[]) => {
    return collection.map((i: Label | Folder) => i.Name).some((i) => i.toLowerCase() === name.toLowerCase());
};

export const mappingHasUnavailableNames = (
    mapping: FolderMapping[],
    collection: Label[] | Folder[],
    isLabelMapping: boolean
) => {
    const destinations = mapping
        .map((m) =>
            m.checked && isLabelMapping ? m.Destinations.Labels?.[0]?.Name : unescapeSlashes(m.Destinations.FolderPath)
        )
        .filter(isTruthy);

    return destinations.some((dest) => nameAlreadyExists(dest, collection));
};

export const getLevel = (name: string, separator: string, folders: MailImportFolder[]) => {
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

export const getFolderRelationshipsMap = (folders: MailImportFolder[]) =>
    folders.reduce((acc: FolderRelationshipsMap, folder) => {
        const currentLevel = getLevel(folder.Source, folder.Separator, folders);

        acc[folder.Source] = folders
            .filter((f) => {
                const level = getLevel(f.Source, f.Separator, folders);
                return (
                    currentLevel + 1 === level &&
                    (f.Source.split(f.Separator).slice(0, -1).join(f.Separator) === folder.Source ||
                        f.Source.startsWith(folder.Source))
                );
            })
            .map((f) => f.Source);

        return acc;
    }, {});
