import { type FC, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { Loader } from '@proton/components';

import { MIGRATION_STATUS, usePhotosWithAlbums } from './PhotosStore/PhotosWithAlbumsProvider';
import { AlbumsView } from './PhotosWithAlbums/AlbumsView';
import { PhotosWithAlbumsInsideAlbumView } from './PhotosWithAlbums/PhotosWithAlbumsInsideAlbumView';
import { PhotosWithAlbumsView } from './PhotosWithAlbums/PhotosWithAlbumsView';
import { PhotosMigrationView } from './PhotosWithAlbums/components/PhotosMigrationView';
import { PhotosLayout } from './PhotosWithAlbums/layout/PhotosLayout';

export const PhotosWithAlbumsContainer: FC = () => {
    const { migrationStatus, startPhotosMigration } = usePhotosWithAlbums();
    useEffect(() => {
        if (migrationStatus === MIGRATION_STATUS.UNKNOWN) {
            void startPhotosMigration();
        }
    }, []);

    if (migrationStatus === MIGRATION_STATUS.MIGRATING) {
        return <PhotosMigrationView />;
    }

    if (migrationStatus === MIGRATION_STATUS.UNKNOWN) {
        return <Loader />;
    }

    return (
        <Routes>
            <Route element={<PhotosLayout />}>
                <Route path="" element={<PhotosWithAlbumsView />} />
                <Route path="albums" element={<AlbumsView />} />
                <Route path="albums/:albumShareId/album/:albumLinkId" element={<PhotosWithAlbumsInsideAlbumView />} />
                <Route path="albums/:albumShareId/album/:albumLinkId/add-photos" element={<PhotosWithAlbumsView />} />
            </Route>
            <Route path="*" element={<Navigate to="/photos" replace />} />
        </Routes>
    );
};
