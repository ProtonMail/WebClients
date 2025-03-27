import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/index';
import {
    Icon,
    type ModalStateReturnObj,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    useModalStateObject,
} from '@proton/components';

import { getMimeTypeDescription } from '../../components/sections/helpers';
import { type DecryptedLink, type PhotoLink, isDecryptedLink } from '../../store';
import type { DecryptedAlbum } from '../PhotosStore/PhotosWithAlbumsProvider';
import { CreateAlbumModal } from './CreateAlbumModal';

import './AlbumPhotoSelection.scss';

const getAltText = ({ mimeType, name }: DecryptedLink) =>
    `${c('Label').t`Album`} - ${getMimeTypeDescription(mimeType || '')} - ${name}`;

const AlbumSquare = ({
    album,
    loading,
    disabled,
    onClick,
}: {
    album: DecryptedAlbum;
    loading: boolean;
    disabled: boolean;
    onClick: (linkId: string) => void;
}) => {
    const isDecrypted = isDecryptedLink(album);
    const isCoverDecrypted = isDecryptedLink(album.cover);
    const thumbUrl =
        (isCoverDecrypted && album.cover?.cachedThumbnailUrl) || (isDecrypted && album.cachedThumbnailUrl) || undefined;

    return (
        <li key={album.linkId}>
            <Button
                className="relative w-full flex flex-nowrap items-center justify-start gap-2 pl-0 album-photo-selection"
                onClick={() => onClick(album.linkId)}
                disabled={disabled}
                loading={loading}
                shape="ghost"
                aria-label={c('Action').ngettext(
                    msgid`Add to "${album.name}" (${album.photoCount} photo)`,
                    `Add to "${album.name}" (${album.photoCount} photos)`,
                    album.photoCount
                )}
            >
                {thumbUrl ? (
                    <img
                        data-testid="album-card-thumbnail"
                        src={thumbUrl}
                        alt={getAltText(album)}
                        className="object-cover w-custom h-custom rounded overflow-hidden"
                        style={{
                            '--w-custom': '2.5rem',
                            '--h-custom': '2.5rem',
                        }}
                    />
                ) : (
                    <div
                        className="object-cover w-custom h-custom rounded overflow-hidden flex justify-center items-center bg-strong p-1"
                        style={{
                            '--w-custom': '2.5rem',
                            '--h-custom': '2.5rem',
                        }}
                    >
                        <Icon name="album" />
                    </div>
                )}
                <span className="grow-2 text-left text-ellipsis">{album.name}</span>
                {!loading && <span className="color-weak text-tabular-nums">{album.photoCount}</span>}
            </Button>
        </li>
    );
};

export const AddAlbumPhotosModal = ({
    photos,
    addAlbumPhotosModal,
    onCreateAlbumWithPhotos,
    onAddAlbumPhotos,
    albums,
    share,
}: {
    addAlbumPhotosModal: ModalStateReturnObj;
    onCreateAlbumWithPhotos: (name: string, linkIds: string[]) => Promise<void>;
    onAddAlbumPhotos: (albumLinkId: string, linkIds: string[]) => Promise<void>;
    photos: PhotoLink[];
    albums: DecryptedAlbum[];
    share: boolean;
}) => {
    const { modalProps, openModal, render } = addAlbumPhotosModal;
    const createAlbumModal = useModalStateObject();

    const sortedAlbums = albums.sort((a, b) => b.createTime - a.createTime);
    const [latestAlbum, secondLatestAlbum, ...otherAlbums] = sortedAlbums;

    const sharedAlbums = sortedAlbums.filter((album) => album.isShared);
    const notSharedAlbums = sortedAlbums.filter((album) => !album.isShared);
    const restAlbums = share ? notSharedAlbums : otherAlbums;

    const [activeAlbumId, setActiveAlbumId] = useState<string | undefined>();

    const handleSelectAlbum = async (linkId: string) => {
        setActiveAlbumId(linkId);
        const photosLinkIds = photos.map((photo) => photo.linkId);
        await onAddAlbumPhotos(linkId, photosLinkIds);
        setActiveAlbumId(undefined);
    };

    return (
        <>
            {render && (
                <ModalTwo {...modalProps} as="form" size="small">
                    <ModalTwoHeader
                        closeButtonProps={{
                            disabled: !!activeAlbumId,
                        }}
                        title={
                            share
                                ? c('Heading').ngettext(
                                      msgid`Share ${photos.length} photo via`,
                                      `Share ${photos.length} photos via`,
                                      photos.length
                                  )
                                : c('Heading').ngettext(
                                      msgid`Add ${photos.length} photo to`,
                                      `Add ${photos.length} photos to`,
                                      photos.length
                                  )
                        }
                    />
                    <ModalTwoContent className="max-h-custom" style={{ '--max-h-custom': '21.25rem' }}>
                        <Button
                            disabled={!!activeAlbumId}
                            className="relative w-full flex items-center gap-2 pl-0 album-photo-selection"
                            onClick={() => {
                                createAlbumModal.openModal(true);
                                openModal(false);
                            }}
                            shape="ghost"
                            aria-label={c('Action').ngettext(
                                msgid`Add ${photos.length} photo to a new album`,
                                `Add ${photos.length} photos to a new album`,
                                photos.length
                            )}
                        >
                            <span
                                className="block w-custom h-custom rounded overflow-hidden bg-strong flex items-center justify-center"
                                style={{
                                    '--w-custom': '2.5rem',
                                    '--h-custom': '2.5rem',
                                }}
                            >
                                <Icon name="plus-circle" />
                            </span>
                            {c('Action').t`New album`}
                        </Button>
                        {!!sortedAlbums.length && (
                            <>
                                {!share && (
                                    <>
                                        <h2 className="text-rg color-weak mt-4 mb-0">{c('Heading').t`Recent`}</h2>
                                        <ul className="unstyled mt-0">
                                            {latestAlbum && (
                                                <AlbumSquare
                                                    loading={activeAlbumId === latestAlbum.linkId}
                                                    disabled={!!activeAlbumId && activeAlbumId !== latestAlbum.linkId}
                                                    album={latestAlbum}
                                                    onClick={handleSelectAlbum}
                                                />
                                            )}
                                            {secondLatestAlbum && (
                                                <AlbumSquare
                                                    loading={activeAlbumId === secondLatestAlbum.linkId}
                                                    disabled={
                                                        !!activeAlbumId && activeAlbumId !== secondLatestAlbum.linkId
                                                    }
                                                    album={secondLatestAlbum}
                                                    onClick={handleSelectAlbum}
                                                />
                                            )}
                                        </ul>
                                    </>
                                )}
                                {share && !!sharedAlbums.length && (
                                    <>
                                        <h2 className="text-rg color-weak mt-4 mb-0">{c('Heading')
                                            .t`Add to shared album`}</h2>
                                        <ul className="unstyled mt-0">
                                            {sharedAlbums.map((album) => (
                                                <AlbumSquare
                                                    key={`album-${album.linkId}-${album.rootShareId}`}
                                                    loading={activeAlbumId === album.linkId}
                                                    disabled={!!activeAlbumId && activeAlbumId !== album.linkId}
                                                    album={album}
                                                    onClick={handleSelectAlbum}
                                                />
                                            ))}
                                        </ul>
                                    </>
                                )}
                                {!!restAlbums.length && (
                                    <>
                                        <h2 className="text-rg color-weak mt-4 mb-0">{c('Heading').t`All albums`}</h2>
                                        <ul className="unstyled mt-0">
                                            {restAlbums.map((album) => (
                                                <AlbumSquare
                                                    key={`album-${album.linkId}-${album.rootShareId}`}
                                                    loading={activeAlbumId === album.linkId}
                                                    disabled={!!activeAlbumId && activeAlbumId !== album.linkId}
                                                    album={album}
                                                    onClick={handleSelectAlbum}
                                                />
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </>
                        )}
                    </ModalTwoContent>
                </ModalTwo>
            )}
            {createAlbumModal.render && (
                <CreateAlbumModal
                    createAlbumModal={createAlbumModal}
                    createAlbum={(name) => {
                        return onCreateAlbumWithPhotos(
                            name,
                            photos.map((photo) => photo.linkId)
                        );
                    }}
                />
            )}
        </>
    );
};
