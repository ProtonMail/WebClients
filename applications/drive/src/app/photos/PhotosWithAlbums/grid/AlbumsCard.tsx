import type { CSSProperties, FC } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { formatDuration } from 'date-fns';
import { c, msgid } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { FileIcon, Icon } from '@proton/components';
import { isVideo } from '@proton/shared/lib/helpers/mimetype';
import { dateLocale } from '@proton/shared/lib/i18n';
import playCircleFilledIcon from '@proton/styles/assets/img/drive/play-circle-filled.svg';
import clsx from '@proton/utils/clsx';

import SignatureIcon from '../../../components/SignatureIcon';
import { getMimeTypeDescription } from '../../../components/sections/helpers';
import { type DecryptedLink, isDecryptedLink } from '../../../store';
import type { DecryptedAlbum } from '../../PhotosStore/PhotosWithAlbumsProvider';
import { formatVideoDuration } from './formatVideoDuration';

import './PhotosCard.scss';

type Props = {
    album: DecryptedAlbum;
    onRender: (linkId: string, domRef: React.MutableRefObject<unknown>) => void;
    onRenderLoadedLink: (linkId: string, domRef: React.MutableRefObject<unknown>) => void;
    style: CSSProperties;
    onClick: () => void;
};

const getAltText = ({ mimeType, name }: DecryptedLink) =>
    `${c('Label').t`Album`} - ${getMimeTypeDescription(mimeType || '')} - ${name}`;

export const AlbumsCard: FC<Props> = ({ style, onRender, onRenderLoadedLink, album, onClick }) => {
    const [imageReady, setImageReady] = useState(false);
    const ref = useRef(null);

    const isDecrypted = isDecryptedLink(album);
    const isCoverDecrypted = isDecryptedLink(album.cover);

    useEffect(() => {
        const hasName = album.name;
        if (!hasName) {
            onRender(album.linkId, ref);
        } else {
            onRenderLoadedLink(album.cover?.linkId || album.linkId, ref);
        }
    }, [album, onRender, onRenderLoadedLink]);

    const thumbUrl =
        (isCoverDecrypted && album.cover?.cachedThumbnailUrl) || (isDecrypted && album.cachedThumbnailUrl) || undefined;

    const isThumbnailLoading =
        !isDecrypted || (album.hasThumbnail && !imageReady) || (album.cover?.hasThumbnail && !imageReady);
    const isLoaded = !isThumbnailLoading && isDecrypted && isCoverDecrypted;

    useEffect(() => {
        if (thumbUrl) {
            const image = new Image();
            image.src = thumbUrl;
            image.onload = () => {
                setImageReady(true);
            };
        }
    }, [thumbUrl]);

    const onKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key !== ' ') {
                return;
            }

            e.preventDefault();

            onClick();
        },
        [onClick]
    );

    return (
        /* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */
        <ButtonLike
            as="div"
            ref={ref}
            style={style}
            className={clsx(
                'button-for-icon', // `aria-busy` buttons get extra padding, this avoids that
                'relative photos-card album-card p-0 border-none rounded shadow-lifted',
                isThumbnailLoading && 'photos-card--loading'
            )}
            data-testid="albums-card"
            onClick={onClick}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="button"
            aria-busy={!isLoaded}
        >
            {isLoaded ? (
                <>
                    <div className="w-full h-full relative">
                        {thumbUrl ? (
                            <img
                                data-testid="album-card-thumbnail"
                                src={thumbUrl}
                                alt={getAltText(album)}
                                className="w-full h-full photos-card-thumbnail rounded"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full photos-card-thumbnail photos-card-thumbnail--empty">
                                <FileIcon mimeType={album.mimeType || ''} size={12} />
                            </div>
                        )}
                        {(album.signatureIssues || album.isShared) && (
                            <div className="absolute top-0 right-0 mr-2 mt-2 flex items-center gap-1">
                                {album.signatureIssues && (
                                    <SignatureIcon
                                        isFile
                                        signatureIssues={album.signatureIssues}
                                        className="color-danger"
                                    />
                                )}
                                {album.isShared && (
                                    <div className="photos-card-share-icon rounded-50 flex items-center justify-center">
                                        <Icon name="users" color="white" size={3} />
                                    </div>
                                )}
                            </div>
                        )}
                        {album.mimeType && isVideo(album.mimeType) && (
                            <div className="w-full absolute bottom-0 flex justify-end items-center px-2 py-2 photos-card-video-info">
                                {album.duration && (
                                    <time
                                        className="text-semibold mr-1"
                                        dateTime={formatDuration(
                                            { seconds: Math.floor(album.duration) },
                                            {
                                                locale: dateLocale,
                                            }
                                        )}
                                    >
                                        {formatVideoDuration(album.duration)}
                                    </time>
                                )}
                                <img src={playCircleFilledIcon} alt="" />
                            </div>
                        )}
                    </div>
                    <div
                        className="text-left mt-2 text-lg text-semibold text-ellipsis"
                        title={album.name ? album.name : c('Info').t`Untitled`}
                    >
                        {album.name ? album.name : c('Info').t`Untitled`}
                    </div>
                    <div className="text-left mb-2 text color-weak text-semibold">
                        {c('Info').ngettext(
                            msgid`${album.photoCount} item`,
                            `${album.photoCount} items`,
                            album.photoCount
                        )}
                        {album.isShared && <span className="ml-1">⋅ {c('Info').t`Shared`}</span>}
                    </div>
                </>
            ) : null}
        </ButtonLike>
    );
};
