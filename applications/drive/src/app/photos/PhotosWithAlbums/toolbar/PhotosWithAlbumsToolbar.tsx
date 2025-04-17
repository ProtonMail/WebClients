import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button, InlineLinkButton, Vr } from '@proton/atoms';
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
import clsx from '@proton/utils/clsx';

import { useLinkSharingModal } from '../../../components/modals/ShareLinkModal/ShareLinkModal';
import {
    type OnFileSkippedSuccessCallbackData,
    type OnFileUploadSuccessCallbackData,
    type PhotoGridItem,
    type PhotoLink,
} from '../../../store';
import { isPhotoGroup } from '../../../store/_photos';
import { AlbumsPageTypes } from '../../../zustand/photos/layout.store';
import { unleashVanillaStore } from '../../../zustand/unleash/unleash.store';
import type { DecryptedAlbum } from '../../PhotosStore/PhotosWithAlbumsProvider';
import { PhotosAddAlbumPhotosButton } from './PhotosAddAlbumPhotosButton';
import { PhotosAddToAlbumButton } from './PhotosAddToAlbumButton';
import { PhotosAlbumShareButton } from './PhotosAlbumShareButton';
import PhotosDetailsButton from './PhotosDetailsButton';
import { PhotosDownloadButton } from './PhotosDownloadButton';
import { PhotosMakeCoverButton } from './PhotosMakeCoverButton';
import { PhotosRemoveAlbumPhotosButton } from './PhotosRemoveAlbumPhotosButton';
import PhotosShareLinkButton from './PhotosShareLinkButton';
import { PhotosShareMultipleLinkButton } from './PhotosShareMultipleLinkButton';
import PhotosTrashButton from './PhotosTrashButton';
import { PhotosUploadButton } from './PhotosUploadButton';

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
                <Icon name="three-dots-vertical" className="mr-2" /> {c('Action').t`More`}
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
    isLoading,
    onGalleryClick,
    onAlbumsClick,
    selection,
}: ToolbarLeftActionsGalleryProps) => {
    const tabs: TabOption[] = [
        {
            id: 'gallery',
            label: c('Link').t`Photos`,
            onClick: onGalleryClick,
        },
        {
            id: 'albums',
            label: c('Link').t`Albums`,
            onClick: onAlbumsClick,
        },
    ];

    return (
        <nav className="ml-2 flex flex-row flex-nowrap gap-4">
            {tabs.map((tab) => (
                <InlineLinkButton
                    key={tab.id}
                    disabled={isLoading}
                    aria-pressed={tab.id === selection}
                    className={clsx(
                        'h3 inline-flex text-bold',
                        tab.id === selection ? 'color-inherit' : 'text-no-decoration color-weak hover:color-norm'
                    )}
                    onClick={() => tab.onClick()}
                >
                    {tab.label}
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
        >
            <Icon name="arrow-left" className="mr-2 shrink-0" /> {c('Action').t`Go back`}
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
                <Icon name="plus" className={clsx(!viewportWidth.xsmall && 'mr-2')} />{' '}
                <span className={clsx(viewportWidth.xsmall && 'sr-only')}>{c('Action').t`New album`}</span>
            </Button>
        </>
    );
};

interface ToolbarRightActionsGalleryProps {
    uploadDisabled: boolean;
    shareId: string;
    linkId: string;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
    onFileSkipped?: (file: OnFileSkippedSuccessCallbackData) => void;
}

interface ToolbarRightActionsAlbumGalleryProps extends ToolbarRightActionsGalleryProps {
    requestDownload: (linkIds: string[]) => Promise<void>;
    data: PhotoGridItem[];
    album: DecryptedAlbum;
    onDeleteAlbum: () => void;
    onLeaveAlbum: () => void;
    onShowDetails: () => void;
    onAddAlbumPhotos: () => void;
}

const ToolbarRightActionsGallery = ({
    uploadDisabled,
    shareId,
    linkId,
    onFileUpload,
}: ToolbarRightActionsGalleryProps) => {
    return (
        <>{!uploadDisabled && <PhotosUploadButton shareId={shareId} linkId={linkId} onFileUpload={onFileUpload} />}</>
    );
};

const ToolbarRightActionsAlbumGallery = ({
    uploadDisabled,
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
}: ToolbarRightActionsAlbumGalleryProps) => {
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const { viewportWidth } = useActiveBreakpoint();
    const showIconOnly = !viewportWidth['>=large'];
    const showUploadButton = !album.permissions.isOwner && !uploadDisabled;
    const isAlbumsWithSharingDisabled = unleashVanillaStore.getState().isEnabled('DriveAlbumsTempDisabledOnRelease');
    return (
        <>
            {!showIconOnly && album.permissions.isOwner && (
                <PhotosAddAlbumPhotosButton onClick={onAddAlbumPhotos} type="toolbar" />
            )}
            {!showIconOnly && showUploadButton && (
                <PhotosUploadButton
                    shareId={shareId}
                    linkId={linkId}
                    onFileUpload={onFileUpload}
                    onFileSkipped={onFileSkipped}
                    isAlbumUpload
                />
            )}
            {data.length > 0 && (
                <ToolbarButton
                    onClick={() => {
                        // TODO: avoid the data loop and just execute callback
                        const linkIds: string[] = data
                            .map((d) => {
                                if (!isPhotoGroup(d)) {
                                    return d.linkId;
                                }
                                return '';
                            })
                            .filter(Boolean);
                        void requestDownload(linkIds);
                    }}
                    data-testid="toolbar-download-album"
                    title={c('Action').t`Download`}
                    className="inline-flex flex-nowrap flex-row items-center"
                >
                    <Icon
                        name="arrow-down-line"
                        className={clsx(!showIconOnly && 'mr-2')}
                        alt={c('Action').t`Download`}
                    />
                    <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Download`}</span>
                </ToolbarButton>
            )}
            {!isAlbumsWithSharingDisabled && album.permissions.isOwner && (
                <PhotosAlbumShareButton
                    showIconOnly={showIconOnly}
                    onClick={() => {
                        // TODO: avoid the data loop and just execute callback
                        showLinkSharingModal({ shareId: album.rootShareId, linkId: album.linkId });
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
                shareId={shareId}
                linkId={linkId}
                showUploadButton={showIconOnly && showUploadButton}
                showAddAlbumPhotosButton={showIconOnly && album.permissions.isOwner}
                showDeleteAlbumButton={album.permissions.isAdmin}
                showLeaveAlbumButton={!album.permissions.isOwner}
            />
            {linkSharingModal}
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
                <Icon name="three-dots-vertical" className="mr-2" /> {c('Action').t`More`}
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>{children}</DropdownMenu>
            </Dropdown>
        </>
    );
};

interface PhotosWithAlbumToolbarProps {
    shareId: string;
    linkId: string;
    selectedItems: PhotoLink[];
    data: PhotoGridItem[];
    onPreview?: () => void;
    requestDownload: (linkIds: string[]) => Promise<void>;
    uploadDisabled: boolean;
    tabSelection: AlbumsPageTypes;
    createAlbumModal: ModalStateReturnObj;
    openAddPhotosToAlbumModal?: () => void;
    openSharePhotosIntoAnAlbumModal?: () => void;
    removeAlbumPhotos?: () => Promise<void>;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
    onFileSkipped?: (file: OnFileSkippedSuccessCallbackData) => void;
    onSelectCover?: () => Promise<void>;
    album?: DecryptedAlbum;
    onDeleteAlbum?: () => void;
    onLeaveAlbum?: () => void;
    onShowDetails?: () => void;
    onAddAlbumPhotos?: () => void;
}

export const PhotosWithAlbumsToolbar: FC<PhotosWithAlbumToolbarProps> = ({
    shareId,
    linkId,
    selectedItems,
    data,
    requestDownload,
    uploadDisabled,
    tabSelection,
    createAlbumModal,
    openAddPhotosToAlbumModal,
    openSharePhotosIntoAnAlbumModal,
    removeAlbumPhotos,
    onFileUpload,
    onFileSkipped,
    onSelectCover,
    album,
    onDeleteAlbum,
    onLeaveAlbum,
    onShowDetails,
    onAddAlbumPhotos,
}) => {
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
            album.permissions.isAdmin
    );
    const canRemoveAlbum = Boolean(album && album.permissions.isEditor && removeAlbumPhotos);
    const isAlbumsWithSharingDisabled = unleashVanillaStore.getState().isEnabled('DriveAlbumsTempDisabledOnRelease');
    const canShare = Boolean(
        (!hasMultipleSelected && !album) || (!hasMultipleSelected && album && album.permissions.isAdmin)
    );
    const canShareMultiple = Boolean(hasMultipleSelected && openSharePhotosIntoAnAlbumModal && !album);
    const canAddPhotosFromGallery = Boolean(openAddPhotosToAlbumModal && tabSelection === AlbumsPageTypes.GALLERY);

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container toolbar--no-bg">
            <div className="gap-2 flex items-center">
                {tabSelection === AlbumsPageTypes.GALLERY && !hasSelection && (
                    <ToolbarRightActionsGallery uploadDisabled={uploadDisabled} shareId={shareId} linkId={linkId} />
                )}
                {tabSelection === AlbumsPageTypes.ALBUMS && (
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
                        {canSelectCover && (
                            <PhotosMakeCoverButton showIconOnly={showIconOnly} onSelectCover={onSelectCover!} />
                        )}
                        {!isAlbumsWithSharingDisabled && canShare && (
                            <PhotosShareLinkButton showIconOnly={showIconOnly} selectedLinks={selectedItems} />
                        )}
                        {!isAlbumsWithSharingDisabled && canShareMultiple && (
                            <PhotosShareMultipleLinkButton
                                showIconOnly={showIconOnly}
                                onClick={openSharePhotosIntoAnAlbumModal!}
                            />
                        )}
                        {canAddPhotosFromGallery && (
                            <PhotosAddToAlbumButton showIconOnly={showIconOnly} onClick={openAddPhotosToAlbumModal!} />
                        )}
                        {(canRemoveAlbum || !album) && <Vr className="h-full" />}
                        {canRemoveAlbum && (
                            <PhotosRemoveAlbumPhotosButton showIconOnly={showIconOnly} onClick={removeAlbumPhotos!} />
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
                        {canAddPhotosFromGallery && (
                            <PhotosAddToAlbumButton showIconOnly={showIconOnly} onClick={openAddPhotosToAlbumModal!} />
                        )}
                        <SelectionDropdownButton>
                            {canSelectCover && (
                                <PhotosMakeCoverButton
                                    dropDownMenuButton={true}
                                    showIconOnly={false}
                                    onSelectCover={onSelectCover!}
                                />
                            )}
                            {!isAlbumsWithSharingDisabled && canShare && (
                                <PhotosShareLinkButton
                                    dropDownMenuButton={true}
                                    showIconOnly={false}
                                    selectedLinks={selectedItems}
                                />
                            )}
                            <PhotosDetailsButton
                                dropDownMenuButton={true}
                                showIconOnly={false}
                                selectedLinks={selectedItems}
                            />
                            {canRemoveAlbum && (
                                <PhotosRemoveAlbumPhotosButton
                                    dropDownMenuButton={true}
                                    showIconOnly={false}
                                    onClick={removeAlbumPhotos!}
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
