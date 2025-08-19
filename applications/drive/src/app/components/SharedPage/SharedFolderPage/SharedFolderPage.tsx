import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { FilePreview, NavigationControl, useActiveBreakpoint } from '@proton/components';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import {
    type DecryptedLink,
    type useBookmarksPublicView,
    useDownload,
    usePublicFolderView,
    usePublicShare,
} from '../../../store';
import { useDriveDocsPublicSharingFF } from '../../../store/_documents';
import { usePublicFileView } from '../../../store/_views/useFileView';
import type { SortParams } from '../../../store/_views/utils/useSorting';
import { isTransferActive } from '../../../utils/transfer';
import { usePublicShareStore } from '../../../zustand/public/public-share.store';
import { FileBrowserStateProvider } from '../../FileBrowser';
import { FloatingElementsPublic } from '../../FloatingElements/FloatingElementsPublic';
import TransferManager from '../../TransferManager/TransferManager';
import { usePublicDetailsModal } from '../../modals/DetailsModal';
import { useReportAbuseModal } from '../../modals/ReportAbuseModal/ReportAbuseModal';
import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';
import ReportAbuseButton from '../Layout/ReportAbuseButton';
import { SharedPageContentHeader } from '../Layout/SharedPageContentHeader';
import SharedPageLayout from '../Layout/SharedPageLayout';
import type { PublicLink } from '../interface';
import { SharedFileBrowser } from './FileBrowser';

interface Props {
    token: string;
    rootLink: DecryptedLink;
    bookmarksPublicView: ReturnType<typeof useBookmarksPublicView>;
    hideSaveToDrive: boolean;
    isPartialView: boolean;
    openInDocs?: (linkId: string, options?: { redirect?: boolean; download?: boolean }) => void;
}

interface PreviewContainerProps {
    token: string;
    linkId: DecryptedLink['linkId'];
    sortParams: SortParams;
    onClose: () => void;
    onNavigate: (linkId: DecryptedLink['linkId']) => void;
    onDownload: () => void;
    openInDocs?: (linkId: string, options?: { redirect?: boolean; download?: boolean }) => void;
}

function SharedPagePreviewContainer({
    token,
    linkId,
    sortParams,
    onClose,
    onNavigate,
    onDownload,
    openInDocs,
}: PreviewContainerProps) {
    const {
        isLinkLoading,
        isContentLoading,
        error,
        contents,
        navigation,
        link: loadedLink,
        videoStreaming,
    } = usePublicFileView(token, linkId, true, sortParams);
    const rootRef = useRef<HTMLDivElement>(null);
    const isDocument = isProtonDocsDocument(loadedLink?.mimeType || '');
    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();
    const [publicDetailsModal, showPublicDetailsModal] = usePublicDetailsModal();
    const { viewOnly } = usePublicShareStore((state) => ({ viewOnly: state.viewOnly }));

    return (
        <>
            <FilePreview
                isPublic
                isMetaLoading={isLinkLoading}
                isLoading={isContentLoading}
                error={error ? error.message || error.toString?.() || c('Info').t`Unknown error` : undefined}
                fileName={loadedLink?.name}
                mimeType={loadedLink?.mimeType}
                imgThumbnailUrl={loadedLink?.cachedThumbnailUrl}
                fileSize={loadedLink?.size}
                contents={contents}
                videoStreaming={videoStreaming}
                ref={rootRef}
                navigationControls={
                    loadedLink &&
                    navigation && (
                        <NavigationControl
                            current={navigation.current}
                            total={navigation.total}
                            rootRef={rootRef}
                            onPrev={() => onNavigate(navigation.prevLinkId)}
                            onNext={() => onNavigate(navigation.nextLinkId)}
                        />
                    )
                }
                onClose={onClose}
                onDownload={isDocument ? undefined : onDownload}
                onDetails={
                    !viewOnly && loadedLink
                        ? () =>
                              showPublicDetailsModal({
                                  token,
                                  linkId: loadedLink.linkId,
                              })
                        : undefined
                }
                isPublicDocsAvailable={isDocsPublicSharingEnabled}
                onOpenInDocs={openInDocs && loadedLink && isDocument ? () => openInDocs(loadedLink.linkId) : undefined}
            />
            {publicDetailsModal}
        </>
    );
}

export default function SharedFolder({
    bookmarksPublicView,
    token,
    rootLink,
    hideSaveToDrive,
    isPartialView,
    openInDocs,
}: Props) {
    const [linkId, setLinkId] = useState(rootLink.linkId);
    const folderView = usePublicFolderView(token, linkId);
    const { downloads, getDownloadsLinksProgresses, download, cancelDownloads } = useDownload();
    const [fileBrowserItems, setFileBrowserItems] = useState<PublicLink[]>([]);
    const [displayedLink, setDiplayedLink] = useState<DecryptedLink | undefined>();
    const { viewOnly } = usePublicShareStore((state) => ({ viewOnly: state.viewOnly }));
    const [previewDisplayed, setPreviewDisplayed] = useState(false);
    const { viewportWidth } = useActiveBreakpoint();

    const [reportAbuseModal, showReportAbuseModal] = useReportAbuseModal();
    const { submitAbuseReport, getVirusReportInfo } = usePublicShare();

    const onItemOpen = (item: DecryptedLink) => {
        if (isProtonDocsDocument(item.mimeType) && openInDocs) {
            openInDocs(item.linkId);
            return;
        }

        if (item.isFile) {
            setPreviewDisplayed(true);
            setDiplayedLink(item);
            return;
        }

        setLinkId(item.linkId);
    };

    const handleClose = () => {
        setPreviewDisplayed(false);
    };

    const handleNavigationPreview = (newLinkId: DecryptedLink['linkId']) => {
        setDiplayedLink(fileBrowserItems.find((link) => link.linkId === newLinkId));
    };

    const handleVirusReport = async ({
        transferId,
        linkId,
        errorMessage,
    }: {
        transferId: string;
        linkId?: string;
        errorMessage?: string;
    }) => {
        const { linkInfo, comment } = await getVirusReportInfo({ linkId, errorMessage, rootLinkId: rootLink.linkId });
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

    const shouldRenderPreviewContainer = previewDisplayed && displayedLink;

    const updateFileBrowserItems = () => {
        const linksProgresses = getDownloadsLinksProgresses();

        setFileBrowserItems(
            folderView.items.map((item) => {
                const progress = linksProgresses[item.linkId];
                const total = item.isFile ? item.size : progress?.total;
                const percent = (() => {
                    if (progress === undefined || total === undefined) {
                        return 0;
                    }
                    if (total === 0) {
                        return 100;
                    }
                    return Math.round((100 / total) * progress.progress);
                })();
                return {
                    id: item.linkId,
                    ...item,
                    progress: !progress
                        ? undefined
                        : {
                              total,
                              progress: progress.progress,
                              percent,
                              isFinished: percent === 100,
                          },
                    itemRowStyle: !progress
                        ? undefined
                        : {
                              background: `linear-gradient(90deg, var(--interaction-norm-minor-2) ${percent}%, var(--background-norm) ${percent}%)`,
                          },
                };
            })
        );
    };

    // Enrich link date with download progress. Downloads changes only when
    // status changes, not the progress, so if download is active, it needs
    // to run in interval until download is finished.
    useEffect(() => {
        updateFileBrowserItems();

        if (!downloads.some(isTransferActive)) {
            // Progresses are not handled by state and might be updated
            // without notifying a bit after downloads state is changed.
            const id = setTimeout(updateFileBrowserItems, 500);
            return () => {
                clearTimeout(id);
            };
        }

        const id = setInterval(updateFileBrowserItems, 500);
        return () => {
            clearInterval(id);
        };
    }, [folderView.items, downloads]);

    const handlePreviewDownload = () => {
        if (!displayedLink) {
            return;
        }
        void download([{ ...displayedLink, shareId: token }]);
    };

    const totalSize = !folderView.isLoading
        ? fileBrowserItems.reduce((total, currentValue) => {
              if (!currentValue.isFile) {
                  return total;
              }
              return total + currentValue.size;
          }, 0)
        : undefined;

    return (
        <FileBrowserStateProvider itemIds={fileBrowserItems.map(({ linkId }) => linkId)}>
            <SharedPageLayout isPartialView={isPartialView}>
                <SharedPageContentHeader
                    token={token}
                    linkId={linkId}
                    onNavigate={setLinkId}
                    size={totalSize}
                    name={folderView.folderName}
                    isPartialView={isPartialView}
                    rootLink={rootLink}
                    items={fileBrowserItems}
                    bookmarksPublicView={bookmarksPublicView}
                    hideSaveToDrive={hideSaveToDrive}
                    className="mt-3 mb-8"
                    isFolderView
                    openInDocs={openInDocs}
                />
                {shouldRenderPreviewContainer && (
                    <SharedPagePreviewContainer
                        token={token}
                        linkId={displayedLink.linkId}
                        sortParams={folderView.sortParams}
                        onNavigate={handleNavigationPreview}
                        onClose={handleClose}
                        onDownload={handlePreviewDownload}
                        openInDocs={openInDocs}
                    />
                )}

                <UploadDragDrop
                    shareId={token}
                    parentLinkId={linkId}
                    className="flex flex-column flex-nowrap flex-1"
                    disabled={viewOnly}
                >
                    <SharedFileBrowser
                        {...folderView}
                        onItemOpen={onItemOpen}
                        openInDocs={openInDocs}
                        items={fileBrowserItems}
                        canWrite={!viewOnly}
                        linkId={linkId}
                    />
                </UploadDragDrop>
                {!viewportWidth['<=small'] && <ReportAbuseButton linkInfo={rootLink} />}
            </SharedPageLayout>
            <FloatingElementsPublic>
                <TransferManager onVirusReport={handleVirusReport} />
            </FloatingElementsPublic>
            {reportAbuseModal}
        </FileBrowserStateProvider>
    );
}
