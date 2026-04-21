import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useTheme } from '@proton/components';
import { MemberRole } from '@proton/drive';
import folderImagesDark from '@proton/styles/assets/img/drive/empty-image-album-dark.webp';
import folderImages from '@proton/styles/assets/img/drive/empty-image-album.webp';

import { useAlbumsStore } from '../../useAlbums.store';
import { PhotosAddAlbumPhotosButton } from '../toolbar/PhotosAddAlbumPhotosButton';

interface AlbumEmptyViewProps {
    nodeUid: string;
    onAddAlbumPhotos: () => void;
}

export const AlbumEmptyView = ({ nodeUid, onAddAlbumPhotos }: AlbumEmptyViewProps) => {
    const theme = useTheme();

    const album = useAlbumsStore(useShallow((state) => state.albums.get(nodeUid)));

    if (!album) {
        return;
    }
    const showAddToAlbumButton = album.directRole !== MemberRole.Viewer;
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
                {showAddToAlbumButton && <PhotosAddAlbumPhotosButton buttonSize="medium" onClick={onAddAlbumPhotos} />}
            </p>
        </div>
    );
};
