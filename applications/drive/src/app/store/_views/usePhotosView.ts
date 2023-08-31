import { useEffect, useMemo, useState } from 'react';

import { fromUnixTime, isThisYear, isToday } from 'date-fns';
import { c } from 'ttag';

import { useLoading } from '@proton/hooks/index';
import { dateLocale } from '@proton/shared/lib/i18n';
import { DeepPartial } from '@proton/shared/lib/interfaces';

import { DecryptedLink, useLink, useLinksListing } from '../_links';
import { usePhotos as usePhotosProvider } from '../_photos';
import { Photo } from '../_photos/interface';
import { usePhotos } from '../_photos/usePhotos';
import { useDefaultShare } from '../_shares';
import { useAbortSignal, useMemoArrayNoMatterTheOrder } from './utils';

export type PhotoLink = DeepPartial<DecryptedLink> & {
    linkId: string;
};
export type PhotoGridItem = PhotoLink | string;

const dateToCategory = (timestamp: number): string => {
    const date = fromUnixTime(timestamp);

    if (isToday(date)) {
        return c('Info').t`Today`;
    } else if (isThisYear(date)) {
        return new Intl.DateTimeFormat(dateLocale.code, { month: 'long' }).format(date);
    }

    return new Intl.DateTimeFormat(dateLocale.code, { month: 'long', year: 'numeric' }).format(date);
};

const flattenWithCategories = (data: PhotoLink[]): PhotoGridItem[] => {
    const result: PhotoGridItem[] = [];
    let lastGroup = '';

    data.forEach((item) => {
        if (!item.activeRevision?.photo) {
            return;
        }

        const group = dateToCategory(item.activeRevision.photo.captureTime || Date.now());
        if (group !== lastGroup) {
            lastGroup = group;
            result.push(group);
        }

        result.push(item);
    });

    return result;
};

export const usePhotosView = () => {
    const { getPhotos } = usePhotos();
    const { getCachedChildren } = useLinksListing();
    const { getLink } = useLink();
    const { getDefaultShare } = useDefaultShare();
    const { shareId, linkId, isLoading } = usePhotosProvider();

    const [photos, setPhotos] = useState<Photo[]>([]);
    const [photosLoading, withPhotosLoading] = useLoading();

    const abortSignal = useAbortSignal([shareId, linkId]);
    const cache = shareId && linkId ? getCachedChildren(abortSignal, shareId, linkId) : undefined;
    const cachedLinks = useMemoArrayNoMatterTheOrder(cache?.links || []);

    // This will be flattened to contain categories and links
    const photosViewData = useMemo(() => {
        const result: Record<string, PhotoLink> = {};

        // We create "fake" links to avoid complicating the rest of the code
        photos.forEach((photo) => {
            result[photo.linkId] = {
                linkId: photo.linkId,
                activeRevision: {
                    photo,
                },
            };
        });

        // Add data from cache
        cachedLinks.forEach((link) => {
            result[link.linkId] = link;
        });

        // Sort values by captureTime
        const values = Object.values(result);
        values.sort(
            (a, b) =>
                (b.activeRevision?.photo?.captureTime || Date.now()) -
                (a.activeRevision?.photo?.captureTime || Date.now())
        );

        return flattenWithCategories(values);
    }, [photos, cachedLinks]);

    useEffect(() => {
        if (!shareId && !linkId) {
            return;
        }

        const fetchPhotos = async (lastLinkId?: string) => {
            const share = await getDefaultShare(abortSignal);
            const photos = await getPhotos(abortSignal, share.volumeId, lastLinkId);

            return photos;
        };

        const photoCall = async (lastLinkId?: string) =>
            fetchPhotos(lastLinkId)
                .then((data) => {
                    if (!!data.length) {
                        setPhotos((prevPhotos) => [...prevPhotos, ...data]);
                        void photoCall(data[data.length - 1].linkId);
                    } else {
                        void Promise.resolve();
                    }
                })
                .catch(() => {});

        void withPhotosLoading(photoCall());
    }, [shareId, linkId]);

    const getPhotoLink = (abortSignal: AbortSignal, linkId: string) => {
        if (!shareId) {
            return;
        }
        return getLink(abortSignal, shareId, linkId);
    };

    return {
        photos: photosViewData,
        getPhotoLink,
        isLoading: photosLoading || isLoading,
        isLoadingMore: photosLoading && !!photos.length,
    };
};
