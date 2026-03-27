import type { CSSProperties, FC } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { formatDuration } from 'date-fns';
import { c, msgid } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    usePopperAnchor,
    useTheme,
} from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';
import { useThumbnail } from '@proton/drive/modules/thumbnails';
import { IcPencil } from '@proton/icons/icons/IcPencil';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { isVideo } from '@proton/shared/lib/helpers/mimetype';
import { dateLocale } from '@proton/shared/lib/i18n';
import folderImagesDark from '@proton/styles/assets/img/drive/empty-image-album-dark.webp';
import folderImages from '@proton/styles/assets/img/drive/empty-image-album.webp';
import playCircleFilledIcon from '@proton/styles/assets/img/drive/play-circle-filled.svg';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { SignatureIcon } from '../../../components/SignatureIcon';
import { getMimeTypeDescription } from '../../../components/sections/helpers';
import { type DecryptedLink, isDecryptedLink } from '../../../store';
import type { DecryptedAlbum } from '../../PhotosStore/PhotosWithAlbumsProvider';
import { usePhotosStore } from '../../usePhotos.store';
import { SharedAlbumDropdownButton } from './SharedAlbumDropdownButton';
import { formatVideoDuration } from './formatVideoDuration';

import './AlbumsCard.scss';

type Props = {
    album: DecryptedAlbum;
    onRender: (coverNodeUid: string, domRef: React.MutableRefObject<unknown>) => void;
    onRenderLoadedLink: (
        coverNodeUid: string,
        coverActiveRevisionUid: string,
        domRef: React.MutableRefObject<unknown>
    ) => void;
    style: CSSProperties;
    onClick: () => void;
    onRename: () => void;
    onShare: () => void;
    onDelete: () => void;
};

const getAltText = ({ mimeType, name }: DecryptedLink) =>
    `${c('Label').t`Album`} - ${getMimeTypeDescription(mimeType || '')} - ${name}`;

interface AlbumDropdownButtonprops {
    onRename: () => void;
    onShare: () => void;
    onDelete: () => void;
}

export const AlbumDropdownButton = ({ onShare, onRename, onDelete }: AlbumDropdownButtonprops) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const driveAlbumsDisabled = useFlag('DriveAlbumsDisabled');

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
                <IcThreeDotsVertical alt={c('Action').t`More`} />
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    {!driveAlbumsDisabled && (
                        <DropdownMenuButton
                            onClick={(e) => {
                                e.stopPropagation();
                                onRename();
                            }}
                            className="text-left flex items-center flex-nowrap"
                        >
                            <IcPencil className="mr-2" />
                            {c('Action').t`Rename album`}
                        </DropdownMenuButton>
                    )}

                    <DropdownMenuButton
                        onClick={(e) => {
                            e.stopPropagation();
                            onShare();
                        }}
                        className="text-left flex items-center flex-nowrap"
                    >
                        <IcUserPlus className="mr-2" name="user-plus" />
                        {c('Action').t`Share album`}
                    </DropdownMenuButton>

                    {!driveAlbumsDisabled && (
                        <DropdownMenuButton
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="text-left flex items-center flex-nowrap"
                        >
                            <IcTrash className="mr-2" />
                            {c('Action').t`Delete album`}
                        </DropdownMenuButton>
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export const AlbumsCard: FC<Props> = ({
    style,
    onRender,
    onRenderLoadedLink,
    album,
    onClick,
    onShare,
    onRename,
    onDelete,
}) => {
    const [imageReady, setImageReady] = useState(false);
    const ref = useRef(null);

    const isDecrypted = isDecryptedLink(album);

    const theme = useTheme();
    const { sharedBy } = album;
    const albumSharedLabel = album.sharedBy ? c('Info').t`Shared with you` : c('Info').t`Shared`;
    const albumSharedTitle = album.sharedBy ? c('Info').t`Shared by ${sharedBy}` : c('Info').t`Shared by you`;

    const coverNodeUid =
        album.albumProperties?.coverLinkId && generateNodeUid(album.volumeId, album.albumProperties?.coverLinkId);

    const coverPhoto = usePhotosStore(
        useShallow((state) => {
            const item = coverNodeUid && state.getPhotoItem(coverNodeUid);
            if (!item || item.additionalInfo === undefined) {
                return undefined;
            }
            return {
                activeRevisionUid: item.additionalInfo.activeRevisionUid,
            };
        })
    );

    const thumbnail = useThumbnail(coverPhoto?.activeRevisionUid);
    const thumbnailUrl = thumbnail?.hdUrl || thumbnail?.sdUrl;
    const isThumbnailLoading = Boolean(
        coverNodeUid &&
        (!coverPhoto ||
            (coverPhoto.activeRevisionUid && thumbnail === undefined) ||
            thumbnail?.sdStatus === 'loading' ||
            (thumbnail?.sdStatus === 'loaded' && thumbnailUrl && !imageReady))
    );

    useEffect(() => {
        if (!coverNodeUid) {
            return;
        }
        if (!coverPhoto?.activeRevisionUid) {
            onRender(coverNodeUid, ref);
        } else {
            onRenderLoadedLink(coverNodeUid, coverPhoto?.activeRevisionUid, ref);
        }
    }, [coverNodeUid, coverPhoto?.activeRevisionUid, onRender, onRenderLoadedLink]);

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

    // For translation context to be identical
    const photoCount = album.photoCount;
    return (
        /* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */
        <ButtonLike
            as="div"
            ref={ref}
            style={style}
            className={clsx(
                'button-for-icon', // `aria-busy` buttons get extra padding, this avoids that
                'relative albums-card p-0 rounded',
                (isThumbnailLoading || !isDecrypted) && 'albums-card--loading'
            )}
            data-testid="albums-card"
            onClick={onClick}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="button"
            aria-busy={isThumbnailLoading || !isDecrypted}
        >
            {isDecrypted ? (
                <>
                    <div className={clsx('w-full h-full relative', isThumbnailLoading && 'hidden')}>
                        {thumbnailUrl ? (
                            <img
                                data-testid="albums-card-thumbnail"
                                data-node-uid={coverNodeUid}
                                src={thumbnailUrl}
                                alt={getAltText(album)}
                                className="w-full h-full albums-card-thumbnail"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full albums-card-thumbnail albums-card-thumbnail--empty">
                                <img
                                    src={theme.information.dark ? folderImagesDark : folderImages}
                                    alt=""
                                    width={80}
                                    className="m-auto"
                                />
                            </div>
                        )}
                        {(album.signatureIssues || album.isShared) && (
                            <div className="absolute top-0 right-0 mr-2 mt-2 flex items-center gap-1">
                                {album.signatureIssues && (
                                    <SignatureIcon
                                        isFile
                                        haveSignatureIssues={!!album.signatureIssues}
                                        className="color-danger"
                                    />
                                )}
                                {album.isShared && (
                                    <div className="albums-card-share-icon rounded-50 flex items-center justify-center">
                                        <IcUsers color="white" size={3} />
                                    </div>
                                )}
                            </div>
                        )}
                        {album.mimeType && isVideo(album.mimeType) && (
                            <div className="w-full absolute bottom-0 flex justify-end items-center px-2 py-2 albums-card-video-info">
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
                                {c('Info').ngettext(msgid`${photoCount} item`, `${photoCount} items`, photoCount)}
                                {album.isShared && (
                                    <span title={albumSharedTitle} className="ml-1">
                                        ⋅ {albumSharedLabel}
                                    </span>
                                )}
                            </div>
                        </div>
                        {album.permissions.isOwner && (
                            <div className="shrink-0 mb-2">
                                <AlbumDropdownButton onShare={onShare} onRename={onRename} onDelete={onDelete} />
                            </div>
                        )}
                        {album.sharedBy && album.shareId && (
                            <div className="shrink-0 mb-2">
                                <SharedAlbumDropdownButton
                                    volumeId={album.volumeId}
                                    shareId={album.shareId}
                                    linkId={album.linkId}
                                />
                            </div>
                        )}
                    </div>
                </>
            ) : null}
        </ButtonLike>
    );
};
