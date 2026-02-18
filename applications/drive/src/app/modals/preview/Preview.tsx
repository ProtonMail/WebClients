import { useRef } from 'react';

import { FilePreview, NavigationControl } from '@proton/components';
import { getDrive } from '@proton/drive/index';

import { useFlagsDriveSheet } from '../../flags/useFlagsDriveSheet';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useSharingModal } from '../SharingModal/SharingModal';
import type { Drive } from './interface';
import { SignatureInformation, SignatureStatus } from './signatures';
import { usePreviewState } from './usePreviewState';

export interface PreviewProps {
    nodeUid: string;
    // Entire list of previewable images in the current view
    previewableNodeUids?: string[];
    drive?: Drive;
    onNodeChange?: (nodeUid: string) => void;
    verifySignatures?: boolean;
    onClose: () => void;

    /**
     * @deprecated It is to connect preview to the legacy Drive photo section.
     * Once the Photos SDK is fully ready, we will remove this and use SDK directly.
     */
    photos?: PhotosProps;
}

type PhotosProps = {
    date?: number;
    isFavorite?: boolean;
    onFavorite?: () => void;
    onSelectCover?: () => void;
    isForPhotos?: boolean;
};

export function Preview({
    drive = getDrive(),
    nodeUid,
    previewableNodeUids,
    onNodeChange,
    verifySignatures = true,
    onClose,
    photos,
}: PreviewProps) {
    const preview = usePreviewState({
        drive,
        nodeUid,
        previewableNodeUids,
        onNodeChange,
        verifySignatures,
    });

    // Ensure Photos version of the preview is used in the photo section.
    // Handle automatically once Photos SDK is used directly.
    if (photos) {
        photos.isForPhotos = true;
    }

    const { detailsModal, showDetailsModal } = useDetailsModal();

    const sheetsEnabled = useFlagsDriveSheet();

    const { sharingModal, showSharingModal } = useSharingModal();

    const rootRef = useRef<HTMLDivElement>(null);

    const onDetails = () => {
        showDetailsModal({ nodeUid, drive, verifySignatures });
    };
    const onShare = preview.canShare ? () => showSharingModal({ nodeUid }) : undefined;

    return (
        <>
            <FilePreview
                ref={rootRef}
                isMetaLoading={preview.isLoading}
                isLoading={preview.isContentLoading}
                error={preview.errorMessage}
                contents={preview.content.data}
                fileName={preview.node.name}
                mimeType={preview.node.mediaType}
                sharedStatus={preview.node.sharedStatus}
                fileSize={preview.node.displaySize}
                onClose={onClose}
                onDownload={preview.actions.downloadFile}
                videoStreaming={preview.content.videoStreaming}
                onSave={preview.actions.saveFile}
                onDetails={onDetails}
                onShare={onShare}
                onOpenInDocs={preview.actions.openInDocs}
                imgThumbnailUrl={preview.content.thumbnailUrl}
                navigationControls={
                    preview.navigation && (
                        <NavigationControl
                            current={preview.navigation.currentPosition}
                            total={preview.navigation.totalCount}
                            rootRef={rootRef}
                            onPrev={preview.navigation.loadPrevious}
                            onNext={preview.navigation.loadNext}
                        />
                    )
                }
                signatureStatus={<SignatureStatus contentSignatureIssue={preview.node.contentSignatureIssue} />}
                signatureConfirmation={
                    preview.node.contentSignatureIssue && (
                        <SignatureInformation contentSignatureIssue={preview.node.contentSignatureIssue} />
                    )
                }
                sheetsEnabled={sheetsEnabled}
                {...photos}
            />
            {detailsModal}
            {sharingModal}
        </>
    );
}
