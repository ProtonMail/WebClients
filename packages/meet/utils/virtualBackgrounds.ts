import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import protonDarkBackground from '@proton/styles/assets/img/meet/backgrounds/00-proton-dark.webp';
import protonLightBackground from '@proton/styles/assets/img/meet/backgrounds/01-proton-light.webp';
import officeBackground from '@proton/styles/assets/img/meet/backgrounds/03-blurred-office.webp';
import libraryBackground from '@proton/styles/assets/img/meet/backgrounds/04-library.webp';
import mountainBackground from '@proton/styles/assets/img/meet/backgrounds/05-mountain-landscape.webp';
import beachBackground from '@proton/styles/assets/img/meet/backgrounds/06-beach-landscape.webp';
import protonDarkThumbnail from '@proton/styles/assets/img/meet/backgrounds/thumbnails/00-proton-dark.webp';
import protonLightThumbnail from '@proton/styles/assets/img/meet/backgrounds/thumbnails/01-proton-light.webp';
import officeThumbnail from '@proton/styles/assets/img/meet/backgrounds/thumbnails/03-blurred-office.webp';
import libraryThumbnail from '@proton/styles/assets/img/meet/backgrounds/thumbnails/04-library.webp';
import mountainThumbnail from '@proton/styles/assets/img/meet/backgrounds/thumbnails/05-mountain-landscape.webp';
import beachThumbnail from '@proton/styles/assets/img/meet/backgrounds/thumbnails/06-beach-landscape.webp';

interface VirtualBackgroundDefinition {
    imageUrl: string;
    thumbnailUrl: string;
    getLabel: () => string;
}

const VIRTUAL_BACKGROUND_DEFINITIONS = {
    protonDark: {
        imageUrl: protonDarkBackground,
        thumbnailUrl: protonDarkThumbnail,
        getLabel: () => c('Label').t`Dark ${BRAND_NAME} background`,
    },
    protonLight: {
        imageUrl: protonLightBackground,
        thumbnailUrl: protonLightThumbnail,
        getLabel: () => c('Label').t`Light ${BRAND_NAME} background`,
    },
    office: {
        imageUrl: officeBackground,
        thumbnailUrl: officeThumbnail,
        getLabel: () => c('Label').t`Blurred office background`,
    },
    library: {
        imageUrl: libraryBackground,
        thumbnailUrl: libraryThumbnail,
        getLabel: () => c('Label').t`Library background`,
    },
    mountain: {
        imageUrl: mountainBackground,
        thumbnailUrl: mountainThumbnail,
        getLabel: () => c('Label').t`Mountain landscape background`,
    },
    beach: {
        imageUrl: beachBackground,
        thumbnailUrl: beachThumbnail,
        getLabel: () => c('Label').t`Beach landscape background`,
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
