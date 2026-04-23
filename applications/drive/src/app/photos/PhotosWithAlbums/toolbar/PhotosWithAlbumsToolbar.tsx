import type { FC, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { Vr } from '@proton/atoms/Vr/Vr';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    type ModalStateReturnObj,
    Toolbar,
    ToolbarButton,
    useActiveBreakpoint,
    usePopperAnchor,
} from '@proton/components';
import { MemberRole, generateNodeUid, getDriveForPhotos, splitNodeUid } from '@proton/drive/index';
import { useSharingModal } from '@proton/drive/modules/sharingModal';
import useLoading from '@proton/hooks/useLoading';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { ShareButton } from '../../../sections/commonButtons/ShareButton';
import type { OnFileSkippedSuccessCallbackData, OnFileUploadSuccessCallbackData, PhotoGridItem } from '../../../store';
import { isPhotoGroup } from '../../../store/_photos';
import { AlbumsPageTypes } from '../../../zustand/photos/layout.store';
import { useAlbumsStore } from '../../useAlbums.store';
import { type PhotoItem, usePhotosStore } from '../../usePhotos.store';
import { PhotosAddAlbumPhotosButton } from './PhotosAddAlbumPhotosButton';
import { PhotosAddToAlbumButton } from './PhotosAddToAlbumButton';
import { PhotosAlbumShareButton } from './PhotosAlbumShareButton';
import PhotosDetailsButton from './PhotosDetailsButton';
import { PhotosDownloadButton } from './PhotosDownloadButton';
import { PhotosMakeCoverButton } from './PhotosMakeCoverButton';
import { PhotosRemoveAlbumPhotosButton } from './PhotosRemoveAlbumPhotosButton';
import { PhotosSavePhotoButton } from './PhotosSavePhotoButton';
import PhotosShareLinkButton from './PhotosShareLinkButton';
import { PhotosShareMultipleLinkButton } from './PhotosShareMultipleLinkButton';
import PhotosTrashButton from './PhotosTrashButton';
import { PhotosUploadButton } from './PhotosUploadButton';

import './ToolbarLeftActionsGallery.scss';

interface ToolbarLeftActionsGalleryProps {
    isLoading: boolean;
    onGalleryClick: () => void;
    onAlbumsClick: () => void;
    selection: 'gallery' | 'albums';
}

interface TabOption {
    id: 'gallery' | 'albums';
    label: string;
    onClick: () => void;
    icon: IconName;
}

interface AlbumGalleryDropdownButtonProps {
    onDelete: () => void;
    onShowDetails: () => void;
    onLeave: () => void;
    onAddAlbumPhotos: () => void;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
    onFileSkipped?: (file: OnFileSkippedSuccessCallbackData) => void;
    showAddAlbumPhotosButton: boolean;
    showUploadButton: boolean;
    showDeleteAlbumButton: boolean;
    showLeaveAlbumButton: boolean;
    volumeId: string;
    shareId: string;
    linkId: string;
}

const AlbumGalleryDropdownButton = ({
    onDelete,
    onShowDetails,
    onLeave,
    showAddAlbumPhotosButton,
    showUploadButton,
    showDeleteAlbumButton,
    showLeaveAlbumButton,
    onAddAlbumPhotos,
    onFileUpload,
    onFileSkipped,
    volumeId,
    shareId,
    linkId,
}: AlbumGalleryDropdownButtonProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    return (
        <>
            <DropdownButton
                shape="ghost"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                className="inline-flex flex-nowrap flex-row items-center toolbar-button"
                data-testid="toolbar-album-more-options"
            >
                <IcThreeDotsVertical className="mr-2" /> {c('Action').t`More`}
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    {/*
                    TODO: Missing 2 actions
                    <DropdownMenuButton className="text-left flex items-center flex-nowrap">
                        <Icon className="mr-2" name="window-image" />
                        {c('Action').t`Set album cover`}
                    </DropdownMenuButton>
                    <DropdownMenuButton className="text-left flex items-center flex-nowrap">
                        <Icon className="mr-2" name="pencil" />
                        {c('Action').t`Edit album`}
                    </DropdownMenuButton>
                    */}
                    {showAddAlbumPhotosButton && (
                        <PhotosAddAlbumPhotosButton onClick={onAddAlbumPhotos} type="dropdown" />
                    )}
                    {showUploadButton && (
                        <PhotosUploadButton
                            volumeId={volumeId}
                            shareId={shareId}
                            linkId={linkId}
                            onFileUpload={onFileUpload}
                            onFileSkipped={onFileSkipped}
                            type="dropdown"
                            isAlbumUpload
                        />
                    )}
                    <DropdownMenuButton className="text-left flex items-center flex-nowrap" onClick={onShowDetails}>
                        <Icon className="mr-2" name="info-circle" />
                        {c('Action').t`Details`}
                    </DropdownMenuButton>

                    {showDeleteAlbumButton && (
                        <DropdownMenuButton className="text-left flex items-center flex-nowrap" onClick={onDelete}>
                            <Icon className="mr-2" name="trash" />
                            {c('Action').t`Delete album`}
                        </DropdownMenuButton>
                    )}
                    {showLeaveAlbumButton && (
                        <DropdownMenuButton className="text-left flex items-center flex-nowrap" onClick={onLeave}>
                            <Icon className="mr-2" name="cross-big" />
                            {c('Action').t`Leave album`}
                        </DropdownMenuButton>
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export const ToolbarLeftActionsGallery = ({
    onGalleryClick,
    onAlbumsClick,
    selection,
}: ToolbarLeftActionsGalleryProps) => {
    const tabs: TabOption[] = [
        {
            id: 'gallery',
            label: c('Link').t`Photos`,
            onClick: onGalleryClick,
            icon: 'image',
        },
        {
            id: 'albums',
            label: c('Link').t`Albums`,
            onClick: onAlbumsClick,
            icon: 'album-folder',
        },
    ];

    return (
        <nav className="ml-2 flex flex-row flex-nowrap gap-4">
            {tabs.map((tab) => (
                <InlineLinkButton
                    key={tab.id}
                    aria-pressed={tab.id === selection}
                    className={clsx(
                        'h3 inline-flex items-center gap-1 text-bold toolbar-photos-gallery-button text-no-decoration',
                        tab.id === selection
                            ? 'color-inherit toolbar-photos-gallery-button--selected'
                            : 'color-hint hover:color-norm'
                    )}
                    onClick={() => tab.onClick()}
                    data-testid={`toolbar-${tab.label.toLowerCase()}-tab`}
                >
                    <Icon name={tab.icon} size={5} /> <span>{tab.label}</span>
                </InlineLinkButton>
            ))}
        </nav>
    );
};

interface ToolbarLeftActionsAlbumsGalleryProps {
    isLoading: boolean;
    onAlbumsClick: () => void;
    name?: string;
}

export const ToolbarLeftActionsAlbumsGallery = ({
    onAlbumsClick,
    //name, // not sure if we should keep it?
}: ToolbarLeftActionsAlbumsGalleryProps) => {
    const getButtonStyles = () => ({
        selected: false,
    });

    // alignment to fix
    return (
        <Button
            shape="ghost"
            className="inline-flex flex-nowrap flex-row text-semibold items-center"
            {...getButtonStyles()}
            onClick={onAlbumsClick}
            data-testid="toolbar-go-back"
        >
            <IcArrowLeft className="mr-2 shrink-0" /> {c('Action').t`Go back`}
        </Button>
    );
};

interface ToolbarRightActionsAlbumsProps {
    createAlbumModal: ModalStateReturnObj;
}

const ToolbarRightActionsAlbums = ({ createAlbumModal }: ToolbarRightActionsAlbumsProps) => {
    const { openModal } = createAlbumModal;
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <>
            <Button
                onClick={() => {
                    openModal(true);
                }}
                color="weak"
                shape="ghost"
                icon={viewportWidth.xsmall}
                className="inline-flex flex-nowrap flex-row items-center"
                data-testid="toolbar-new-album"
            >
                <IcPlus className={clsx(!viewportWidth.xsmall && 'mr-2')} />{' '}
                <span className={clsx(viewportWidth.xsmall && 'sr-only')}>{c('Action').t`New album`}</span>
            </Button>
        </>
    );
};

interface ToolbarRightActionsGalleryProps {
    uploadDisabled: boolean;
    volumeId: string;
    shareId: string;
    linkId: string;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
    onFileSkipped?: (file: OnFileSkippedSuccessCallbackData) => void;
}

interface ToolbarRightActionsAlbumGalleryProps extends ToolbarRightActionsGalleryProps {
    requestDownload: (photosUids: string[]) => Promise<void>;
    data: PhotoGridItem[];
    nodeUid: string;
    onDeleteAlbum: () => void;
    onLeaveAlbum: () => void;
    onShowDetails: () => void;
    onAddAlbumPhotos: () => void;
    isAlbumPhotosLoading?: boolean;
}

const ToolbarRightActionsGallery = ({
    uploadDisabled,
    volumeId,
    shareId,
    linkId,
    onFileUpload,
}: ToolbarRightActionsGalleryProps) => {
    return (
        <>
            {!uploadDisabled && (
                <PhotosUploadButton volumeId={volumeId} shareId={shareId} linkId={linkId} onFileUpload={onFileUpload} />
            )}
        </>
    );
};

const ToolbarRightActionsAlbumGallery = ({
    uploadDisabled,
    volumeId,
    shareId,
    linkId,
    onFileUpload,
    onFileSkipped,
    requestDownload,
    nodeUid,
    data,
    onDeleteAlbum,
    onLeaveAlbum,
    onShowDetails,
    onAddAlbumPhotos,
    isAlbumPhotosLoading,
}: ToolbarRightActionsAlbumGalleryProps) => {
    const { sharingModal, showSharingModal } = useSharingModal();
    const { viewportWidth } = useActiveBreakpoint();
    const showIconOnly = !viewportWidth['>=large'];
    const album = useAlbumsStore(useShallow((state) => state.albums.get(nodeUid)));
    const showUploadButton = album?.directRole !== MemberRole.Viewer && !uploadDisabled;
    const showAddAlbumsButton = album?.directRole !== MemberRole.Viewer;
    const [isDownloading, withDownloading] = useLoading();
    const [pendingDownload, setPendingDownload] = useState(false);
    const wasLoadingRef = useRef(isAlbumPhotosLoading);

    const extractNodeUidsFromData = (data: PhotoGridItem[]): string[] => {
        return data
            .filter((item): item is Exclude<PhotoGridItem, string> => !isPhotoGroup(item))
            .map((item) => generateNodeUid(item.volumeId, item.linkId));
    };

    // Track when pagination finishes and trigger pending download with latest data
    // This prevent request download before all photos ids have been fetched.
    useEffect(() => {
        if (wasLoadingRef.current && !isAlbumPhotosLoading && pendingDownload) {
            setPendingDownload(false);
            const linkIds = extractNodeUidsFromData(data);
            void withDownloading(requestDownload(linkIds)).catch(noop);
        }
        wasLoadingRef.current = isAlbumPhotosLoading;
    }, [isAlbumPhotosLoading, pendingDownload, data, requestDownload, withDownloading]);

    // If the isAlbumPhotosLoading is false, we can requestDownload right away
    const handleDownloadClick = () => {
        if (isAlbumPhotosLoading) {
            setPendingDownload(true);
        } else {
            const linkIds = extractNodeUidsFromData(data);
            void withDownloading(requestDownload(linkIds)).catch(noop);
        }
    };

    const showLoading = pendingDownload || isDownloading;

    return (
        <>
            {!showIconOnly && showAddAlbumsButton && (
                <PhotosAddAlbumPhotosButton onClick={onAddAlbumPhotos} type="toolbar" />
            )}
            {!showIconOnly && !showAddAlbumsButton && showUploadButton && (
                <PhotosUploadButton
                    volumeId={volumeId}
                    shareId={shareId}
                    linkId={linkId}
                    onFileUpload={onFileUpload}
                    onFileSkipped={onFileSkipped}
                    isAlbumUpload
                />
            )}
            {!isAlbumPhotosLoading && data.length === 0 ? null : (
                <ToolbarButton
                    loading={showLoading}
                    onClick={handleDownloadClick}
                    data-testid="toolbar-download-album"
                    title={c('Action').t`Download`}
                    icon={
                        <Icon
                            name="arrow-down-line"
                            className={clsx(!showIconOnly && 'mr-2')}
                            alt={c('Action').t`Download`}
                        />
                    }
                >
                    <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Download`}</span>
                </ToolbarButton>
            )}

            {album?.isOwner && (
                <PhotosAlbumShareButton
                    showIconOnly={showIconOnly}
                    onClick={() => {
                        showSharingModal({ nodeUid, drive: getDriveForPhotos() });
                    }}
                />
            )}
            {/* TODO: DRVWEB-4974 - show share button only for isOwner once permissions available in AlbumSummary */}
            <Vr className="h-full" />
            <AlbumGalleryDropdownButton
                onDelete={onDeleteAlbum}
                onShowDetails={onShowDetails}
                onLeave={onLeaveAlbum}
                onFileUpload={onFileUpload}
                onFileSkipped={onFileSkipped}
                onAddAlbumPhotos={onAddAlbumPhotos}
                volumeId={volumeId}
                shareId={shareId}
                linkId={linkId}
                showUploadButton={showIconOnly && !showAddAlbumsButton && showUploadButton}
                showAddAlbumPhotosButton={showIconOnly && showAddAlbumsButton}
                showDeleteAlbumButton={album?.directRole !== MemberRole.Viewer}
                showLeaveAlbumButton={!album?.isOwner}
            />
            {sharingModal}
        </>
    );
};

interface SelectionDropdownButtonProps {
    children: ReactNode;
}

const SelectionDropdownButton = ({ children }: SelectionDropdownButtonProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    return (
        <>
            <DropdownButton
                shape="ghost"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                className="inline-flex flex-nowrap flex-row items-center toolbar-button"
                data-testid="toolbar-album-more-options"
            >
                <IcThreeDotsVertical className="mr-2" /> {c('Action').t`More`}
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>{children}</DropdownMenu>
            </Dropdown>
        </>
    );
};

interface PhotosWithAlbumToolbarProps {
    volumeId: string;
    shareId: string;
    linkId: string; // the upload folder link ID (either root or inside a share album)
    rootLinkId?: string;
    selectedItems: PhotoItem[];
    data: PhotoGridItem[];
    onPreview?: () => void;
    requestDownload: (photosUids: string[]) => Promise<void>;
    uploadDisabled: boolean;
    tabSelection: AlbumsPageTypes;
    createAlbumModal: ModalStateReturnObj;
    openAddPhotosToAlbumModal?: () => void;
    openSharePhotosIntoAnAlbumModal?: () => void;
    openSharePhotoModal?: () => void;
    removeAlbumPhotos?: () => Promise<void>;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
    onFileSkipped?: (file: OnFileSkippedSuccessCallbackData) => void;
    onSelectCover?: () => Promise<void>;
    nodeUid?: string;
    onDeleteAlbum?: () => void;
    onLeaveAlbum?: () => void;
    onShowDetails?: () => void;
    onAddAlbumPhotos?: () => void;
    onSavePhotos?: () => Promise<void>;
    isAlbumPhotosLoading?: boolean;
}

export const PhotosWithAlbumsToolbar: FC<PhotosWithAlbumToolbarProps> = ({
    volumeId,
    shareId,
    linkId,
    rootLinkId,
    selectedItems,
    data,
    requestDownload,
    uploadDisabled,
    tabSelection,
    createAlbumModal,
    openAddPhotosToAlbumModal,
    openSharePhotosIntoAnAlbumModal,
    openSharePhotoModal,
    removeAlbumPhotos,
    onFileUpload,
    onFileSkipped,
    onSelectCover,
    nodeUid,
    onDeleteAlbum,
    onLeaveAlbum,
    onShowDetails,
    onAddAlbumPhotos,
    onSavePhotos,
    isAlbumPhotosLoading,
}) => {
    const { viewportWidth } = useActiveBreakpoint();
    const hasSelection = selectedItems.length > 0;
    const hasMultipleSelected = selectedItems.length > 1;
    const showMoreButtonDropdown = viewportWidth['<=medium'];
    const showIconOnly =
        !viewportWidth['>=large'] || (!hasMultipleSelected && viewportWidth['>=large'] && viewportWidth.large);
    // Only show set cover button if photo selected is not already the onSelectCover
    const album = useAlbumsStore(useShallow((state) => nodeUid && state.albums.get(nodeUid)));
    const canSelectCover = Boolean(
        !hasMultipleSelected && onSelectCover && album && selectedItems.length && album.isOwner
    );
    const canSavePhotos = Boolean(
        album &&
        hasSelection &&
        rootLinkId &&
        onSavePhotos &&
        selectedItems.every(({ nodeUid }) => {
            const photo = usePhotosStore.getState().getPhotoItem(nodeUid);
            if (!photo?.additionalInfo?.parentNodeUid) {
                return true;
            }
            return splitNodeUid(photo.additionalInfo.parentNodeUid).nodeId !== rootLinkId;
        })
    );
    // TODO: DRVWEB-4974 - use album.permissions.isEditor/isOwner once available in AlbumSummary
    const canRemoveAlbum = Boolean(album && album.directRole !== MemberRole.Viewer && removeAlbumPhotos);
    const canShare = Boolean(
        (openSharePhotoModal && !hasMultipleSelected && !album) || (!hasMultipleSelected && album)
    );
    const canShareMultiple = Boolean(hasMultipleSelected && openSharePhotosIntoAnAlbumModal && !album);
    const canAddPhotosFromGallery = Boolean(openAddPhotosToAlbumModal && tabSelection === AlbumsPageTypes.GALLERY);

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container toolbar--no-bg">
            <div className="gap-2 flex items-center">
                {tabSelection === AlbumsPageTypes.GALLERY && !hasSelection && (
                    <ToolbarRightActionsGallery
                        volumeId={volumeId}
                        uploadDisabled={uploadDisabled}
                        shareId={shareId}
                        linkId={linkId}
                    />
                )}
                {tabSelection === AlbumsPageTypes.ALBUMS && (
                    <ToolbarRightActionsAlbums createAlbumModal={createAlbumModal} />
                )}

                {tabSelection === AlbumsPageTypes.ALBUMSGALLERY &&
                    !hasSelection &&
                    nodeUid &&
                    onDeleteAlbum &&
                    onLeaveAlbum &&
                    onShowDetails &&
                    onAddAlbumPhotos && (
                        <ToolbarRightActionsAlbumGallery
                            uploadDisabled={uploadDisabled}
                            volumeId={volumeId}
                            shareId={shareId}
                            linkId={linkId}
                            requestDownload={requestDownload}
                            data={data}
                            onFileUpload={onFileUpload}
                            onFileSkipped={onFileSkipped}
                            nodeUid={nodeUid}
                            onDeleteAlbum={onDeleteAlbum}
                            onLeaveAlbum={onLeaveAlbum}
                            onShowDetails={onShowDetails}
                            onAddAlbumPhotos={onAddAlbumPhotos}
                            isAlbumPhotosLoading={isAlbumPhotosLoading}
                        />
                    )}

                {/* Selection Bar that appears when an item is selected (in the photo stream gallery or in album gallery) */}
                {hasSelection && !showMoreButtonDropdown && (
                    <>
                        <PhotosDownloadButton
                            showIconOnly={showIconOnly}
                            requestDownload={requestDownload}
                            selectedPhotos={selectedItems}
                        />
                        {canSavePhotos && onSavePhotos && (
                            <PhotosSavePhotoButton showIconOnly={showIconOnly} onSavePhotos={onSavePhotos} />
                        )}
                        {canSelectCover && onSelectCover && (
                            <PhotosMakeCoverButton showIconOnly={showIconOnly} onSelectCover={onSelectCover} />
                        )}
                        {canShare && openSharePhotoModal && (
                            <ShareButton buttonType="toolbar" showTitle onClick={openSharePhotoModal} />
                        )}
                        {canShareMultiple && openSharePhotosIntoAnAlbumModal && (
                            <PhotosShareMultipleLinkButton
                                showIconOnly={showIconOnly}
                                onClick={openSharePhotosIntoAnAlbumModal}
                            />
                        )}
                        {canAddPhotosFromGallery && openAddPhotosToAlbumModal && (
                            <PhotosAddToAlbumButton showIconOnly={showIconOnly} onClick={openAddPhotosToAlbumModal} />
                        )}
                        {(canRemoveAlbum || !album) && <Vr className="h-full" />}
                        {canRemoveAlbum && removeAlbumPhotos && (
                            <PhotosRemoveAlbumPhotosButton showIconOnly={showIconOnly} onClick={removeAlbumPhotos} />
                        )}
                        {!album && <PhotosTrashButton showIconOnly={showIconOnly} selectedPhotos={selectedItems} />}
                    </>
                )}
                {/* Selection Bar that appears when an item is selected (in the photo stream gallery or in album gallery) on small screen */}
                {hasSelection && showMoreButtonDropdown && (
                    <>
                        <PhotosDownloadButton
                            showIconOnly={showIconOnly}
                            requestDownload={requestDownload}
                            selectedPhotos={selectedItems}
                        />
                        {canAddPhotosFromGallery && openAddPhotosToAlbumModal && (
                            <PhotosAddToAlbumButton showIconOnly={showIconOnly} onClick={openAddPhotosToAlbumModal} />
                        )}
                        <SelectionDropdownButton>
                            {canSavePhotos && onSavePhotos && (
                                <PhotosSavePhotoButton
                                    dropDownMenuButton={true}
                                    showIconOnly={false}
                                    onSavePhotos={onSavePhotos}
                                />
                            )}
                            {canSelectCover && onSelectCover && (
                                <PhotosMakeCoverButton
                                    dropDownMenuButton={true}
                                    showIconOnly={false}
                                    onSelectCover={onSelectCover}
                                />
                            )}
                            {canShare && openSharePhotoModal && (
                                <PhotosShareLinkButton
                                    dropDownMenuButton={true}
                                    showIconOnly={false}
                                    selectedPhoto={selectedItems[0]}
                                    onClick={openSharePhotoModal}
                                />
                            )}
                            {canShareMultiple && openSharePhotosIntoAnAlbumModal && (
                                <PhotosShareMultipleLinkButton
                                    dropDownMenuButton={true}
                                    showIconOnly={false}
                                    onClick={openSharePhotosIntoAnAlbumModal}
                                />
                            )}
                            <PhotosDetailsButton
                                dropDownMenuButton={true}
                                showIconOnly={false}
                                selectedPhotos={selectedItems}
                            />
                            {canRemoveAlbum && removeAlbumPhotos && (
                                <PhotosRemoveAlbumPhotosButton
                                    dropDownMenuButton={true}
                                    showIconOnly={false}
                                    onClick={removeAlbumPhotos}
                                />
                            )}
                            {!album && (
                                <PhotosTrashButton
                                    dropDownMenuButton={true}
                                    showIconOnly={false}
                                    selectedPhotos={selectedItems}
                                />
                            )}
                        </SelectionDropdownButton>
                    </>
                )}
            </div>
        </Toolbar>
    );
};
