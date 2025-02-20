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

const getAltText = ({ mimeType, name }: DecryptedLink) =>
    `${c('Label').t`Album`} - ${getMimeTypeDescription(mimeType || '')} - ${name}`;

const AlbumSquare = ({ album, onClick }: { album: DecryptedAlbum; onClick: (linkId: string) => void }) => {
    const isDecrypted = isDecryptedLink(album);
    const isCoverDecrypted = isDecryptedLink(album.cover);
    const thumbUrl =
        (isCoverDecrypted && album.cover?.cachedThumbnailUrl) || (isDecrypted && album.cachedThumbnailUrl) || undefined;

    return (
        <li key={album.linkId}>
            <Button
                className="w-full flex items-center justify-start gap-2 pl-0"
                onClick={() => onClick(album.linkId)}
                shape="ghost"
            >
                {thumbUrl ? (
                    <img
                        data-testid="album-card-thumbnail"
                        src={thumbUrl}
                        alt={getAltText(album)}
                        className="w-custom h-custom rounded overflow-hidden"
                        style={{
                            '--w-custom': '2.5rem',
                            '--h-custom': '2.5rem',
                        }}
                    />
                ) : (
                    <div
                        className="w-custom h-custom rounded overflow-hidden flex items-center bg-strong p-1"
                        style={{
                            '--w-custom': '2.5rem',
                            '--h-custom': '2.5rem',
                        }}
                    >
                        <Icon name="image" size={10} />
                    </div>
                )}
                <span className="grow-2 text-left">{album.name}</span>
                <span>{album.photoCount}</span>
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
}: {
    addAlbumPhotosModal: ModalStateReturnObj;
    onCreateAlbumWithPhotos: (name: string, linkIds: string[]) => Promise<void>;
    onAddAlbumPhotos: (albumLinkId: string, linkIds: string[]) => Promise<void>;
    photos: PhotoLink[];
    albums: DecryptedAlbum[];
}) => {
    const { modalProps, openModal, render } = addAlbumPhotosModal;
    const createAlbumModal = useModalStateObject();

    const sortedAlbums = albums.sort((a, b) => b.createTime - a.createTime);
    const [latestAlbum, secondLatestAlbum, ...restAlbums] = sortedAlbums;

    const handleSelectAlbum = (linkId: string) => {
        const photosLinkIds = photos.map((photo) => photo.linkId);
        void onAddAlbumPhotos(linkId, photosLinkIds);
    };

    return (
        <>
            {render && (
                <ModalTwo {...modalProps} as="form" size="small">
                    <ModalTwoHeader
                        title={c('Calendar settings sidebar').ngettext(
                            msgid`Add ${photos.length} photo to`,
                            `Add ${photos.length} photos to`,
                            photos.length
                        )}
                    />
                    <ModalTwoContent className="max-h-custom" style={{ '--max-h-custom': '21.25rem' }}>
                        <Button
                            className="w-full flex items-center gap-2 pl-0"
                            onClick={() => {
                                createAlbumModal.openModal(true);
                                openModal(false);
                            }}
                            shape="ghost"
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
                            <ul className="unstyled">
                                <li>
                                    {c('Info').t`Recent`}
                                    <ul className="unstyled">
                                        {latestAlbum && <AlbumSquare album={latestAlbum} onClick={handleSelectAlbum} />}
                                        {secondLatestAlbum && (
                                            <AlbumSquare album={secondLatestAlbum} onClick={handleSelectAlbum} />
                                        )}
                                    </ul>
                                </li>
                                {!!restAlbums.length && (
                                    <li>
                                        {c('Info').t`All albums`}
                                        <ul className="unstyled">
                                            {restAlbums.map((album) => (
                                                <AlbumSquare album={album} onClick={handleSelectAlbum} />
                                            ))}
                                        </ul>
                                    </li>
                                )}
                            </ul>
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
