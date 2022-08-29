import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Address, Label } from '@proton/shared/lib/interfaces';
import {
    ImportedMailFolder,
    MailImportDestinationFolder,
    MailImportMapping,
    MailImporterPayload,
} from '@proton/shared/lib/interfaces/EasySwitch';
import { Folder } from '@proton/shared/lib/interfaces/Folder';

import { escapeSlashes, getFolderRelationshipsMap, getLevel, splitEscaped } from '../helpers';
import {
    CheckedFoldersMap,
    DisabledFoldersMap,
    EditModeMap,
    FolderNamesMap,
    FolderPathsMap,
    LabelsMap,
} from '../interfaces';
import ImportManageFoldersRow from './ImportManageFoldersRow';

interface Props {
    addresses: Address[];
    payload: MailImporterPayload;
    onChangePayload: (newPayload: MailImporterPayload) => void;
    toggleEditing: (editing: boolean) => void;
    isLabelMapping: boolean;
    folders: Folder[];
    labels: Label[];
    providerFolders: ImportedMailFolder[];
    importedEmail: string;
}

const ImportManageFolders = ({
    addresses,
    payload,
    toggleEditing,
    onChangePayload,
    isLabelMapping,
    folders,
    labels,
    providerFolders,
    importedEmail,
}: Props) => {
    // Here we map folders with their direct children
    const folderRelationshipsMap = getFolderRelationshipsMap(providerFolders);

    const [checkedFoldersMap, setCheckedFoldersMap] = useState(
        providerFolders.reduce<CheckedFoldersMap>((acc, folder) => {
            const found = payload.Mapping.find((m) => m.Source === folder.Source);
            acc[folder.Source] = !!(found && found.checked);
            return acc;
        }, {})
    );

    const getParent = (folderName: string) => {
        const [parentName] =
            Object.entries(folderRelationshipsMap).find(([, children]) => {
                return children.includes(folderName);
            }) || [];
        return parentName;
    };

    const getNameValue = (destinationPath: string) => {
        const [firstLevel, secondLevel, ...rest] = splitEscaped(destinationPath);

        // for level 3 or more
        if (rest.length) {
            return rest.join('/');
        }
        return secondLevel || firstLevel;
    };

    const [folderNamesMap, setFoldersNameMap] = useState(
        providerFolders.reduce<FolderNamesMap>((acc, folder) => {
            const found = payload.Mapping.find((m) => m.Source === folder.Source);
            acc[folder.Source] = getNameValue(
                found?.Destinations.FolderPath || folder.DestinationFolder || folder.Source
            );
            return acc;
        }, {})
    );

    const [labelsMap, setLabelsMap] = useState(
        providerFolders.reduce<LabelsMap>((acc, folder) => {
            const found = payload.Mapping.find((m) => m.Source === folder.Source);
            if (found?.Destinations?.Labels?.length) {
                [acc[folder.Source]] = found.Destinations.Labels;
            }
            return acc;
        }, {})
    );

    const forgeNewPath = (folder: ImportedMailFolder) => {
        const systemFolders = Object.values(MailImportDestinationFolder) as string[];
        let sourceParentPath = getParent(folder.Source);
        const ancestors = [];

        while (sourceParentPath) {
            ancestors.unshift(folderNamesMap[sourceParentPath]);
            sourceParentPath = getParent(sourceParentPath);
        }

        if (ancestors.length && systemFolders.map((f) => f.toLowerCase()).includes(ancestors[0].toLowerCase())) {
            ancestors.shift();
        }

        const [firstLevel, secondLevel] = ancestors;

        return [firstLevel, secondLevel, folderNamesMap[folder.Source]].filter((value) => !!value).join('/');
    };

    const folderPathsMap = useMemo(
        () =>
            providerFolders.reduce<FolderPathsMap>((acc, folder) => {
                acc[folder.Source] = forgeNewPath(folder);
                return acc;
            }, {}),
        [folderNamesMap, checkedFoldersMap]
    );

    const disabledFoldersMap = useMemo(() => {
        return providerFolders.reduce<DisabledFoldersMap>((acc, folder) => {
            const sourceParentName = getParent(folder.Source);
            acc[folder.Source] = sourceParentName
                ? acc[sourceParentName] || !checkedFoldersMap[sourceParentName]
                : false;
            return acc;
        }, {});
    }, [checkedFoldersMap]);

    const getDescendants = (children: string[]) => {
        const grandChildren: string[] = children.reduce<string[]>((acc, childName) => {
            const children = folderRelationshipsMap[childName];

            return [...acc, ...getDescendants(children)];
        }, []);

        return [...children, ...grandChildren];
    };

    const handleToggleCheck = (source: string, checked: boolean) => {
        const newCheckedFoldersMap = {
            ...checkedFoldersMap,
            [source]: checked,
        };

        const children = folderRelationshipsMap[source];
        const descendants = children ? getDescendants(children) : [];

        descendants.forEach((folderName) => {
            newCheckedFoldersMap[folderName] = checked;
        });

        setCheckedFoldersMap(newCheckedFoldersMap);
    };

    const handleRenameFolder = (source: string, newName: string) => {
        setFoldersNameMap({
            ...folderNamesMap,
            [source]: escapeSlashes(newName),
        });
    };

    const handleRenameLabel = (source: string, Name: string) => {
        setLabelsMap({
            ...labelsMap,
            [source]: {
                ...labelsMap[source],
                Name,
            },
        });
    };

    const [editModeMap, setEditModeMap] = useState(
        providerFolders.reduce<EditModeMap>((acc, folder) => {
            acc[folder.Source] = false;
            return acc;
        }, {})
    );

    const updateEditModeMapping = (key: string, editMode: boolean) => {
        const newEditModeMap = { ...editModeMap };
        newEditModeMap[key] = editMode;
        setEditModeMap(newEditModeMap);
    };

    useEffect(() => {
        const isEditing = Object.values(editModeMap).some(Boolean);
        toggleEditing(isEditing);
    }, [editModeMap]);

    useEffect(() => {
        const Mapping = providerFolders.reduce<MailImportMapping[]>((acc, folder) => {
            const Destinations = isLabelMapping
                ? {
                      FolderPath: folder.DestinationFolder,
                      Labels: !folder.DestinationFolder ? [labelsMap[folder.Source]] : [],
                  }
                : {
                      FolderPath: forgeNewPath(folder),
                  };

            acc.push({
                Source: folder.Source,
                Destinations,
                checked: checkedFoldersMap[folder.Source],
            });

            return acc;
        }, []);

        onChangePayload({
            ...payload,
            Mapping,
        });
    }, [checkedFoldersMap, labelsMap, folderNamesMap]);

    const emailAddress = addresses.find((addr) => addr.ID === payload.AddressID)?.Email;
    const fromLabel = c('Label').t`From: ${importedEmail}`;
    const toLabel = c('Label').t`To: ${emailAddress}`;

    return (
        <>
            <div className="mb1 mt2">{c('Info').t`Please select the folders you would like to import:`}</div>

            <div className="flex pt1">
                <div className="flex-item-fluid text-ellipsis pr0-5" title={fromLabel}>
                    <strong>{fromLabel}</strong>
                </div>

                <div className="flex-item-fluid text-ellipsis pl0-5" title={toLabel}>
                    <strong>{toLabel}</strong>
                </div>
            </div>

            <div className="flex mb1">
                <div className="flex-item-fluid pt0-5">
                    <ul className="unstyled m0">
                        {providerFolders
                            .filter(
                                (folder) =>
                                    getLevel(folder.Source, folder.Separator, providerFolders) === 0 &&
                                    !folder.DestinationCategory
                            )
                            .map((item: ImportedMailFolder) => (
                                <ImportManageFoldersRow
                                    onToggleCheck={handleToggleCheck}
                                    key={item.Source}
                                    folder={item}
                                    level={0}
                                    disabledFoldersMap={disabledFoldersMap}
                                    checkedFoldersMap={checkedFoldersMap}
                                    folderRelationshipsMap={folderRelationshipsMap}
                                    providerFolders={providerFolders}
                                    folderNamesMap={folderNamesMap}
                                    folderPathsMap={folderPathsMap}
                                    labelsMap={labelsMap}
                                    onRenameFolder={handleRenameFolder}
                                    onRenameLabel={handleRenameLabel}
                                    editModeMap={editModeMap}
                                    getParent={getParent}
                                    updateEditModeMapping={updateEditModeMapping}
                                    isLabelMapping={isLabelMapping}
                                    folders={folders}
                                    labels={labels}
                                />
                            ))}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default ImportManageFolders;
