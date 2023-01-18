import { ChangeEvent, useEffect, useRef, useState } from 'react';

import { debounce } from 'lodash';
import { c } from 'ttag';

import { MailImportPayloadError } from '@proton/activation/interface';
import { Checkbox, Icon, InlineLinkButton, LabelStack } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { FOLDER_ICONS, FolderMapItem } from '../../CustomizeMailImportModal.interface';
import ManageFoldersRowFolderErrors from './ManageFoldersRowFolderErrors';
import ManageFolderRowInput from './ManageFoldersRowInput';
import ManageFoldersRowLabelErrors from './ManageFoldersRowLabelErrors';

const DIMMED_OPACITY_CLASSNAME = 'opacity-30';

interface WrapperProps {
    checked: boolean;
    editMode: boolean;
    disabled: boolean;
    checkboxId: string;
    children: React.ReactNode;
}

const Wrapper = ({ checked, editMode, disabled, checkboxId, children }: WrapperProps) => {
    const classNames = clsx([
        'flex flex-nowrap flex-align-items-center pt1 pb1',
        !checked && DIMMED_OPACITY_CLASSNAME,
        (disabled || editMode) && 'cursor-default',
    ]);

    return editMode ? (
        <div className={classNames}>{children}</div>
    ) : (
        <label htmlFor={checkboxId} className={classNames}>
            {children}
        </label>
    );
};

interface Props {
    index: number;
    folderItem: FolderMapItem;
    onRename: (index: number, Name: string) => void;
    onToggleCheck: (index: number, checked: boolean) => void;
    onErrorSaved: () => void;
}

const debouncedRenameCallback = debounce((callback) => callback(), 150);
const indentStyle = (level: number) => {
    return { '--margin-left-custom': `${level}em` };
};

const ManageFoldersRow = ({ index, folderItem, onRename, onToggleCheck, onErrorSaved }: Props) => {
    const hasError = folderItem.errors.length > 0;

    const inputRef = useRef<HTMLInputElement>(null);
    const folderProtonName = folderItem.systemFolder
        ? folderItem.systemFolder
        : folderItem.protonPath[folderItem.protonPath.length - 1];
    const folderProviderName = folderItem.providerPath[folderItem.providerPath.length - 1];
    const [inputValue, setInputValue] = useState(folderProtonName);

    const [editMode, setEditMode] = useState(hasError);

    const handleSave = () => {
        setEditMode(false);
        onErrorSaved();
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        const { value } = target;
        setInputValue(value);
        debouncedRenameCallback(() => onRename(index, value));
    };

    useEffect(() => {
        if (editMode && inputRef && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editMode]);

    return (
        <li className="border-bottom">
            <Wrapper
                checked={folderItem.checked}
                editMode={editMode}
                disabled={folderItem.disabled}
                checkboxId={folderItem.id}
            >
                <div className="flex w50 flex-nowrap flex-align-items-center flex-item-noshrink pr0-5">
                    <div
                        className="flex-item-noshrink ml-custom"
                        style={indentStyle(folderItem.providerPath.length)}
                        data-testid="CustomizeModal:sourceItem"
                    >
                        <Checkbox
                            onChange={({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
                                onToggleCheck(index, checked);
                            }}
                            id={folderItem.id}
                            checked={folderItem.checked}
                            disabled={folderItem.disabled}
                            data-testid="CustomizeModal:checkbox"
                        />
                    </div>
                    <div
                        data-testid="CustomizeModal:FolderRow:providerName"
                        className="ml0-5 flex-item-fluid-auto text-ellipsis"
                        title={folderProviderName}
                    >
                        {folderProviderName}
                    </div>
                </div>
                <div className="flex w50 pl0-5">
                    <div
                        className={clsx(['flex flex-nowrap flex-align-items-center ml-custom'])}
                        style={indentStyle(folderItem.protonPath.length)}
                        data-testid="CustomizeModal:destinationItem"
                    >
                        {!folderItem.isLabel && (
                            <Icon
                                name={folderItem.systemFolder ? FOLDER_ICONS[folderItem.systemFolder] : 'folder'}
                                className={clsx([
                                    'flex-item-noshrink mr0-5',
                                    hasError && 'color-danger',
                                    folderItem.errors.includes(MailImportPayloadError.MERGE_WARNING) && 'color-warning',
                                ])}
                            />
                        )}
                    </div>
                    <div
                        data-testid="CustomizeModal:FolderRow:protonName"
                        className={clsx([
                            'flex flex-nowrap flex-item-fluid flex-align-items-center',
                            hasError && 'color-danger',
                            folderItem.errors.includes(MailImportPayloadError.MERGE_WARNING) && 'color-warning',
                        ])}
                    >
                        {editMode && !folderItem.disabled ? (
                            <ManageFolderRowInput
                                disabled={!folderItem.checked}
                                errors={folderItem.errors}
                                handleChange={handleChange}
                                handleSave={handleSave}
                                hasError={hasError}
                                inputRef={inputRef}
                                inputValue={inputValue}
                                isLabelMapping={folderItem.isLabel}
                            />
                        ) : (
                            <>
                                {folderItem.isLabel && !folderItem.systemFolder ? (
                                    <div
                                        className={clsx([
                                            'flex-item-fluid-auto text-ellipsis flex flex-align-items-center',
                                            (hasError ||
                                                folderItem.errors.includes(MailImportPayloadError.MERGE_WARNING)) &&
                                                'text-bold',
                                        ])}
                                        title={folderProtonName}
                                    >
                                        <LabelStack
                                            labels={[
                                                {
                                                    name: folderProtonName,
                                                    color: folderItem.color,
                                                    title: folderProtonName,
                                                },
                                            ]}
                                            className="max-w100 flex-item-fluid"
                                        />

                                        <ManageFoldersRowLabelErrors
                                            checked={folderItem.checked}
                                            errors={folderItem.errors}
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className={clsx([
                                            'text-ellipsis flex flex-align-items-center',
                                            (hasError ||
                                                folderItem.errors.includes(MailImportPayloadError.MERGE_WARNING)) &&
                                                'text-bold',
                                        ])}
                                        title={folderProtonName}
                                    >
                                        <div className="flex-item-fluid text-ellipsis" title={folderProtonName}>
                                            {folderProtonName}
                                        </div>

                                        <ManageFoldersRowFolderErrors
                                            checked={folderItem.checked}
                                            errors={folderItem.errors}
                                            isSystemFolderChild={folderItem.isSystemFolderChild}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    {((editMode && !folderItem.disabled) || hasError) && (
                        <InlineLinkButton
                            onClick={handleSave}
                            className={clsx(['ml0-5 p0-5', hasError && DIMMED_OPACITY_CLASSNAME])}
                            aria-disabled={hasError}
                            disabled={hasError || !folderItem.checked}
                            data-testid="CustomizeModal:rowSave"
                        >
                            {c('Action').t`Save`}
                        </InlineLinkButton>
                    )}
                </div>
            </Wrapper>
        </li>
    );
};

export default ManageFoldersRow;
