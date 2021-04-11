import React, { ChangeEvent, useState, useRef, useEffect, useMemo } from 'react';
import { c } from 'ttag';

import { classnames } from '../../../../helpers';
import { Tooltip, Icon, Checkbox, InlineLinkButton, Input } from '../../../../components';

import {
    DestinationFolder,
    CheckedFoldersMap,
    DisabledFoldersMap,
    FolderRelationshipsMap,
    MailImportFolder,
    FolderNamesMap,
    FolderPathsMap,
    EditModeMap,
} from '../interfaces';

import { escapeSlashes, unescapeSlashes, splitEscaped } from '../helpers';

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

const ERRORS = {
    nameTooLongError: c('Error').t`The folder name is too long. Please choose a different name.`,
    emptyValueError: c('Error').t`Folder name cannot be empty`,
};

const WARNINGS = {
    mergeWarning: c('Warning')
        .t`Proton will merge all folders with the same name. To avoid this, change the names before import.`,
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
    onRename: (source: string, newName: string) => void;
    onToggleCheck: (source: string, checked: boolean) => void;
    folder: MailImportFolder;
    level: number;
    checkedFoldersMap: CheckedFoldersMap;
    disabledFoldersMap: DisabledFoldersMap;
    folderRelationshipsMap: FolderRelationshipsMap;
    providerFolders: MailImportFolder[];
    folderNamesMap: FolderNamesMap;
    folderPathsMap: FolderPathsMap;
    editModeMap: EditModeMap;
    updateEditModeMapping: (key: string, editMode: boolean) => void;
    getParent: (folderName: string) => string | undefined;
    isSystemSubfolder?: boolean;
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
    onRename,
    updateEditModeMapping,
    getParent,
    editModeMap,
    isSystemSubfolder = false,
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

    const destinationName = folderNamesMap[Source];

    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(unescapeSlashes(destinationName));
    const initialValue = useRef<string>(inputValue);

    const emptyValueError = useMemo(() => !inputValue || !inputValue.trim(), [inputValue]);

    const nameTooLongError = useMemo(() => {
        if (!checked) {
            return false;
        }
        return escapeSlashes(inputValue).length >= 100;
    }, [inputValue, checked]);

    const mergeWarning = useMemo(() => {
        if (!checked) {
            return false;
        }

        const newPath = folderPathsMap[folder.Source];

        return Object.entries(folderPathsMap).some(([source, path]) => {
            return source !== Source && path === newPath && checkedFoldersMap[source];
        });
    }, [inputValue, checked, folderNamesMap, folderPathsMap, checkedFoldersMap]);

    const hasError = emptyValueError || nameTooLongError;

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
        onRename(Source, value);
    };

    const handleCancel = (e: React.MouseEvent) => {
        preventDefaultAndStopPropagation(e);
        setEditMode(false);
        onRename(Source, initialValue.current);
        setInputValue(initialValue.current);
    };

    const renderInput = () => {
        let error;
        let item;

        if (nameTooLongError) {
            error = ERRORS.nameTooLongError;
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
                    if (emptyValueError || nameTooLongError) {
                        return;
                    }
                    handleSave(e);
                }}
                icon={item}
                error={error}
                errorZoneClassName="hidden"
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
        if (disabled) {
            setEditMode(false);
            setInputValue(initialValue.current);
        }
    }, [disabled]);

    useEffect(() => {
        if (editMode && inputRef && inputRef.current) {
            inputRef.current.focus();
        }
        updateEditModeMapping(Source, editMode);
    }, [editMode]);

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
                    <div className="flex w40 flex-nowrap flex-align-items-center flex-item-noshrink pr1">
                        <div className="flex-item-noshrink" style={DestinationFolder ? undefined : sourceIndentStyles}>
                            <Checkbox
                                onChange={({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
                                    if (!checked && editMode) {
                                        setEditMode(false);
                                    }
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

                    <div className="flex w40 pr1">
                        <div
                            className="flex flex-nowrap flex-align-items-center flex-item-fluid-auto"
                            style={DestinationFolder ? undefined : destinationIndentStyles}
                        >
                            <Icon
                                name={DestinationFolder ? FOLDER_ICONS[DestinationFolder] : 'folder'}
                                className={classnames([
                                    'flex-item-noshrink',
                                    hasError && 'color-danger',
                                    mergeWarning && 'color-warning',
                                ])}
                            />
                            <div
                                className={classnames([
                                    'ml0-5 w100 flex flex-nowrap',
                                    hasError && 'color-danger',
                                    mergeWarning && 'color-warning',
                                ])}
                            >
                                {editMode && !disabled ? (
                                    renderInput()
                                ) : (
                                    <>
                                        <span
                                            className={classnames([
                                                'flex-item-fluid-auto text-ellipsis',
                                                (nameTooLongError || mergeWarning) && 'text-bold',
                                            ])}
                                            title={unescapeSlashes(destinationName)}
                                        >
                                            {unescapeSlashes(destinationName)}
                                        </span>
                                        {nameTooLongError && (
                                            <Tooltip title={ERRORS.nameTooLongError} type="error">
                                                <Icon
                                                    tabIndex={-1}
                                                    name="info"
                                                    className="flex-item-noshrink color-danger inline-flex flex-align-self-center flex-item-noshrink"
                                                />
                                            </Tooltip>
                                        )}
                                        {mergeWarning && (
                                            <Tooltip title={WARNINGS.mergeWarning} type="warning">
                                                <Icon
                                                    tabIndex={-1}
                                                    name="info"
                                                    className="flex-item-noshrink color-warning inline-flex flex-align-self-center flex-item-noshrink"
                                                />
                                            </Tooltip>
                                        )}
                                        {isSystemSubfolder && !mergeWarning && (
                                            <Tooltip
                                                title={c('Tooltip')
                                                    .t`System subfolders will show up as separate folders in ProtonMail`}
                                            >
                                                <Icon
                                                    tabIndex={-1}
                                                    name="info"
                                                    className="flex-item-noshrink inline-flex flex-align-self-center flex-item-noshrink"
                                                />
                                            </Tooltip>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {!DestinationFolder && (
                        <div
                            className="flex w20 flex-align-items-center"
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
                                        className={classnames(['p0-5', hasError && DIMMED_OPACITY_CLASSNAME])}
                                        aria-disabled={hasError}
                                        disabled={hasError}
                                    >
                                        {c('Action').t`Save`}
                                    </InlineLinkButton>
                                    <InlineLinkButton onClick={handleCancel} className="ml0-5 p0-5">
                                        {c('Action').t`Cancel`}
                                    </InlineLinkButton>
                                </>
                            ) : (
                                <InlineLinkButton
                                    aria-disabled={!checked}
                                    disabled={!checked}
                                    tabIndex={disabled ? -1 : 0}
                                    onClick={toggleEditMode}
                                    className="p0-5"
                                >
                                    {c('Action').t`Rename`}
                                </InlineLinkButton>
                            )}
                        </div>
                    )}
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
                            onRename={onRename}
                            updateEditModeMapping={updateEditModeMapping}
                            getParent={getParent}
                            editModeMap={editModeMap}
                            isSystemSubfolder={!!DestinationFolder || isSystemSubfolder}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

export default ImportManageFoldersRow;
