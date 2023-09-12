import { CSSProperties, FC, useEffect } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { FileIcon } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import type { PhotoLink } from '../../../../store/';
import { usePortalPreview } from '../../../PortalPreview';
import { useDetailsModal } from '../../../modals/DetailsModal';
import { getMimeTypeDescription } from '../../helpers';

import './PhotosCard.scss';

type Props = {
    photo: PhotoLink;
    onRender: (linkId: string) => void;
    style: CSSProperties;
    shareId: string;
};

const getAltText = ({ mimeType, name }: PhotoLink) =>
    `${c('Label').t`Photo`} - ${getMimeTypeDescription(mimeType || '')} - ${name}`;

export const PhotosCard: FC<Props> = ({ shareId, style, onRender, photo }) => {
    const [portalPreview, showPortalPreview] = usePortalPreview();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    useEffect(() => {
        onRender(photo.linkId);
    }, [photo.linkId]);

    const thumbUrl = photo.cachedThumbnailUrl;
    const isThumbnailLoading = photo.hasThumbnail === undefined;
    const isActive = photo.activeRevision.id && photo.activeRevision.photo.linkId;

    return (
        <>
            {portalPreview}
            {detailsModal}
            {/*// TODO: Keyboard navigation*/}
            <ButtonLike
                as="div"
                style={style}
                className={clsx(
                    'photos-card p-0 border-none rounded-none',
                    isThumbnailLoading && 'photos-card--loading'
                )}
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
                {!isThumbnailLoading && !photo.hasThumbnail && isActive && (
                    <div className="flex flex-align-items-center flex-justify-center w100 h100 photos-card-thumbnail photos-card-thumbnail--empty">
                        <FileIcon mimeType={photo.mimeType || ''} size={48} />
                    </div>
                )}
                {!isThumbnailLoading && thumbUrl && isActive ? (
                    <img src={thumbUrl} alt={getAltText(photo)} className="w100 h100 photos-card-thumbnail" />
                ) : null}
            </ButtonLike>
        </>
    );
};
PhotosCard.displayName = 'PhotosCard';
