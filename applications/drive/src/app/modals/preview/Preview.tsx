import { useRef } from 'react';

import { FilePreview, NavigationControl } from '@proton/components';
import { splitNodeUid } from '@proton/drive';

import { useDetailsModal } from '../../components/modals/DetailsModal';
import { useLinkSharingModal } from '../../components/modals/ShareLinkModal/ShareLinkModal';
import { useFlagsDriveSheet } from '../../flags/useFlagsDriveSheet';
import { SignatureInformation, SignatureStatus } from './signatures';
import { usePreviewState } from './usePreviewState';

export interface PreviewProps {
    deprecatedContextShareId: string;
    nodeUid: string;
    previewableNodeUids?: string[];
    onNodeChange?: (nodeUid: string) => void;
    onClose: () => void;
}

export function Preview({
    deprecatedContextShareId,
    nodeUid,
    previewableNodeUids,
    onNodeChange,
    onClose,
}: PreviewProps) {
    const { volumeId, nodeId } = splitNodeUid(nodeUid);

    const sheetsEnabled = useFlagsDriveSheet();

    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();

    const rootRef = useRef<HTMLDivElement>(null);

    const preview = usePreviewState({ nodeUid, previewableNodeUids, onNodeChange });

    const onDetails = () => {
        showDetailsModal({ volumeId, shareId: deprecatedContextShareId, linkId: nodeId });
    };

    const onShare = preview.canShare
        ? () => showLinkSharingModal({ volumeId, shareId: deprecatedContextShareId, linkId: nodeId })
        : undefined;

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
            />
            {detailsModal}
            {linkSharingModal}
        </>
    );
}
