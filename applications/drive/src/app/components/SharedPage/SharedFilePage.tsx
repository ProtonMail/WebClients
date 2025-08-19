import { c } from 'ttag';

import { FilePreviewContent, useActiveBreakpoint } from '@proton/components';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import type { DecryptedLink } from '../../store';
import { type useBookmarksPublicView, useDownload, usePublicShare } from '../../store';
import { useDriveDocsPublicSharingFF } from '../../store/_documents';
import { usePublicFileView } from '../../store/_views/useFileView';
import { FileBrowserStateProvider } from '../FileBrowser';
import { FloatingElementsPublic } from '../FloatingElements/FloatingElementsPublic';
import TransferManager from '../TransferManager/TransferManager';
import { useReportAbuseModal } from '../modals/ReportAbuseModal/ReportAbuseModal';
import ReportAbuseButton from './Layout/ReportAbuseButton';
import { SharedPageContentHeader } from './Layout/SharedPageContentHeader';
import SharedPageLayout from './Layout/SharedPageLayout';

interface Props {
    token: string;
    rootLink: DecryptedLink;
    bookmarksPublicView: ReturnType<typeof useBookmarksPublicView>;
    hideSaveToDrive: boolean;
    isPartialView: boolean;
    openInDocs?: (linkId: string, options?: { redirect?: boolean; download?: boolean }) => void;
}

export default function SharedFilePage({
    bookmarksPublicView,
    token,
    rootLink,
    hideSaveToDrive,
    isPartialView,
    openInDocs,
}: Props) {
    const { isLinkLoading, isContentLoading, error, contents, downloadFile, videoStreaming } = usePublicFileView(
        token,
        rootLink.linkId
    );

    const { viewportWidth } = useActiveBreakpoint();
    const isDocument = isProtonDocsDocument(rootLink?.mimeType || '');
    const [reportAbuseModal, showReportAbuseModal] = useReportAbuseModal();
    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();
    const { submitAbuseReport, getVirusReportInfo } = usePublicShare();
    const { cancelDownloads } = useDownload();

    const handleVirusReport = async ({ transferId, errorMessage }: { transferId: string; errorMessage?: string }) => {
        const { linkInfo, comment } = await getVirusReportInfo({ errorMessage, rootLinkId: rootLink.linkId });
        return showReportAbuseModal({
            linkInfo,
            onSubmit: (params) => {
                cancelDownloads(transferId);
                return submitAbuseReport(params);
            },
            prefilled: {
                Category: 'malware',
                Comment: comment,
            },
        });
    };

    return (
        <FileBrowserStateProvider itemIds={[rootLink.linkId]}>
            <SharedPageLayout isPartialView={isPartialView}>
                <SharedPageContentHeader
                    token={token}
                    linkId={rootLink.linkId}
                    isPartialView={isPartialView}
                    rootLink={rootLink}
                    name={rootLink.name}
                    size={rootLink.size}
                    items={[{ id: rootLink.linkId, ...rootLink }]}
                    bookmarksPublicView={bookmarksPublicView}
                    hideSaveToDrive={hideSaveToDrive}
                    className="mt-3 mb-4"
                />
                <FilePreviewContent
                    isMetaLoading={isLinkLoading}
                    isLoading={isContentLoading}
                    onDownload={!viewportWidth['<=small'] ? downloadFile : undefined}
                    error={error ? error.message || error.toString?.() || c('Info').t`Unknown error` : undefined}
                    contents={contents}
                    fileName={rootLink?.name}
                    mimeType={rootLink?.mimeType}
                    fileSize={rootLink?.size}
                    videoStreaming={videoStreaming}
                    imgThumbnailUrl={rootLink?.cachedThumbnailUrl}
                    isPublic
                    isSharedFile={true}
                    isPublicDocsAvailable={isDocsPublicSharingEnabled}
                    onOpenInDocs={rootLink && isDocument && openInDocs ? () => openInDocs(rootLink.linkId) : undefined}
                />
                {!viewportWidth['<=small'] && <ReportAbuseButton linkInfo={rootLink} />}
            </SharedPageLayout>
            <FloatingElementsPublic>
                <TransferManager onVirusReport={handleVirusReport} />
            </FloatingElementsPublic>
            {reportAbuseModal}
        </FileBrowserStateProvider>
    );
}
