import { c } from 'ttag';

import type { ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';

import { SummerSale2026PalmIcon } from '../components/summerSale2026/SummerSale2026PalmIcon';

export const getModalTitle = () => c('q2campaign2026: Title').t`SUMMER SALE`;
export const getCTAContent = () => {
    // translator: button in the top right corner of the app (outside the modal)
    return c('q2campaign2026: Action').t`Summer Sale`;
};
export const topButton = {
    getCTAContent,
    shape: 'solid' as ButtonLikeShape,
    iconContent: SummerSale2026PalmIcon,
    gradient: false,
    variant: 'summer-sale-2026',
};
