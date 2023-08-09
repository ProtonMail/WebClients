import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks/index';

import { DecryptedLink, useLink, useLinkActions, useLinks, useLinksListing } from '../_links';
import { usePhotos as usePhotosProvider } from '../_photos';
import type { Photo } from '../_photos/interface';
import { usePhotos } from '../_photos/usePhotos';
import { useDefaultShare } from '../_shares';

export const usePhotosView = () => {
    const { getPhotos } = usePhotos();
    const { getCachedChildren } = useLinksListing();
    const { getLink } = useLink();
    const { getDefaultShare } = useDefaultShare();
    const { shareId, linkId, isLoading } = usePhotosProvider();

    const [photos, setPhotos] = useState<Record<string, Photo | DecryptedLink>>({});
    const [photosLoading, withPhotosLoading] = useLoading();

    useEffect(() => {
        if (!shareId || !linkId) {
            return;
        }
        const abortController = new AbortController();

        const cached = getCachedChildren(abortController.signal, shareId, linkId);

        const reducedLinks = cached.links.reduce<Record<string, DecryptedLink>>((acc, link) => {
            acc[link.linkId] = link;
            return acc;
        }, {});

        const fetchPhotos = async () => {
            const share = await getDefaultShare(abortController.signal);
            const photos = await getPhotos(abortController.signal, share.volumeId);

            return photos;
        };

        void withPhotosLoading(
            fetchPhotos()
                .then((newPhotos) => {
                    const reducedPhoto = newPhotos.reduce<Record<string, Photo>>((acc, photo) => {
                        if (photos[photo.linkId]) {
                            return acc;
                        }
                        acc[photo.linkId] = photo;
                        return acc;
                    }, {});
                    setPhotos({ ...photos, ...reducedPhoto, ...reducedLinks });
                })
                .catch((err) => {})
        );

        return () => {
            abortController.abort();
        };
    }, [shareId, linkId]);

    const getPhotoLink = (abortSignal: AbortSignal, linkId: string) => {
        if (!shareId) {
            return;
        }
        return getLink(abortSignal, shareId, linkId);
    };

    return {
        photos,
        getPhotoLink,
    };
};
