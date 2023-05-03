import { FC, useEffect } from 'react';

import { Loader } from '@proton/components/components';

import { useDefaultShare } from '../../../store';
import { usePhotos } from '../../../store/_photos/usePhotos';
import { PhotosEmptyView } from './PhotosEmptyView';
import { PhotosGrid } from './PhotosGrid';
import { PhotosToolbar } from './toolbar';

export const PhotosView: FC<void> = () => {
    const { getPhotos } = usePhotos();
    const isLoading = false;
    const isEmpty = false;
    const { getDefaultShare } = useDefaultShare();

    useEffect(() => {
        const abortController = new AbortController();

        const fetchPhotos = async () => {
            const share = await getDefaultShare(abortController.signal);
            const photos = await getPhotos(abortController.signal, share.volumeId);

            return photos;
        };

        fetchPhotos()
            .then(() => {})
            .catch(() => {});

        return () => {
            abortController.abort();
        };
    }, []);

    if (isLoading) {
        return <Loader />;
    }

    if (isEmpty) {
        return <PhotosEmptyView />;
    }

    return (
        <>
            <PhotosToolbar />
            <PhotosGrid />
        </>
    );
};
