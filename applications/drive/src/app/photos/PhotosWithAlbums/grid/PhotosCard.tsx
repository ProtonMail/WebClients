import type { CSSProperties, FC } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { formatDuration } from 'date-fns';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Checkbox, FileIcon, Icon, Tooltip } from '@proton/components';
import { isVideo } from '@proton/shared/lib/helpers/mimetype';
import { dateLocale } from '@proton/shared/lib/i18n';
import playCircleFilledIcon from '@proton/styles/assets/img/drive/play-circle-filled.svg';
import clsx from '@proton/utils/clsx';

import SignatureIcon from '../../../components/SignatureIcon';
import { getMimeTypeDescription } from '../../../components/sections/helpers';
import { type DecryptedLink, type PhotoLink, isDecryptedLink } from '../../../store';
import { stopPropagation } from '../../../utils/stopPropagation';
import { formatVideoDuration } from './formatVideoDuration';

import './PhotosCard.scss';

type Props = {
    photo: PhotoLink;
    selected: boolean;
    onRender: (linkId: string, domRef: React.MutableRefObject<unknown>) => void;
    onRenderLoadedLink: (linkId: string, domRef: React.MutableRefObject<unknown>) => void;
    style: CSSProperties;
    onClick: () => void;
    onSelect: (isSelected: boolean) => void;
    onFavorite?: () => void;
    hasSelection: boolean;
    isFavorite: boolean;
    isOwnedByCurrentUser: boolean;
};

const getAltText = ({ mimeType, name }: DecryptedLink) =>
    `${c('Label').t`Photo`} - ${getMimeTypeDescription(mimeType || '')} - ${name}`;

export const PhotosCard: FC<Props> = ({
    style,
    onRender,
    onRenderLoadedLink,
    photo,
    onClick,
    onSelect,
    onFavorite,
    selected,
    hasSelection,
    isFavorite,
    isOwnedByCurrentUser,
}) => {
    const [imageReady, setImageReady] = useState(false);
    const ref = useRef(null);

    const isDecrypted = isDecryptedLink(photo);
    const hasName = 'name' in photo;

    // First call when photo is rendered to request caching link meta data.

    // Once we have link meta data (link has name which is missing during
    // photo listing), we can initiate thumbnail loading.
    // The separation is needed to call thumbnail queue when link is already
    // present in cache to not fetch or decrypt meta data more than once.
    useEffect(() => {
        if (!hasName) {
            onRender(photo.linkId, ref);
        } else {
            onRenderLoadedLink(photo.linkId, ref);
        }
    }, [hasName]);

    const thumbUrl = isDecrypted ? photo.cachedThumbnailUrl : undefined;
    const isThumbnailLoading = !isDecrypted || (photo.hasThumbnail && !imageReady);
    const isActive = isDecrypted && photo.activeRevision?.id;
    const isLoaded = !isThumbnailLoading && isActive;

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
                    selected && 'photos-card--selected'
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
                            <Icon
                                name={isFavorite ? 'heart-filled' : 'heart'}
                                size={5}
                                alt={c('Action').t`Mark as favorite`}
                            />
                        </button>
                    </Tooltip>
                )}

                {isLoaded ? (
                    <div className="w-full h-full relative photos-card-thumbnail-holder">
                        {thumbUrl ? (
                            <img
                                data-testid="photos-card-thumbnail"
                                src={thumbUrl}
                                alt={getAltText(photo)}
                                className="w-full h-full photos-card-thumbnail rounded"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full photos-card-thumbnail photos-card-thumbnail--empty">
                                <FileIcon mimeType={photo.mimeType || ''} size={12} />
                            </div>
                        )}

                        {(!isOwnedByCurrentUser || photo.signatureIssues || photo.isShared) && (
                            <div className="absolute bottom-0 flex left-0 ml-2 mb-2 gap-1">
                                {!isOwnedByCurrentUser &&
                                    !isFavorite &&
                                    /* saved photos are not linked with original and thus cloud icon is for now not shown until this is resolved */ false && (
                                        <div
                                            data-testid="photo-cloud-icon"
                                            className="photos-card-bottom-icon rounded-50 color-white flex items-center justify-center"
                                        >
                                            <Icon name="cloud" alt={c('Info').t`Photo is not saved to your library`} />
                                        </div>
                                    )}
                                {photo.signatureIssues && (
                                    <SignatureIcon
                                        isFile
                                        mimeType={photo.mimeType}
                                        signatureIssues={photo.signatureIssues}
                                        haveParentAccess={!!photo.parentLinkId}
                                        className="color-danger"
                                    />
                                )}
                                {photo.isShared && (
                                    <div className="photos-card-bottom-icon rounded-50 flex items-center justify-center">
                                        <Icon name="users" color="white" size={3} />
                                    </div>
                                )}
                            </div>
                        )}

                        {photo.mimeType && isVideo(photo.mimeType) && (
                            <div className="absolute bottom-0 flex right-0 mr-2 mb-2 gap-2">
                                {photo.mimeType && isVideo(photo.mimeType) && (
                                    <div
                                        className={clsx(
                                            'flex items-center pl-1',
                                            !!photo.duration && 'rounded-full photos-card-video-info'
                                        )}
                                    >
                                        {photo.duration && (
                                            <time
                                                className="text-semibold lh100 text-xs text-tabular-nums mr-0.5"
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
                        )}
                    </div>
                ) : null}
            </ButtonLike>
        </div>
    );
};
