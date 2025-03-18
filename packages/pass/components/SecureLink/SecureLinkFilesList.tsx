import { type FC } from 'react';

import { FileAttachment } from '@proton/pass/components/FileAttachments/FileAttachment';
import { FileAttachmentsView } from '@proton/pass/components/FileAttachments/FileAttachmentsView';
import { useFileDownload } from '@proton/pass/hooks/files/useFileDownload';
import type { FileDescriptor } from '@proton/pass/types';
import { download } from '@proton/pass/utils/dom/download';

type Props = { files: FileDescriptor[]; filesToken: string };

export const SecureLinkFilesList: FC<Props> = ({ files, filesToken }) => {
    const { downloadFile, cancelDownload, filesDownloading } = useFileDownload();

    const handleDownload = async (file: FileDescriptor) => {
        const fileBlob = await downloadFile(file, { filesToken });
        if (fileBlob) download(fileBlob);
    };

    return (
        files.length > 0 && (
            <FileAttachmentsView filesCount={files.length}>
                {files.map((file, key) => (
                    <FileAttachment
                        key={`file-${key}`}
                        file={file}
                        onCancel={() => cancelDownload(file.fileID)}
                        onDownload={() => handleDownload(file)}
                        loading={filesDownloading.includes(file.fileID)}
                    />
                ))}
            </FileAttachmentsView>
        )
    );
};
