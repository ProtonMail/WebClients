import { FC } from 'react';

import { Vr } from '@proton/atoms/Vr';
import { Toolbar } from '@proton/components';

import { DecryptedLink, PhotoLink } from '../../../../store';
import { MoveToTrashButton } from '../../Drive/ToolbarButtons';
import { DetailsButton, ShareLinkButton } from '../../ToolbarButtons';
import { PhotosDownloadButton } from './PhotosDownloadButton';
import { PhotosPreviewButton } from './PhotosPreviewButton';
import { PhotosUploadButton } from './PhotosUploadButton';

interface Props {
    shareId: string;
    linkId: string;
    selectedItems: PhotoLink[];
    onPreview: () => void;
    requestDownload: (linkIds: string[]) => Promise<void>;
}

export const PhotosToolbar: FC<Props> = ({ shareId, linkId, selectedItems, onPreview, requestDownload }) => {
    const hasSelection = selectedItems.length > 0;
    const hasMultipleSelected = selectedItems.length > 1;

    let links = selectedItems as DecryptedLink[];

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex">
                <PhotosUploadButton shareId={shareId} linkId={linkId} />
                {hasSelection && (
                    <>
                        <Vr />
                        {!hasMultipleSelected && <PhotosPreviewButton onClick={onPreview} />}
                        <PhotosDownloadButton requestDownload={requestDownload} selectedLinks={selectedItems} />
                        <ShareLinkButton selectedLinks={links} />
                        <Vr />
                        <DetailsButton selectedLinks={links} />
                        <Vr />
                        <MoveToTrashButton selectedLinks={links} />
                    </>
                )}
            </div>
        </Toolbar>
    );
};
