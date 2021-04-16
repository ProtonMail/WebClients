import React, { ChangeEvent, useState, useRef, useEffect, useMemo } from 'react';
import { c } from 'ttag';

import { Folder } from 'proton-shared/lib/interfaces/Folder';
import { Label } from 'proton-shared/lib/interfaces/Label';

import { classnames } from '../../../../helpers';
import { Tooltip, Icon, Checkbox, InlineLinkButton, Input, LabelStack } from '../../../../components';

import {
    DestinationFolder,
    CheckedFoldersMap,
    DisabledFoldersMap,
    FolderRelationshipsMap,
    MailImportFolder,
    FolderNamesMap,
    FolderPathsMap,
    EditModeMap,
    LabelsMap,
} from '../interfaces';

import { escapeSlashes, unescapeSlashes, splitEscaped, nameAlreadyExists } from '../helpers';

const SYSTEM_FOLDERS = Object.values(DestinationFolder) as string[];

const FOLDER_ICONS = {
    [DestinationFolder.INBOX]: 'inbox',
    [DestinationFolder.ALL_DRAFTS]: 'drafts',
    [DestinationFolder.ALL_SENT]: 'sent',
    [DestinationFolder.TRASH]: 'trash',
    [DestinationFolder.SPAM]: 'spam',
    [DestinationFolder.ARCHIVE]: 'archive',
    [DestinationFolder.SENT]: 'sent',
    [DestinationFolder.DRAFTS]: 'drafts',
    [DestinationFolder.STARRED]: 'star',
    [DestinationFolder.ALL_MAIL]: 'all-emails',
};

const DIMMED_OPACITY_CLASSNAME = 'opacity-30';

interface WrapperProps {
    isLabel: boolean;
    children: React.ReactNode;
    checkboxId: string;
    className: string;
}

const RowWrapperComponent = ({ isLabel, children, checkboxId, className }: WrapperProps) => {
    return isLabel ? (
        <label htmlFor={checkboxId} className={className}>
            {children}
        </label>
    ) : (
        <div className={className}>{children}</div>
    );
};

interface Props {
    onRenameFolder: (source: string, newName: string) => void;
    onRenameLabel: (source: string, Name: string) => void;
    onToggleCheck: (source: string, checked: boolean) => void;
    folder: MailImportFolder;
    level: number;
    checkedFoldersMap: CheckedFoldersMap;
    disabledFoldersMap: DisabledFoldersMap;
    folderRelationshipsMap: FolderRelationshipsMap;
    providerFolders: MailImportFolder[];
    folderNamesMap: FolderNamesMap;
    folderPathsMap: FolderPathsMap;
    labelsMap: LabelsMap;
    editModeMap: EditModeMap;
    updateEditModeMapping: (key: string, editMode: boolean) => void;
    getParent: (folderName: string) => string | undefined;
    isSystemSubfolder?: boolean;
    isLabelMapping: boolean;
    folders: Folder[];
    labels: Label[];
}

const ImportManageFoldersRow = ({
    folder,
    level,
    onToggleCheck,
    checkedFoldersMap,
    disabledFoldersMap,
    folderRelationshipsMap,
    providerFolders,
    folderNamesMap,
    folderPathsMap,
    labelsMap,
    onRenameFolder,
    onRenameLabel,
    updateEditModeMapping,
    getParent,
    editModeMap,
    isSystemSubfolder = false,
    isLabelMapping,
    folders,
    labels,
}: Props) => {
    const { Source, Separator, DestinationFolder } = folder;

    const checked = checkedFoldersMap[Source];
    const disabled = disabledFoldersMap[Source];

    const children = folderRelationshipsMap[Source].reduce<MailImportFolder[]>((acc, childName) => {
        const found = providerFolders.find((f) => f.Source === childName);
        if (found) {
            acc.push(found);
        }
        return acc;
    }, []);

    const destinationName =
        isLabelMapping && labelsMap[Source] ? labelsMap[Source].Name : unescapeSlashes(folderNamesMap[Source]);

    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(destinationName);
    const initialValue = useRef<string>(inputValue);

    const ERRORS = {
        nameTooLongError: isLabelMapping
            ? c('Error').t`The label name is too long. Please choose a different name.`
            : c('Error').t`The folder name is too long. Please choose a different name.`,
        emptyValueError: isLabelMapping
            ? c('Error').t`Label name cannot be empty`
            : c('Error').t`Folder name cannot be empty`,
        nameAlreadyExistsError: isLabelMapping
            ? c('Error').t`This label name is not available. Please choose a different name`
            : c('Error').t`This folder name is not available. Please choose a different name`,
    };

    const WARNINGS = {
        mergeWarning: c('Warning')
            .t`Proton will merge all folders with the same name. To avoid this, change the names before import.`,
    };

    const emptyValueError = useMemo(() => !inputValue || !inputValue.trim(), [inputValue]);

    /*
     * Here we check folders names agains existing labels
     * and labels against existing folders
     * */
    const nameAlreadyExistsError = useMemo(() => nameAlreadyExists(inputValue, isLabelMapping ? folders : labels), [
        inputValue,
        folders,
        labels,
    ]);

    const nameTooLongError = useMemo(() => {
        if (!checked) {
            return false;
        }
        return isLabelMapping ? inputValue.length >= 100 : escapeSlashes(inputValue).length >= 100;
    }, [inputValue, checked]);

    const mergeWarning = useMemo(() => {
        if (!checked) {
            return false;
        }

        const newPath = folderPathsMap[folder.Source];

        return Object.entries(folderPathsMap).some(([source, path]) => {
            return (
                source !== Source &&
                path === newPath &&
                checkedFoldersMap[source] &&
                !labelsMap[source] &&
                !folder.DestinationFolder
            );
        });
    }, [inputValue, checked, folderNamesMap, folderPathsMap, checkedFoldersMap, labelsMap]);

    const hasError = emptyValueError || nameTooLongError || nameAlreadyExistsError;

    const [editMode, setEditMode] = useState(hasError);

    const toggleEditMode = () => {
        if (disabled || editMode) {
            return;
        }
        if (!editMode) {
            initialValue.current = inputValue;
        }

        setEditMode(!editMode);
    };

    const handleSave = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        setEditMode(false);
        initialValue.current = inputValue;
    };

    const preventDefaultAndStopPropagation = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = target;
        setInputValue(value);

        if (!value) {
            return;
        }

        if (isLabelMapping) {
            onRenameLabel(Source, value);
        } else {
            onRenameFolder(Source, value);
        }
    };

    const handleCancel = () => {
        setEditMode(false);
        if (isLabelMapping) {
            onRenameLabel(Source, initialValue.current);
        } else {
            onRenameFolder(Source, initialValue.current);
        }
        setInputValue(initialValue.current);
    };

    const renderInput = () => {
        let error;
        let item;

        if (nameTooLongError) {
            error = ERRORS.nameTooLongError;
        }

        if (nameAlreadyExistsError) {
            error = ERRORS.nameAlreadyExistsError;
        }

        if (emptyValueError) {
            error = ERRORS.emptyValueError;
        }

        if (error) {
            item = (
                <Tooltip title={error} type="error">
                    <Icon
                        tabIndex={-1}
                        name="info"
                        className="color-danger inline-flex flex-align-self-center flex-item-noshrink"
                    />
                </Tooltip>
            );
        }

        return (
            <Input
                autoFocus
                required
                isSubmitted
                ref={inputRef}
                value={inputValue}
                onChange={handleChange}
                onPressEnter={(e: React.KeyboardEvent) => {
                    e.preventDefault();
                    if (hasError) {
                        return;
                    }
                    handleSave(e);
                }}
                icon={item}
                error={error}
                errorZoneClassName="hidden"
                className="hauto"
            />
        );
    };

    const getSourceDisplayName = () => {
        const split = splitEscaped(Source, Separator);

        let parentName = '';

        while (split.length && !parentName) {
            split.pop();
            const parent = providerFolders.find((f) => f.Source === split.join(Separator));
            if (parent) {
                parentName = parent.Source;
            }
        }

        return parentName ? folder.Source.replace(`${parentName}${Separator}`, '') : folder.Source;
    };

    useEffect(() => {
        if (editMode && inputRef && inputRef.current) {
            inputRef.current.focus();
        }
        updateEditModeMapping(Source, editMode);
    }, [editMode]);

    useEffect(() => {
        if (disabled) {
            handleCancel();
            return;
        }

        if (!checked && editMode) {
            handleCancel();
        }

        if (checked && hasError) {
            setEditMode(true);
        }
    }, [checked, disabled]);

    const isParentSystemFolder = useMemo(() => {
        const split = splitEscaped(Source, Separator);
        return SYSTEM_FOLDERS.includes(split[0]);
    }, [Source, Separator]);

    const sourceIndentStyles = { marginLeft: `${level}em` };

    /*
     * For "regular" destination folders we keep the same level, capped at 2
     * Otherwise, for destination folders which parent is a System Folder (possible with Outlook)
     * then we apply the level minus one, but can't be less than 0 nor higher than 2
     * */
    const destinationIndentStyles = {
        marginLeft: `${isParentSystemFolder ? Math.max(0, Math.min(level - 1, 2)) : Math.min(level, 2)}em`,
    };

    const renderDestination = () => {
        if (labelsMap[Source]) {
            const { Name: name, Color: color } = labelsMap[Source];

            const warnings = !checked ? null : (
                <>
                    {nameTooLongError && (
                        <Tooltip title={ERRORS.nameTooLongError} type="error">
                            <Icon tabIndex={-1} name="info" className="color-danger" />
                        </Tooltip>
                    )}

                    {!checked && nameAlreadyExistsError && !nameTooLongError && (
                        <Tooltip title={ERRORS.nameAlreadyExistsError} type="error">
                            <Icon tabIndex={-1} name="info" className="color-danger" />
                        </Tooltip>
                    )}
                </>
            );

            return (
                <div className="flex flex-nowrap flex-align-items-center flex-item-fluid-auto">
                    <div
                        className={classnames([
                            'flex flex-nowrap flex-item-fluid-auto',
                            hasError && 'color-danger',
                            mergeWarning && 'color-warning',
                        ])}
                    >
                        {editMode && !disabled && checked ? (
                            renderInput()
                        ) : (
                            <div
                                className={classnames([
                                    'flex-item-fluid-auto text-ellipsis flex flex-align-items-center',
                                    (hasError || mergeWarning) && 'text-bold',
                                ])}
                                title={destinationName}
                            >
                                <LabelStack
                                    labels={[
                                        {
                                            name,
                                            color,
                                            title: name,
                                        },
                                    ]}
                                    className="max-w100 flex-item-fluid"
                                />

                                {warnings && (
                                    <div className="flex-item-noshrink inline-flex flex-align-self-center flex-item-noshrink ml1">
                                        {warnings}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {editMode && !disabled && (
                        <div
                            className="flex flex-align-items-center flex-item-noshrink ml0-5"
                            onClick={(e) => {
                                if (disabled) {
                                    preventDefaultAndStopPropagation(e);
                                }
                            }}
                        >
                            <InlineLinkButton
                                onClick={handleSave}
                                className={classnames(['p0-5', hasError && DIMMED_OPACITY_CLASSNAME])}
                                aria-disabled={hasError}
                                disabled={hasError}
                            >
                                {c('Action').t`Rename`}
                            </InlineLinkButton>
                        </div>
                    )}
                </div>
            );
        }

        const warnings = !checked ? null : (
            <>
                {nameTooLongError && (
                    <Tooltip title={ERRORS.nameTooLongError} type="error">
                        <Icon tabIndex={-1} name="info" className="color-danger" />
                    </Tooltip>
                )}

                {nameAlreadyExistsError && !nameTooLongError && (
                    <Tooltip title={ERRORS.nameAlreadyExistsError} type="error">
                        <Icon tabIndex={-1} name="info" className="color-danger" />
                    </Tooltip>
                )}

                {mergeWarning && (
                    <Tooltip title={WARNINGS.mergeWarning} type="warning">
                        <Icon tabIndex={-1} name="info" className="color-warning" />
                    </Tooltip>
                )}

                {isSystemSubfolder && !mergeWarning && (
                    <Tooltip title={c('Tooltip').t`System subfolders will show up as separate folders in ProtonMail`}>
                        <Icon tabIndex={-1} name="info" />
                    </Tooltip>
                )}
            </>
        );

        return (
            <div
                className="flex flex-nowrap flex-align-items-center flex-item-fluid-auto"
                style={DestinationFolder ? undefined : destinationIndentStyles}
            >
                <Icon
                    name={DestinationFolder ? FOLDER_ICONS[DestinationFolder] : 'folder'}
                    className={classnames([
                        'flex-item-noshrink mr0-5',
                        hasError && 'color-danger',
                        mergeWarning && 'color-warning',
                    ])}
                />
                <div
                    className={classnames([
                        'flex flex-nowrap flex-item-fluid flex-align-items-center',
                        hasError && 'color-danger',
                        mergeWarning && 'color-warning',
                    ])}
                >
                    {editMode && !disabled ? (
                        renderInput()
                    ) : (
                        <div
                            className={classnames([
                                'text-ellipsis flex flex-align-items-center',
                                (hasError || mergeWarning) && 'text-bold',
                            ])}
                            title={destinationName}
                        >
                            <div className="flex-item-fluid text-ellipsis">{destinationName}</div>

                            {warnings && (
                                <div className="flex-item-noshrink inline-flex flex-align-self-center flex-item-noshrink ml0-5">
                                    {warnings}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!DestinationFolder && (
                    <div
                        className="flex flex-align-items-center flex-item-noshrink"
                        onClick={(e) => {
                            if (disabled) {
                                preventDefaultAndStopPropagation(e);
                            }
                        }}
                    >
                        {editMode && !disabled ? (
                            <>
                                <InlineLinkButton
                                    onClick={handleSave}
                                    className={classnames(['ml0-5 p0-5', hasError && DIMMED_OPACITY_CLASSNAME])}
                                    aria-disabled={hasError}
                                    disabled={hasError}
                                >
                                    {c('Action').t`Save`}
                                </InlineLinkButton>
                                <InlineLinkButton
                                    onClick={(e) => {
                                        preventDefaultAndStopPropagation(e);
                                        handleCancel();
                                    }}
                                    className="ml0-5 p0-5"
                                >
                                    {c('Action').t`Cancel`}
                                </InlineLinkButton>
                            </>
                        ) : (
                            <InlineLinkButton
                                aria-disabled={!checked}
                                disabled={!checked}
                                tabIndex={disabled ? -1 : 0}
                                onClick={toggleEditMode}
                                className="ml0-5 p0-5"
                            >
                                {c('Action').t`Rename`}
                            </InlineLinkButton>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <li>
            <div className="border-bottom">
                <RowWrapperComponent
                    isLabel={!editMode}
                    checkboxId={Source}
                    className={classnames([
                        'flex flex-nowrap flex-align-items-center pt1 pb1',
                        !checked && DIMMED_OPACITY_CLASSNAME,
                        (disabled || editMode) && 'cursor-default',
                    ])}
                >
                    <div className="flex w50 flex-nowrap flex-align-items-center flex-item-noshrink pr0-5">
                        <div className="flex-item-noshrink" style={DestinationFolder ? undefined : sourceIndentStyles}>
                            <Checkbox
                                onChange={({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
                                    onToggleCheck(Source, checked);
                                }}
                                id={Source}
                                checked={checked}
                                disabled={disabled}
                            />
                        </div>
                        <div className="ml0-5 flex-item-fluid-auto text-ellipsis" title={getSourceDisplayName()}>
                            {getSourceDisplayName()}
                        </div>
                    </div>

                    <div className="flex w50 pl0-5">{renderDestination()}</div>
                </RowWrapperComponent>
            </div>

            {children.length > 0 && (
                <ul className="unstyled m0">
                    {children.map((f) => (
                        <ImportManageFoldersRow
                            onToggleCheck={onToggleCheck}
                            key={f.Source}
                            folder={f}
                            level={level + 1}
                            checkedFoldersMap={checkedFoldersMap}
                            disabledFoldersMap={disabledFoldersMap}
                            folderRelationshipsMap={folderRelationshipsMap}
                            providerFolders={providerFolders}
                            folderNamesMap={folderNamesMap}
                            folderPathsMap={folderPathsMap}
                            labelsMap={labelsMap}
                            onRenameFolder={onRenameFolder}
                            onRenameLabel={onRenameLabel}
                            updateEditModeMapping={updateEditModeMapping}
                            getParent={getParent}
                            editModeMap={editModeMap}
                            isSystemSubfolder={!!DestinationFolder || isSystemSubfolder}
                            isLabelMapping={isLabelMapping}
                            folders={folders}
                            labels={labels}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

export default ImportManageFoldersRow;
