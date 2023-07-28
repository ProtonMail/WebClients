import { FC } from 'react';

import { Toolbar } from '@proton/components';

import { PhotosUploadButton } from './PhotosUploadButton';

interface Props {
    shareId: string;
    linkId: string;
}

export const PhotosToolbar: FC<Props> = ({ shareId, linkId }) => {
    return (
        <Toolbar>
            <PhotosUploadButton shareId={shareId} linkId={linkId} />
        </Toolbar>
    );
};
