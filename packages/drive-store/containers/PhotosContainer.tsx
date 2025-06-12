import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { PhotosView } from '../components/sections/Photos';

export const PhotosContainer = () => {
    return (
        <Routes>
            <Route path="" element={<PhotosView />} />
            <Route path="*" element={<Navigate to="/photos" replace />} />
        </Routes>
    );
};
