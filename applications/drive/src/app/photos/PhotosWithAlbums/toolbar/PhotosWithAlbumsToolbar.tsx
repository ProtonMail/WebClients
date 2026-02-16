import type { FC, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

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
import { generateNodeUid } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import type { IconName } from '@proton/icons/types';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useSharingModal } from '../../../modals/SharingModal/SharingModal';
import type {
    OnFileSkippedSuccessCallbackData,
    OnFileUploadSuccessCallbackData,
    PhotoGridItem,
    PhotoLink,
} from '../../../store';
import { isPhotoGroup } from '../../../store/_photos';
import { AlbumsPageTypes } from '../../../zustand/photos/layout.store';
import type { DecryptedAlbum } from '../../PhotosStore/PhotosWithAlbumsProvider';
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
    isLoading,
    onAlbumsClick,
    //name, // not sure if we should keep it?
}: ToolbarLeftActionsAlbumsGalleryProps) => {
    const getButtonStyles = () => ({
        loading: isLoading,
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
    requestDownload: (linkIds: { linkId: string; shareId: string }[]) => Promise<void>;
    data: PhotoGridItem[];
    album: DecryptedAlbum;
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
    album,
    data,
    onDeleteAlbum,
    onLeaveAlbum,
    onShowDetails,
    onAddAlbumPhotos,
    isAlbumPhotosLoading,
}: ToolbarRightActionsAlbumGalleryProps) => {
    const driveAlbumsDisabled = useFlag('DriveAlbumsDisabled');
    const { sharingModal, showSharingModal } = useSharingModal();
    const { viewportWidth } = useActiveBreakpoint();
    const showIconOnly = !viewportWidth['>=large'];
    const showUploadButton = !album.permissions.isOwner && !uploadDisabled;
    const showAddAlbumsButton =
        (album.permissions.isOwner || album.permissions.isAdmin || album.permissions.isEditor) && !driveAlbumsDisabled;
    const [isDownloading, withDownloading] = useLoading();
    const [pendingDownload, setPendingDownload] = useState(false);
    const wasLoadingRef = useRef(isAlbumPhotosLoading);

    const extractLinkIdsFromData = (data: PhotoGridItem[]): { linkId: string; shareId: string }[] => {
        return data
            .map((photoItem) => {
                if (!isPhotoGroup(photoItem)) {
                    return { linkId: photoItem.linkId, shareId: photoItem.rootShareId };
                }
                return {
                    linkId: '',
                    shareId: '',
                };
            })
            .filter((photoItem) => photoItem.linkId && photoItem.shareId);
    };

    // Track when pagination finishes and trigger pending download with latest data
    // This prevent request download before all photos ids have been fetched.
    useEffect(() => {
        if (wasLoadingRef.current && !isAlbumPhotosLoading && pendingDownload) {
            setPendingDownload(false);
            const linkIds = extractLinkIdsFromData(data);
            void withDownloading(requestDownload(linkIds)).catch(noop);
        }
        wasLoadingRef.current = isAlbumPhotosLoading;
    }, [isAlbumPhotosLoading, pendingDownload, data, requestDownload, withDownloading]);

    // If the isAlbumPhotosLoading is false, we can requestDownload right away
    const handleDownloadClick = () => {
        if (isAlbumPhotosLoading) {
            setPendingDownload(true);
        } else {
            const linkIds = extractLinkIdsFromData(data);
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

            {album.permissions.isOwner && (
                <PhotosAlbumShareButton
                    showIconOnly={showIconOnly}
                    onClick={() => {
                        // TODO: avoid the data loop and just execute callback
                        showSharingModal({ nodeUid: generateNodeUid(album.volumeId, album.linkId) });
                    }}
                />
            )}
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
                showDeleteAlbumButton={album.permissions.isAdmin && !driveAlbumsDisabled}
                showLeaveAlbumButton={!album.permissions.isOwner && !driveAlbumsDisabled}
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
    selectedItems: PhotoLink[];
    data: PhotoGridItem[];
    onPreview?: () => void;
    requestDownload: (linkIds: { linkId: string; shareId: string }[]) => Promise<void>;
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
    album?: DecryptedAlbum;
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
    album,
    onDeleteAlbum,
    onLeaveAlbum,
    onShowDetails,
    onAddAlbumPhotos,
    onSavePhotos,
    isAlbumPhotosLoading,
}) => {
    const driveAlbumsDisabled = useFlag('DriveAlbumsDisabled');
    const { viewportWidth } = useActiveBreakpoint();
    const hasSelection = selectedItems.length > 0;
    const hasMultipleSelected = selectedItems.length > 1;
    const showMoreButtonDropdown = viewportWidth['<=medium'];
    const showIconOnly =
        !viewportWidth['>=large'] || (!hasMultipleSelected && viewportWidth['>=large'] && viewportWidth.large);
    // Only show set cover button if photo selected is not already the cover
    const canSelectCover = Boolean(
        !hasMultipleSelected &&
        onSelectCover &&
        album &&
        selectedItems.length &&
        album.cover?.linkId !== selectedItems[0].linkId &&
        album.permissions.isAdmin &&
        !driveAlbumsDisabled
    );
    const canSavePhotos = Boolean(
        album &&
        hasSelection &&
        rootLinkId &&
        onSavePhotos &&
        selectedItems.every(({ parentLinkId }) => parentLinkId !== rootLinkId)
    );
    const canRemoveAlbum = Boolean(album && album.permissions.isEditor && removeAlbumPhotos && !driveAlbumsDisabled);
    const canShare = Boolean(
        (openSharePhotoModal && !hasMultipleSelected && !album) ||
        (!hasMultipleSelected && album && album.permissions.isAdmin)
    );
    const canShareMultiple = Boolean(hasMultipleSelected && openSharePhotosIntoAnAlbumModal && !album);
    const canAddPhotosFromGallery = Boolean(
        openAddPhotosToAlbumModal && tabSelection === AlbumsPageTypes.GALLERY && !driveAlbumsDisabled
    );

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
                {tabSelection === AlbumsPageTypes.ALBUMS && !driveAlbumsDisabled && (
                    <ToolbarRightActionsAlbums createAlbumModal={createAlbumModal} />
                )}

                {tabSelection === AlbumsPageTypes.ALBUMSGALLERY &&
                    !hasSelection &&
                    album &&
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
                            album={album}
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
                            selectedLinks={selectedItems}
                        />
                        {canSavePhotos && onSavePhotos && (
                            <PhotosSavePhotoButton showIconOnly={showIconOnly} onSavePhotos={onSavePhotos} />
                        )}
                        {canSelectCover && onSelectCover && (
                            <PhotosMakeCoverButton showIconOnly={showIconOnly} onSelectCover={onSelectCover} />
                        )}
                        {canShare && openSharePhotoModal && (
                            <PhotosShareLinkButton
                                showIconOnly={showIconOnly}
                                selectedLink={selectedItems[0]}
                                onClick={openSharePhotoModal}
                            />
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
                        {!album && <PhotosTrashButton showIconOnly={showIconOnly} selectedLinks={selectedItems} />}
                    </>
                )}
                {/* Selection Bar that appears when an item is selected (in the photo stream gallery or in album gallery) on small screen */}
                {hasSelection && showMoreButtonDropdown && (
                    <>
                        <PhotosDownloadButton
                            showIconOnly={showIconOnly}
                            requestDownload={requestDownload}
                            selectedLinks={selectedItems}
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
                                    selectedLink={selectedItems[0]}
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
                                selectedLinks={selectedItems}
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
                                    selectedLinks={selectedItems}
                                />
                            )}
                        </SelectionDropdownButton>
                    </>
                )}
            </div>
        </Toolbar>
    );
};
