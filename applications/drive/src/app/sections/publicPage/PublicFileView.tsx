import { useState } from 'react';

import { type NodeEntity, splitNodeUid } from '@proton/drive';

import { downloadManager } from '../../managers/download/DownloadManager';
import { useDetailsModal } from '../../modals/DetailsModal';
import { ContentPreviewMethod, PartialPreview } from '../../modals/preview';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { PublicHeader } from './PublicHeader';
import { getPublicLinkClient } from './publicLinkClient';

interface PublicFileViewProps {
    rootNode: NodeEntity;
}

export const PublicFileView = ({ rootNode }: PublicFileViewProps) => {
    const [contentData, setContentData] = useState<Uint8Array<ArrayBuffer>[] | undefined>(undefined);
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const handleContentLoaded = (data: Uint8Array<ArrayBuffer>[], previewMethod?: ContentPreviewMethod) => {
        if (previewMethod === ContentPreviewMethod.Buffer) {
            setContentData(data);
        }
    };
    const handleDownload = async () => {
        if (contentData) {
            const { node } = getNodeEntity(await getPublicLinkClient().getNode(rootNode.uid));
            await downloadManager.downloadFromBuffer(node, contentData);
        } else {
            await downloadManager.download([rootNode.uid]);
        }
    };

    const handleDetails = async () => {
        const { volumeId, nodeId } = splitNodeUid(rootNode.uid);
        showDetailsModal({
            //shareId is required for legacy compatibility reasons, it's safe to pass empty string here as we will use sdk logic
            shareId: '',
            volumeId,
            linkId: nodeId,
            verifySignatures: false,
            drive: getPublicLinkClient(),
        });
    };

    return (
        <div className="h-full flex flex-column">
            <PublicHeader
                name={rootNode.name}
                sharedBy={
                    (rootNode.keyAuthor.ok ? rootNode.keyAuthor.value : rootNode.keyAuthor.error.claimedAuthor) ||
                    undefined
                }
                onDetails={handleDetails}
                onDownload={handleDownload}
            />
            <PartialPreview
                className="flex-1"
                drive={getPublicLinkClient()}
                nodeUid={rootNode.uid}
                verifySignatures={false}
                onContentLoaded={handleContentLoaded}
                onDownload={handleDownload}
            />
            {detailsModal}
        </div>
    );
};
