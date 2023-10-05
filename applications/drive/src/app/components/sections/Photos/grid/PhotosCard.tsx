import React, { CSSProperties, FC, useEffect, useRef, useState } from 'react';

import { formatDuration } from 'date-fns';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { FileIcon } from '@proton/components/components';
import { isVideo } from '@proton/shared/lib/helpers/mimetype';
import { dateLocale } from '@proton/shared/lib/i18n';
import playCircleFilledIcon from '@proton/styles/assets/img/drive/play-circle-filled.svg';
import clsx from '@proton/utils/clsx';

import type { PhotoLink } from '../../../../store/';
import { getMimeTypeDescription } from '../../helpers';
import { formatVideoDuration } from './formatVideoDuration';

import './PhotosCard.scss';

type Props = {
    photo: PhotoLink;
    onRender: (linkId: string, domRef: React.MutableRefObject<unknown>) => void;
    style: CSSProperties;
    onClick: (photo: PhotoLink) => void;
};

const getAltText = ({ mimeType, name }: PhotoLink) =>
    `${c('Label').t`Photo`} - ${getMimeTypeDescription(mimeType || '')} - ${name}`;

export const PhotosCard: FC<Props> = ({ style, onRender, photo, onClick }) => {
    const [imageReady, setImageReady] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        onRender(photo.linkId, ref);
    }, [photo.linkId]);

    const thumbUrl = photo.cachedThumbnailUrl;
    const isThumbnailLoading = photo.hasThumbnail === undefined || (photo.hasThumbnail && !imageReady);
    const isActive = !!photo.activeRevision.id && !!photo.activeRevision.photo.linkId;

    useEffect(() => {
        if (thumbUrl) {
            const image = new Image();
            image.src = thumbUrl;
            image.onload = () => {
                setImageReady(true);
            };
        }
    }, [thumbUrl]);

    /*// TODO: Keyboard navigation*/
    return (
        <ButtonLike
            as="div"
            ref={ref}
            style={style}
            disabled={isThumbnailLoading}
            className={clsx('photos-card p-0 border-none rounded-none', isThumbnailLoading && 'photos-card--loading')}
            onClick={() => onClick(photo)}
        >
            {!isThumbnailLoading && !photo.hasThumbnail && isActive && (
                <div className="flex flex-align-items-center flex-justify-center w100 h100 photos-card-thumbnail photos-card-thumbnail--empty">
                    <FileIcon mimeType={photo.mimeType || ''} size={48} />
                </div>
            )}
            {!isThumbnailLoading && thumbUrl && isActive ? (
                <div className="w100 h100 relative">
                    <img src={thumbUrl} alt={getAltText(photo)} className="w100 h100 photos-card-thumbnail" />
                    {photo.mimeType && isVideo(photo.mimeType) && (
                        <div className="w100 absolute bottom flex flex-justify-end flex-align-items-center px-2 py-2 photos-card-video-info">
                            {photo.duration && (
                                <time
                                    className="color-invert text-semibold mr-0.5"
                                    dateTime={formatDuration(
                                        { seconds: Math.floor(photo.duration) },
                                        {
                                            locale: dateLocale,
                                        }
                                    )}
                                >
                                    {formatVideoDuration(photo.duration)}
                                </time>
                            )}
                            <img src={playCircleFilledIcon} alt="" />
                        </div>
                    )}
                </div>
            ) : null}
        </ButtonLike>
    );
};
