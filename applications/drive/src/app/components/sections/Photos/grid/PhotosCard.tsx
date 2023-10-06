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
import SignatureIcon from '../../../SignatureIcon';
import { getMimeTypeDescription } from '../../helpers';
import { formatVideoDuration } from './formatVideoDuration';

import './PhotosCard.scss';

type Props = {
    photo: PhotoLink;
    onRender: (linkId: string) => void;
    onRenderLoadedLink: (linkId: string, domRef: React.MutableRefObject<unknown>) => void;
    style: CSSProperties;
    onClick: () => void;
};

const getAltText = ({ mimeType, name }: PhotoLink) =>
    `${c('Label').t`Photo`} - ${getMimeTypeDescription(mimeType || '')} - ${name}`;

export const PhotosCard: FC<Props> = ({ style, onRender, onRenderLoadedLink, photo, onClick }) => {
    const [imageReady, setImageReady] = useState(false);
    const ref = useRef(null);

    // First call when photo is rendered to request caching link meta data.
    useEffect(() => {
        onRender(photo.linkId);
    }, [photo.linkId]);

    // Once we have link meta data (link has name which is missing during
    // photo listing), we can initiate thumbnail loading.
    // The separation is needed to call thumbanil queue when link is already
    // present in cache to not fetch or decrypt meta data more than once.
    useEffect(() => {
        if (photo.name) {
            onRenderLoadedLink(photo.linkId, ref);
        }
    }, [photo.name]);

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
            onClick={onClick}
        >
            {!isThumbnailLoading && !photo.hasThumbnail && isActive && (
                <div className="flex flex-align-items-center flex-justify-center w100 h100 photos-card-thumbnail photos-card-thumbnail--empty">
                    <FileIcon mimeType={photo.mimeType || ''} size={48} />
                </div>
            )}
            {!isThumbnailLoading && thumbUrl && isActive ? (
                <div className="w100 h100 relative">
                    <img src={thumbUrl} alt={getAltText(photo)} className="w100 h100 photos-card-thumbnail" />
                    {photo.signatureIssues && (
                        <SignatureIcon
                            isFile
                            signatureIssues={photo.signatureIssues}
                            className="absolute top right mr-2 mt-2 color-danger"
                        />
                    )}
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
