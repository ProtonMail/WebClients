import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import protonBackground from '@proton/styles/assets/img/meet/backgrounds/00-proton.webp';
import officeBackground from '@proton/styles/assets/img/meet/backgrounds/01-modern-office.webp';
import mountainBackground from '@proton/styles/assets/img/meet/backgrounds/02-mountain-landscape.webp';
import abstractBackground from '@proton/styles/assets/img/meet/backgrounds/03-abstract-natural-texture.webp';
import beachBackground from '@proton/styles/assets/img/meet/backgrounds/04-beach-landscape.webp';
import coffeeBackground from '@proton/styles/assets/img/meet/backgrounds/05-coffee-place.webp';
import protonThumbnail from '@proton/styles/assets/img/meet/backgrounds/thumbnails/00-proton.webp';
import officeThumbnail from '@proton/styles/assets/img/meet/backgrounds/thumbnails/01-modern-office.webp';
import mountainThumbnail from '@proton/styles/assets/img/meet/backgrounds/thumbnails/02-mountain-landscape.webp';
import abstractThumbnail from '@proton/styles/assets/img/meet/backgrounds/thumbnails/03-abstract-natural-texture.webp';
import beachThumbnail from '@proton/styles/assets/img/meet/backgrounds/thumbnails/04-beach-landscape.webp';
import coffeeThumbnail from '@proton/styles/assets/img/meet/backgrounds/thumbnails/05-coffee-place.webp';

export const VIRTUAL_BACKGROUNDS = [
    { id: 'proton', imageUrl: protonBackground, thumbnailUrl: protonThumbnail },
    { id: 'office', imageUrl: officeBackground, thumbnailUrl: officeThumbnail },
    { id: 'mountain', imageUrl: mountainBackground, thumbnailUrl: mountainThumbnail },
    { id: 'abstract', imageUrl: abstractBackground, thumbnailUrl: abstractThumbnail },
    { id: 'beach', imageUrl: beachBackground, thumbnailUrl: beachThumbnail },
    { id: 'coffee', imageUrl: coffeeBackground, thumbnailUrl: coffeeThumbnail },
] as const;

export type VirtualBackgroundId = (typeof VIRTUAL_BACKGROUNDS)[number]['id'];

export type BackgroundEffect = 'none' | 'blur' | VirtualBackgroundId;

export interface VirtualBackgroundSource {
    imageUrl: string;
}

export const isVirtualBackgroundId = (value: unknown): value is VirtualBackgroundId =>
    VIRTUAL_BACKGROUNDS.some((background) => background.id === value);

export const getVirtualBackgroundSource = (id: VirtualBackgroundId): VirtualBackgroundSource | undefined => {
    const background = VIRTUAL_BACKGROUNDS.find((entry) => entry.id === id);

    return background ? { imageUrl: background.imageUrl } : undefined;
};

export const getVirtualBackgroundLabel = (id: VirtualBackgroundId) => {
    switch (id) {
        case 'proton':
            return c('Label').t`${BRAND_NAME} background`;
        case 'office':
            return c('Label').t`Office background`;
        case 'mountain':
            return c('Label').t`Mountain background`;
        case 'abstract':
            return c('Label').t`Abstract background`;
        case 'beach':
            return c('Label').t`Beach background`;
        case 'coffee':
            return c('Label').t`Coffee place background`;
    }
};
