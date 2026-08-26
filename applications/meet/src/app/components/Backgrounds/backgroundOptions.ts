import { c } from 'ttag';

import { IcCircleSlash } from '@proton/icons/icons/IcCircleSlash';
import { IcMeetBlur } from '@proton/icons/icons/IcMeetBlur';
import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import type { VirtualBackgroundId } from '@proton/meet/utils/virtualBackgrounds';
import {
    VIRTUAL_BACKGROUND_IDS,
    getVirtualBackgroundLabel,
    getVirtualBackgroundThumbnailUrl,
} from '@proton/meet/utils/virtualBackgrounds';

interface BackgroundEffectOption {
    effect: BackgroundEffect;
    label: string;
    Icon: typeof IcCircleSlash;
}

interface VirtualBackgroundOption {
    effect: VirtualBackgroundId;
    label: string;
    thumbnailUrl: string;
}

// Labels are built on call rather than at module scope so they follow the active locale.
export const getBackgroundEffectOptions = (): BackgroundEffectOption[] => [
    { effect: 'none', label: c('Action').t`No effect`, Icon: IcCircleSlash },
    { effect: 'blur', label: c('Action').t`Blur background`, Icon: IcMeetBlur },
];

export const getVirtualBackgroundOptions = (): VirtualBackgroundOption[] =>
    VIRTUAL_BACKGROUND_IDS.map((id) => ({
        effect: id,
        label: getVirtualBackgroundLabel(id),
        thumbnailUrl: getVirtualBackgroundThumbnailUrl(id),
    }));
