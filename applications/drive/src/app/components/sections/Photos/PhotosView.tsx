import { FC, useEffect, useState } from 'react';

import { fromUnixTime, isThisYear, isToday } from 'date-fns';
import { c } from 'ttag';

import { Loader } from '@proton/components/components';
import { useLoading } from '@proton/hooks/index';
import { dateLocale } from '@proton/shared/lib/i18n';

import { useDefaultShare, usePhotos as usePhotosProvider } from '../../../store';
import { Photo } from '../../../store/_photos/interfaces';
import { usePhotos } from '../../../store/_photos/usePhotos';
import { usePhotosView } from '../../../store/_views/usePhotosView';
import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';
import { PhotosEmptyView } from './PhotosEmptyView';
import { PhotosGrid } from './PhotosGrid';
import type { PhotoGridItem } from './PhotosGrid';
import { PhotosToolbar } from './toolbar';
import ToolbarRow from '../ToolbarRow/ToolbarRow';

const dateToCategory = (timestamp: number): string => {
    const date = fromUnixTime(timestamp);

    if (isToday(date)) {
        return c('Info').t`Today`;
    } else if (isThisYear(date)) {
        return new Intl.DateTimeFormat(dateLocale.code, { month: 'long' }).format(date);
    }

    return new Intl.DateTimeFormat(dateLocale.code, { month: 'long', year: 'numeric' }).format(date);
};

const flattenWithCategories = (data: Photo[]): PhotoGridItem[] => {
    const result: PhotoGridItem[] = [];
    let lastGroup = '';

    data.forEach((photo) => {
        const group = dateToCategory(photo.captureTime);
        if (group !== lastGroup) {
            lastGroup = group;
            result.push(group);
        }

        result.push(photo);
    });

    /*
    for (let i = 0; i < 10000; i++) {
        result.push({
            linkId: 'random' + i,
            captureTime: new Date().getTime() / 1000,
        });
    }
    */

    return result;
};

export const PhotosView: FC<void> = () => {
    const { getPhotos } = usePhotos();
    const { getPhotoLink } = usePhotosView();
    const { shareId, linkId, isLoading } = usePhotosProvider();
    const [photos, setPhotos] = useState<PhotoGridItem[]>([]);
    const [photosLoading, withPhotosLoading] = useLoading();
    const isEmpty = photos.length === 0;
    const { getDefaultShare } = useDefaultShare();

    useEffect(() => {
        const abortController = new AbortController();

        const fetchPhotos = async () => {
            const share = await getDefaultShare(abortController.signal);
            const photos = await getPhotos(abortController.signal, share.volumeId);

            return photos;
        };

        void withPhotosLoading(
            fetchPhotos()
                .then((data) => setPhotos(flattenWithCategories(data)))
                .catch(() => {})
        );

        return () => {
            abortController.abort();
        };
    }, []);

    if (isLoading || photosLoading) {
        return <Loader />;
    }

    if (!shareId || !linkId) {
        return <PhotosEmptyView />;
    }

    return (
        <UploadDragDrop
            isPhoto
            shareId={shareId}
            linkId={linkId}
            className="flex flex-column flex-nowrap flex-item-fluid"
        >
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{c('Title').t`Photos`}</span>}
                toolbar={<PhotosToolbar shareId={shareId} linkId={linkId} />}
            />

            {isEmpty && !photosLoading ? <PhotosEmptyView /> : <PhotosGrid data={photos} getPhotoLink={getPhotoLink} />}
        </UploadDragDrop>
    );
};
