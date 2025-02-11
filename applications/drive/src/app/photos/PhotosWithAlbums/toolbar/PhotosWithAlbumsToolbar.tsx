import { type FC } from 'react';

import { Button, Vr } from '@proton/atoms';
import { ButtonGroup, Icon, type ModalStateReturnObj, Toolbar } from '@proton/components';

import type { OnFileUploadSuccessCallbackData, PhotoLink } from '../../../store';
import PhotosDetailsButton from './PhotosDetailsButton';
import { PhotosDownloadButton } from './PhotosDownloadButton';
import { PhotosPreviewButton } from './PhotosPreviewButton';
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

export const ToolbarLeftActionsGallery = ({
    isLoading,
    onGalleryClick,
    onAlbumsClick,
    selection,
}: ToolbarLeftActionsGalleryProps) => {
    const tabs: TabOption[] = [
        {
            id: 'gallery',
            label: 'Gallery',
            onClick: onGalleryClick,
        },
        {
            id: 'albums',
            label: 'Albums',
            onClick: onAlbumsClick,
        },
    ];

    const handleClick = (tab: TabOption) => {
        tab.onClick();
    };

    const getButtonStyles = (tabId: TabOption['id']) => ({
        style:
            selection === tabId
                ? {
                      backgroundColor: 'transparent',
                      color: 'var(--interaction-weak-contrast)',
                  }
                : {},
        className: selection === tabId ? 'text-bold' : '',
        loading: selection === tabId && isLoading,
        selected: selection === tabId,
    });

    return (
        <ButtonGroup shape="ghost" color="weak">
            {tabs.map((tab) => (
                <Button key={tab.id} color="weak" {...getButtonStyles(tab.id)} onClick={() => handleClick(tab)}>
                    {tab.label}
                </Button>
            ))}
        </ButtonGroup>
    );
};

interface ToolbarLeftActionsAlbumsGalleryProps {
    isLoading: boolean;
    onAlbumsClick: () => void;
    name: string;
}

export const ToolbarLeftActionsAlbumsGallery = ({
    isLoading,
    onAlbumsClick,
    name,
}: ToolbarLeftActionsAlbumsGalleryProps) => {
    const getButtonStyles = () => ({
        loading: isLoading,
        selected: false,
    });

    return (
        <>
            <Button color="weak" {...getButtonStyles()} onClick={onAlbumsClick}>
                Albums
            </Button>
            <Icon name="chevron-right" />
            <span>{name}</span>
        </>
    );
};

interface ToolbarRightActionsAlbumsProps {
    createAlbumModal: ModalStateReturnObj;
}

const ToolbarRightActionsAlbums = ({ createAlbumModal }: ToolbarRightActionsAlbumsProps) => {
    const { openModal } = createAlbumModal;
    return (
        <>
            <ButtonGroup shape="ghost">
                <Button
                    icon={true}
                    onClick={() => {
                        openModal(true);
                    }}
                >
                    <Icon name="plus" alt={'Create album'} />
                </Button>
            </ButtonGroup>
        </>
    );
};

interface ToolbarRightActionsGalleryProps {
    uploadDisabled: boolean;
    shareId: string;
    linkId: string;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
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

interface PhotosWithAlbumToolbarProps {
    shareId: string;
    linkId: string;
    selectedItems: PhotoLink[];
    onPreview: () => void;
    requestDownload: (linkIds: string[]) => Promise<void>;
    uploadDisabled: boolean;
    tabSelection: 'albums' | 'gallery' | 'albums-gallery';
    createAlbumModal: ModalStateReturnObj;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
}

export const PhotosWithAlbumsToolbar: FC<PhotosWithAlbumToolbarProps> = ({
    shareId,
    linkId,
    selectedItems,
    onPreview,
    requestDownload,
    uploadDisabled,
    tabSelection,
    createAlbumModal,
    onFileUpload,
}) => {
    const hasSelection = selectedItems.length > 0;
    const hasMultipleSelected = selectedItems.length > 1;

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex">
                {tabSelection === 'gallery' && (
                    <ToolbarRightActionsGallery uploadDisabled={uploadDisabled} shareId={shareId} linkId={linkId} />
                )}
                {tabSelection === 'albums' && <ToolbarRightActionsAlbums createAlbumModal={createAlbumModal} />}

                {tabSelection === 'albums-gallery' && (
                    // TODO: Album Gallery dedicated toolbar
                    <ToolbarRightActionsGallery
                        uploadDisabled={uploadDisabled}
                        shareId={shareId}
                        linkId={linkId}
                        onFileUpload={onFileUpload}
                    />
                )}

                {/* Some photos are selected */}
                {hasSelection && (
                    <>
                        {!uploadDisabled && <Vr />}
                        {!hasMultipleSelected && <PhotosPreviewButton onClick={onPreview} />}
                        <PhotosDownloadButton requestDownload={requestDownload} selectedLinks={selectedItems} />
                        {!hasMultipleSelected && <PhotosShareLinkButton selectedLinks={selectedItems} />}
                        <Vr />
                        <PhotosDetailsButton selectedLinks={selectedItems} />
                        <Vr />
                        <PhotosTrashButton selectedLinks={selectedItems} />
                    </>
                )}
            </div>
        </Toolbar>
    );
};
