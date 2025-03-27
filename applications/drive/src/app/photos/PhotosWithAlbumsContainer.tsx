import type { FC } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { AlbumsView } from './PhotosWithAlbums/AlbumsView';
import { PhotosWithAlbumsInsideAlbumView } from './PhotosWithAlbums/PhotosWithAlbumsInsideAlbumView';
import { PhotosWithAlbumsView } from './PhotosWithAlbums/PhotosWithAlbumsView';

export const PhotosWithAlbumsContainer: FC = () => {
    return (
        <Routes>
            <Route path="" element={<PhotosWithAlbumsView />} />
            <Route path="albums" element={<AlbumsView />} />
            <Route path="albums/:albumShareId/album/:albumLinkId" element={<PhotosWithAlbumsInsideAlbumView />} />
            <Route
                path="albums/:albumShareId/album/:albumLinkId/add-photos"
                element={<PhotosWithAlbumsView isAddAlbumPhotosView />}
            />
            <Route path="*" element={<Navigate to="/photos" replace />} />
        </Routes>
    );
};
