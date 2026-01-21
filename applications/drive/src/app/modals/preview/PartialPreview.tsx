import { useEffect } from 'react';

import { FilePreviewContent } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useFlagsDriveSheet } from '../../flags/useFlagsDriveSheet';
import type { ContentPreviewMethod } from './content';
import type { Drive } from './interface';
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
 * PartialPreview component is intended to be used in those cases:
 * - You don't want the Header with all actions (Details, Download, etc...)
 * - You don't want the component to take the whole screen
 * For exemple in PublicFileView we need the preview but we want to handle all actions,
 * as well as adding custom header.
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
                isMetaLoading={preview.isLoading}
                isLoading={preview.isContentLoading}
                mimeType={preview.node.mediaType}
                error={preview.errorMessage}
                imgThumbnailUrl={preview.content.thumbnailUrl}
                fileSize={preview.node.displaySize}
                fileName={preview.node.name}
                videoStreaming={preview.content.videoStreaming}
                isPublic={true}
                sheetsEnabled={sheetsEnabled}
                onOpenInDocs={preview.actions.openInDocs}
                contents={preview.content.data}
                onDownload={onDownload}
            />
        </div>
    );
}
