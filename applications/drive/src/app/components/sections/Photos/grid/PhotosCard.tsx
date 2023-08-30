import { CSSProperties, FC, useEffect } from 'react';

import { c } from 'ttag';

import { PhotoLink } from '../../../../store/_views/usePhotosView';
import { getMimeTypeDescription } from '../../helpers';

type Props = {
    photo: PhotoLink;
    onRender: (item: PhotoLink) => void;
    style: CSSProperties;
    shareId: string;
};

const getAltText = ({ mimeType, name }: PhotoLink) =>
    `${c('Label').t`Photo`} - ${getMimeTypeDescription(mimeType || '')} - ${name}`;

export const PhotosCard: FC<Props> = ({ style, onRender, photo }) => {
    useEffect(() => {
        onRender(photo);
    }, [photo]);

    const thumbUrl = photo.cachedThumbnailUrl;

    return (
        // TODO: Thumbnails on click
        // TODO: Keyboard navigation
        <div style={style} className="photos-card cursor-pointer">
            {thumbUrl ? <img src={thumbUrl} alt={getAltText(photo)} className="photos-card--thumbnail" /> : null}
        </div>
    );
};
