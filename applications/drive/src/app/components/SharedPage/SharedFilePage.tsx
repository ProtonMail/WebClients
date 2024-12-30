import { c } from 'ttag';

import { FilePreviewContent, useActiveBreakpoint } from '@proton/components';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import type { DecryptedLink } from '../../store';
import { type useBookmarksPublicView, useDownload, usePublicShare } from '../../store';
import { useDriveDocsPublicSharingFF } from '../../store/_documents';
import { usePublicFileView } from '../../store/_views/useFileView';
import { FileBrowserStateProvider } from '../FileBrowser';
import TransferManager from '../TransferManager/TransferManager';
import { useReportAbuseModal } from '../modals/ReportAbuseModal/ReportAbuseModal';
import ReportAbuseButton from './Layout/ReportAbuseButton';
import { SharedPageContentHeader } from './Layout/SharedPageContentHeader';
import SharedPageLayout from './Layout/SharedPageLayout';

interface Props {
    token: string;
    link: DecryptedLink;
    bookmarksPublicView: ReturnType<typeof useBookmarksPublicView>;
    hideSaveToDrive?: boolean;
    isPartialView?: boolean;
    openInDocs?: (linkId: string) => void;
}

export default function SharedFilePage({
    bookmarksPublicView,
    token,
    link,
    hideSaveToDrive = false,
    isPartialView = false,
    openInDocs,
}: Props) {
    const { isLinkLoading, isContentLoading, error, contents, downloadFile } = usePublicFileView(token, link.linkId);
    const { viewportWidth } = useActiveBreakpoint();
    const isDocument = isProtonDocument(link?.mimeType || '');
    const [reportAbuseModal, showReportAbuseModal] = useReportAbuseModal();
    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();
    const { submitAbuseReport, getVirusReportInfo } = usePublicShare();
    const { cancelDownloads } = useDownload();

    const handleVirusReport = async ({ transferId, errorMessage }: { transferId: string; errorMessage?: string }) => {
        const { linkInfo, comment } = await getVirusReportInfo({ errorMessage, rootLinkId: link.linkId });
        return showReportAbuseModal({
            linkInfo,
            onSubmit: submitAbuseReport,
            onClose: () => cancelDownloads(transferId),
            prefilled: {
                Category: 'malware',
                Comment: comment,
            },
        });
    };

    return (
        <FileBrowserStateProvider itemIds={[link.linkId]}>
            <SharedPageLayout isPartialView={isPartialView}>
                <SharedPageContentHeader
                    isPartialView={isPartialView}
                    rootLink={link}
                    name={link.name}
                    size={link.size}
                    items={[{ id: link.linkId, ...link }]}
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
                    fileName={link?.name}
                    mimeType={link?.mimeType}
                    fileSize={link?.size}
                    imgThumbnailUrl={link?.cachedThumbnailUrl}
                    isPublic
                    isSharedFile={true}
                    isPublicDocsAvailable={isDocsPublicSharingEnabled}
                    onOpenInDocs={link && isDocument && openInDocs ? () => openInDocs(link.linkId) : undefined}
                />
                {!viewportWidth['<=small'] && <ReportAbuseButton linkInfo={link} />}
            </SharedPageLayout>
            <div
                className="fixed bottom-0 right-0 z-up w-full items-end max-w-custom"
                style={{ '--max-w-custom': '50em' }}
            >
                <TransferManager onVirusReport={handleVirusReport} />
            </div>
            {reportAbuseModal}
        </FileBrowserStateProvider>
    );
}
