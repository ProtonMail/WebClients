import { c } from 'ttag';

import type { ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';

import { BlackFriday2026Icon } from '../components/blackFriday2026/BlackFriday2026Icon';

const getCTAContent = () => {
    return c('bfcampaign2026: Action').t`Black Friday`;
};

export const topButton = {
    getCTAContent,
    shape: 'solid' as ButtonLikeShape,
    iconContent: BlackFriday2026Icon,
    gradient: false,
    variant: 'black-friday-2026',
};
