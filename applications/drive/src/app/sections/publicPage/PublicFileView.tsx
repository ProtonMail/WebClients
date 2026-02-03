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
    customPassword?: string;
    isPartialView?: boolean;
}

export const PublicFileView = ({ rootNode, customPassword, isPartialView }: PublicFileViewProps) => {
    const [contentData, setContentData] = useState<Uint8Array<ArrayBuffer>[] | undefined>(undefined);
    const { modals, handleDetails, handleOpenDocsOrSheets, handleCopyLink } = usePublicActions();

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
    const handleDownload = async (shouldScan?: boolean) => {
        if (contentData) {
            const { node } = getNodeEntity(await getPublicLinkClient().getNode(rootNode.uid));
            await downloadManager.downloadFromBuffer(node, contentData);
            return;
        }

        if (shouldScan) {
            await downloadManager.downloadAndScan([rootNode.uid], { skipSignatureCheck: true });
        } else {
            await downloadManager.download([rootNode.uid], { skipSignatureCheck: true });
        }
    };

    return (
        <div className="h-full flex flex-column">
            <PublicHeader
                breadcrumbOrName={
                    <h1
                        // Custom padding to match breadcrumb style
                        className="text-4xl text-semibold pl-custom py-custom"
                        style={{
                            '--pl-custom': '0.315rem',
                            '--py-custom': '0.5625rem',
                        }}
                    >
                        {rootNode.name}
                    </h1>
                }
                sharedBy={
                    (rootNode.keyAuthor.ok ? rootNode.keyAuthor.value : rootNode.keyAuthor.error.claimedAuthor) ||
                    undefined
                }
                onDetails={() => handleDetails(rootNode.uid)}
                onDownload={() => handleDownload()}
                onScanAndDownload={() => handleDownload(true)}
                onCopyLink={handleCopyLink}
                customPassword={customPassword}
                isPartialView={isPartialView}
            />
            <PartialPreview
                className="flex-1"
                drive={getPublicLinkClient()}
                nodeUid={rootNode.uid}
                verifySignatures={false}
                onContentLoaded={handleContentLoaded}
                onDownload={() => handleDownload()}
            />
            {modals.detailsModal}
        </div>
    );
};
