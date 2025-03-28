import { type FC, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { ConfirmationPrompt } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import { useFileDownload } from '@proton/pass/hooks/files/useFileDownload';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { useMatchUser } from '@proton/pass/hooks/useMatchUser';
import { isShareWritable } from '@proton/pass/lib/shares/share.predicates';
import { fileUpdateMetadata } from '@proton/pass/store/actions';
import { selectShare } from '@proton/pass/store/selectors';
import type { BaseFileDescriptor, FileDescriptor, FileID, SelectedItem } from '@proton/pass/types';
import { download } from '@proton/pass/utils/dom/download';

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
    const upsell = useUpselling();

    const allowed = useMatchUser({ paid: true });
    const canRename = Boolean(props.canRename && allowed && share && isShareWritable(share));

    const handleRename = useCallback(async (descriptor: BaseFileDescriptor, fileName: string) => {
        if (descriptor.name === fileName) return;
        return dispatch(fileUpdateMetadata, { ...descriptor, name: fileName, shareId, itemId });
    }, []);

    const handleDelete = ({ fileID, name }: FileDescriptor) =>
        deleteFile.handler({ name, onSubmit: () => onDelete?.(fileID) });

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
                    onRename={canRename ? (fileName) => handleRename(file, fileName) : undefined}
                    onDownload={
                        allowed
                            ? () => handleDownload(file)
                            : () => upsell({ type: 'pass-plus', upsellRef: UpsellRef.FILE_ATTACHMENTS })
                    }
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
