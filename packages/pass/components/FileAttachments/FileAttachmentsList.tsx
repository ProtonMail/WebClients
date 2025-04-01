import { type FC, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { ConfirmationPrompt } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { useFileDownload } from '@proton/pass/hooks/files/useFileDownload';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { useMatchUser } from '@proton/pass/hooks/useMatchUser';
import { isShareWritable } from '@proton/pass/lib/shares/share.predicates';
import { fileUpdateMetadata } from '@proton/pass/store/actions';
import { selectShare } from '@proton/pass/store/selectors';
import type { BaseFileDescriptor, FileDescriptor, FileID, SelectedItem } from '@proton/pass/types';

import { FileAttachment } from './FileAttachment';

type Props = SelectedItem & {
    canRename?: boolean;
    files: FileDescriptor[];
    onDelete?: (fileID: FileID) => void;
};

const getInitialModalState = () => ({ name: '' });

export const FileAttachmentsList: FC<Props> = (props) => {
    const { shareId, itemId, files, onDelete } = props;

    const dispatch = useAsyncRequestDispatch();
    const fileDownload = useFileDownload();
    const deleteFile = useAsyncModalHandles<void, { name: string }>({ getInitialModalState });

    const share = useSelector(selectShare(shareId));

    const allowed = useMatchUser({ paid: true });
    const canRename = Boolean(props.canRename && allowed && share && isShareWritable(share));

    const handleRename = useCallback(async (descriptor: BaseFileDescriptor, fileName: string) => {
        if (descriptor.name === fileName) return;
        return dispatch(fileUpdateMetadata, { ...descriptor, name: fileName, shareId, itemId });
    }, []);

    const handleDelete = ({ fileID, name }: FileDescriptor) =>
        deleteFile.handler({ name, onSubmit: () => onDelete?.(fileID) });

    return (
        <>
            {files.map((file, key) => (
                <FileAttachment
                    key={`file-${key}`}
                    file={file}
                    onDelete={onDelete ? () => handleDelete(file) : undefined}
                    onCancel={() => fileDownload.cancel(file.fileID)}
                    onRename={canRename ? (fileName) => handleRename(file, fileName) : undefined}
                    onDownload={() => fileDownload.start(file, { shareId, itemId })}
                    loading={fileDownload.pending.has(file.fileID)}
                />
            ))}

            {deleteFile.state.open && (
                <ConfirmationPrompt
                    danger
                    onCancel={deleteFile.abort}
                    onConfirm={deleteFile.resolver}
                    title={c('Action').t`Delete ${deleteFile.state.name}`}
                    message={c('Info').t`Once deleted, this file can still be recovered from the item's history.`}
                    confirmText={c('Action').t`Delete`}
                />
            )}
        </>
    );
};
