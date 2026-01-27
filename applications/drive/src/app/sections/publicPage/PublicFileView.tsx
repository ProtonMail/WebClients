import { useEffect, useState } from 'react';

import { MemberRole, type NodeEntity } from '@proton/drive';

import { downloadManager } from '../../managers/download/DownloadManager';
import { ContentPreviewMethod, PartialPreview } from '../../modals/preview';
import { getOpenInDocsInfo } from '../../utils/docs/openInDocs';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { PublicHeader } from './PublicHeader';
import { usePublicActions } from './actions/usePublicActions';
import { getPublicLinkClient } from './publicLinkClient';
import { usePublicAuthStore } from './usePublicAuth.store';

interface PublicFileViewProps {
    rootNode: NodeEntity;
}

export const PublicFileView = ({ rootNode }: PublicFileViewProps) => {
    const [contentData, setContentData] = useState<Uint8Array<ArrayBuffer>[] | undefined>(undefined);
    const { modals, handleDetails, handleOpenDocsOrSheets } = usePublicActions();

    useEffect(() => {
        const openInDocsInfo = rootNode.mediaType ? getOpenInDocsInfo(rootNode.mediaType) : undefined;

        // Do not open/convert in case of viewer for non-native docs/sheets files
        if (openInDocsInfo && usePublicAuthStore.getState().publicRole !== MemberRole.Viewer) {
            handleOpenDocsOrSheets(rootNode.uid, openInDocsInfo);
        }
    }, [rootNode.uid, rootNode.mediaType, rootNode.parentUid, handleOpenDocsOrSheets]);

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
            await downloadManager.downloadAndScan([rootNode.uid], { skipSignatureCheck: true });
        }
    };

    return (
        <div className="h-full flex flex-column">
            <PublicHeader
                name={rootNode.name}
                sharedBy={
                    (rootNode.keyAuthor.ok ? rootNode.keyAuthor.value : rootNode.keyAuthor.error.claimedAuthor) ||
                    undefined
                }
                onDetails={() => handleDetails(rootNode.uid)}
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
            {modals.detailsModal}
        </div>
    );
};
