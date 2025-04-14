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
import { getFileParts, sanitizeFileName } from '@proton/pass/lib/file-attachments/helpers';
import type { fileUpdateMetadata } from '@proton/pass/store/actions';
import type { RequestFlowAsyncResult } from '@proton/pass/store/request/types';
import type { Maybe } from '@proton/pass/types';
import { not } from '@proton/pass/utils/fp/predicates';
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
    onRename?: (fileName: string) => Promise<Maybe<RequestFlowAsyncResult<typeof fileUpdateMetadata>>>;
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
    const [filename, setFilename] = useState(file.name);
    const { base, ext } = useMemo(() => getFileParts(filename), [filename]);

    const fileAttachmentsDisabled = useMatchUser({ paid: false, planDisplayName: ['Pass Essentials'] });
    const online = useConnectivity();

    const fileRename = useAsyncModalHandles<string, unknown>({ getInitialModalState: () => ({}) });

    const noActions = [onDelete, onDownload, onRename, onRestore].every(not(Boolean));
    const actionsDisabled = disabled || !online || noActions;
    const canDownload = onDownload && !loading && !fileRename.state.open && online;
    const canRename = onRename && !loading && !fileAttachmentsDisabled && !fileRename.state.open && online;

    const enableRenaming = () =>
        fileRename.handler({
            onSubmit: async (changedFileName) => {
                if (!onRename) return;

                const sanitized = sanitizeFileName(changedFileName);
                setFilename(sanitized);

                const res = await onRename(sanitized);
                if (res?.type !== 'success') setFilename(file.name);
            },
            onAbort: () => setFilename(file.name),
        });

    useEffect(() => {
        if (fileRename.state.open) {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(0, base.length);
        }
    }, [fileRename.state.open]);

    return (
        <div className="flex justify-space-between items-center p-4 pt-0 gap-4">
            <ClickableDiv
                className={clsx('shrink-0 hover:control', canDownload ? 'cursor-pointer' : 'pointer-events-none')}
                onClick={canDownload ? onDownload : noop}
                onDoubleClick={canDownload ? onDownload : noop}
            >
                <Icon
                    name="arrow-down"
                    alt={c('Pass_file_attachments').t`Download file`}
                    className="hover:show m-auto"
                />
                <FileAttachmentIcon mimeType={file?.mimeType ?? file?.type ?? ''} className="hover:hide" />
            </ClickableDiv>
            <div className="flex-1 flex-column text-left">
                <ClickableDiv
                    className={clsx(canDownload && 'cursor-pointer')}
                    onDoubleClick={canRename ? enableRenaming : noop}
                >
                    <InputFieldTwo
                        ref={inputRef}
                        inputClassName={clsx(
                            'p-0 rounded-none',
                            !fileRename.state.open && 'text-ellipsis pointer-events-none'
                        )}
                        value={fileRename.state.open ? filename : base || file.name}
                        onChange={({ target: { value } }) => setFilename(value)}
                        onBlur={() => fileRename.resolver(filename)}
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                fileRename.resolver(filename);
                            }
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                fileRename.abort();
                            }
                        }}
                        unstyled
                        dense
                        readOnly={!fileRename.state.open}
                    />
                </ClickableDiv>
                <div className="text-sm color-weak flex max-w-full flex-nowrap gap-1">
                    {ext && <span className="text-ellipsis">{`${ext.toUpperCase()} - `}</span>}
                    <span className="shrink-0">{humanSize({ bytes: file.size })}</span>
                </div>
            </div>

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
                                    label={c('Pass_file_attachments').t`Rename`}
                                    icon="pencil"
                                />
                            )}
                            {onDownload && (
                                <DropdownMenuButton
                                    onClick={onDownload}
                                    label={c('Pass_file_attachments').t`Download`}
                                    icon="arrow-down"
                                />
                            )}
                            {onRestore && (
                                <DropdownMenuButton
                                    onClick={onRestore}
                                    label={c('Pass_file_attachments').t`Restore`}
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
