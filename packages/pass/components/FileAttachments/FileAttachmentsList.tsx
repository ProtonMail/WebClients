import { type FC } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { ConfirmationPrompt } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { useFileDownload } from '@proton/pass/hooks/files/useFileDownload';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { fileUpdateMetadata } from '@proton/pass/store/actions';
import type { BaseFileDescriptor, FileDescriptor, FileID, SelectedItem } from '@proton/pass/types';
import { download } from '@proton/pass/utils/dom/download';

import { FileAttachment } from './FileAttachment';

type Props = SelectedItem & { files: FileDescriptor[]; onDelete?: (fileID: FileID) => void };

export const FileAttachmentsList: FC<Props> = ({ shareId, itemId, files, onDelete }) => {
    const dispatch = useDispatch();
    const deleteFile = useAsyncModalHandles<void, { name: string }>({ getInitialModalState: () => ({ name: '' }) });
    const fileDownload = useFileDownload();

    const onRename = (descriptor: BaseFileDescriptor, fileName: string) => {
        if (descriptor.name === fileName) return;
        dispatch(fileUpdateMetadata.intent({ ...descriptor, name: fileName, shareId, itemId }));
    };

    const handleDelete = ({ fileID, name }: FileDescriptor) =>
        deleteFile.handler({
            name,
            onSubmit: () => onDelete?.(fileID),
        });

    const handleDownload = async (file: FileDescriptor) => {
        const fileBlob = await fileDownload.start(file, { shareId, itemId });
        if (fileBlob) download(fileBlob, file.name);
    };

    return (
        <>
            {files.map((file, key) => (
                <FileAttachment
                    key={`file-${key}`}
                    file={file}
                    onDelete={onDelete ? () => handleDelete(file) : undefined}
                    onCancel={() => fileDownload.cancel(file.fileID)}
                    onRename={(fileName) => onRename(file, fileName)}
                    onDownload={() => handleDownload(file)}
                    loading={fileDownload.pending.has(file.fileID)}
                />
            ))}

            {deleteFile.state.open && (
                <ConfirmationPrompt
                    onCancel={deleteFile.abort}
                    onConfirm={deleteFile.resolver}
                    title={c('Action').t`Delete file: ${deleteFile.state.name}`}
                    message={c('Info').t`Once deleted, this file can still be recovered from the item's history.`}
                />
            )}
        </>
    );
};
