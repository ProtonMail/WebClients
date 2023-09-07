import { CSSProperties, FC, useEffect } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import clsx from '@proton/utils/clsx';

import type { PhotoLink } from '../../../../store/';
import { usePortalPreview } from '../../../PortalPreview';
import { useDetailsModal } from '../../../modals/DetailsModal';
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
    const [detailsModal, showDetailsModal] = useDetailsModal();
    useEffect(() => {
        onRender(photo);
    }, [photo]);

    const thumbUrl = photo.cachedThumbnailUrl;

    const isActive = photo.activeRevision?.id && photo.activeRevision?.photo?.linkId;
    return (
        <>
            {portalPreview}
            {detailsModal}
            {/*// TODO: Thumbnails on click*/}
            {/*// TODO: Keyboard navigation*/}
            <ButtonLike
                as="div"
                style={style}
                className={clsx('photos-card p-0 border-none rounded-none', isActive && thumbUrl && 'cursor-pointer ')}
                onClick={() =>
                    photo.activeRevision?.id &&
                    photo.activeRevision?.photo?.linkId &&
                    showPortalPreview({
                        shareId,
                        linkId: photo.activeRevision?.photo?.linkId,
                        revisionId: photo.activeRevision?.id,
                        date: photo.activeRevision.photo?.captureTime,
                        onDetails: () =>
                            photo.activeRevision?.photo?.linkId &&
                            showDetailsModal({
                                shareId,
                                linkId: photo.activeRevision?.photo?.linkId,
                            }),
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
