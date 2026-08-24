import type { FC } from 'react';

import { useFileDownload } from '../../hooks/files/useFileDownload';
import type { FileDescriptor } from '../../types';
import { FileAttachment } from '../FileAttachments/FileAttachment';
import { FileAttachmentsView } from '../FileAttachments/FileAttachmentsView';

type Props = { files: FileDescriptor[]; filesToken: string };

export const SecureLinkFilesList: FC<Props> = ({ files, filesToken }) => {
    const fileDownload = useFileDownload();

    return (
        files.length > 0 && (
            <FileAttachmentsView filesCount={files.length}>
                {files.map((file) => (
                    <FileAttachment
                        key={file.fileUID}
                        file={file}
                        onCancel={() => fileDownload.cancel(file.fileID)}
                        onDownload={() => fileDownload.start(file, { filesToken })}
                        loading={fileDownload.pending.has(file.fileID)}
                    />
                ))}
            </FileAttachmentsView>
        )
    );
};
