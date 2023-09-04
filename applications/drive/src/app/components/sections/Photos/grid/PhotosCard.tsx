import { CSSProperties, FC, useEffect } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';

import { PhotoLink } from '../../../../store/_views/usePhotosView';
import { usePortalPreview } from '../../../PortalPreview/PortalPreview';
import { getMimeTypeDescription } from '../../helpers';

type Props = {
    photo: PhotoLink;
    onRender: (item: PhotoLink) => void;
    style: CSSProperties;
    shareId: string;
};

const getAltText = ({ mimeType, name }: PhotoLink) =>
    `${c('Label').t`Photo`} - ${getMimeTypeDescription(mimeType || '')} - ${name}`;

export const PhotosCard: FC<Props> = ({ shareId, style, onRender, photo }) => {
    const [portalPreview, showPortalPreview] = usePortalPreview();
    useEffect(() => {
        onRender(photo);
    }, [photo]);

    const thumbUrl = photo.cachedThumbnailUrl;

    const isActive = photo.activeRevision?.id && photo.activeRevision?.photo?.linkId;
    return (
        <>
            {portalPreview}
            {/*// TODO: Thumbnails on click*/}
            {/*// TODO: Keyboard navigation*/}
            <ButtonLike
                as="div"
                style={style}
                className="photos-card cursor-pointer p-0 border-none"
                onClick={() =>
                    photo.activeRevision?.id &&
                    photo.activeRevision?.photo?.linkId &&
                    showPortalPreview({
                        shareId,
                        linkId: photo.activeRevision?.photo?.linkId,
                        revisionId: photo.activeRevision?.id,
                        date: photo.activeRevision.photo?.captureTime,
                    })
                }
            >
                {thumbUrl && isActive ? (
                    <img src={thumbUrl} alt={getAltText(photo)} className="photos-card--thumbnail" />
                ) : null}
            </ButtonLike>
        </>
    );
};
