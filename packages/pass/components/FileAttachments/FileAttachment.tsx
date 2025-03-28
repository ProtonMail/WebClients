import { type FC, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { InputFieldTwo } from '@proton/components/index';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { ClickableDiv } from '@proton/pass/components/Layout/Button/ClickableDiv';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { useMatchUser } from '@proton/pass/hooks/useMatchUser';
import { reconcileFilename } from '@proton/pass/lib/file-attachments/helpers';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { FileAttachmentIcon } from './FileAttachmentIcon';

export type FileOrDescriptor = {
    name: string;
    size: number;
    mimeType?: string;
    type?: string;
};

type Props = {
    file: FileOrDescriptor;
    onDelete?: () => void;
    onRename?: (fileName: string) => void;
    onCancel?: () => void;
    onDownload?: () => void;
    onRestore?: () => void;
    loading?: boolean;
    disabled?: boolean;
};

export const FileAttachment: FC<Props> = ({
    disabled,
    file,
    loading,
    onCancel,
    onDelete,
    onDownload,
    onRename,
    onRestore,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const fileRenameModal = useAsyncModalHandles<string, unknown>({ getInitialModalState: () => ({}) });
    const [renamedFile, setRenamedFile] = useState(file.name);
    const [fileName, extension] = useMemo(() => splitExtension(renamedFile), [renamedFile]);
    const fileAttachmentsDisabled = useMatchUser({ paid: false, planDisplayName: ['Pass Essentials'] });
    const online = useConnectivity();

    const noActions = [onDelete, onDownload, onRename, onRestore].every((action) => action === undefined);
    const actionsDisabled = disabled || !online || noActions;
    const canDownload = !loading && !fileRenameModal.state.open && online;
    const canRename = onRename && !loading && !fileAttachmentsDisabled && !fileRenameModal.state.open && online;

    const enableRenaming = () =>
        fileRenameModal.handler({
            onSubmit: (changedFileName) => {
                if (!onRename) return;
                const conciliatedFileName = reconcileFilename(changedFileName, file.name);
                setRenamedFile(conciliatedFileName);
                onRename(conciliatedFileName);
            },
            onAbort: () => setRenamedFile(file.name),
        });

    useEffect(() => {
        if (fileRenameModal.state.open) {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(0, fileName.length);
        }
    }, [fileRenameModal.state.open]);

    return (
        <div className="flex justify-space-between items-center p-4 pt-0 gap-4">
            <ClickableDiv
                className={clsx('shrink-0', canDownload && 'cursor-pointer')}
                onClick={canDownload ? onDownload : noop}
            >
                {({ hovering }) =>
                    hovering ? (
                        <Icon name="arrow-down" alt={c('Action').t`Download file`} className="m-auto" />
                    ) : (
                        <FileAttachmentIcon mimeType={file?.mimeType ?? file?.type ?? ''} />
                    )
                }
            </ClickableDiv>
            <ClickableDiv className="flex-1 flex-column text-left" onDoubleClick={canRename ? enableRenaming : noop}>
                <InputFieldTwo
                    ref={inputRef}
                    inputClassName="p-0 rounded-none"
                    value={fileRenameModal.state.open ? renamedFile : fileName}
                    onChange={({ target: { value } }) => setRenamedFile(value)}
                    onBlur={() => fileRenameModal.resolver(renamedFile)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            fileRenameModal.resolver(renamedFile);
                        }
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            fileRenameModal.abort();
                        }
                    }}
                    unstyled
                    dense
                    autoFocus
                    readOnly={!fileRenameModal.state.open}
                />
                <div className="text-sm color-weak">{`${extension.toUpperCase()} - ${humanSize({ bytes: file.size })}`}</div>
            </ClickableDiv>
            <div className="shrink-0">
                {loading ? (
                    <div className="flex items-center gap-1">
                        <CircleLoader size="small" />
                        {onCancel && (
                            <Button
                                icon
                                pill
                                shape="ghost"
                                color="norm"
                                onClick={onCancel}
                                size="small"
                                title={c('Action').t`Cancel`}
                            >
                                <Icon name="cross" alt={c('Action').t`Cancel`} size={3} />
                            </Button>
                        )}
                    </div>
                ) : (
                    !actionsDisabled && (
                        <QuickActionsDropdown
                            disabled={loading}
                            iconSize={4}
                            originalPlacement="bottom-end"
                            pill
                            color="norm"
                            shape="ghost"
                            size="small"
                        >
                            {onRename && !fileAttachmentsDisabled && (
                                <DropdownMenuButton
                                    onClick={enableRenaming}
                                    label={c('Action').t`Rename`}
                                    icon="pencil"
                                />
                            )}
                            {onDownload && (
                                <DropdownMenuButton
                                    onClick={onDownload}
                                    label={c('Action').t`Download`}
                                    icon="arrow-down"
                                />
                            )}
                            {onRestore && (
                                <DropdownMenuButton
                                    onClick={onRestore}
                                    label={c('Action').t`Restore`}
                                    icon="clock-rotate-left"
                                />
                            )}
                            {onDelete && !fileAttachmentsDisabled && (
                                <DropdownMenuButton
                                    onClick={onDelete}
                                    label={c('Action').t`Delete`}
                                    icon="trash"
                                    danger
                                />
                            )}
                        </QuickActionsDropdown>
                    )
                )}
            </div>
        </div>
    );
};
