import FileIcon from '@proton/components/components/fileIcon/FileIcon';
import type { FunctionComponent, ReactNode } from 'react';

import { c } from 'ttag';

import type { DriveDocument } from '../../../../types/documents';

interface Props {
    doc: DriveDocument;
    sizeText: string;
    contentSizeText?: string;
    trailing?: ReactNode;
    className?: string;
}

export const SearchInspectMeta: FunctionComponent<Props> = ({
    doc,
    sizeText,
    contentSizeText,
    trailing,
    className = '',
}) => {
    const subtitle = doc.folderPath || doc.folderId || '';

    return (
        <div className={`w-full flex items-start gap-3 ${className}`}>
            <FileIcon mimeType={doc.mimeType || 'application/octet-stream'} size={4} />
            <div className="flex flex-column gap-1 flex-1 min-w-0">
                <div className="text-semibold truncate">{doc.name}</div>
                {subtitle && (
                    <div className="text-sm color-weak truncate">
                        <strong>{c('Info').t`Folder:`}</strong> {subtitle}
                    </div>
                )}
                {doc.spaceId && (
                    <div className="text-sm color-weak">
                        <strong>{c('Info').t`Space:`}</strong> {doc.spaceId}
                    </div>
                )}
                <div className="text-sm color-weak">
                    <strong>{c('Info').t`MIME:`}</strong> {doc.mimeType || c('Info').t`Unknown`}
                </div>
                <div className="text-sm color-weak">
                    <strong>{c('Info').t`Size:`}</strong> {sizeText}
                </div>
                {contentSizeText && (
                    <div className="text-sm color-weak">
                        <strong>{c('Info').t`Indexed content:`}</strong> {contentSizeText}
                    </div>
                )}
                <div className="text-sm color-weak">
                    <strong>{c('Info').t`Modified:`}</strong>{' '}
                    {doc.modifiedTime ? new Date(doc.modifiedTime).toLocaleString() : '—'}
                </div>
                {trailing}
            </div>
        </div>
    );
};


