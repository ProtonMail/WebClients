import type { CSSProperties, FC } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { formatDuration } from 'date-fns';
import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Checkbox, FileIcon } from '@proton/components';
import { useThumbnail } from '@proton/drive/modules/thumbnails';
import { IcCloud } from '@proton/icons/icons/IcCloud';
import { IcHeart } from '@proton/icons/icons/IcHeart';
import { IcHeartFilled } from '@proton/icons/icons/IcHeartFilled';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { isVideo } from '@proton/shared/lib/helpers/mimetype';
import { dateLocale } from '@proton/shared/lib/i18n';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import playCircleFilledIcon from '@proton/styles/assets/img/drive/play-circle-filled.svg';
import clsx from '@proton/utils/clsx';

import { SignatureIcon } from '../../../components/SignatureIcon';
import { getMimeTypeDescription } from '../../../components/sections/helpers';
import { stopPropagation } from '../../../utils/stopPropagation';
import { usePhotosStore } from '../../usePhotos.store';
import { formatVideoDuration } from './formatVideoDuration';

import './PhotosCard.scss';

type Props = {
    nodeUid: string;
    selected: boolean;
    onRender: (nodeUid: string, domRef: React.MutableRefObject<unknown>) => void;
    onRenderLoadedLink: (nodeUid: string, activeRevisionUid: string, domRef: React.MutableRefObject<unknown>) => void;
    style: CSSProperties;
    onClick: () => void;
    onSelect: (isSelected: boolean) => void;
    onFavorite?: () => void;
    hasSelection: boolean;
    isOwnedByCurrentUser: boolean;
};

const getAltText = ({ mediaType, name }: { mediaType: string; name: string }) =>
    `${c('Label').t`Photo`} - ${getMimeTypeDescription(mediaType)} - ${name}`;

export const PhotosCard: FC<Props> = ({
    style,
    onRender,
    onRenderLoadedLink,
    nodeUid,
    onClick,
    onSelect,
    onFavorite,
    selected,
    hasSelection,
    isOwnedByCurrentUser,
}) => {
    const { photoInfo, isFavorite } = usePhotosStore(
        useShallow((state) => {
            const item = state.getPhotoItem(nodeUid);
            if (!item?.additionalInfo) {
                return { photoInfo: undefined, isFavorite: false };
            }

            return {
                photoInfo: {
                    name: item.additionalInfo.name,
                    mediaType: item.additionalInfo.mediaType || '',
                    haveSignatureIssues: item.additionalInfo.haveSignatureIssues,
                    isShared: item.additionalInfo.isShared,
                    duration: item.additionalInfo.duration,
                    activeRevisionUid: item.additionalInfo.activeRevisionUid,
                },
                isFavorite: item.tags.includes(PhotoTag.Favorites),
            };
        })
    );

    const [imageReady, setImageReady] = useState(false);
    const ref = useRef(null);

    // First call when photo is rendered to request caching link meta data.

    // Once we have link meta data (link has name which is missing during
    // photo listing), we can initiate thumbnail loading.
    // The separation is needed to call thumbnail queue when link is already
    // present in cache to not fetch or decrypt meta data more than once.
    useEffect(() => {
        if (!photoInfo?.activeRevisionUid) {
            onRender(nodeUid, ref);
        } else {
            onRenderLoadedLink(nodeUid, photoInfo.activeRevisionUid, ref);
        }
    }, [nodeUid, onRender, onRenderLoadedLink, photoInfo]);

    const thumbnail = useThumbnail(photoInfo?.activeRevisionUid);
    const thumbnailUrl = thumbnail?.hdUrl || thumbnail?.sdUrl;
    const isThumbnailLoading = Boolean(thumbnail?.sdStatus === 'loading' || (thumbnailUrl && !imageReady));
    const isLoaded = thumbnail !== undefined && !isThumbnailLoading && Boolean(photoInfo);

    useEffect(() => {
        if (thumbnailUrl) {
            const image = new Image();
            image.src = thumbnailUrl;
            image.onload = () => {
                setImageReady(true);
            };
        }
    }, [thumbnailUrl]);

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
        <div className="new-photos">
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <ButtonLike
                as="div"
                ref={ref}
                style={style}
                className={clsx(
                    'button-for-icon', // `aria-busy` buttons get extra padding, this avoids that
                    'relative photos-card p-0 border-none rounded',
                    isThumbnailLoading && 'photos-card--loading',
                    !hasSelection && 'photos-card--hide-checkbox',
                    selected && 'photos-card--selected',
                    isFavorite && 'photos-card--favorited'
                )}
                data-testid="photos-card"
                onClick={onClick}
                onKeyDown={onKeyDown}
                tabIndex={0}
                role="button"
                aria-busy={!isLoaded}
            >
                <Checkbox
                    className="absolute top-0 left-0 ml-2 mt-2 scale-fade-in"
                    data-testid="photos-card-checkbox"
                    checked={selected}
                    onClick={stopPropagation}
                    onKeyDown={(e) => {
                        if (e.key !== 'Shift') {
                            e.stopPropagation();
                        }
                    }}
                    onChange={() => {
                        onSelect(!selected);
                    }}
                    // If we are in select mode, then we don't need to focus the checkbox
                    // as the main card action is already bound to select
                    tabIndex={hasSelection ? -1 : 0}
                    aria-label={
                        // translator: This string is used by screen readers to inform the user of a selection action
                        c('Info').t`Select item`
                    }
                ></Checkbox>
                {Boolean(!hasSelection && onFavorite) && (
                    <Tooltip
                        title={isFavorite ? c('Action').t`Remove from favorites` : c('Action').t`Mark as favorite`}
                    >
                        <button
                            type="button"
                            className="absolute top-0 right-0 mr-2 mt-2 scale-fade-in photos-card-favorite-button color-white-on-hover"
                            aria-pressed={isFavorite}
                            onClick={(e) => {
                                e.stopPropagation();
                                onFavorite?.();
                            }}
                        >
                            {isFavorite ? (
                                <IcHeartFilled size={5} alt={c('Action').t`Remove from favorites`} />
                            ) : (
                                <IcHeart size={5} alt={c('Action').t`Mark as favorite`} />
                            )}
                        </button>
                    </Tooltip>
                )}

                {isLoaded && photoInfo ? (
                    <div className="w-full h-full relative photos-card-thumbnail-holder">
                        {thumbnailUrl ? (
                            <img
                                data-testid="photos-card-thumbnail"
                                data-node-uid={nodeUid}
                                src={thumbnailUrl}
                                alt={getAltText({ name: photoInfo.name, mediaType: photoInfo.mediaType })}
                                className="w-full h-full photos-card-thumbnail rounded"
                            />
                        ) : (
                            <div
                                className="flex items-center justify-center w-full h-full photos-card-thumbnail photos-card-thumbnail--empty"
                                data-testid={getAltText({ name: photoInfo.name, mediaType: photoInfo.mediaType })}
                            >
                                <FileIcon mimeType={photoInfo.mediaType} size={12} />
                            </div>
                        )}

                        {(!isOwnedByCurrentUser || photoInfo.haveSignatureIssues || photoInfo.isShared) && (
                            <div className="absolute bottom-0 flex left-0 ml-2 mb-2 gap-1">
                                {!isOwnedByCurrentUser &&
                                    !isFavorite &&
                                    /* saved photos are not linked with original and thus cloud icon is for now not shown until this is resolved */ false && (
                                        <div
                                            data-testid="photo-cloud-icon"
                                            className="photos-card-bottom-icon rounded-50 color-white flex items-center justify-center"
                                        >
                                            <IcCloud alt={c('Info').t`Photo is not saved to your library`} />
                                        </div>
                                    )}
                                {photoInfo.haveSignatureIssues && (
                                    <SignatureIcon
                                        isFile
                                        haveSignatureIssues={photoInfo.haveSignatureIssues}
                                        className="color-danger"
                                    />
                                )}
                                {photoInfo.isShared && (
                                    <div className="photos-card-bottom-icon rounded-50 flex items-center justify-center">
                                        <IcUsers color="white" size={3} />
                                    </div>
                                )}
                            </div>
                        )}

                        {photoInfo.mediaType && isVideo(photoInfo.mediaType) && (
                            <div className="absolute bottom-0 flex right-0 mr-2 mb-2 gap-2">
                                <div
                                    className={clsx(
                                        'flex items-center pl-1',
                                        !!photoInfo.duration && 'rounded-full photos-card-video-info'
                                    )}
                                >
                                    {photoInfo.duration && (
                                        <time
                                            className="text-semibold lh100 text-xs text-tabular-nums mr-0.5"
                                            dateTime={formatDuration(
                                                { seconds: Math.floor(photoInfo.duration) },
                                                {
                                                    locale: dateLocale,
                                                }
                                            )}
                                        >
                                            {formatVideoDuration(photoInfo.duration)}
                                        </time>
                                    )}
                                    <img src={playCircleFilledIcon} alt="" />
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
            </ButtonLike>
        </div>
    );
};
