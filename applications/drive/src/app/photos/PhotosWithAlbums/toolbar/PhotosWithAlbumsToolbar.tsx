import { type FC, useState } from 'react';

import { Button, Vr } from '@proton/atoms';
import {
    ButtonGroup,
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    Toolbar,
    usePopperAnchor,
} from '@proton/components';

import type { PhotoLink } from '../../../store';
import PhotosDetailsButton from './PhotosDetailsButton';
import { PhotosDownloadButton } from './PhotosDownloadButton';
import { PhotosPreviewButton } from './PhotosPreviewButton';
import PhotosShareLinkButton from './PhotosShareLinkButton';
import PhotosTrashButton from './PhotosTrashButton';
import { PhotosUploadButton } from './PhotosUploadButton';

interface PhotosWithAlbumToolbarProps {
    shareId: string;
    linkId: string;
    selectedItems: PhotoLink[];
    onPreview: () => void;
    requestDownload: (linkIds: string[]) => Promise<void>;
    uploadDisabled: boolean;
}

interface ToolbarRightActionsProps {
    uploadDisabled: boolean;
    shareId: string;
    linkId: string;
}

const VideoDropdownButton = () => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    return (
        <>
            <DropdownButton shape="ghost" ref={anchorRef} isOpen={isOpen} onClick={toggle} hasCaret>
                Videos
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    {['Live', 'Burst'].map((i) => {
                        return (
                            <DropdownMenuButton className="text-left" key={i}>
                                {i}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
interface ToolbarLeftActionsProps {
    isLoading: boolean;
    onGalleryClick: () => void;
    onAlbumsClick: () => void;
}

interface TabOption {
    id: 'gallery' | 'albums';
    label: string;
    onClick: () => void;
}

export const ToolbarLeftActions = ({ isLoading, onGalleryClick, onAlbumsClick }: ToolbarLeftActionsProps) => {
    const [selection, setSelection] = useState<'gallery' | 'albums'>('gallery');

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
        setSelection(tab.id);
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

const ToolbarRightActions = ({ uploadDisabled, shareId, linkId }: ToolbarRightActionsProps) => {
    return (
        <>
            <ButtonGroup shape="ghost">
                <Button>All</Button>
                <Button>Favorites</Button>
                <Button>Screenshots</Button>
                <VideoDropdownButton />
            </ButtonGroup>
            {!uploadDisabled && <PhotosUploadButton shareId={shareId} linkId={linkId} />}
        </>
    );
};

export const PhotosWithAlbumsToolbar: FC<PhotosWithAlbumToolbarProps> = ({
    shareId,
    linkId,
    selectedItems,
    onPreview,
    requestDownload,
    uploadDisabled,
}) => {
    const hasSelection = selectedItems.length > 0;
    const hasMultipleSelected = selectedItems.length > 1;

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex">
                <ToolbarRightActions uploadDisabled={uploadDisabled} shareId={shareId} linkId={linkId} />

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
