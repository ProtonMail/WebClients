import { type FC } from 'react';

import { FileAttachment } from '@proton/pass/components/FileAttachments/FileAttachment';
import { FileAttachmentsView } from '@proton/pass/components/FileAttachments/FileAttachmentsView';
import { useFileDownload } from '@proton/pass/hooks/files/useFileDownload';
import type { FileDescriptor } from '@proton/pass/types';
import { download } from '@proton/pass/utils/dom/download';

type Props = { files: FileDescriptor[]; filesToken: string };

export const SecureLinkFilesList: FC<Props> = ({ files, filesToken }) => {
    const fileDownload = useFileDownload();

    const handleDownload = async (file: FileDescriptor) => {
        const fileBlob = await fileDownload.start(file, { filesToken });
        if (fileBlob) download(fileBlob, file.name);
    };

    return (
        files.length > 0 && (
            <FileAttachmentsView filesCount={files.length}>
                {files.map((file, key) => (
                    <FileAttachment
                        key={`file-${key}`}
                        file={file}
                        onCancel={() => fileDownload.cancel(file.fileID)}
                        onDownload={() => handleDownload(file)}
                        loading={fileDownload.pending.has(file.fileID)}
                    />
                ))}
            </FileAttachmentsView>
        )
    );
};
