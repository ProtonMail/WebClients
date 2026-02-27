import { useEffect } from 'react';

import { FilePreviewContent } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useFlagsDriveSheet } from '../../flags/useFlagsDriveSheet';
import type { ContentPreviewMethod } from './content';
import type { Drive } from './interface';
import { SignatureInformation } from './signatures';
import { usePreviewState } from './usePreviewState';

export interface PartialPreviewProps {
    drive: Drive;
    nodeUid: string;
    verifySignatures?: boolean;
    onContentLoaded?: (data: Uint8Array<ArrayBuffer>[], previewMethod?: ContentPreviewMethod) => void;
    onDownload?: () => void;
    className?: string;
}

/**
 * PartialPreview component is intended to be used only in public page.
 * It doesn't include the header with all actions (Details, Download, etc...)
 * and it doesn't take the whole screen.
 */
export function PartialPreview({
    drive,
    nodeUid,
    verifySignatures = true,
    onContentLoaded,
    onDownload,
    className,
}: PartialPreviewProps) {
    const preview = usePreviewState({
        drive,
        nodeUid,
        verifySignatures,
    });

    const sheetsEnabled = useFlagsDriveSheet();

    useEffect(() => {
        if (onContentLoaded && preview.content.data) {
            onContentLoaded(preview.content.data, preview.content.previewMethod);
        }
    }, [preview.content.data, onContentLoaded, preview.content.previewMethod]);

    return (
        <div className={clsx('flex flex-column flex-nowrap', className)}>
            <FilePreviewContent
                isPublic={true}
                isMetaLoading={preview.isLoading}
                isLoading={preview.isContentLoading}
                error={preview.errorMessage}
                contents={preview.content.data}
                fileName={preview.node.name}
                mimeType={preview.node.mediaType}
                fileSize={preview.node.displaySize}
                onDownload={onDownload}
                videoStreaming={preview.content.videoStreaming}
                onOpenInDocs={preview.actions.openInDocs}
                imgThumbnailUrl={preview.content.thumbnailUrl}
                signatureConfirmation={
                    preview.node.contentSignatureIssueLabel && (
                        <SignatureInformation contentSignatureIssue={preview.node.contentSignatureIssueLabel} />
                    )
                }
                sheetsEnabled={sheetsEnabled}
            />
        </div>
    );
}
