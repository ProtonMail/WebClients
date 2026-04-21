import type { CSSProperties, FC } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

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
import { getDriveForPhotos, splitNodeUid } from '@proton/drive/index';
import { loadThumbnail, useThumbnail } from '@proton/drive/modules/thumbnails';
import { IcPencil } from '@proton/icons/icons/IcPencil';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import folderImagesDark from '@proton/styles/assets/img/drive/empty-image-album-dark.webp';
import folderImages from '@proton/styles/assets/img/drive/empty-image-album.webp';
import clsx from '@proton/utils/clsx';

import { SignatureIcon } from '../../../components/SignatureIcon';
import { useAlbumsStore } from '../../useAlbums.store';
import { usePhotosStore } from '../../usePhotos.store';
import { enqueueAdditionalInfo } from '../loaders/loadAdditionalInfo';
import { SharedAlbumDropdownButton } from './SharedAlbumDropdownButton';

import './AlbumsCard.scss';

type Props = {
    nodeUid: string;
    style: CSSProperties;
    onClick: () => void;
    onRename: () => void;
    onShare: () => void;
    onDelete: () => void;
};

const getAltText = (name: string) => `${c('Label').t`Album`} - ${name}`;

interface AlbumDropdownButtonprops {
    onRename: () => void;
    onShare: () => void;
    onDelete: () => void;
}

export const AlbumDropdownButton = ({ onShare, onRename, onDelete }: AlbumDropdownButtonprops) => {
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
                <IcThreeDotsVertical alt={c('Action').t`More`} />
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
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
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export const AlbumsCard: FC<Props> = ({ style, nodeUid, onClick, onShare, onRename, onDelete }) => {
    const [imageReady, setImageReady] = useState(false);
    const ref = useRef(null);

    const theme = useTheme();

    const { photoCount, coverNodeUid, name, isShared, isOwner, hasSignatureIssues, decprecatedShareId } =
        useAlbumsStore(
            useShallow((state) => {
                const item = state.albums.get(nodeUid);
                return {
                    photoCount: item?.photoCount ?? 0,
                    coverNodeUid: item?.coverNodeUid,
                    name: item?.name,
                    isShared: item?.isShared,
                    isOwner: item?.isOwner,
                    hasSignatureIssues: item?.hasSignatureIssues,
                    decprecatedShareId: item?.deprecatedShareId,
                };
            })
        );
    const albumSharedLabel = isShared && isOwner ? c('Info').t`Shared` : c('Info').t`Shared with you`;
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
            enqueueAdditionalInfo(coverNodeUid, () => Boolean(ref.current));
        } else {
            loadThumbnail(getDriveForPhotos(), {
                nodeUid: coverNodeUid,
                revisionUid: coverPhoto.activeRevisionUid,
                shouldLoad: () => Boolean(ref.current),
                thumbnailTypes: ['sd', 'hd'],
            });
        }
    }, [coverNodeUid, coverPhoto?.activeRevisionUid]);

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
        /* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */
        <ButtonLike
            as="div"
            ref={ref}
            style={style}
            className={clsx(
                'button-for-icon', // `aria-busy` buttons get extra padding, this avoids that
                'relative albums-card p-0 rounded',
                isThumbnailLoading && 'albums-card--loading'
            )}
            data-testid="albums-card"
            onClick={onClick}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="button"
            aria-busy={isThumbnailLoading}
        >
            <>
                <div className={clsx('w-full h-full relative', isThumbnailLoading && 'hidden')}>
                    {thumbnailUrl ? (
                        <img
                            data-testid="albums-card-thumbnail"
                            data-node-uid={coverNodeUid}
                            src={thumbnailUrl}
                            alt={getAltText(name ?? '')}
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
                    {isShared && (
                        <div className="absolute top-0 right-0 mr-2 mt-2 flex items-center gap-1">
                            <SignatureIcon
                                isFile={false}
                                haveSignatureIssues={!!hasSignatureIssues}
                                className="color-danger"
                            />
                            <div className="albums-card-share-icon rounded-50 flex items-center justify-center">
                                <IcUsers color="white" size={3} />
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-row flex-nowrap mt-2 items-center">
                    <div className="flex-1">
                        <div className="text-left text-lg text-semibold text-ellipsis" title={name}>
                            {name}
                        </div>
                        <div className="text-left mb-2 text color-weak text-semibold">
                            {c('Info').ngettext(msgid`${photoCount} item`, `${photoCount} items`, photoCount)}
                            {(isShared || !isOwner) && <span className="ml-1">⋅ {albumSharedLabel}</span>}
                        </div>
                    </div>
                    {isOwner && (
                        <div className="shrink-0 mb-2">
                            <AlbumDropdownButton onShare={onShare} onRename={onRename} onDelete={onDelete} />
                        </div>
                    )}
                    {!isOwner && decprecatedShareId && (
                        <div className="shrink-0 mb-2">
                            <SharedAlbumDropdownButton
                                volumeId={splitNodeUid(nodeUid).volumeId}
                                shareId={decprecatedShareId}
                                linkId={splitNodeUid(nodeUid).nodeId}
                            />
                        </div>
                    )}
                </div>
            </>
        </ButtonLike>
    );
};
