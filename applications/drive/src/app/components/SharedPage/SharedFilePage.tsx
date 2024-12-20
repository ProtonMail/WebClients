import { c } from 'ttag';

import { FilePreviewContent, useActiveBreakpoint } from '@proton/components';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import type { DecryptedLink } from '../../store';
import { type useBookmarksPublicView } from '../../store';
import { useDriveDocsPublicSharingFF } from '../../store/_documents';
import { usePublicFileView } from '../../store/_views/useFileView';
import { FileBrowserStateProvider } from '../FileBrowser';
import ReportAbuseButton from './Layout/ReportAbuseButton';
import { SharedPageContentHeader } from './Layout/SharedPageContentHeader';
import SharedPageLayout from './Layout/SharedPageLayout';
import SharedPageTransferManager from './TransferModal/SharedPageTransferManager';

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

    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();

    return (
        <FileBrowserStateProvider itemIds={[link.linkId]}>
            <SharedPageLayout isPartialView={isPartialView}>
                <SharedPageContentHeader
                    isPartialView={isPartialView}
                    rootItem={link}
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
            <SharedPageTransferManager rootItem={link} />
        </FileBrowserStateProvider>
    );
}
