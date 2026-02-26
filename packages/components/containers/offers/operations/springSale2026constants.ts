import type { IconName, IconSize } from 'packages/icons/types';
import { c } from 'ttag';

import type { ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';

export const getModalTitle = () => c('springSale2026: Title').t`SPRING SALE`;
export const getCTAContent = () => {
    // translator: button in the top right corner of the app (outside the modal)
    return c('springSale2026: Action').t`SPRING SALE 2026`;
};
export const topButton = {
    getCTAContent,
    shape: 'solid' as ButtonLikeShape,
    icon: 'percent' as IconName,
    iconSize: 4 as IconSize,
    gradient: false,
    variant: 'pink',
};
