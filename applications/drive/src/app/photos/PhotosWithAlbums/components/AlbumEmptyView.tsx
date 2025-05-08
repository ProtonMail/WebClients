import { c } from 'ttag';

import { useTheme } from '@proton/components/index';
import folderImagesDark from '@proton/styles/assets/img/drive/empty-image-album-dark.webp';
import folderImages from '@proton/styles/assets/img/drive/empty-image-album.webp';
import useFlag from '@proton/unleash/useFlag';

import type { DecryptedAlbum } from '../../PhotosStore/PhotosWithAlbumsProvider';
import { PhotosAddAlbumPhotosButton } from '../toolbar/PhotosAddAlbumPhotosButton';

interface AlbumEmptyViewProps {
    album: DecryptedAlbum;
    onAddAlbumPhotos: () => void;
}

export const AlbumEmptyView = ({ album, onAddAlbumPhotos }: AlbumEmptyViewProps) => {
    const driveAlbumsDisabled = useFlag('DriveAlbumsDisabled');
    const theme = useTheme();

    const showAddToAlbumButton = album.permissions.isOwner || album.permissions.isAdmin || album.permissions.isEditor;
    return (
        <div
            className="m-auto flex flex-column flex-nowrap *:min-size-auto shrink-0 max-w-custom text-center"
            style={{ '--max-w-custom': '15rem' }}
            data-testid="album-gallery-empty-view"
        >
            <img
                src={theme.information.dark ? folderImagesDark : folderImages}
                alt=""
                width={200}
                className="mx-auto"
            />

            <h1 className="mt-4 mb-2 text-bold h2 text-ellipsis" title={album.name}>
                {album.name}
            </h1>

            <p className="color-weak my-0">{c('Action').t`This album is empty`}</p>

            <p className="mx-auto">
                {!driveAlbumsDisabled && (
                    <>
                        {showAddToAlbumButton && (
                            <PhotosAddAlbumPhotosButton buttonSize="medium" onClick={onAddAlbumPhotos} />
                        )}
                    </>
                )}
            </p>
        </div>
    );
};
