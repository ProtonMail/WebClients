import type { FC } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';

import type { PhotoLink } from '../../../../store';
import PhotosDetailsButton from './PhotosDetailsButton';
import { PhotosDownloadButton } from './PhotosDownloadButton';
import { PhotosPreviewButton } from './PhotosPreviewButton';
import PhotosShareLinkButton from './PhotosShareLinkButton';
import PhotosTrashButton from './PhotosTrashButton';
import { PhotosUploadButton } from './PhotosUploadButton';

interface Props {
    shareId: string;
    linkId: string;
    selectedItems: PhotoLink[];
    onPreview: () => void;
    requestDownload: (linkIds: string[]) => Promise<void>;
    uploadDisabled: boolean;
}

export const PhotosToolbar: FC<Props> = ({
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
                {!uploadDisabled && <PhotosUploadButton shareId={shareId} linkId={linkId} />}
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
