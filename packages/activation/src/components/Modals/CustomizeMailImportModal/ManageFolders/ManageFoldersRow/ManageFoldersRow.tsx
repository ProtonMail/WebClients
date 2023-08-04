import { ChangeEvent, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { MailImportPayloadError } from '@proton/activation/src/interface';
import { Checkbox, Icon, InlineLinkButton, LabelStack } from '@proton/components';
import clsx from '@proton/utils/clsx';
import debounce from '@proton/utils/debounce';

import { FOLDER_ICONS, FolderMapItem } from '../../CustomizeMailImportModal.interface';
import ManageFoldersRowFolderErrors from './ManageFoldersRowFolderErrors';
import ManageFolderRowInput from './ManageFoldersRowInput';
import ManageFoldersRowLabelErrors from './ManageFoldersRowLabelErrors';

const DIMMED_OPACITY_CLASSNAMES = 'opacity-30';

interface WrapperProps {
    checked: boolean;
    editMode: boolean;
    disabled: boolean;
    checkboxId: string;
    children: React.ReactNode;
}

const Wrapper = ({ checked, editMode, disabled, checkboxId, children }: WrapperProps) => {
    const classNames = clsx([
        'flex flex-nowrap flex-align-items-center py-4',
        !checked && DIMMED_OPACITY_CLASSNAMES,
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
    return { '--ml-custom': `${level}em` };
};

const ManageFoldersRow = ({ index, folderItem, onRename, onToggleCheck, onErrorSaved }: Props) => {
    const { disabled, checked, errors, systemFolder, protonPath, providerPath, isLabel } = folderItem;
    const hasError = errors.length > 0 && checked;

    const inputRef = useRef<HTMLInputElement>(null);
    const folderProtonName = systemFolder ? systemFolder : protonPath[protonPath.length - 1];
    const folderProviderName = providerPath[providerPath.length - 1];
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
            <Wrapper checked={checked} editMode={editMode} disabled={disabled} checkboxId={folderItem.id}>
                <div className="flex w50 flex-nowrap flex-align-items-center flex-item-noshrink pr-2">
                    <div
                        className="flex-item-noshrink ml-custom"
                        style={indentStyle(providerPath.length)}
                        data-testid="CustomizeModal:sourceItem"
                    >
                        <Checkbox
                            onChange={({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
                                onToggleCheck(index, checked);
                            }}
                            id={folderItem.id}
                            checked={checked}
                            disabled={disabled}
                            data-testid="CustomizeModal:checkbox"
                        />
                    </div>
                    <div
                        data-testid="CustomizeModal:FolderRow:providerName"
                        className="ml-2 flex-item-fluid-auto text-ellipsis"
                        title={folderProviderName}
                    >
                        {folderProviderName}
                    </div>
                </div>
                <div className="flex w50 pl-2">
                    <div
                        className={clsx(['flex flex-nowrap flex-align-items-center ml-custom'])}
                        style={indentStyle(protonPath.length)}
                        data-testid="CustomizeModal:destinationItem"
                    >
                        {((isLabel && systemFolder) || !isLabel) && (
                            <Icon
                                name={systemFolder ? FOLDER_ICONS[systemFolder] : 'folder'}
                                className={clsx([
                                    'flex-item-noshrink mr-2',
                                    hasError && 'color-danger',
                                    errors.includes(MailImportPayloadError.MERGE_WARNING) && 'color-warning',
                                ])}
                            />
                        )}
                    </div>
                    <div
                        data-testid="CustomizeModal:FolderRow:protonName"
                        className={clsx([
                            'flex flex-nowrap flex-item-fluid flex-align-items-center',
                            hasError && 'color-danger',
                            errors.includes(MailImportPayloadError.MERGE_WARNING) && 'color-warning',
                        ])}
                    >
                        {editMode && !disabled && checked ? (
                            <ManageFolderRowInput
                                disabled={!checked}
                                errors={errors}
                                handleChange={handleChange}
                                handleSave={handleSave}
                                hasError={hasError}
                                inputRef={inputRef}
                                inputValue={inputValue}
                                isLabelMapping={isLabel}
                            />
                        ) : (
                            <>
                                {isLabel && !systemFolder ? (
                                    <div
                                        className={clsx([
                                            'flex-item-fluid-auto text-ellipsis flex flex-align-items-center',
                                            (hasError || errors.includes(MailImportPayloadError.MERGE_WARNING)) &&
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

                                        <ManageFoldersRowLabelErrors checked={checked} errors={errors} />
                                    </div>
                                ) : (
                                    <div
                                        className={clsx([
                                            'text-ellipsis flex flex-align-items-center',
                                            (hasError || errors.includes(MailImportPayloadError.MERGE_WARNING)) &&
                                                'text-bold',
                                        ])}
                                        title={folderProtonName}
                                    >
                                        <div className="flex-item-fluid text-ellipsis" title={folderProtonName}>
                                            {folderProtonName}
                                        </div>

                                        <ManageFoldersRowFolderErrors
                                            checked={checked}
                                            errors={errors}
                                            isSystemFolderChild={folderItem.isSystemFolderChild}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    {checked && ((editMode && !disabled) || hasError) && (
                        <InlineLinkButton
                            onClick={handleSave}
                            className={clsx(['ml-2 p-2', hasError && DIMMED_OPACITY_CLASSNAMES])}
                            aria-disabled={hasError}
                            disabled={hasError || !checked}
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
