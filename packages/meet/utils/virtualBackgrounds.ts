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

interface VirtualBackgroundDefinition {
    imageUrl: string;
    thumbnailUrl: string;
    getLabel: () => string;
}

const VIRTUAL_BACKGROUND_DEFINITIONS = {
    proton: {
        imageUrl: protonBackground,
        thumbnailUrl: protonThumbnail,
        getLabel: () => c('Label').t`${BRAND_NAME} background`,
    },
    office: {
        imageUrl: officeBackground,
        thumbnailUrl: officeThumbnail,
        getLabel: () => c('Label').t`Office background`,
    },
    mountain: {
        imageUrl: mountainBackground,
        thumbnailUrl: mountainThumbnail,
        getLabel: () => c('Label').t`Mountain background`,
    },
    abstract: {
        imageUrl: abstractBackground,
        thumbnailUrl: abstractThumbnail,
        getLabel: () => c('Label').t`Abstract background`,
    },
    beach: {
        imageUrl: beachBackground,
        thumbnailUrl: beachThumbnail,
        getLabel: () => c('Label').t`Beach background`,
    },
    coffee: {
        imageUrl: coffeeBackground,
        thumbnailUrl: coffeeThumbnail,
        getLabel: () => c('Label').t`Coffee place background`,
    },
} satisfies Record<string, VirtualBackgroundDefinition>;

export type VirtualBackgroundId = keyof typeof VIRTUAL_BACKGROUND_DEFINITIONS;

export const VIRTUAL_BACKGROUND_IDS = Object.keys(VIRTUAL_BACKGROUND_DEFINITIONS) as VirtualBackgroundId[];

export const isVirtualBackgroundId = (value: unknown): value is VirtualBackgroundId =>
    typeof value === 'string' && value in VIRTUAL_BACKGROUND_DEFINITIONS;

export interface VirtualBackgroundSource {
    imageUrl: string;
}

export const getVirtualBackgroundSource = (id: VirtualBackgroundId): VirtualBackgroundSource => ({
    imageUrl: VIRTUAL_BACKGROUND_DEFINITIONS[id].imageUrl,
});

export const getVirtualBackgroundThumbnailUrl = (id: VirtualBackgroundId) =>
    VIRTUAL_BACKGROUND_DEFINITIONS[id].thumbnailUrl;

export const getVirtualBackgroundLabel = (id: VirtualBackgroundId) => VIRTUAL_BACKGROUND_DEFINITIONS[id].getLabel();
