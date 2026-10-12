import { c } from 'ttag';

import type { ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';

import { BlackFriday2026Icon } from '../components/blackFriday2026/BlackFriday2026Icon';

const getCTAContent = () => {
    // translator: button in the top right corner of the app (outside the modal)
    return c('bfcampaign2026: Action').t`Special Offer`;
};

export const topButton = {
    getCTAContent,
    shape: 'solid' as ButtonLikeShape,
    iconContent: BlackFriday2026Icon,
    gradient: false,
    variant: 'black-friday-2026',
};
