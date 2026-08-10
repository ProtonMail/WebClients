import { c } from 'ttag';

import type { ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';

import { Q3Sale2026Icon } from '../components/q3Sale2026/Q3Sale2026Icon';

export const getModalTitle = () => c('q3campaign2026: Title').t`SEPTEMBER SALE`;

export const getCTAContent = () => {
    // translator: button in the top right corner of the app (outside the modal)
    return c('q3campaign2026: Action').t`September Sale`;
};

export const topButton = {
    getCTAContent,
    shape: 'solid' as ButtonLikeShape,
    iconContent: Q3Sale2026Icon,
    gradient: false,
    variant: 'q3-sale-2026',
};
