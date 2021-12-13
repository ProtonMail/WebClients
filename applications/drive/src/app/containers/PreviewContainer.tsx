import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { useEffect, useState, useCallback, useRef } from 'react';
import { RouteComponentProps, useLocation } from 'react-router-dom';

import { useLoading, FilePreview, NavigationControl, useModals } from '@proton/components';
import { DriveSectionSortKeys, LinkMeta, LinkType, SortParams } from '@proton/shared/lib/interfaces/drive/link';
import { STATUS_CODE } from '@proton/shared/lib/drive/constants';

import useActiveShare from '../hooks/drive/useActiveShare';
import useDrive from '../hooks/drive/useDrive';
import useDriveSorting from '../hooks/drive/useDriveSorting';
import useNavigate from '../hooks/drive/useNavigate';
import { isTransferCancelError } from '../utils/transfer';
import { DownloadStreamControls } from '../components/downloads/interface';
import { useDownloadProvider } from '../components/downloads/DownloadProvider';
import useDownload from '../components/downloads/useDownload';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';
import { mapLinksToChildren } from '../components/sections/helpers';
import DetailsModal from '../components/DetailsModal';
import ShareLinkModal from '../components/ShareLinkModal/ShareLinkModal';
import useUserSettings from '../hooks/drive/useUserSettings';
import { streamToBuffer } from '../utils/stream';

const getSharedStatus = (meta?: LinkMeta) => {
    if (!meta?.Shared) {
        return '';
    }

    if (meta?.UrlsExpired || meta?.Trashed) {
        return 'inactive';
    }

    return 'shared';
};

const PreviewContainer = ({ match }: RouteComponentProps<{ shareId: string; linkId: string }>) => {
    const { shareId, linkId } = match.params;
    const { navigateToLink, navigateToSharedURLs, navigateToTrash, navigateToRoot } = useNavigate();
    const cache = useDriveCache();
    const downloadControls = useRef<DownloadStreamControls>();
    const { setFolder } = useActiveShare();
    const { getLinkMeta, fetchAllFolderPages } = useDrive();
    const [loading, withLoading] = useLoading(true);
    const [contents, setContents] = useState<Uint8Array[]>();
    const [, setError] = useState();
    const { createModal } = useModals();
    const { download } = useDownloadProvider();
    const { downloadStream } = useDownload();

    const referer = new URLSearchParams(useLocation().search).get('r');
    const useNavigation = !referer?.startsWith('/shared-urls') && !referer?.startsWith('/trash');

    const rootRef = useRef<HTMLDivElement>(null);

    const meta = cache.get.linkMeta(shareId, linkId);
    const { sort } = useUserSettings();

    const { sortedList } = useDriveSorting(
        (sortParams: SortParams<DriveSectionSortKeys>) => {
            return (meta && useNavigation && cache.get.childLinkMetas(shareId, meta.ParentLinkID, sortParams)) || [];
        },
        sort,
        async () => {}
    );

    const linksAvailableForPreview = sortedList.filter(({ MIMEType, Size }) => isPreviewAvailable(MIMEType, Size));

    const currentOpenIndex = linksAvailableForPreview.findIndex(({ LinkID }) => LinkID === meta?.LinkID);

    useEffect(() => {
        let canceled = false;

        const preloadFile = async () => {
            try {
                const { ParentLinkID, MIMEType, Size, Name, Type } = meta ?? (await getLinkMeta(shareId, linkId));

                if (canceled) {
                    return;
                }

                setFolder({ shareId, linkId: ParentLinkID });

                fetchAllFolderPages(shareId, ParentLinkID).catch(console.error);

                if (isPreviewAvailable(MIMEType, Size)) {
                    const { stream, controls } = await downloadStream([
                        {
                            type: Type,
                            shareId,
                            linkId,
                            name: Name,
                            mimeType: MIMEType,
                            size: Size,
                        },
                    ]);
                    downloadControls.current = controls;
                    setContents(await streamToBuffer(stream));
                } else {
                    downloadControls.current = undefined;
                    setContents(undefined);
                }
            } catch (err: any) {
                if (err.status === STATUS_CODE.NOT_FOUND) {
                    navigateToRoot();
                } else if (!isTransferCancelError(err)) {
                    setError(() => {
                        throw err;
                    });
                }
            }
        };

        if (contents) {
            setContents(undefined);
        }

        withLoading(preloadFile()).catch(console.error);

        return () => {
            canceled = true;
            downloadControls.current?.cancel();
            downloadControls.current = undefined;
        };
    }, [shareId, linkId]);

    const navigateToParent = useCallback(() => {
        if (referer?.startsWith('/shared-urls')) {
            navigateToSharedURLs();
            return;
        }
        if (referer?.startsWith('/trash')) {
            navigateToTrash();
            return;
        }
        if (meta?.ParentLinkID) {
            navigateToLink(shareId, meta.ParentLinkID, LinkType.FOLDER);
        }
    }, [meta?.ParentLinkID, shareId, referer]);

    const onOpen = useCallback(
        ({ LinkID }: LinkMeta) => {
            navigateToLink(shareId, LinkID, LinkType.FILE);
        },
        [shareId]
    );

    const saveFile = useCallback(async () => {
        if (!meta) {
            return;
        }
        void download([
            {
                type: meta.Type,
                shareId,
                linkId,
                name: meta.Name,
                mimeType: meta.MIMEType,
                size: meta.Size,
                buffer: contents,
            },
        ]);
    }, [meta, contents, shareId, linkId]);

    const openDetails = useCallback(() => {
        if (!meta) {
            return;
        }

        const [item] = mapLinksToChildren([meta], (linkId) => cache.get.isLinkLocked(shareId, linkId));
        createModal(<DetailsModal shareId={shareId} item={item} />);
    }, [shareId, meta]);

    const openShareOptions = useCallback(() => {
        if (!meta) {
            return;
        }

        const [item] = mapLinksToChildren([meta], (linkId) => cache.get.isLinkLocked(shareId, linkId));
        createModal(<ShareLinkModal shareId={shareId} item={item} />);
    }, [shareId, meta]);

    const handleNext = () => onOpen?.(linksAvailableForPreview[currentOpenIndex + 1]);
    const handlePrev = () => onOpen?.(linksAvailableForPreview[currentOpenIndex - 1]);

    return (
        <FilePreview
            loading={loading}
            contents={contents}
            fileName={meta?.Name}
            mimeType={meta?.MIMEType}
            sharedStatus={getSharedStatus(meta)}
            fileSize={meta?.Size}
            onClose={navigateToParent}
            onSave={saveFile}
            onDetail={openDetails}
            onShare={openShareOptions}
            ref={rootRef}
            navigationControls={
                meta &&
                currentOpenIndex !== -1 && (
                    <NavigationControl
                        current={currentOpenIndex + 1}
                        total={linksAvailableForPreview.length}
                        rootRef={rootRef}
                        onPrev={handlePrev}
                        onNext={handleNext}
                    />
                )
            }
        />
    );
};

export default PreviewContainer;
