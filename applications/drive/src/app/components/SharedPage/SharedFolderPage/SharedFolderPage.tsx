import { useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { NavigationControl } from '@proton/components/containers';
import FilePreview from '@proton/components/containers/filePreview/FilePreview';

import { DecryptedLink, useDownload, usePublicFolderView } from '../../../store';
import { usePublicFileView } from '../../../store/_views/useFileView';
import { SortParams } from '../../../store/_views/utils/useSorting';
import { isTransferActive } from '../../../utils/transfer';
import { FileBrowserStateProvider } from '../../FileBrowser';
import { useUpsellFloatingModal } from '../../modals/UpsellFloatingModal';
import Breadcrumbs from '../Layout/Breadcrumbs';
import HeaderSecureLabel from '../Layout/HeaderSecureLabel';
import HeaderSize from '../Layout/HeaderSize';
import SharedPageFooter from '../Layout/SharedPageFooter';
import SharedPageHeader from '../Layout/SharedPageHeader';
import SharedPageLayout from '../Layout/SharedPageLayout';
import { PublicLink } from '../interface';
import SharedFileBrowser from './FileBrowser';

interface Props {
    token: string;
    rootLink: DecryptedLink;
}

interface PreviewContainerProps {
    shareId: string;
    linkId: DecryptedLink['linkId'];
    sortParams: SortParams;
    onClose: () => void;
    onNavigate: (linkId: DecryptedLink['linkId']) => void;
    onDownload: () => void;
}

function SharedPagePreviewContainer({
    shareId,
    linkId,
    sortParams,
    onClose,
    onNavigate,
    onDownload,
}: PreviewContainerProps) {
    const {
        isLinkLoading,
        isContentLoading,
        error,
        contents,
        navigation,
        link: loadedLink,
    } = usePublicFileView(shareId, linkId, true, sortParams);

    const rootRef = useRef<HTMLDivElement>(null);

    return (
        <FilePreview
            colorUi="standard"
            isMetaLoading={isLinkLoading}
            isLoading={isContentLoading}
            error={error ? error.message || error.toString?.() || c('Info').t`Unknown error` : undefined}
            fileName={loadedLink?.name}
            mimeType={loadedLink?.mimeType}
            imgThumbnailUrl={loadedLink?.cachedThumbnailUrl}
            fileSize={loadedLink?.size}
            contents={contents}
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
            onDownload={onDownload}
        />
    );
}

export default function SharedFolder({ token, rootLink }: Props) {
    const [linkId, setLinkId] = useState(rootLink.linkId);
    const folderView = usePublicFolderView(token, linkId);
    const { downloads, getDownloadsLinksProgresses, download } = useDownload();
    const [fileBrowserItems, setFileBrowserItems] = useState<PublicLink[]>([]);
    const [displayedLink, setDiplayedLink] = useState<DecryptedLink | undefined>();
    const [previewDisplayed, setPreviewDisplayed] = useState(false);
    const [renderUpsellFloatingModal] = useUpsellFloatingModal();

    const onItemOpen = (item: DecryptedLink) => {
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

    const { totalSize } = useMemo(
        () =>
            fileBrowserItems.reduce(
                (previousValue, currentValue) => {
                    if (previousValue.haveSubFolder || !currentValue.isFile) {
                        return { haveSubFolder: true, totalSize: 0 };
                    }
                    return {
                        ...previousValue,
                        totalSize: previousValue.totalSize + currentValue.size,
                    };
                },
                { haveSubFolder: false, totalSize: 0 }
            ),
        [fileBrowserItems]
    );

    return (
        <FileBrowserStateProvider itemIds={fileBrowserItems.map(({ linkId }) => linkId)}>
            <SharedPageLayout FooterComponent={<SharedPageFooter rootItem={rootLink} items={fileBrowserItems} />}>
                <SharedPageHeader rootItem={rootLink} items={fileBrowserItems} className="mt-7 mb-8">
                    <div className="max-w-full flex flex-align-items-center">
                        <Breadcrumbs
                            token={token}
                            name={folderView.folderName}
                            linkId={linkId}
                            onNavigate={setLinkId}
                            className="w-full shared-folder-header-breadcrumbs pb-1"
                        />
                        <div className="flex flex-align-items-center">
                            <HeaderSecureLabel />
                            {totalSize ? <HeaderSize size={totalSize} /> : null}
                        </div>
                    </div>
                </SharedPageHeader>
                {shouldRenderPreviewContainer && (
                    <SharedPagePreviewContainer
                        shareId={token}
                        linkId={displayedLink.linkId}
                        sortParams={folderView.sortParams}
                        onNavigate={handleNavigationPreview}
                        onClose={handleClose}
                        onDownload={handlePreviewDownload}
                    />
                )}
                <SharedFileBrowser {...folderView} onItemOpen={onItemOpen} items={fileBrowserItems} />
            </SharedPageLayout>
            {renderUpsellFloatingModal}
        </FileBrowserStateProvider>
    );
}
