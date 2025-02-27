import type { CSSProperties, FC } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { formatDuration } from 'date-fns';
import { c, msgid } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Dropdown, DropdownButton, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components';
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

export const AlbumDropdownButton = () => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                shape="ghost"
                color="weak"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                }}
                icon
                className="inline-flex flex-nowrap flex-row items-center relative z-up border-none"
            >
                <Icon name="three-dots-vertical" alt={c('Action').t`More`} />
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    <DropdownMenuButton className="text-left flex items-center flex-nowrap">
                        <Icon className="mr-2" name="pencil" />
                        {c('Action').t`Rename album`}
                    </DropdownMenuButton>
                    <DropdownMenuButton className="text-left flex items-center flex-nowrap">
                        <Icon className="mr-2" name="user-plus" />
                        {c('Action').t`Share album`}
                    </DropdownMenuButton>
                    <DropdownMenuButton className="text-left flex items-center flex-nowrap">
                        <Icon className="mr-2" name="trash" />
                        {c('Action').t`Delete album`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

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
    const isLoaded = !isThumbnailLoading && isDecrypted;

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
                                className="w-full h-full photos-card-thumbnail"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full photos-card-thumbnail photos-card-thumbnail--empty">
                                <Icon name="album" size={6} />
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
                    <div className="flex flex-row flex-nowrap mt-2 items-center">
                        <div className="flex-1">
                            <div
                                className="text-left text-lg text-semibold text-ellipsis"
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
                        </div>
                        <div className="shrink-0 mb-2">
                            <AlbumDropdownButton />
                        </div>
                    </div>
                </>
            ) : null}
        </ButtonLike>
    );
};
