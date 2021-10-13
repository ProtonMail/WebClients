import { format } from 'date-fns';

import { LABEL_TYPE } from '@proton/shared/lib/constants';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';
import {
    MailImportDestinationFolder,
    ImportedMailFolder,
    MailImportMapping,
    MailImportPayloadError,
} from '@proton/shared/lib/interfaces/EasySwitch';

import {
    escapeSlashes,
    getFolderRelationshipsMap,
    getRandomLabelColor,
    mappingHasFoldersTooLong,
    mappingHasLabelsTooLong,
    mappingHasUnavailableNames,
    splitEscaped,
} from '../mail/helpers';
import { MAX_FOLDER_LIMIT } from '../constants';

const { FOLDER_NAMES_TOO_LONG, LABEL_NAMES_TOO_LONG, UNAVAILABLE_NAMES, MAX_FOLDERS_LIMIT_REACHED } =
    MailImportPayloadError;

interface LabelColorMap {
    [key: string]: string;
}

interface UseIAMailPayloadContext {
    email: string;
    providerFolders: ImportedMailFolder[];
    isLabelMapping: boolean;
    folders?: Folder[];
    labels?: Label[];
}

const useIAMailPayload = ({
    email,
    providerFolders,
    isLabelMapping,
    folders = [],
    labels = [],
}: UseIAMailPayloadContext) => {
    const getParentSource = (folderPath: string, separator: string) => {
        const split = splitEscaped(folderPath, separator);

        let parentName = '';

        while (split.length && !parentName) {
            split.pop();
            const parent = providerFolders.find((f) => f.Source === split.join(separator));
            if (parent) {
                parentName = parent.Source;
            }
        }

        return parentName;
    };

    const getFolderName = (folderPath: string, separator: string) => {
        const parentSource = getParentSource(folderPath, separator);

        return parentSource
            ? escapeSlashes(folderPath.replace(`${parentSource}${separator}`, ''))
            : escapeSlashes(folderPath);
    };

    const getDestinationFolderPath = ({ Source, Separator }: ImportedMailFolder) => {
        const folderName = getFolderName(Source, Separator);
        const systemFolders = Object.values(MailImportDestinationFolder) as string[];

        let parentSource = getParentSource(Source, Separator);
        let pathParts = [folderName];

        while (parentSource) {
            if (!systemFolders.map((f) => f.toLowerCase()).includes(parentSource.toLowerCase())) {
                pathParts = [getFolderName(parentSource, Separator), ...pathParts];
            } else {
                pathParts[0] = `[${parentSource}]${pathParts[0]}`;
            }

            parentSource = getParentSource(parentSource, Separator);
        }

        if (pathParts.length > 2) {
            const [firstLevel, secondLevel, ...rest] = pathParts;
            return [firstLevel, secondLevel, escapeSlashes(rest.join('/'))].join('/');
        }

        return pathParts.join('/');
    };

    const folderRelationshipsMap = getFolderRelationshipsMap(providerFolders);

    const labelColorMap = providerFolders.reduce((acc: LabelColorMap, label) => {
        const { DestinationFolder, Source } = label;

        if (DestinationFolder) {
            return acc;
        }

        const color = getRandomLabelColor();
        const children = folderRelationshipsMap[Source] || [];

        acc[Source] = acc[Source] || color;
        children.forEach((f) => {
            acc[f] = acc[f] || acc[Source];
        });

        return acc;
    }, {});

    const getDestinationLabels = ({ Source, Separator }: ImportedMailFolder) => {
        return [
            {
                Name: Source.split(Separator).join('-'),
                Color: labelColorMap[Source],
            },
        ];
    };

    const getDefaultMapping = () => {
        return providerFolders.map((folder) => {
            const Destinations = isLabelMapping
                ? {
                      FolderPath: folder.DestinationFolder,
                      Labels: !folder.DestinationFolder ? getDestinationLabels(folder) : [],
                  }
                : {
                      FolderPath: folder.DestinationFolder || getDestinationFolderPath(folder),
                  };

            return {
                Source: folder.Source,
                Destinations,
                checked: true,
            };
        });
    };

    const getDefaultLabel = () => ({
        Name: `${email.split('@')[1]} ${format(new Date(), 'dd-MM-yyyy HH:mm')}`,
        Color: getRandomLabelColor(),
        Type: LABEL_TYPE.MESSAGE_LABEL,
    });

    /* Mail mapping errors */
    const hasMaxFoldersError = (mapping: MailImportMapping[]) =>
        mapping.filter((m) => m.checked).length + folders.length >= MAX_FOLDER_LIMIT;
    const hasUnavailableNamesError = (mapping: MailImportMapping[]) =>
        mappingHasUnavailableNames(mapping, isLabelMapping ? folders : labels, isLabelMapping);
    const hasFoldersTooLongError = (mapping: MailImportMapping[]) => mappingHasFoldersTooLong(mapping);
    const hasLabelsTooLongError = (mapping: MailImportMapping[]) => mappingHasLabelsTooLong(mapping);

    const getMailMappingErrors = (mapping: MailImportMapping[]): MailImportPayloadError[] => {
        const errors = [];

        if (hasMaxFoldersError(mapping)) {
            errors.push(MAX_FOLDERS_LIMIT_REACHED);
        }
        if (hasFoldersTooLongError(mapping)) {
            errors.push(FOLDER_NAMES_TOO_LONG);
        }
        if (hasLabelsTooLongError(mapping)) {
            errors.push(LABEL_NAMES_TOO_LONG);
        }
        if (hasUnavailableNamesError(mapping)) {
            errors.push(UNAVAILABLE_NAMES);
        }

        return errors;
    };

    return {
        getDefaultMapping,
        getDefaultLabel,
        getMailMappingErrors,
    };
};

export default useIAMailPayload;
