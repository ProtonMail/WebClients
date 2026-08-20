import { c } from 'ttag';

import { IcCircleSlash } from '@proton/icons/icons/IcCircleSlash';
import { IcMeetBlur } from '@proton/icons/icons/IcMeetBlur';

import type { BackgroundEffect, VirtualBackgroundId } from '../../utils/virtualBackgrounds/virtualBackgrounds';
import { VIRTUAL_BACKGROUNDS, getVirtualBackgroundLabel } from '../../utils/virtualBackgrounds/virtualBackgrounds';

interface BackgroundEffectOption {
    effect: BackgroundEffect;
    label: string;
    Icon: typeof IcCircleSlash;
}

interface VirtualBackgroundOption {
    effect: VirtualBackgroundId;
    label: string;
    color: string;
}

// Labels are built on call rather than at module scope so they follow the active locale.
export const getBackgroundEffectOptions = (): BackgroundEffectOption[] => [
    { effect: 'none', label: c('Action').t`No effect`, Icon: IcCircleSlash },
    { effect: 'blur', label: c('Action').t`Blur background`, Icon: IcMeetBlur },
];

export const getVirtualBackgroundOptions = (): VirtualBackgroundOption[] =>
    VIRTUAL_BACKGROUNDS.map(({ id, color }) => ({ effect: id, label: getVirtualBackgroundLabel(id), color }));
