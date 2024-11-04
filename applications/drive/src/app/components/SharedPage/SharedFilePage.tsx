import { c } from 'ttag';

import { FileNameDisplay, FilePreviewContent, useActiveBreakpoint } from '@proton/components';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import type { DecryptedLink } from '../../store';
import { type useBookmarksPublicView, useDownloadScanFlag } from '../../store';
import { useDriveDocsPublicSharingFF } from '../../store/_documents';
import { usePublicFileView } from '../../store/_views/useFileView';
import { FileBrowserStateProvider } from '../FileBrowser';
import HeaderSecureLabel from './Layout/HeaderSecureLabel';
import HeaderSize from './Layout/HeaderSize';
import SharedPageFooter from './Layout/SharedPageFooter';
import SharedPageHeader from './Layout/SharedPageHeader';
import SharedPageLayout from './Layout/SharedPageLayout';
import SharedPageTransferManager from './TransferModal/SharedPageTransferManager';

interface Props {
    token: string;
    link: DecryptedLink;
    bookmarksPublicView: ReturnType<typeof useBookmarksPublicView>;
    hideSaveToDrive?: boolean;
    partialView?: boolean;
    openInDocs?: (linkId: string) => void;
}

export default function SharedFilePage({
    bookmarksPublicView,
    token,
    link,
    hideSaveToDrive = false,
    partialView = false,
    openInDocs,
}: Props) {
    const { isLinkLoading, isContentLoading, error, contents, downloadFile } = usePublicFileView(token, link.linkId);
    const isDownloadScanEnabled = useDownloadScanFlag();
    const { viewportWidth } = useActiveBreakpoint();
    const isDocument = isProtonDocument(link?.mimeType || '');

    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();

    return (
        <FileBrowserStateProvider itemIds={[link.linkId]}>
            <SharedPageLayout
                partialView={partialView}
                FooterComponent={
                    <SharedPageFooter
                        rootItem={link}
                        items={[{ id: link.linkId, ...link }]}
                        bookmarksPublicView={bookmarksPublicView}
                        hideSaveToDrive={hideSaveToDrive}
                        partialView={partialView}
                    />
                }
            >
                <SharedPageHeader
                    partialView={partialView}
                    rootItem={link}
                    items={[{ id: link.linkId, ...link }]}
                    bookmarksPublicView={bookmarksPublicView}
                    hideSaveToDrive={hideSaveToDrive}
                    className="mt-3 mb-4"
                >
                    <div className="w-full flex flex-nowrap flex-column md:items-center md:flex-row">
                        <FileNameDisplay className="text-4xl text-bold py-1 md:p-1" text={link.name} />
                        <div
                            className="flex md:flex-1 shrink-0 md:gap-4 md:flex-row-reverse md:grow-1 min-w-custom"
                            style={{ '--min-w-custom': 'max-content' }}
                        >
                            {!isDownloadScanEnabled ? (
                                <HeaderSecureLabel className="md:ml-auto" />
                            ) : (
                                <div className="md:ml-auto" />
                            )}
                            {link.size ? <HeaderSize size={link.size} /> : null}
                        </div>
                    </div>
                </SharedPageHeader>
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
                    isPublicDocsAvailable={isDocsPublicSharingEnabled}
                    onOpenInDocs={link && isDocument && openInDocs ? () => openInDocs(link.linkId) : undefined}
                />
            </SharedPageLayout>
            <SharedPageTransferManager rootItem={link} />
        </FileBrowserStateProvider>
    );
}
