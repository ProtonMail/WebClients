import { type FC } from 'react';

import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms';
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
    useConfirmActionModal,
    usePopperAnchor,
} from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useLinkSharingModal } from '../../../components/modals/ShareLinkModal/ShareLinkModal';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import {
    type OnFileSkippedSuccessCallbackData,
    type OnFileUploadSuccessCallbackData,
    type PhotoGridItem,
    type PhotoLink,
    useSharedWithMeActions,
} from '../../../store';
import { isPhotoGroup } from '../../../store/_photos';
import type { DecryptedAlbum } from '../../PhotosStore/PhotosWithAlbumsProvider';
import { PhotosAddAlbumPhotosButton } from './PhotosAddAlbumPhotosButton';
import { PhotosAlbumShareButton } from './PhotosAlbumShareButton';
import PhotosDetailsButton from './PhotosDetailsButton';
import { PhotosDownloadButton } from './PhotosDownloadButton';
import { PhotosMakeCoverButton } from './PhotosMakeCoverButton';
import { PhotosPreviewButton } from './PhotosPreviewButton';
import { PhotosRemoveAlbumPhotosButton } from './PhotosRemoveAlbumPhotosButton';
import PhotosShareLinkButton from './PhotosShareLinkButton';
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
    isOwner: boolean;
}

const AlbumGalleryDropdownButton = ({ onDelete, onShowDetails, onLeave, isOwner }: AlbumGalleryDropdownButtonProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    return (
        <>
            <DropdownButton
                shape="ghost"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                className="inline-flex flex-nowrap flex-row items-center toolbar-button"
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
                    <DropdownMenuButton className="text-left flex items-center flex-nowrap" onClick={onShowDetails}>
                        <Icon className="mr-2" name="info-circle" />
                        {c('Action').t`Details`}
                    </DropdownMenuButton>

                    {isOwner && (
                        <DropdownMenuButton className="text-left flex items-center flex-nowrap" onClick={onDelete}>
                            <Icon className="mr-2" name="trash" />
                            {c('Action').t`Delete album`}
                        </DropdownMenuButton>
                    )}
                    {!isOwner && (
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
    onShowDetails: () => void;
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
    onShowDetails,
}: ToolbarRightActionsAlbumGalleryProps) => {
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const { removeMe } = useSharedWithMeActions();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { navigateToAlbums } = useDriveNavigation();

    return (
        <>
            {!uploadDisabled && (
                <PhotosUploadButton
                    shareId={shareId}
                    linkId={linkId}
                    onFileUpload={onFileUpload}
                    onFileSkipped={onFileSkipped}
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
                    <Icon name="arrow-down-line" className="mr-2" alt={c('Action').t`Download`} />
                    {c('Action').t`Download`}
                </ToolbarButton>
            )}
            {album.permissions.isOwner && (
                <PhotosAlbumShareButton
                    onClick={() => {
                        // TODO: avoid the data loop and just execute callback
                        showLinkSharingModal({ shareId: album.rootShareId, linkId: album.linkId });
                    }}
                />
            )}

            <AlbumGalleryDropdownButton
                onDelete={onDeleteAlbum}
                onShowDetails={onShowDetails}
                onLeave={() => {
                    if (!album.sharingDetails?.shareId) {
                        return;
                    }
                    removeMe(
                        new AbortController().signal,
                        showConfirmModal,
                        album.sharingDetails.shareId,
                        navigateToAlbums
                    );
                }}
                isOwner={album.permissions.isOwner}
            />
            {linkSharingModal}
            {confirmModal}
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
    tabSelection: 'albums' | 'gallery' | 'albums-gallery';
    createAlbumModal: ModalStateReturnObj;
    addAlbumPhotosModal?: ModalStateReturnObj;
    removeAlbumPhotos?: () => Promise<void>;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
    onFileSkipped?: (file: OnFileSkippedSuccessCallbackData) => void;
    onSelectCover?: () => Promise<void>;
    album?: DecryptedAlbum;
    onDeleteAlbum?: () => void;
    onShowDetails?: () => void;
}

export const PhotosWithAlbumsToolbar: FC<PhotosWithAlbumToolbarProps> = ({
    shareId,
    linkId,
    selectedItems,
    data,
    onPreview,
    requestDownload,
    uploadDisabled,
    tabSelection,
    createAlbumModal,
    addAlbumPhotosModal,
    removeAlbumPhotos,
    onFileUpload,
    onFileSkipped,
    onSelectCover,
    album,
    onDeleteAlbum,
    onShowDetails,
}) => {
    const hasSelection = selectedItems.length > 0;
    const hasMultipleSelected = selectedItems.length > 1;

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container toolbar--no-bg">
            <div className="gap-2 flex items-center">
                {tabSelection === 'gallery' && (
                    <ToolbarRightActionsGallery uploadDisabled={uploadDisabled} shareId={shareId} linkId={linkId} />
                )}
                {tabSelection === 'albums' && <ToolbarRightActionsAlbums createAlbumModal={createAlbumModal} />}

                {tabSelection === 'albums-gallery' && !hasSelection && album && onDeleteAlbum && onShowDetails && (
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
                        onShowDetails={onShowDetails}
                    />
                )}

                {hasSelection && (
                    <>
                        {!hasMultipleSelected && <PhotosPreviewButton onClick={() => onPreview?.()} />}
                        <PhotosDownloadButton requestDownload={requestDownload} selectedLinks={selectedItems} />
                        {/* Only show set cover button if photo selected is not already the cover */}
                        {!hasMultipleSelected &&
                            onSelectCover &&
                            album &&
                            album.cover?.linkId !== selectedItems[0].linkId && (
                                <PhotosMakeCoverButton onSelectCover={onSelectCover} />
                            )}
                        {!hasMultipleSelected && <PhotosShareLinkButton selectedLinks={selectedItems} />}
                        <PhotosDetailsButton selectedLinks={selectedItems} />
                        {addAlbumPhotosModal && (
                            <PhotosAddAlbumPhotosButton onClick={() => addAlbumPhotosModal.openModal(true)} />
                        )}
                        {/* <Vr />
                        <PhotosDetailsButton selectedLinks={selectedItems} />
                        <Vr />*/}
                        {album && removeAlbumPhotos && <PhotosRemoveAlbumPhotosButton onClick={removeAlbumPhotos} />}
                        {!album && <PhotosTrashButton selectedLinks={selectedItems} />}
                    </>
                )}
            </div>
        </Toolbar>
    );
};
